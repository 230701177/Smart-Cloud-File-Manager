const crypto = require('crypto');

/**
 * Generate SHA-256 hash for a given buffer or string content
 * @param {Buffer|string} content
 * @returns {string} Hexadecimal hash string
 */
const generateHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

module.exports = {
  generateHash
};
