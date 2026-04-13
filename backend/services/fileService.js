const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const File = require('../models/File');
const Version = require('../models/Version');
const FileAccess = require('../models/FileAccess');
const Chunk = require('../models/Chunk');
const User = require('../models/User');
const { splitBufferIntoChunks } = require('../utils/chunking');
const { generateHash } = require('../utils/hashing');
const { processChunk, removeChunkReference } = require('./dedupService');
const { getChunk } = require('./storageService');

const MAX_ACCESS_HISTORY = 10;
const RECENCY_WEIGHT = 0.5;
const FREQUENCY_WEIGHT = 0.3;
const LOCATION_MATCH_WEIGHT = 0.2;

const normalizeIp = (ip) => {
  if (!ip) return '127.0.0.1';
  const value = Array.isArray(ip) ? ip[0] : String(ip);
  return value.replace('::ffff:', '').split(',')[0].trim();
};

const lookupLocation = (ip) => {
  const resolvedIp = normalizeIp(ip);
  
  try {
    if (!geoip || typeof geoip.lookup !== 'function') {
        throw new Error('GeoIP service unavailable');
    }
    
    const geo = geoip.lookup(resolvedIp);

    if (!geo) {
        return { ip: resolvedIp, location: 'Unknown' };
    }

    const parts = [geo.city, geo.region, geo.country].filter(Boolean);
    return {
        ip: resolvedIp,
        location: parts.length > 0 ? parts.join(', ') : geo.country || 'Unknown'
    };
  } catch (err) {
    console.warn('[GeoIP] Lookup failed, using fallback:', err.message);
    return { ip: resolvedIp, location: 'Unknown' };
  }
};

const calculateFileSizeFromHashes = async (chunkHashes) => {
  if (!Array.isArray(chunkHashes) || chunkHashes.length === 0) {
    return 0;
  }

  const chunks = await Chunk.find({ hash: { $in: chunkHashes } }).select('hash size');
  const sizeByHash = new Map(chunks.map((chunk) => [chunk.hash, chunk.size]));

  return chunkHashes.reduce((total, hash) => total + (sizeByHash.get(hash) || 0), 0);
};

const toPlainFile = (file, extra = {}) => ({
  ...file.toObject(),
  ...extra
});

const canUserAccessFile = (file, userId) => {
  if (!file || !userId) return false;

  if (file.userId.toString() === userId.toString()) {
    return true;
  }

  if (file.accessLevel === 'public' || file.isPublic) {
    return true;
  }

  if (file.accessLevel !== 'shared') {
    return false;
  }

  return Array.isArray(file.sharedWith) && file.sharedWith.some((entry) => {
    if (!entry || !entry.userId) return false;
    return entry.userId.toString() === userId.toString();
  });
};

const getFileForOwner = async (fileId, ownerId) => {
  const file = await File.findOne({ fileId, userId: ownerId });
  if (!file) {
    throw new Error('File not found');
  }

  return file;
};

const trackAccess = async (fileId, ip = '127.0.0.1') => {
  const { ip: normalizedIp, location } = lookupLocation(ip);
  const file = await File.findOne({ fileId });

  if (!file) {
    return;
  }

  await FileAccess.create({
    fileId,
    userId: file.userId,
    location,
    ip: normalizedIp
  });

  file.accessCount = (file.accessCount || 0) + 1;
  file.lastAccessedAt = new Date();
  file.lastAccessedLocation = location;
  file.accessHistory = [
    {
      timestamp: new Date(),
      location,
      ip: normalizedIp
    },
    ...(Array.isArray(file.accessHistory) ? file.accessHistory : [])
  ].slice(0, MAX_ACCESS_HISTORY);

  await file.save();
};

