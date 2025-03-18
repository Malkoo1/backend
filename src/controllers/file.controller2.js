// backend/src/controllers/file.controller.js
const File = require('../models/file.model');
const Folder = require('../models/folder.model');

// 1. uploadFile - Protected route (Authenticated users only)
exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.user) { // Should be ensured by authMiddleware, but double-check
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const { folderId, description } = req.body; // Get folderId and description from request body
        const userId = req.user._id; // Get user ID from authenticated user

        // Validate folderId and check if the folder exists and belongs to the user (optional but recommended)
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(400).json({ message: 'Invalid folder ID.' });
        }
        if (folder.userId.toString() !== userId.toString()) { // Ensure folder belongs to the user (security)
            return res.status(403).json({ message: 'Unauthorized: Folder does not belong to the user.' });
        }

        const newFile = new File({
            filename: req.file.originalname, // or use a sanitized name if needed
            contentType: req.file.mimetype,
            size: req.file.size,
            userId: userId,
            folderId: folderId,
            content: req.file.buffer, // Assuming you are using multer memory storage, otherwise adjust based on storage
            description: description || '', // Use provided description or empty string
        });

        const savedFile = await newFile.save();

        res.status(201).json(savedFile); // Return the saved file object
    } catch (error) {
        console.error('Error uploading file:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 2. deleteFile - Admin-only route (Admin role required)
exports.deleteFile = async (req, res, next) => {
    try {
        if (!req.user) { // Should be ensured by authMiddleware, but double-check
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }
        if (!req.user.role === 'admin') { // Should be ensured by isAdmin middleware, but double-check
            return res.status(403).json({ message: 'Unauthorized: Admin role required.' });
        }

        const fileId = req.params.fileId;

        const fileToDelete = await File.findById(fileId);
        if (!fileToDelete) {
            return res.status(404).json({ message: 'File not found.' });
        }

        await File.findByIdAndDelete(fileId); // Delete the file

        res.json({ message: 'File deleted successfully.' }); // Success message
    } catch (error) {
        console.error('Error deleting file:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 3. listFilesForUser - User and Admin accessible (Authenticated users)
exports.listFilesForUser = async (req, res, next) => {
    try {
        if (!req.user) { // Should be ensured by authMiddleware, but double-check
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const userId = req.user._id; // Get user ID from authenticated user

        // You might want to add filtering or pagination later
        const files = await File.find({ userId: userId }).populate('folderId', 'name'); // Populate folder name for easier display

        res.json(files); // Return the array of files
    } catch (error) {
        console.error('Error listing files for user:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 4. getFileMetadata - Public route (No authentication required)
exports.getFileMetadata = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;

        const file = await File.findById(fileId).populate('userId', 'username'); // Populate user username for display
        if (!file) {
            return res.status(404).json({ message: 'File metadata not found.' });
        }

        res.json(file); // Return the file metadata
    } catch (error) {
        console.error('Error getting file metadata:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 5. addCommentToFile - Anyone can add comments (adjust auth as needed)
exports.addCommentToFile = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;
        const commentText = req.body.text;
        let authorInfo;

        if (req.user) { // Logged-in user (Admin or User role)
            authorInfo = { authorType: 'user', user: req.user._id }; // req.user should be set by auth middleware
        } else { // Guest user
            const guestName = req.body.guestName;
            if (!guestName) {
                return res.status(400).json({ message: "Guest name is required for guest comments." });
            }
            authorInfo = { authorType: 'guest', guestName: guestName };
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        const newComment = { text: commentText, author: authorInfo };
        file.comments.push(newComment);
        await file.save();

        // Populate the author field in the newly added comment (optional, for more complete response)
        await file.populate('comments.author.user', 'username').execPopulate(); // Populate user username

        const lastComment = file.comments[file.comments.length - 1]; // Get the last added comment

        res.status(201).json(lastComment); // Return the newly added comment
    } catch (error) {
        console.error('Error adding comment to file:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 6. getCommentsForFile - Public route (No authentication required)
exports.getCommentsForFile = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;

        const file = await File.findById(fileId).populate('comments.author.user', 'username'); // Populate username for comments
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }

        res.json(file.comments); // Return only the comments array
    } catch (error) {
        console.error('Error getting comments for file:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 7. (Optional) deleteComment - Might need admin or user authentication (Example: Admin only)
exports.deleteComment = async (req, res, next) => {
    try {
        if (!req.user) { // Should be ensured by authMiddleware
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }
        if (!req.user.role === 'admin') { // Should be ensured by isAdmin middleware
            return res.status(403).json({ message: 'Unauthorized: Admin role required.' });
        }

        const fileId = req.params.fileId;
        const commentIdToDelete = req.params.commentId;

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Find the index of the comment to delete
        const commentIndex = file.comments.findIndex(comment => comment._id.toString() === commentIdToDelete);
        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        file.comments.splice(commentIndex, 1); // Remove the comment from the array
        await file.save();

        res.json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        next(error);
    }
};

// 8. updateFile - Protected route (Authenticated users only)
exports.updateFile = async (req, res, next) => {
    try {
        if (!req.user) { // Authentication check
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const fileId = req.params.fileId;
        const { filename, description, folderId, relatedFiles } = req.body; // Get fields to update from request body
        const userId = req.user._id; // Authenticated user's ID

        const fileToUpdate = await File.findById(fileId);
        if (!fileToUpdate) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Authorization check: Ensure the file belongs to the logged-in user (or admin - adjust logic if needed)
        if (fileToUpdate.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to update this file.' });
        }

        // Validate folderId and check if the folder exists and belongs to the user (optional but recommended if changing folders)
        if (folderId) { // Only validate folder if folderId is provided in the update request
            const folder = await Folder.findById(folderId);
            if (!folder) {
                return res.status(400).json({ message: 'Invalid folder ID.' });
            }
            if (folder.userId.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Unauthorized: Folder does not belong to the user.' });
            }
            fileToUpdate.folderId = folderId; // Update folderId if valid
        }


        // Update fields if provided in the request
        if (filename) {
            fileToUpdate.filename = filename;
        }
        if (description) {
            fileToUpdate.description = description;
        }
        if (relatedFiles && Array.isArray(relatedFiles)) { // Validate relatedFiles is an array
            // Basic validation - could add more validation to check if related file IDs are valid if needed
            fileToUpdate.relatedFiles = relatedFiles;
        }

        fileToUpdate.updatedAt = Date.now(); // Update updatedAt timestamp

        const updatedFile = await fileToUpdate.save();

        res.json(updatedFile); // Return the updated file object
    } catch (error) {
        console.error('Error updating file:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 9. addReplyToComment - Protected route (Authenticated users can reply to comments)
exports.addReplyToComment = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;
        const commentId = req.params.commentId; // ID of the comment to reply to
        const replyText = req.body.text;
        let authorInfo;

        if (req.user) { // Logged-in user
            authorInfo = { authorType: 'user', user: req.user._id };
        } else { // Guest user (optional - you can restrict replies to logged-in users only if needed)
            const guestName = req.body.guestName;
            if (!guestName) {
                return res.status(400).json({ message: "Guest name is required for guest replies." });
            }
            authorInfo = { authorType: 'guest', guestName: guestName };
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        const commentToReplyTo = file.comments.id(commentId); // Find the specific comment within the file
        if (!commentToReplyTo) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const newReply = { text: replyText, author: authorInfo };
        commentToReplyTo.replies.push(newReply); // Push the reply into the replies array of the target comment
        await file.save();

        // Populate author for the newly added reply (optional)
        await file.populate('comments.replies.author.user', 'username').execPopulate();
        const lastReply = commentToReplyTo.replies[commentToReplyTo.replies.length - 1]; // Get the last reply

        res.status(201).json(lastReply); // Return the newly added reply
    } catch (error) {
        console.error('Error adding reply to comment:', error);
        next(error);
    }
};