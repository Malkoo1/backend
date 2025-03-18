const mongoose = require('mongoose');
const FolderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    active: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // ... folder fields
});

const Folder = mongoose.model('Folder', FolderSchema);

module.exports = Folder;