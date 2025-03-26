const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    avatar: { type: String, default: '' }, // New field: Avatar URL
    avatarColor: { type: String, default: 'bg-green-500' }, // New field: Avatar color
    isEmailVerified: { type: Boolean, default: false }, // New field: Email verification status
    emailVerificationToken: { type: String },         // New field: Verification token
    emailVerificationTokenExpires: { type: Date },    // New field: Token expiry
    passwordResetToken: { type: String }, // New field for password reset token
    passwordResetTokenExpires: { type: Date }, // New field for password reset token expiry
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;