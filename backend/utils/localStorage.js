const fs = require('fs').promises;
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../storage/chunks');

// Ensure storage directory exists
const initializeStorage = async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating storage directory:', err);
  }
};

initializeStorage();

const uploadChunkLocal = async (hash, buffer) => {
  const filePath = path.join(STORAGE_DIR, hash);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

const downloadChunkLocal = async (hash) => {
  const filePath = path.join(STORAGE_DIR, hash);
  return await fs.readFile(filePath);
};

const deleteChunkLocal = async (hash) => {
  const filePath = path.join(STORAGE_DIR, hash);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

module.exports = {
  uploadChunkLocal,
  downloadChunkLocal,
  deleteChunkLocal
};
