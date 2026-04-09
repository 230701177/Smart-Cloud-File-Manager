const Chunk = require('../models/Chunk');
const storageService = require('./storageService');

/**
 * Processes a single chunk for deduplication
 * @param {string} hash The chunk hash
 * @param {Buffer} buffer The chunk data
 * @param {number} size Size of the chunk
 * @returns {string} The hash of the processed chunk
 */
const processChunk = async (hash, buffer, size) => {
  // Check if chunk exists in DB
  let chunk = await Chunk.findOne({ hash });

  if (chunk) {
    // If exists, increment reference count
    chunk.referenceCount += 1;
    await chunk.save();
  } else {
    // Store new chunk to disk
    const storagePath = await storageService.storeChunk(hash, buffer);
    // Create DB entry
    chunk = new Chunk({
      hash,
      storagePath,
      size,
      referenceCount: 1
    });
    await chunk.save();
  }

  return hash;
};

/**
 * Reduces reference count for a chunk and deletes if 0
 * @param {string} hash The chunk hash to remove
 */
const removeChunkReference = async (hash) => {
  const chunk = await Chunk.findOne({ hash });
  if (chunk) {
    if (chunk.referenceCount > 1) {
      chunk.referenceCount -= 1;
      await chunk.save();
    } else {
      // Reference count reached 0, delete from storage and DB
      await storageService.deleteChunk(hash);
      await Chunk.deleteOne({ _id: chunk._id });
    }
  }
};

module.exports = {
  processChunk,
  removeChunkReference
};
