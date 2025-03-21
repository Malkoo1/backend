const mongoose = require('mongoose');

// Comment Schema
const CommentSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // For registered users
    guestName: { type: String, default: null }, // For guest users
    avatar: { type: String, required: false }, // Optional for guest users
    avatarColor: { type: String, required: false }, // Optional for guest users
    text: { type: String, required: true },
    time: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Annotation Schema
const AnnotationSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    comments: [CommentSchema], // Array of comments
    resolved: { type: Boolean, default: false }, // New field to track resolution status
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Admin who resolved the annotation
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Version Schema
const VersionSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
    date: { type: Date, default: Date.now },
    size: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const ApprovalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // For registered users
    guestName: { type: String, default: null }, // For guest users
    avatar: { type: String, required: false }, // Optional for guest users
    avatarColor: { type: String, required: false }, // Optional for guest users
    approvedAt: { type: Date, default: Date.now }, // Timestamp of approval
});

const AdditionalFileSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the additional file
    path: { type: String, required: true }, // Path of the additional file
    size: { type: String, required: true }, // Size of the additional file
    type: { type: String, required: true }, // Type of the additional file
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// File Schema
const FileSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    size: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Reference to User
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true, index: true }, // Reference to Folder
    path: { type: String, required: true },
    additionalFiles: [AdditionalFileSchema],
    versions: [VersionSchema], // Array of versions
    annotations: [AnnotationSchema], // Array of annotations
    approvals: [ApprovalSchema], // Array of approvals by users and guests
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create the File model
const File = mongoose.model('File', FileSchema);

module.exports = File;