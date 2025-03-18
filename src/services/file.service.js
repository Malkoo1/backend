const File = require('../models/file.model');

exports.addCommentToFile = async (fileId, commentText, authorInfo) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error("File not found"); // Or handle not found case
        }

        const newComment = { text: commentText, author: authorInfo };
        file.comments.push(newComment);
        await file.save();
        return file; // Or return the newly added comment
    } catch (error) {
        throw error; // Re-throw or handle error appropriately
    }
};