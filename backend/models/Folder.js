const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const folderSchema = new mongoose.Schema({
  folderId: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  parentId: {
    type: String, // String for another folderId or null for root
    default: null,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  color: {
    type: String,
    default: '#4285f4'
  }
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);
