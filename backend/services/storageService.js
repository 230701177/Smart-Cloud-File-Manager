const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

const STORAGE_DIR = path.join(__dirname, '..', 'storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Saves a chunk buffer to local disk
 * @param {string} hash Chunk hash used as filename
 * @param {Buffer} buffer The chunk data
 * @returns {string} The path where the chunk is stored
 */
const storeChunk = async (hash, buffer) => {
  const chunkPath = path.join(STORAGE_DIR, hash);
  if (!fs.existsSync(chunkPath)) {
    await writeFileAsync(chunkPath, buffer);
  }
  return chunkPath;
};

/**
 * Retrieves a chunk from disk
 * @param {string} hash The chunk hash
 * @returns {Buffer} The chunk data
 */
const getChunk = async (hash) => {
  const chunkPath = path.join(STORAGE_DIR, hash);
  return await readFileAsync(chunkPath);
};

/**
 * Deletes a chunk from disk
 * @param {string} hash The chunk hash
 */
const deleteChunk = async (hash) => {
  const chunkPath = path.join(STORAGE_DIR, hash);
  if (fs.existsSync(chunkPath)) {
    await unlinkAsync(chunkPath);
  }
};

module.exports = {
  storeChunk,
  getChunk,
  deleteChunk,
  STORAGE_DIR
};
