// backend/src/controllers/folder.controller.js
const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const Share = require('../models/share.model');
const User = require('../models/user.model');

// 1. createFolder - Protected route
exports.createFolder = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const { name } = req.body;
        const userId = req.user._id;

        const newFolder = new Folder({
            name: name,
            userId: userId,
        });

        const savedFolder = await newFolder.save();
        res.status(201).json(savedFolder);
    } catch (error) {
        console.error('Error creating folder:', error);
        next(error);
    }
};

// 2. listFoldersForUser - Protected route

// exports.listFoldersForUser = async (req, res, next) => {
//     try {
//         if (!req.user) {
//             return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
//         }

//         const userId = req.user._id;

//         // Find folders owned by the user
//         const userFolders = await Folder.find({ userId });

//         // Find shared folders where the user is the recipient
//         const sharedFolders = await Share.find({ sharedWith: userId })
//             .populate({
//                 path: 'folderId',
//                 model: 'Folder' // Ensure this matches your Folder model name
//             });

//         // Extract folder details from shared folders and ensure uniqueness
//         const sharedFolderDetails = sharedFolders
//             .map(share => share.folderId)
//             .filter(folder => folder !== null); // Filter out null values

//         // Use a Set to deduplicate folders based on _id
//         const uniqueSharedFolders = [...new Set(sharedFolderDetails.map(folder => folder._id.toString()))]
//             .map(id => sharedFolderDetails.find(folder => folder._id.toString() === id));

//         // Return only the folders explicitly shared with the user
//         res.json({
//             userFolders,         // Folders owned by the user
//             sharedFolders: uniqueSharedFolders // Unique folders explicitly shared with the user
//         });
//     } catch (error) {
//         console.error('Error listing folders for user:', error);
//         next(error);
//     }
// };

// exports.listFoldersForUser = async (req, res, next) => {
//     try {
//         // Check if the requesting user is authenticated
//         if (!req.user) {
//             return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
//         }
//         const userId = req.user._id;

//         // Check if the requesting user has the role of 'admin'
//         // if (req.user.role !== 'admin') {
//         //     return res.status(403).json({ message: 'Forbidden: User does not have admin privileges.' });
//         // }

//         // Find all users with the role of 'admin'
//         const adminUsers = await User.find({ role: 'admin' });

//         // Extract the IDs of admin users
//         const adminUserIds = adminUsers.map(user => user._id);

//         // Find folders owned by admin users
//         let userFolders = await Folder.find({ userId: { $in: adminUserIds } });

//         // Find shared folders where admin users are the recipients
//         const sharedFolders = await Share.find({ sharedWith: userId })
//             .populate({
//                 path: 'folderId',
//                 model: 'Folder' // Ensure this matches your Folder model name
//             });

//         // Extract folder details from shared folders and ensure uniqueness
//         const sharedFolderDetails = sharedFolders
//             .map(share => share.folderId)
//             .filter(folder => folder !== null); // Filter out null values

//         // Use a Set to deduplicate folders based on _id
//         const uniqueSharedFolders = [...new Set(sharedFolderDetails.map(folder => folder._id.toString()))]
//             .map(id => sharedFolderDetails.find(folder => folder._id.toString() === id));

//         // Return the folders owned by admin users and unique folders shared with them
//         if (req.user.role !== 'admin') {
//             userFolders = [];
//             res.json({
//                 userFolders,
//                 sharedFolders: uniqueSharedFolders // Unique folders explicitly shared with admin users
//             });
//             // return res.status(403).json({ message: 'Forbidden: User does not have admin privileges.' });
//         }
//         // Folders owned by admin users
//         res.json({
//             userFolders,
//             sharedFolders: uniqueSharedFolders // Unique folders explicitly shared with admin users
//         });
//     } catch (error) {
//         console.error('Error listing folders for admin users:', error);
//         next(error);
//     }
// };

exports.listFoldersForUser = async (req, res, next) => {
    try {
        // Check if the requesting user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const userId = req.user._id;

        // Find all users with the role of 'admin'
        const adminUsers = await User.find({ role: 'admin' });

        // Extract the IDs of admin users
        const adminUserIds = adminUsers.map(user => user._id);

        // Find folders owned by admin users
        let userFolders = await Folder.find({ userId: { $in: adminUserIds } });

        // Find shared folders where admin users are the recipients
        const sharedFolders = await Share.find({ sharedWith: userId })
            .populate({
                path: 'folderId',
                model: 'Folder' // Ensure this matches your Folder model name
            });

        // Extract folder details from shared folders and ensure uniqueness
        const sharedFolderDetails = sharedFolders
            .map(share => share.folderId)
            .filter(folder => folder !== null); // Filter out null values

        // Use a Set to deduplicate folders based on _id
        const uniqueSharedFolders = [...new Set(sharedFolderDetails.map(folder => folder._id.toString()))]
            .map(id => sharedFolderDetails.find(folder => folder._id.toString() === id));

        // If the user is not an admin, return only shared folders
        if (req.user.role !== 'admin') {
            return res.json({
                userFolders: [], // No folders owned by non-admin users
                sharedFolders: uniqueSharedFolders // Unique folders explicitly shared with the user
            });
        }

        // If the user is an admin, return both admin folders and shared folders
        res.json({
            userFolders, // Folders owned by admin users
            sharedFolders: uniqueSharedFolders // Unique folders explicitly shared with admin users
        });
    } catch (error) {
        console.error('Error listing folders for admin users:', error);
        next(error);
    }
};


