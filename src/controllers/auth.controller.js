// backend/src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const User = require('../models/user.model');
const config = require('../config/config');
const emailUtils = require('../utils/email'); // Import email utility

const encryptionSecret = 'naveed_admin';


exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // 1. Input Validation (Basic - add more as needed)
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // 2. Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already taken.' }); // 409 Conflict
        }

        // 3. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Generate email verification token
        const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // Token expires in 24 hours
        const encryptedToken = CryptoJS.AES.encrypt(verificationToken, encryptionSecret).toString();

        const tailwindColors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const randomAvatarColor = tailwindColors[Math.floor(Math.random() * tailwindColors.length)];

        // 5. Create new user (now including verification fields)
        const newUser = new User({
            username,
            email,
            passwordHash,
            isEmailVerified: true, // Initially not verified
            emailVerificationToken: encryptedToken,
            emailVerificationTokenExpires: emailVerificationTokenExpires,
            avatarColor: randomAvatarColor,
        });

        await newUser.save();

        // 6. Send verification email (using the utility function)
        // await emailUtils.sendVerificationEmail(email, verificationToken);

        // 7. Respond with success message (inform user to check email)
        res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });

    } catch (error) {
        console.error("Registration controller error:", error);
        return next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Input Validation (Basic - you can add more robust validation)
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' }); // 400 Bad Request
        }

        // 2. User Lookup by Username
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // 401 Unauthorized - Username not found
        }

        // 3. Password Verification
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // 401 Unauthorized - Password incorrect
        }

        // 4. Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({ message: 'Email verification required. Please check your email.' }); // 403 Forbidden
        }

        // 5. Authentication Success - Generate JWT
        const payload = { userId: user._id, role: user.role }; // Include user ID and role in payload
        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour (adjust as needed)

        // Set JWT as an HttpOnly, Secure cookie
        // res.cookie('authToken', token, {
        //     httpOnly: true, // Make cookie HttpOnly (not accessible by JS)
        //     secure: process.env.NODE_ENV === 'production', // Set to true in production (HTTPS only)
        //     sameSite: 'Strict', // Recommended for CSRF protection
        //     maxAge: 3600000, // Cookie expiration (e.g., 1 hour in milliseconds) - matches JWT expiry
        //     path: '/', // Cookie valid for the entire domain
        // });

        // res.cookie('authToken', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'Lax',  // or 'None' for development ONLY
        //     maxAge: 3600000,
        //     path: '/',
        // });


        // res.cookie('authToken', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production', // Set to false in development
        //     sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax', // Use 'Lax' or 'None' in development
        //     maxAge: 3600000,
        //     path: '/',
        // });

        // 6. Send Token in Response
        return res.json({ token: token }); // Send JWT to client
        // return res.json({ message: 'Login successful' });

    } catch (error) {
        console.error("Login controller error:", error);
        return next(error); // Pass error to error handling middleware
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is missing.' }); // 400 Bad Request
        }

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationTokenExpires: { $gt: Date.now() }, // Check if token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' }); // 400 Bad Request
        }

        // Mark user as verified and clear verification token fields
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationTokenExpires = undefined;
        await user.save();

        // Respond with success - could redirect to login page or send success message
        res.status(200).json({ message: 'Email verified successfully. You can now log in.' }); // 200 OK
        // Or, you could redirect to login page:  res.redirect('/login');

    } catch (error) {
        console.error("Email verification error:", error);
        return next(error); // Error handling middleware
    }
};

exports.logout = (req, res) => {
    // Handle logout logic
    res.clearCookie("auth_token");
    res.json({ message: "User logged out" });
};