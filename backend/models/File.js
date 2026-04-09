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
  }
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

module.exports = File;
