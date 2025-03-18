
const File = require('../models/file.model');
const Folder = require('../models/folder.model');
const User = require('../models/user.model');
const Share = require('../models/share.model');
const mongoose = require('mongoose');
const path = require('path');


// 1. uploadFile - Protected route (Authenticated users only)
exports.uploadMultipleFiles = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        if (!req.files || req.files.length === 0) { // Check for req.files array instead of req.file
            return res.status(400).json({ message: 'No files uploaded.' });
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

        const savedFiles = []; // Array to store saved file objects

        for (const fileData of req.files) { // Iterate over req.files array

            const filePath = `uploads/${fileData.filename}`;
            let fileSize = fileData.size; // in bytes
            let fileSizeFormatted;
            if (fileSize < 1024) {
                fileSizeFormatted = `${fileSize} Bytes`;
            } else if (fileSize < 1024 * 1024) {
                fileSizeFormatted = `${(fileSize / 1024).toFixed(2)} KB`;
            } else {
                fileSizeFormatted = `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
            }

            // Extract file extension (e.g., png, pdf, docx)
            const fileExtension = path.extname(fileData.originalname).substring(1);

            const newFile = new File({
                id: Date.now(), // basic id generation, consider UUID or better approach
                name: fileData.originalname, // or use a sanitized name if needed
                type: fileExtension, // Store only the extension
                size: fileSizeFormatted, // Store formatted size
                userId: userId,
                folderId: folderId,
                path: filePath,
                content: fileData.buffer, // Access file data from each element in req.files
                description: description || '', // Use provided description or empty string
            });

            const savedFile = await newFile.save();
            savedFiles.push(savedFile); // Add each saved file to the array
        }

        res.status(201).json(savedFiles); // Return the array of saved file objects
    } catch (error) {
        console.error('Error uploading multiple files:', error);
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

        const file = await File.findById(fileId)
            .populate('userId', 'username') // Populate user who uploaded the file
            .populate({
                path: 'annotations.comments.userId',
                select: 'username', // Only fetch the username
            }).populate('approvals.userId', 'name email avatar');


        if (!file) {
            return res.status(404).json({ message: 'File metadata not found.' });
        }

        res.json(file); // Return the file metadata with user details in comments
    } catch (error) {
        console.error('Error getting file metadata:', error);
        next(error); // Pass error to error handling middleware
    }
};


// 6. getCommentsForFile - Public route (No authentication required)
exports.getCommentsForFile = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;

        const file = await File.findById(fileId).populate('annotations.0.comments.author.user', 'username'); // Populate username for comments
        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }

        res.json(file.annotations[0].comments); // Return only the comments array from the first annotation. Adjust as needed if you have multiple annotations and want to retrieve comments differently
    } catch (error) {
        console.error('Error getting comments for file:', error);
        next(error); // Pass error to error handling middleware
    }
};


// 8. updateFile - Protected route (Authenticated users only)
// exports.updateFile = async (req, res, next) => {
//     try {
//         if (!req.user) { // Authentication check
//             return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
//         }

//         const fileId = req.params.fileId;
//         const { name, description, folderId, versions } = req.body; // Get fields to update from request body
//         const userId = req.user._id; // Authenticated user's ID

//         const fileToUpdate = await File.findById(fileId);
//         if (!fileToUpdate) {
//             return res.status(404).json({ message: 'File not found.' });
//         }

//         // Authorization check: Ensure the file belongs to the logged-in user (or admin - adjust logic if needed)
//         if (fileToUpdate.userId.toString() !== userId.toString()) {
//             return res.status(403).json({ message: 'Unauthorized: You do not have permission to update this file.' });
//         }

//         // Validate folderId and check if the folder exists and belongs to the user (optional but recommended if changing folders)
//         if (folderId) { // Only validate folder if folderId is provided in the update request
//             const folder = await Folder.findById(folderId);
//             if (!folder) {
//                 return res.status(400).json({ message: 'Invalid folder ID.' });
//             }
//             if (folder.userId.toString() !== userId.toString()) {
//                 return res.status(403).json({ message: 'Unauthorized: Folder does not belong to the user.' });
//             }
//             fileToUpdate.folderId = folderId; // Update folderId if valid
//         }


//         // Update fields if provided in the request
//         if (name) {
//             fileToUpdate.name = name;
//         }
//         if (description) {
//             fileToUpdate.description = description;
//         }
//         if (versions && Array.isArray(versions)) {
//             fileToUpdate.versions = versions; // consider logic to merge or replace versions based on your needs
//         }


//         fileToUpdate.updatedAt = Date.now(); // Update updatedAt timestamp

//         const updatedFile = await fileToUpdate.save();

//         res.json(updatedFile); // Return the updated file object
//     } catch (error) {
//         console.error('Error updating file:', error);
//         next(error); // Pass error to error handling middleware
//     }
// };

exports.updateFile = async (req, res, next) => {

    try {
        if (!req.user) { // Authentication check
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const fileId = req.params.fileId;
        const { description } = req.body; // Only allow updating description
        const userId = req.user._id; // Authenticated user's ID

        const fileToUpdate = await File.findById(fileId);
        if (!fileToUpdate) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Authorization check: Ensure the file belongs to the logged-in user
        if (fileToUpdate.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to update this file.' });
        }

        // Update only the description field if provided
        if (description) {
            fileToUpdate.description = description;
        } else {
            return res.status(400).json({ message: 'Description is required for update.' });
        }

        fileToUpdate.updatedAt = Date.now(); // Update timestamp

        await fileToUpdate.save();

        res.json({ message: 'File description updated successfully.' });
    } catch (error) {
        console.error('Error updating file description:', error);
        next(error); // Pass error to error handling middleware
    }
};

// 9. addReplyToComment - Protected route (Authenticated users can reply to comments) - ADJUST TO ANNOTATIONS
exports.addReplyToComment = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;
        const annotationIndex = 0; // Assuming reply to comment in the first annotation. Adjust index as needed
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

        if (!file.annotations || !file.annotations[annotationIndex] || !file.annotations[annotationIndex].comments) {
            return res.status(404).json({ message: "Annotation or comments not found for this file" });
        }

        const commentToReplyTo = file.annotations[annotationIndex].comments.id(commentId); // Find the specific comment within the file and annotation
        if (!commentToReplyTo) {
            return res.status(404).json({ message: "Comment not found" });
        }

        const newReply = { text: replyText, author: authorInfo, id: Date.now() };
        // commentToReplyTo.replies.push(newReply); // No replies array in current schema, consider modifying CommentSchema if replies are needed within comments
        //  Instead of replies within comments, let's add it as a new comment to the same annotation for simplicity for now
        file.annotations[annotationIndex].comments.push(newReply);
        await file.save();

        // Populate author for the newly added reply (optional)
        await file.populate('annotations.0.comments.author.user', 'username').execPopulate();
        const lastComment = file.annotations[0].comments[file.annotations[0].comments.length - 1]; // Get the last comment which is effectively the reply

        res.status(201).json(lastComment); // Return the newly added reply (which is a comment)
    } catch (error) {
        console.error('Error adding reply to comment:', error);
        next(error);
    }
};

// 10. downloadFile - Protected route (Authenticated users can download their files)
exports.downloadFile = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const fileId = req.params.fileId;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Authorization: Check if the file belongs to the logged-in user or if user is admin (adjust as needed)
        if (file.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to download this file.' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Type', file.type); // or use 'application/octet-stream' for generic download
        res.send(file.content); // Send file buffer as response
    } catch (error) {
        console.error('Error downloading file:', error);
        next(error);
    }
};

// 11. searchFilesForUser - Protected route (Authenticated users can search their files)
exports.searchFilesForUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const userId = req.user._id;
        const searchQuery = req.query.q; // Get search query from query parameter

        if (!searchQuery) {
            return res.status(400).json({ message: 'Search query parameter "q" is required.' });
        }

        // Basic text search on name and description. Can be improved with indexing and more sophisticated search techniques
        const files = await File.find({
            userId: userId,
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search on name
                { description: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search on description
            ]
        }).populate('folderId', 'name');

        res.json(files);
    } catch (error) {
        console.error('Error searching files for user:', error);
        next(error);
    }
};

// 12. moveFileToFolder - Protected route (Authenticated users can move their files)
exports.moveFileToFolder = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const fileId = req.params.fileId;
        const { folderId: newFolderId } = req.body; // Get new folder ID from request body
        const userId = req.user._id;

        if (!newFolderId) {
            return res.status(400).json({ message: 'New folder ID is required.' });
        }

        const fileToMove = await File.findById(fileId);
        if (!fileToMove) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Authorization: Check if the file belongs to the logged-in user
        if (fileToMove.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to move this file.' });
        }

        const newFolder = await Folder.findById(newFolderId);
        if (!newFolder) {
            return res.status(400).json({ message: 'Invalid new folder ID.' });
        }
        // Authorization: Check if the new folder belongs to the logged-in user
        if (newFolder.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: New folder does not belong to the user.' });
        }

        fileToMove.folderId = newFolderId; // Update file's folder ID
        const updatedFile = await fileToMove.save();

        res.json(updatedFile);
    } catch (error) {
        console.error('Error moving file to folder:', error);
        next(error);
    }
};

// 13. getFileVersions - Public route (Anyone can get file versions metadata)
exports.getFileVersions = async (req, res, next) => {
    try {
        const fileId = req.params.fileId;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }

        res.json(file.versions); // Return the versions array
    } catch (error) {
        console.error('Error getting file versions:', error);
        next(error);
    }
};

exports.uploadMultipleVersionsFile = async (req, res, next) => {
    try {

        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        if (!req.files || req.files.length === 0) { // Check for req.files array instead of req.file
            return res.status(400).json({ message: 'No files uploaded.' });
        }
        const { fileId } = req.body;
        const files = req.files;

        if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({ message: 'Invalid fileId' });
        }

        const fileDoc = await File.findById(fileId);
        if (!fileDoc) {
            return res.status(404).json({ message: 'File not found' });
        }

        const formatFileSize = (bytes) => {
            if (bytes < 1024) {
                return bytes + ' Bytes';
            } else if (bytes < 1048576) { // 1024 * 1024
                return (bytes / 1024).toFixed(2) + ' KB';
            } else if (bytes < 1073741824) { // 1024 * 1024 * 1024
                return (bytes / 1048576).toFixed(2) + ' MB';
            } else {
                return (bytes / 1073741824).toFixed(2) + ' GB';
            }
        };

        const newVersions = files.map((file, index) => ({
            id: fileDoc.versions.length + index + 1,
            name: file.originalname,
            path: file.path,
            size: formatFileSize(parseInt(file.size)),
            date: new Date()
        }));

        fileDoc.versions.push(...newVersions);
        fileDoc.updatedAt = new Date();
        await fileDoc.save();

        res.status(200).json({ message: 'Files uploaded successfully', versions: newVersions });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
        next(error);
    }
};


exports.addAnnotation = async (req, res) => {
    const { documentId } = req.params;
    const { x, y, comments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
    }

    if (typeof x !== 'number' || typeof y !== 'number') {
        return res.status(400).json({ message: 'Annotation x and y coordinates must be numbers' });
    }

    try {
        const file = await File.findById(documentId);
        if (!file) {
            return res.status(404).json({ message: 'Document not found' });
        }



        let lastId = file.annotations.length > 0
            ? file.annotations[file.annotations.length - 1].id
            : 0;

        const newAnnotation = {
            id: lastId + 1, // Increment ID sequentially
            x,
            y,
            comments: comments || '',
        };

        file.annotations.push(newAnnotation);
        await file.save();

        res.status(201).json(newAnnotation);
    } catch (error) {
        console.error('Error saving annotation:', error);
        res.status(500).json({ message: 'Failed to save annotation', error: error.message });
    }
};

exports.addCommentToAnnotation = async (req, res) => {
    const { documentId, annotationId } = req.params;
    const { text, userId, guestName, avatar, avatarColor } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
    }

    if (!Number.isInteger(parseInt(annotationId))) {
        return res.status(400).json({ message: 'Invalid annotation ID' });
    }

    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try {
        const file = await File.findById(documentId);
        if (!file) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const annotation = file.annotations.find(anno => anno.id === parseInt(annotationId));
        if (!annotation) {
            return res.status(404).json({ message: 'Annotation not found' });
        }

        // Generate a **sequential** comment ID based on existing comments
        let lastCommentId = annotation.comments.length > 0
            ? annotation.comments[annotation.comments.length - 1].id
            : 0;

        const newComment = {
            id: lastCommentId + 1, // Sequential Comment ID
            text: text.trim(),
            time: new Date(),
            edited: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: userId || null,
            guestName: userId ? null : guestName || 'Guest', // Ensure guest name if no userId
            avatar: avatar || null,
            avatarColor: avatarColor || null,
        };



        annotation.comments.push(newComment);
        await file.save();

        const populatedFile = await File.findById(documentId).populate({
            path: 'annotations.comments.userId',
            select: 'username email avatar avatarColor', // Select required fields
        });

        // Find the newly added comment in the populated data
        const populatedAnnotation = populatedFile.annotations.find(anno => anno.id === parseInt(annotationId));
        const populatedComment = populatedAnnotation.comments.find(c => c.id === newComment.id);

        res.status(201).json(populatedComment);

        // res.status(201).json(newComment);
    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(500).json({ message: 'Failed to save comment', error: error.message });
    }
};

exports.deleteCommentFromAnnotation = async (req, res) => {
    const { documentId, annotationId, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
    }

    if (!Number.isInteger(parseInt(annotationId))) {
        return res.status(400).json({ message: 'Invalid annotation ID' });
    }

    if (!Number.isInteger(parseInt(commentId))) {
        return res.status(400).json({ message: 'Invalid comment ID' });
    }

    try {
        const file = await File.findById(documentId);
        if (!file) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const annotationIndex = file.annotations.findIndex(anno => anno.id === parseInt(annotationId));
        if (annotationIndex === -1) {
            return res.status(404).json({ message: 'Annotation not found' });
        }

        const initialCommentLength = file.annotations[annotationIndex].comments.length;

        // Remove the comment
        file.annotations[annotationIndex].comments = file.annotations[annotationIndex].comments.filter(
            comment => comment.id !== parseInt(commentId)
        );

        if (file.annotations[annotationIndex].comments.length === initialCommentLength) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        await file.save();

        res.status(200).json({ message: 'Comment deleted successfully' });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Failed to delete comment', error: error.message });
    }
};

exports.updateCommentInAnnotation = async (req, res) => {
    const { documentId, annotationId, commentId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
    }

    if (!Number.isInteger(parseInt(annotationId))) {
        return res.status(400).json({ message: 'Invalid annotation ID' });
    }

    if (!Number.isInteger(parseInt(commentId))) {
        return res.status(400).json({ message: 'Invalid comment ID' });
    }

    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    try {
        const file = await File.findById(documentId);
        if (!file) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const annotationIndex = file.annotations.findIndex(anno => anno.id === parseInt(annotationId));
        if (annotationIndex === -1) {
            return res.status(404).json({ message: 'Annotation not found' });
        }

        const commentIndex = file.annotations[annotationIndex].comments.findIndex(
            comment => comment.id === parseInt(commentId)
        );

        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Update the comment properties
        file.annotations[annotationIndex].comments[commentIndex].text = text.trim();
        file.annotations[annotationIndex].comments[commentIndex].edited = true;
        file.annotations[annotationIndex].comments[commentIndex].updatedAt = new Date();

        await file.save();

        const updatedFile = await File.findById(documentId).populate('annotations.comments.userId');

        res.status(200).json(updatedFile.annotations[annotationIndex].comments[commentIndex]);

        // res.status(200).json(file.annotations[annotationIndex].comments[commentIndex]); // Return the updated comment

    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Failed to update comment', error: error.message });
    }
};

exports.approveDocument = async (req, res) => {
    const { documentId } = req.params;
    const { userId, guestName, avatar, avatarColor } = req.body;

    try {
        // Find the document
        const document = await File.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Remove existing approval if userId already exists
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            document.approvals = document.approvals.filter(approval =>
                !(approval.userId && approval.userId.toString() === userId)
            );
        }

        let populatedUser = null;

        // Fetch user details if userId exists
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            populatedUser = await User.findById(userId).select('name email avatar');
        }

        // Create a new approval object
        const newApproval = {
            userId: populatedUser ? populatedUser._id : null, // Only store userId if user exists
            user: populatedUser || null, // Include user data if found
            guestName: guestName || null, // For guest users
            avatar: avatar || null, // Optional for guest users
            avatarColor: avatarColor || null, // Optional for guest users
            approvedAt: new Date(), // Timestamp of approval
        };

        // Add the new approval to the document
        document.approvals.push(newApproval);
        await document.save();

        // Populate the approvals with user data before sending response
        const updatedDocument = await File.findById(documentId)
            .populate('approvals.userId', 'name email avatar');

        res.status(200).json({ message: 'Approval saved successfully', document: updatedDocument });

    } catch (error) {
        console.error('Error saving approval:', error);
        res.status(500).json({ message: 'Failed to save approval', error: error.message });
    }
};


// Function to handle file sharing
exports.shareFile = async (req, res) => {
    try {
        const { resourceType, resourceId, shareEmails, permissions = 'view' } = req.body;
        const sharedBy = req.user._id; // Retrieved from authentication middleware

        if (!resourceType || !resourceId || !shareEmails || !Array.isArray(shareEmails)) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Find the user who is sharing
        const sharingUser = await User.findById(sharedBy);
        if (!sharingUser) {
            return res.status(404).json({ message: 'Sharing user not found.' });
        }

        let responseMessages = []; // ✅ Store messages instead of sending multiple responses

        // Process each email to find the user and create a share record
        for (const email of shareEmails) {
            if (!email) continue; // Skip empty emails

            const sharedWithUser = await User.findOne({ email });
            if (!sharedWithUser) {
                responseMessages.push(`User with email ${email} not found.`);
                continue; // Move to the next email
            }

            let folderId = null;

            if (resourceType === 'file') {
                // Get folderId from the File model
                const file = await File.findById(resourceId);
                if (!file || !file.folderId) {
                    return res.status(404).json({ message: 'File not found or has no folder associated.' });
                }
                folderId = file.folderId;
            } else if (resourceType === 'folder') {
                folderId = resourceId; // When sharing a folder, the resourceId is the folder ID
            }

            const newShare = new Share({
                resourceType,
                resourceId: resourceType === 'file' ? resourceId : null, // Set resourceId only for files
                folderId: folderId,
                sharedBy,
                sharedWith: sharedWithUser._id,
                permissions,
            });

            await newShare.save();
        }

        // ✅ Send response only once at the end
        return res.status(201).json({
            message: 'Resource sharing process completed.',
            details: responseMessages.length ? responseMessages : 'All users found and shared successfully.',
        });

    } catch (error) {
        console.error('Error sharing resource:', error);

        // ✅ Ensure only one response is sent
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to share resource.', error: error.message });
        }
    }
};