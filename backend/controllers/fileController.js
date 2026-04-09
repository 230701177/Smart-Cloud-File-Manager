const fileService = require('../services/fileService');
const Chunk = require('../models/Chunk');

// Upload File
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
    const file = await fileService.updateFileVersion(fileId, buffer);
    
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
    
    const { fileName, buffer } = await fileService.downloadFile(fileId, version ? parseInt(version) : null);
    
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

// Delete File
exports.deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await fileService.deleteFile(fileId, req.user._id);
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// List Files
exports.listFiles = async (req, res, next) => {
  try {
    const files = await fileService.listFiles(req.user._id);
    res.status(200).json({ files });
  } catch (error) {
    next(error);
  }
};

// Get File Version History
exports.getFileVersions = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const versions = await fileService.getFileVersions(fileId);
    res.status(200).json({ versions });
  } catch (error) {
    next(error);
  }
};

// Get Storage Stats
exports.getStorageStats = async (req, res, next) => {
  try {
    const chunks = await Chunk.find();
    
    let totalPhysicalSize = 0;
    let totalLogicalSize = 0;
    let totalChunks = chunks.length;
    
    chunks.forEach(c => {
      totalPhysicalSize += c.size; // stored once
      totalLogicalSize += (c.size * c.referenceCount); // what it would be without dedup
    });
    
    const savingsPercentage = totalLogicalSize > 0 
      ? ((totalLogicalSize - totalPhysicalSize) / totalLogicalSize * 100).toFixed(2)
      : 0;

    res.status(200).json({ 
      stats: {
        totalPhysicalSize,
        totalLogicalSize,
        totalChunks,
        savingsPercentage: `${savingsPercentage}% deduplication savings`
      }
    });
  } catch (error) {
    next(error);
  }
};
