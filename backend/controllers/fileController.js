const fileService = require('../services/fileService');
const uploadService = require('../services/uploadService');
const aiService = require('../services/aiService');

const getClientIp = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
  return Array.isArray(ip) ? ip[0] : ip;
};

// Upload Chunk
exports.uploadChunk = async (req, res, next) => {
  try {
    const { uploadId, chunkIndex } = req.body;
    if (!req.file) throw new Error('No chunk provided');
    await uploadService.saveTempChunk(uploadId, chunkIndex, req.file.buffer);
    res.status(200).json({ message: 'Chunk uploaded' });
  } catch (error) {
    next(error);
  }
};

// Complete Chunked Upload
exports.completeUpload = async (req, res, next) => {
  try {
    const { uploadId, totalChunks, fileName, parentId } = req.body;
    const buffer = await uploadService.assembleChunks(uploadId, totalChunks);
    const file = await fileService.uploadFile(fileName, buffer, req.user._id, parentId || null);
    res.status(201).json({ message: 'File reassembled and saved', file });
  } catch (error) {
    next(error);
  }
};

// Upload File (legacy/single)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { originalname, buffer } = req.file;
    const userId = req.user._id;
    const parentId = req.body.parentId || null;
    
    const file = await fileService.uploadFile(originalname, buffer, userId, parentId);
    
    res.status(201).json({ 
      message: 'File uploaded successfully', 
      file 
    });
  } catch (error) {
    next(error);
  }
};

// Update File Version
exports.updateFileVersion = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { buffer } = req.file;
    const file = await fileService.updateFileVersion(fileId, buffer, req.user._id);
    
    res.status(200).json({ 
      message: 'File version updated successfully', 
      file 
    });
  } catch (error) {
    next(error);
  }
};

// Download File
exports.downloadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { version } = req.query; // optional
    const ip = getClientIp(req);

    const { fileName, buffer } = await fileService.downloadFile(
      fileId,
      req.user?._id,
      version ? parseInt(version, 10) : null,
      ip
    );
    
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeMap = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      txt: 'text/plain',
      csv: 'text/csv',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      json: 'application/json',
      mp4: 'video/mp4',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
    };
    
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Soft Delete File (Move to Trash)
exports.moveToTrash = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await fileService.moveToTrash(fileId, req.user._id);
    res.status(200).json({ message: 'File moved to trash' });
  } catch (error) {
    next(error);
  }
};

// Restore File from Trash
exports.restoreFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await fileService.restoreFile(fileId, req.user._id);
    res.status(200).json({ message: 'File restored successfully' });
  } catch (error) {
    next(error);
  }
};

// Permanently Delete File
exports.deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await fileService.deleteFile(fileId, req.user._id);
    res.status(200).json({ message: 'File permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// List Files
exports.listFiles = async (req, res, next) => {
  try {
    const inTrash = req.query.trash === 'true';
    const files = await fileService.listFiles(req.user._id, { inTrash });
    res.status(200).json({ files });
  } catch (error) {
    next(error);
  }
};

// Recommend Files
exports.recommendFiles = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const files = await fileService.getRecommendedFiles(req.user._id, ip);
    res.status(200).json({ files });
  } catch (error) {
    next(error);
  }
};

// Search Files
exports.searchFiles = async (req, res, next) => {
  try {
    const { q, type, minSize, maxSize, startDate, endDate } = req.query;
    const files = await fileService.searchFiles(req.user._id, { type, minSize, maxSize, startDate, endDate }, q);
    res.status(200).json({ files });
  } catch (error) {
    next(error);
  }
};

// Share File
exports.shareFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { email, permission } = req.body;
    await fileService.shareFile(fileId, req.user._id, email, permission);
    res.status(200).json({ message: 'File shared successfully' });
  } catch (error) {
    next(error);
  }
};
exports.getFileVersions = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const versions = await fileService.getFileVersions(fileId, req.user._id);
    res.status(200).json({ versions });
  } catch (error) {
    next(error);
  }
};

exports.restoreVersion = async (req, res, next) => {
  try {
    const { fileId, versionNumber } = req.params;
    const file = await fileService.restoreFileVersion(fileId, req.user._id, parseInt(versionNumber, 10));
    res.status(200).json({ message: 'File restored to version ' + versionNumber, file });
  } catch (error) {
    next(error);
  }
};

exports.summarizeFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const ip = getClientIp(req);
    console.log(`[Summarize] Requested for file: ${fileId} from IP: ${ip}`);

    // 1. Download the file
    const { fileName, buffer } = await fileService.downloadFile(fileId, req.user._id, null, ip);
    console.log(`[Summarize] Downloaded: ${fileName} (${buffer.length} bytes)`);
    
    // 2. Determine MIME type
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeMap = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    const mimeType = mimeMap[ext] || 'text/plain';
    
    // 3. Extract and Summarize
    const text = await aiService.extractText(buffer, mimeType);
    console.log(`[Summarize] Text extracted (${text?.length || 0} chars)`);
    
    const summary = await aiService.summarizeContent(text);
    console.log(`[Summarize] AI success`);

    res.status(200).json({ summary });
  } catch (error) {
    console.error('[Summarize] Controller Error:', error);
    res.status(500).json({ 
      error: 'AI Summarization failed', 
      message: error.message 
    });
  }
};

