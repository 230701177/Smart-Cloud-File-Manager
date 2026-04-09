const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// Protect all file routes
router.use(auth);

// Upload a new file
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Update a file as a new version
router.post('/upload/:fileId/version', upload.single('file'), fileController.updateFileVersion);

// Download a file
router.get('/download/:fileId', fileController.downloadFile);

// Delete a file completely
router.delete('/:fileId', fileController.deleteFile);

// List all files
router.get('/list', fileController.listFiles);

// Get versions history for a file
router.get('/:fileId/versions', fileController.getFileVersions);

// Get storage deduplication stats
router.get('/stats', fileController.getStorageStats);

module.exports = router;
