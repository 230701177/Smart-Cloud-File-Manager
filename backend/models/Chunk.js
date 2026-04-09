const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  storagePath: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  referenceCount: {
    type: Number,
    default: 1,
    min: 0
  }
}, { timestamps: true });

const Chunk = mongoose.model('Chunk', chunkSchema);

module.exports = Chunk;
