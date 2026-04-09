/**
 * Splits a file buffer into fixed-size chunks
 * @param {Buffer} fileBuffer The complete file buffer
 * @param {number} chunkSize In bytes (default 1MB = 1024 * 1024)
 * @returns {Buffer[]} Array of chunk buffers
 */
const splitBufferIntoChunks = (fileBuffer, chunkSize = 1048576) => {
  const chunks = [];
  let offset = 0;
  
  while (offset < fileBuffer.length) {
    const end = Math.min(offset + chunkSize, fileBuffer.length);
    chunks.push(fileBuffer.slice(offset, end));
    offset += chunkSize;
  }
  
  return chunks;
};

module.exports = {
  splitBufferIntoChunks
};
