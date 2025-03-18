// backend/server.js
const express = require('express');
const connectDB = require('./src/config/database'); // Import your database connection function
const app = require('./src/app'); // Your Express app setup

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB(); // Call the function to establish connection

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});