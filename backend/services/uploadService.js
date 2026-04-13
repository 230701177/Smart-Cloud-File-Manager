const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../storage/temp_uploads');

const initializeTempStorage = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {}
};

initializeTempStorage();

const saveTempChunk = async (uploadId, chunkIndex, buffer) => {
  const chunkDir = path.join(TEMP_DIR, uploadId);
  await fs.mkdir(chunkDir, { recursive: true });
  const chunkPath = path.join(chunkDir, chunkIndex.toString());
  await fs.writeFile(chunkPath, buffer);
  return chunkPath;
};

const assembleChunks = async (uploadId, totalChunks) => {
  const chunkDir = path.join(TEMP_DIR, uploadId);
  const buffers = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(chunkDir, i.toString());
    const buffer = await fs.readFile(chunkPath);
    buffers.push(buffer);
  }
  
  const finalBuffer = Buffer.concat(buffers);
  
  // Cleanup
  await fs.rm(chunkDir, { recursive: true, force: true });
  
  return finalBuffer;
};

module.exports = {
  saveTempChunk,
  assembleChunks
};
