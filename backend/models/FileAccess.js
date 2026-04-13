const mongoose = require('mongoose');

const fileAccessSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  ip: {
    type: String
  }
}, { timestamps: true });

const FileAccess = mongoose.model('FileAccess', fileAccessSchema);

module.exports = FileAccess;
