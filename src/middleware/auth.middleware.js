const jwt = require('jsonwebtoken');
const User = require('../models/user.model'); // Import your User model
const config = require('../config/config'); // Import your config (for JWT_SECRET)

// 1. Authentication Middleware: Verify JWT and User Login
exports.authenticate = async (req, res, next) => {
    try {
        // Get the JWT token from the Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

        // const token = req.cookies.authToken;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required: No token provided.' }); // 401 Unauthorized
        }

        // Verify the JWT token
        jwt.verify(token, config.jwtSecret, async (err, decodedToken) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token.' }); // 403 Forbidden - Token is valid but rejected
            }

            // Token is valid, 'decodedToken' contains the payload (user info)
            // Attach the user object to the request for subsequent middleware/controllers
            try {
                const user = await User.findById(decodedToken.userId); // Assuming userId is in JWT payload
                if (!user) {
                    return res.status(404).json({ message: 'User not found.' }); // User from token no longer exists
                }
                req.user = user; // Attach user object to request
                next(); // Proceed to the next middleware or route handler
            } catch (dbError) {
                console.error("Database error fetching user:", dbError);
                return res.status(500).json({ message: 'Internal server error.', error: dbError }); // 500 Server Error
            }
        });
    } catch (error) {
        console.error("Authentication middleware error:", error);
        return res.status(500).json({ message: 'Internal server error.', error: error }); // 500 Server Error
    }
};

// 2. Role-Based Authorization Middleware: isAdmin - Check for Admin Role
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        return res.status(403).json({ message: 'Unauthorized: Admin role required.' }); // 403 Forbidden - Not enough permission
    }
};

// Example of another role-based middleware - isUser (optional - for user role, could be redundant if 'authenticate' is enough for user routes)
exports.isUser = (req, res, next) => {
    if (req.user && (req.user.role === 'user' || req.user.role === 'admin')) { // Allow both user and admin
        next(); // User is a 'user' or 'admin', proceed
    } else {
        return res.status(403).json({ message: 'Unauthorized: User role required.' }); // 403 Forbidden - Not enough permission
    }
};

// You can add more role-based middleware functions as needed (e.g., isEditor, isModerator, etc.)