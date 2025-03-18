const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true, index: true },
    content: { type: Buffer }, // Or contentUrl: { type: String }, depending on your storage
    description: { type: String },
    relatedFiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }], // New: Array of related File ObjectIds
    comments: [
        {
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            author: {
                type: {              //  Polymorphic author field to handle Users and Guests
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For registered users
                    guestName: { type: String }                                // For guest users
                },
                required: true,      // Author is always required
                discriminatorKey: 'authorType' // For Mongoose Discriminators (optional, for more structured typing)
            },
            replies: [             // New: Array for comment replies (nested comments)
                {
                    text: { type: String, required: true },
                    createdAt: { type: Date, default: Date.now },
                    author: {      // Author for replies, same structure as main comment author
                        type: {
                            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                            guestName: { type: String }
                        },
                        required: true,
                        discriminatorKey: 'authorType'
                    }
                }
            ]
        }
    ],
    // ... other file fields
});

const File = mongoose.model('File', FileSchema);

module.exports = File;