const getRecommendedFiles = async (userId, ip = '127.0.0.1') => {
  const { location: userLocation } = lookupLocation(ip);
  const files = await File.find({ userId, inTrash: false }).sort({ lastAccessedAt: -1, createdAt: -1 });

  const scoredFiles = files.map((file) => {
    const accessDate = file.lastAccessedAt ? new Date(file.lastAccessedAt) : new Date(0);
    const hoursSinceLastAccess = (Date.now() - accessDate.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 - (hoursSinceLastAccess * 2));
    const frequencyScore = Math.min(100, (file.accessCount || 0) * 2);
    const locationScore = file.lastAccessedLocation && file.lastAccessedLocation === userLocation && userLocation !== 'Unknown' ? 100 : 0;
    const score = (RECENCY_WEIGHT * recencyScore) + (FREQUENCY_WEIGHT * frequencyScore) + (LOCATION_MATCH_WEIGHT * locationScore);

    return toPlainFile(file, { score });
  });

  return scoredFiles.sort((a, b) => b.score - a.score).slice(0, 10);
};

const searchFiles = async (userId, query = {}, text = '') => {
  const filter = { userId, inTrash: false };

  if (text) {
    filter.fileName = { $regex: text, $options: 'i' };
  }

  if (query.type) {
    filter.fileName = { ...(filter.fileName || {}), $regex: `\\.${query.type}$`, $options: 'i' };
  }

  if (query.minSize || query.maxSize) {
    filter.size = {};
    if (query.minSize) filter.size.$gte = Number.parseInt(query.minSize, 10);
    if (query.maxSize) filter.size.$lte = Number.parseInt(query.maxSize, 10);
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  return File.find(filter).sort({ createdAt: -1 });
};

const createVersionRecord = async (fileId, versionNumber, chunkHashes, restoredFromVersionNumber = null) => {
  const version = new Version({
    fileId,
    versionNumber,
    chunkHashes,
    restoredFromVersionNumber
  });

  await version.save();
  return version;
};

const uploadFile = async (fileName, fileBuffer, userId, parentId = null) => {
  const existingFile = await File.findOne({ fileName, userId, parentId, inTrash: false });

  if (existingFile) {
    return updateFileVersion(existingFile.fileId, fileBuffer, userId);
  }

  const fileId = uuidv4();
  const chunks = splitBufferIntoChunks(fileBuffer);
  const chunkHashes = [];

  for (const chunkBuffer of chunks) {
    const hash = generateHash(chunkBuffer);
    await processChunk(hash, chunkBuffer, chunkBuffer.length);
    chunkHashes.push(hash);
  }

  const file = new File({
    fileId,
    fileName,
    userId,
    parentId,
    chunkHashes,
    size: fileBuffer.length,
    version: 1,
    accessLevel: 'private',
    lastAccessedAt: new Date()
  });

  await file.save();
  await createVersionRecord(fileId, 1, chunkHashes);

  return file;
};

const updateFileVersion = async (fileId, fileBuffer, userId = null) => {
  const file = userId ? await File.findOne({ fileId, userId }) : await File.findOne({ fileId });

  if (!file) {
    throw new Error('File not found');
  }

  const chunks = splitBufferIntoChunks(fileBuffer);
  const newChunkHashes = [];

  for (const chunkBuffer of chunks) {
    const hash = generateHash(chunkBuffer);
    await processChunk(hash, chunkBuffer, chunkBuffer.length);
    newChunkHashes.push(hash);
  }

  const newVersionNumber = (file.version || 1) + 1;

  file.chunkHashes = newChunkHashes;
  file.size = fileBuffer.length;
  file.version = newVersionNumber;
  file.lastAccessedAt = new Date();

  await file.save();
  await createVersionRecord(file.fileId, newVersionNumber, newChunkHashes);

  return file;
};

const restoreFileVersion = async (fileId, userId, versionNumber) => {
  const file = await getFileForOwner(fileId, userId);
  const version = await Version.findOne({ fileId, versionNumber });

  if (!version) {
    throw new Error('Version not found');
  }

  const restoredSize = await calculateFileSizeFromHashes(version.chunkHashes);
  const newVersionNumber = (file.version || 1) + 1;

  file.chunkHashes = version.chunkHashes;
  file.size = restoredSize;
  file.version = newVersionNumber;
  file.lastAccessedAt = new Date();

  await file.save();
  await createVersionRecord(fileId, newVersionNumber, version.chunkHashes, versionNumber);

  return file;
};

const downloadFile = async (fileId, requesterId = null, versionNumber = null, ip = null) => {
  const fileInfo = await File.findOne({ fileId });

  if (!fileInfo) {
    throw new Error('File not found');
  }

  if (requesterId && !canUserAccessFile(fileInfo, requesterId)) {
    throw new Error('Access denied');
  }

  if (ip) {
    await trackAccess(fileId, ip);
  }

  let chunkHashes = fileInfo.chunkHashes;

  if (versionNumber) {
    const version = await Version.findOne({ fileId, versionNumber });
    if (!version) {
      throw new Error('Version not found');
    }
    chunkHashes = version.chunkHashes;
  }

  const chunkBuffers = [];
  for (const hash of chunkHashes) {
    const buffer = await getChunk(hash);
    chunkBuffers.push(buffer);
  }

  return {
    fileName: fileInfo.fileName,
    buffer: Buffer.concat(chunkBuffers),
    versionNumber: versionNumber || fileInfo.version
  };
};

const moveToTrash = async (fileId, userId) => {
  const file = await File.findOneAndUpdate(
    { fileId, userId },
    { $set: { inTrash: true, deletedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!file) {
    throw new Error('File not found');
  }

  return file;
};

const restoreFile = async (fileId, userId) => {
  const file = await File.findOneAndUpdate(
    { fileId, userId },
    { $set: { inTrash: false, deletedAt: null } },
    { returnDocument: 'after' }
  );

  if (!file) {
    throw new Error('File not found');
  }

  return file;
};

const deleteFile = async (fileId, userId) => {
  const file = await File.findOne({ fileId, userId });

  if (!file) {
    throw new Error('File not found');
  }

  const versions = await Version.find({ fileId }).sort({ versionNumber: 1 });
  const hashesToRemove = [];

  for (const version of versions) {
    hashesToRemove.push(...version.chunkHashes);
  }

  for (const hash of hashesToRemove) {
    await removeChunkReference(hash);
  }

  await Version.deleteMany({ fileId });
  await File.deleteOne({ _id: file._id });
};

const listFiles = async (userId, options = {}) => {
  const query = { userId, inTrash: options.inTrash || false };
  return File.find(query).sort({ createdAt: -1 });
};

const getFileVersions = async (fileId, userId = null) => {
  if (userId) {
    await getFileForOwner(fileId, userId);
  }

  return Version.find({ fileId }).sort({ versionNumber: -1 });
};

const shareFile = async (fileId, ownerId, targetUserEmail, permission = 'view') => {
  const targetUser = await User.findOne({ email: targetUserEmail.toLowerCase() });

  if (!targetUser) {
    throw new Error('User not found');
  }

  if (targetUser._id.toString() === ownerId.toString()) {
    throw new Error('Cannot share with yourself');
  }

  const file = await File.findOne({ fileId, userId: ownerId });

  if (!file) {
    throw new Error('File not found or access denied');
  }

  const existingShareIndex = Array.isArray(file.sharedWith)
    ? file.sharedWith.findIndex((entry) => entry && entry.userId && entry.userId.toString() === targetUser._id.toString())
    : -1;

  if (existingShareIndex >= 0) {
    file.sharedWith[existingShareIndex].permission = permission;
  } else {
    file.sharedWith.push({ userId: targetUser._id, permission });
  }

  file.accessLevel = 'shared';
  file.isPublic = permission === 'public';

  await file.save();
  return file;
};

module.exports = {
  uploadFile,
  updateFileVersion,
  downloadFile,
  deleteFile,
  moveToTrash,
  restoreFile,
  listFiles,
  searchFiles,
  getFileVersions,
  getRecommendedFiles,
  restoreFileVersion,
  trackAccess,
  shareFile,
  canUserAccessFile
};
