const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
// const AWS = require('aws-sdk');

// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY,
//     region: 'eu-central-1'
// });

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

// const storage = multer.memoryStorage();

const router = express.Router();

const upload = multer({ storage: storage });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail); // New verification route

router.post('/resend-verification', authController.resendVerificationEmail);

router.post('/forgot-password', authController.forgotPassword); // New route for forgot password

router.post('/reset-password/:token', authController.resetPassword); // New route for actual password reset

router.put('/me', authMiddleware.authenticate, upload.single('avatar'), authController.updateMe);


router.get('/profile', authMiddleware.authenticate, (req, res) => {
    // If authenticateJWT middleware passes, req.user will be populated
    return res.json({ message: 'Authenticated!', user: req.user }); // Or return user profile data
});
module.exports = router;