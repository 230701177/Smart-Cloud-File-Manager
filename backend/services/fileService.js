const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const Version = require('../models/Version');
const { splitBufferIntoChunks } = require('../utils/chunking');
const { generateHash } = require('../utils/hashing');
const { processChunk, removeChunkReference } = require('./dedupService');
const { getChunk } = require('./storageService');

/**
 * Upload a completely new file
 */
const uploadFile = async (fileName, fileBuffer, userId, parentId = null) => {
  const fileId = uuidv4();
  const chunks = splitBufferIntoChunks(fileBuffer);
  const size = fileBuffer.length;
  
  const chunkHashes = [];
  
  // Process each chunk
  for (const chunkBuffer of chunks) {
    const hash = generateHash(chunkBuffer);
    await processChunk(hash, chunkBuffer, chunkBuffer.length);
    chunkHashes.push(hash);
  }

  // Create initial file record
  const file = new File({
    fileId,
    fileName,
    userId,
    parentId,
    chunkHashes,
    size,
    version: 1
  });
  
  await file.save();

  // Create version 1 record
  const version = new Version({
    fileId,
    versionNumber: 1,
    chunkHashes
  });

  await version.save();

  return file;
};

/**
 * Upload a new version for an existing file
 */
const updateFileVersion = async (fileId, fileBuffer) => {
  const file = await File.findOne({ fileId });
  if (!file) throw new Error('File not found');

  const chunks = splitBufferIntoChunks(fileBuffer);
  const size = fileBuffer.length;
  
  const newChunkHashes = [];
  
  // Process new chunks
  for (const chunkBuffer of chunks) {
    const hash = generateHash(chunkBuffer);
    await processChunk(hash, chunkBuffer, chunkBuffer.length);
    newChunkHashes.push(hash);
  }

  // To properly handle garbage collection if old chunks are no longer used by ANY version,
  // we need a mechanism. Wait, versions retain references to old chunks! 
  // We only dereference if we DELETE a version or the whole file. So we don't dereference here.
  
  const newVersionNumber = file.version + 1;

  file.chunkHashes = newChunkHashes;
  file.size = size;
  file.version = newVersionNumber;
  await file.save();

  const version = new Version({
    fileId,
    versionNumber: newVersionNumber,
    chunkHashes: newChunkHashes
  });

  await version.save();

  return file;
};

/**
 * Reconstruct file from chunks
 */
const downloadFile = async (fileId, versionNumber = null) => {
  let chunkHashes = [];
  let fileInfo = await File.findOne({ fileId });

  if (!fileInfo) throw new Error('File not found');

  if (versionNumber) {
    const version = await Version.findOne({ fileId, versionNumber });
    if (!version) throw new Error('Version not found');
    chunkHashes = version.chunkHashes;
  } else {
    // Default to latest
    chunkHashes = fileInfo.chunkHashes;
  }

  const chunkBuffers = [];
  for (const hash of chunkHashes) {
    const buffer = await getChunk(hash);
    chunkBuffers.push(buffer);
  }

  return {
    fileName: fileInfo.fileName,
    buffer: Buffer.concat(chunkBuffers)
  };
};

/**
 * Delete a file and all its versions
 */
const deleteFile = async (fileId, userId) => {
  const file = await File.findOne({ fileId, userId });
  if (!file) throw new Error('File not found');

  // We must dereference all chunks across all versions
  const versions = await Version.find({ fileId });
  
  // Create a unique set of all chunk hashes ever used by this file's versions
  const allHashesSet = new Set();
  for (const version of versions) {
    for (const hash of version.chunkHashes) {
      // Actually, if a chunk is used in multiple versions of the same file, 
      // the reference count was incremented EACH time processChunk was called.
      // Wait, let's verify processChunk logic. If uploadFile processes identical chunks, reference count goes up.
      // Does updateFileVersion re-process identical chunks? Yes! So reference count went up for shared chunks!
      // Therefore we must removeReference for ALL hashes in ALL versions so the reference count decrements correctly.
    }
  }
  
  for (const version of versions) {
    for (const hash of version.chunkHashes) {
       await removeChunkReference(hash);
    }
    await Version.deleteOne({ _id: version._id });
  }

  await File.deleteOne({ _id: file._id });
};

/**
 * List all files
 */
const listFiles = async (userId) => {
  return await File.find({ userId, inTrash: false }).sort({ createdAt: -1 });
};

/**
 * Get file versions history
 */
const getFileVersions = async (fileId) => {
  return await Version.find({ fileId }).sort({ versionNumber: -1 });
};

module.exports = {
  uploadFile,
  updateFileVersion,
  downloadFile,
  deleteFile,
  listFiles,
  getFileVersions
};
