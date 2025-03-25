// backend/src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const User = require('../models/user.model');
const config = require('../config/config');
const emailUtils = require('../utils/email'); // Import email utility

const encryptionSecret = 'naveed_admin';


// exports.register = async (req, res, next) => {
//     try {
//         const { username, email, password } = req.body;

//         // 1. Input Validation (Basic - add more as needed)
//         if (!username || !password) {
//             return res.status(400).json({ message: 'Username and password are required.' });
//         }

//         // 2. Check if username already exists
//         // const existingUser = await User.findOne({ username });
//         // if (existingUser) {
//         //     return res.status(409).json({ message: 'Username already taken.' }); // 409 Conflict
//         // }

//         // 3. Hash the password
//         const saltRounds = 10;
//         const passwordHash = await bcrypt.hash(password, saltRounds);

//         // 4. Generate email verification token
//         const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//         const emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // Token expires in 24 hours
//         const encryptedToken = CryptoJS.AES.encrypt(verificationToken, encryptionSecret).toString();

//         const tailwindColors = [
//             'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
//             'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
//         ];
//         const randomAvatarColor = tailwindColors[Math.floor(Math.random() * tailwindColors.length)]; 4

//         // 5. Determine user role based on email domain
//         const emailDomain = email.split('@')[1]; // Extract domain from email
//         const role = emailDomain === 'sato-studio.at' ? 'admin' : 'user';

//         const EmailVerified = role === 'admin' ? true : false;

//         // 5. Create new user (now including verification fields)
//         const newUser = new User({
//             username,
//             email,
//             passwordHash,
//             role,
//             isEmailVerified: EmailVerified, // Initially not verified
//             emailVerificationToken: encryptedToken,
//             emailVerificationTokenExpires: emailVerificationTokenExpires,
//             avatarColor: randomAvatarColor,
//         });

//         await newUser.save();

//         // 6. Send verification email (using the utility function)
//         await emailUtils.sendVerificationEmail(email, verificationToken);

//         // 7. Respond with success message (inform user to check email)
//         if (role === 'admin') {
//             res.status(201).json({ message: 'Admin user registered successfully.Please Login' });
//         } else {
//             res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
//         }
//         // res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });

//     } catch (error) {
//         console.error("Registration controller error:", error);
//         return next(error);
//     }
// };


exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate email verification token
        const verificationToken = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        const encryptedToken = CryptoJS.AES.encrypt(verificationToken, encryptionSecret).toString();
        const emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Random Tailwind color for avatar
        const tailwindColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
        const randomAvatarColor = tailwindColors[Math.floor(Math.random() * tailwindColors.length)];

        // Determine user role
        const role = email.endsWith("@sato-studio.at") ? "admin" : "user";
        const isEmailVerified = role === "admin"; // Admins are automatically verified

        // Create new user
        const newUser = new User({
            username,
            email,
            passwordHash,
            role,
            isEmailVerified,
            emailVerificationToken: encryptedToken,
            emailVerificationTokenExpires,
            avatarColor: randomAvatarColor,
        });

        await newUser.save();

        // Send verification email (only for non-admin users)
        if (!isEmailVerified) {
            await emailUtils.sendVerificationEmail(email, verificationToken);
        }

        res.status(201).json({
            message: isEmailVerified
                ? "Admin user registered successfully. Please login."
                : "User registered successfully. Please check your email to verify your account."
        });

    } catch (error) {
        console.error("Registration error:", error);
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


        // 6. Send Token in Response
        return res.json({ token: token }); // Send JWT to client
        // return res.json({ message: 'Login successful' });

    } catch (error) {
        console.error("Login controller error:", error);
        return next(error); // Pass error to error handling middleware
    }
};

// exports.verifyEmail = async (req, res, next) => {
//     try {
//         const { token } = req.params;

//         if (!token) {
//             return res.status(400).json({ message: 'Verification token is missing.' }); // 400 Bad Request
//         }

//         const encryptedToken = CryptoJS.AES.encrypt(token, encryptionSecret).toString();

//         const user = await User.findOne({
//             emailVerificationToken: encryptedToken,
//             emailVerificationTokenExpires: { $gt: Date.now() }, // Check if token is not expired
//         });

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid or expired verification token.' }); // 400 Bad Request
//         }

//         // Mark user as verified and clear verification token fields
//         user.isEmailVerified = true;
//         user.emailVerificationToken = undefined;
//         user.emailVerificationTokenExpires = undefined;
//         await user.save();

