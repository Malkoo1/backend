const mongoose = require('mongoose');
const ShareSchema = new mongoose.Schema({
    resourceType: { type: String, enum: ['folder', 'file'], required: true }, // Type of resource being shared
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: false }, // ID of the file
    folderId: { type: mongoose.Schema.Types.ObjectId, required: false }, // ID of the folder
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who shared the resource
    sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User with whom the resource is shared
    permissions: { type: String, enum: ['view', 'edit', 'delete'], default: 'view' }, // Permissions for the shared resource
    createdAt: { type: Date, default: Date.now }
});

const Share = mongoose.model('Share', ShareSchema);

module.exports = Share;