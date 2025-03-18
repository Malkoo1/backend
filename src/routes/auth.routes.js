const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail); // New verification route

router.get('/profile', authMiddleware.authenticate, (req, res) => {
    // If authenticateJWT middleware passes, req.user will be populated
    return res.json({ message: 'Authenticated!', user: req.user }); // Or return user profile data
});
module.exports = router;