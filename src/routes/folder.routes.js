// backend/src/routes/folder.routes.js
const express = require('express');
const folderController = require('../controllers/folder.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Protected routes - require authentication


router.post('/folders', authMiddleware.authenticate, folderController.createFolder);
router.get('/folders', authMiddleware.authenticate, folderController.listFoldersForUser);
router.get('/:folderId', authMiddleware.authenticate, folderController.getFolderById);

router.get('/share/:folderId', authMiddleware.authenticate, folderController.getFolderByIdWithSharedFiles);
router.patch('/:folderId', authMiddleware.authenticate, folderController.updateFolder);
router.delete('/:folderId', authMiddleware.authenticate, folderController.deleteFolder);



module.exports = router;