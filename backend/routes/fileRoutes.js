const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// Protect all file routes
router.use(auth);

// Upload a new file
router.post('/upload', upload.single('file'), fileController.uploadFile);

// Chunked upload
router.post('/upload/chunk', upload.single('chunk'), fileController.uploadChunk);

// Reassemble chunks
router.post('/upload/complete', fileController.completeUpload);

// Update a file as a new version
router.post('/upload/:fileId/version', upload.single('file'), fileController.updateFileVersion);

// Download a file
router.get('/download/:fileId', fileController.downloadFile);

// List all files
router.get('/list', fileController.listFiles);

// Search files
router.get('/search', fileController.searchFiles);

// Recommend files
router.get('/recommend', fileController.recommendFiles);

// Move to trash
router.post('/trash/:fileId', fileController.moveToTrash);

// Share file
router.post('/share/:fileId', fileController.shareFile);

// Restore from trash
router.post('/restore/:fileId', fileController.restoreFile);

// Delete a file completely
router.delete('/:fileId', fileController.deleteFile);

// Get versions history for a file
router.get('/:fileId/versions', fileController.getFileVersions);

// Restore a file to a specific version
router.post('/:fileId/restore/:versionNumber', fileController.restoreVersion);
router.post('/:fileId/restore-version/:versionNumber', fileController.restoreVersion);

// AI Document Summary
router.post('/:fileId/summarize', fileController.summarizeFile);


module.exports = router;