//         return res.status(200).json({
//             message: "Email verified successfully. You can now log in.",
//             email: user.email, // Returning email
//         });

//         // Respond with success - could redirect to login page or send success message
//         // res.status(200).json({ message: 'Email verified successfully. You can now log in.' }); // 200 OK
//         // Or, you could redirect to login page:  res.redirect('/login');

//     } catch (error) {
//         console.error("Email verification error:", error);
//         return next(error); // Error handling middleware
//     }
// };



exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: "Verification token is missing." });
        }

        // First find users with unexpired tokens (narrow down the search)
        const users = await User.find({
            emailVerificationTokenExpires: { $gt: Date.now() },
            isEmailVerified: false // Only check unverified users
        }).select('emailVerificationToken email isEmailVerified');

        let matchedUser = null;

        // More efficient search with early termination
        for (const user of users) {
            try {
                const decryptedToken = CryptoJS.AES.decrypt(
                    user.emailVerificationToken,
                    encryptionSecret
                ).toString(CryptoJS.enc.Utf8);

                if (decryptedToken === token) {
                    matchedUser = user;
                    break; // Found our user, exit loop
                }
            } catch (err) {
                console.error("Decryption error for user:", user.email, err);
                continue; // Skip to next user if decryption fails
            }
        }

        if (!matchedUser) {
            // Check if token exists but is expired
            const expiredUser = await User.findOne({
                emailVerificationToken: { $exists: true },
                emailVerificationTokenExpires: { $lte: Date.now() }
            });

            if (expiredUser) {
                return res.status(400).json({
                    message: "Verification token has expired. Please request a new one.",
                    code: "TOKEN_EXPIRED"
                });
            }

            return res.status(400).json({
                message: "Invalid verification token.",
                code: "INVALID_TOKEN"
            });
        }

        // Update user (verify email and clear token)
        const updatedUser = await User.findByIdAndUpdate(
            matchedUser._id,
            {
                $set: { isEmailVerified: true },
                $unset: {
                    emailVerificationToken: 1,
                    emailVerificationTokenExpires: 1
                }
            },
            { new: true }
        );

        res.status(200).json({
            message: "Email verified successfully!",
            email: updatedUser.email,
            isEmailVerified: true
        });

    } catch (error) {
        console.error("Email verification error:", error);
        return next(error);
    }
};

exports.updateMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }
        const userId = req.user._id;
        const { username, email, currentPassword, newPassword, confirmNewPassword } = req.body;
        let avatarPath = req.file ? `/uploads/${req.file.filename}` : undefined;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update username and email if provided
        if (username) {
            user.username = username;
        }
        if (email) {
            const existingUserWithEmail = await User.findOne({ email: email, _id: { $ne: userId } });
            if (existingUserWithEmail) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            user.email = email;
        }

        // Update avatar if a new file is uploaded
        if (avatarPath) {
            user.avatar = avatarPath;
        }

        // Handle password update if currentPassword and newPassword are provided
        if (currentPassword && newPassword && confirmNewPassword) {
            if (!user.passwordHash) { // Changed from user.password
                return res.status(400).json({ message: 'Password cannot be changed as no password is set for this user.' });
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash); // Changed from user.password
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid current password' });
            }
            if (newPassword !== confirmNewPassword) {
                return res.status(400).json({ message: 'New password and confirm password do not match' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'New password must be at least 6 characters long' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.passwordHash = hashedPassword; // Changed from user.password
        }

        user.updatedAt = Date.now();
        await user.save();

        const updatedUserWithoutPassword = await User.findById(userId).select('-passwordHash'); // Changed from -password
        res.status(200).json({ success: true, user: updatedUserWithoutPassword });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update user profile' });
    }
};

exports.resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required."
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address."
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "This email is already verified."
            });
        }

        // Generate new token and expiration (24 hours from now)
        const verificationToken = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        const encryptedToken = CryptoJS.AES.encrypt(
            verificationToken,
            encryptionSecret
        ).toString();

        user.emailVerificationToken = encryptedToken;
        user.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        // Send email
        await emailUtils.sendVerificationEmail(user.email, verificationToken);

        res.status(200).json({
            success: true,
            message: "Verification email resent successfully."
        });

    } catch (error) {
        console.error("Error resending verification email:", error);
        next(error);
    }
};

exports.logout = (req, res) => {
    // Handle logout logic
    res.clearCookie("auth_token");
    res.json({ message: "User logged out" });
};