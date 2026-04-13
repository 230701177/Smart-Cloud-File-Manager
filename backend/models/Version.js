const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  chunkHashes: {
    type: [String],
    required: true
  },
  restoredFromVersionNumber: {
    type: Number,
    default: null
  }
}, { timestamps: true });

// Ensure unique combination of fileId and versionNumber
versionSchema.index({ fileId: 1, versionNumber: 1 }, { unique: true });

const Version = mongoose.model('Version', versionSchema);

module.exports = Version;
