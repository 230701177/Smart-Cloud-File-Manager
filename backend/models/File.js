const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  parentId: {
    type: String, // String for folderId or null for root
    default: null,
    index: true
  },
  starred: {
    type: Boolean,
    default: false
  },
  inTrash: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  // Shared file permissions are stored with user references and permission levels.
  chunkHashes: {
    type: [String],
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedLocation: {
    type: String, // IP or physical location string
    default: 'Unknown'
  },
  accessHistory: [{
    timestamp: { type: Date, default: Date.now },
    location: String,
    ip: String
  }]
}, { timestamps: true });

fileSchema.index({ userId: 1, parentId: 1, fileName: 1 });
fileSchema.index({ userId: 1, inTrash: 1, createdAt: -1 });
fileSchema.index({ userId: 1, accessCount: -1, lastAccessedAt: -1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