// 3. getFolderById - Protected route
exports.getFolderById = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const folderId = req.params.folderId;
        const folder = await Folder.findById(folderId);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        // Authorization check: Ensure folder belongs to the user
        // if (folder.userId.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({ message: 'Unauthorized: Folder does not belong to the user.' });
        // }

        // Fetch files within the folder and populate folder data
        const files = await File.find({ folderId: folderId }).populate('folderId');

        if (files.length > 0) {
            // If files are found, send folder and files data
            res.json({ folder: folder, files: files });
        } else {
            // If no files are found, send only folder data
            res.json({ folder: folder, files: [] });
        }

    } catch (error) {
        console.error('Error getting folder by ID with files:', error);
        next(error);
    }
};


exports.getFolderByIdWithSharedFiles = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const folderId = req.params.folderId;
        const userId = req.user._id;

        // Find the folder by ID
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        // Find shared records for this folder where the user is the recipient
        const sharedRecords = await Share.find({ folderId: folderId, sharedWith: userId });

        // Separate shared folder and file records
        const sharedFolderRecords = sharedRecords.filter(record => record.resourceType === 'folder');
        const sharedFileRecords = sharedRecords.filter(record => record.resourceType === 'file');

        // Fetch files inside shared folders
        let sharedFilesFromFolders = [];
        if (sharedFolderRecords.length > 0) {
            const sharedFolderIds = sharedFolderRecords.map(record => record.folderId);
            sharedFilesFromFolders = await File.find({ folderId: { $in: sharedFolderIds } });
        }

        // Fetch only explicitly shared files
        const sharedFileIds = sharedFileRecords.map(record => record.resourceId).filter(id => id !== null);
        const sharedFiles = sharedFileIds.length > 0 ? await File.find({ _id: { $in: sharedFileIds } }) : [];

        // Combine all shared files and remove duplicates using a Set
        const allSharedFiles = [...sharedFiles, ...sharedFilesFromFolders];
        const uniqueSharedFiles = [...new Set(allSharedFiles.map(file => file._id.toString()))]
            .map(id => allSharedFiles.find(file => file._id.toString() === id));

        // Response with folder details and unique shared files
        res.json({
            folder,
            sharedFiles: uniqueSharedFiles
        });

    } catch (error) {
        console.error('Error getting folder by ID with shared files:', error);
        next(error);
    }
};

// 4. updateFolder - Protected route
exports.updateFolder = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const folderId = req.params.folderId;
        const { name, parentFolderId } = req.body;
        const userId = req.user._id;

        const folderToUpdate = await Folder.findById(folderId);
        if (!folderToUpdate) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        // Authorization check: Ensure folder belongs to the user
        // if (folderToUpdate.userId.toString() !== userId.toString()) {
        //     return res.status(403).json({ message: 'Unauthorized: You do not have permission to update this folder.' });
        // }

        // Basic validation for parentFolderId (optional - check if it exists and belongs to the same user)
        if (parentFolderId) {
            const parentFolder = await Folder.findById(parentFolderId);
            if (!parentFolder) {
                return res.status(400).json({ message: 'Invalid parent folder ID.' });
            }
            if (parentFolder.userId.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Unauthorized: Parent folder does not belong to the user.' });
            }
        }


        folderToUpdate.name = name || folderToUpdate.name; // Update name if provided
        folderToUpdate.parentFolderId = parentFolderId !== undefined ? parentFolderId : folderToUpdate.parentFolderId; // Update parentFolderId if provided (allow unsetting parent by sending null or undefined)
        folderToUpdate.updatedAt = Date.now();

        const updatedFolder = await folderToUpdate.save();
        res.json(updatedFolder);
    } catch (error) {
        console.error('Error updating folder:', error);
        next(error);
    }
};

// 5. deleteFolder - Protected route
exports.deleteFolder = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
        }

        const folderId = req.params.folderId;
        const userId = req.user._id;

        const folderToDelete = await Folder.findById(folderId);
        if (!folderToDelete) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        // Authorization check: Ensure folder belongs to the user
        if (folderToDelete.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to delete this folder.' });
        }

        // Consider adding checks to prevent deleting non-empty folders or handle contained files

        await Folder.findByIdAndDelete(folderId);
        res.json({ message: 'Folder deleted successfully.' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        next(error);
    }
};