// backend/src/routes/file.routes.js
const express = require('express');
const fileController = require('../controllers/file.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Set up storage to save files in "uploads/" directory
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save files in "uploads/" directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt); // Unique file name
    }
});

// Configure Multer to use disk storage
// Import multer for file uploads

const router = express.Router();

// Multer setup for file uploads (using memory storage for this example)
const upload = multer({ storage: storage }); // or diskStorage for file system

// Protected route - only authenticated users can access for file uploads
router.post('/upload', authMiddleware.authenticate, upload.array('files'), fileController.uploadMultipleFiles); // Changed to uploadMultipleFiles controller

// Admin-only route - only admins can access for deleting files
// router.delete('/:fileId', authMiddleware.authenticate, authMiddleware.isAdmin, fileController.deleteFile);

// Route that can be accessed by authenticated users (users and admins) for listing their files
router.get('/user-files', authMiddleware.authenticate, authMiddleware.isUser, fileController.listFilesForUser); // Changed route path for clarity

// Public route - no authentication required for getting file metadata
router.get('/document/:fileId', fileController.getFileMetadata);


// Public route - anyone can get comments for a file
router.get('/:fileId/comments', fileController.getCommentsForFile);

// Protected route - authenticated users can add replies to comments
router.post('/:fileId/comments/:commentId/replies', authMiddleware.authenticate, authMiddleware.isUser, fileController.addReplyToComment); // Added auth for replies - adjust as needed



// Protected route - only authenticated users can access for updating file metadata and versions
router.patch('/:fileId', authMiddleware.authenticate, authMiddleware.isUser, fileController.updateFile); // PATCH for updates

// Protected route - authenticated users can download their files
router.get('/:fileId/download', authMiddleware.authenticate, authMiddleware.isUser, fileController.downloadFile);

// Protected route - authenticated users can search their files
router.get('/user-files/search', authMiddleware.authenticate, authMiddleware.isUser, fileController.searchFilesForUser);

// Protected route - authenticated users can move their files to different folders
router.patch('/:fileId/move', authMiddleware.authenticate, authMiddleware.isUser, fileController.moveFileToFolder);

// Public route - anyone can get file versions
router.get('/:fileId/versions', fileController.getFileVersions);

router.post('/:fileId/upload', authMiddleware.authenticate, upload.array('files'), fileController.uploadMultipleVersionsFile);


router.post('/document/:documentId/annotations', fileController.addAnnotation);

router.post('/document/:documentId/annotations/:annotationId/comments', fileController.addCommentToAnnotation);

router.delete('/document/:documentId/annotations/:annotationId/comments/:commentId', fileController.deleteCommentFromAnnotation);

router.put('/document/:documentId/annotations/:annotationId/comments/:commentId', fileController.updateCommentInAnnotation);

router.post('/documents/:documentId/approve', fileController.approveDocument);

router.post('/share', authMiddleware.authenticate, fileController.shareFile);

// router.get('/:file_id/emails', fileController.getSharedEmails);
router.get("/:type/:file_id/emails", fileController.getSharedEmails);

router.delete("/share", authMiddleware.authenticate, fileController.removeSharedAccess);

module.exports = router;




