const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', folderController.createFolder);
router.get('/', folderController.getFolders);
router.put('/:folderId', folderController.updateFolder);
router.delete('/:folderId', folderController.deleteFolder);

module.exports = router;
