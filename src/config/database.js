const mongoose = require('mongoose');
const config = require('./config'); // Ensure this file has `mongoURI`

const connectDB = async () => {
    try {
        console.log("MongoDB URI:", config.mongoURI);
        await mongoose.connect(config.mongoURI, {
            writeConcern: { w: "majority" }  // ✅ Fix: Remove extra comma
        }); // No need for extra options

        console.log('✅ MongoDB connected...');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;