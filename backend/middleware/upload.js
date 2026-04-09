const multer = require('multer');

// Configure multer to use memory storage since we will process the stream/buffer directly into chunks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // e.g. Limit single file to 100MB for memory constraints, scale appropriately
  }
});

module.exports = upload;
