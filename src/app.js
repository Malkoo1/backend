const express = require('express');
const cors = require('cors'); // For handling Cross-Origin Resource Sharing
const bodyParser = require('body-parser'); // For parsing request bodies
const authRoutes = require('./routes/auth.routes'); // Import authentication routes
const folderRoutes = require('./routes/folder.routes'); // Import folder routes
const fileRoutes = require('./routes/file.routes');   // Import file routes
const cookieParser = require("cookie-parser");

const app = express();



app.use(
    cors({
        origin: "https://sato.identitytests.net", // Frontend URL
        credentials: true, // Allow sending cookies
    })
);
app.use(cookieParser());
app.use(express.json());
// Middleware setup

// 1. CORS (Cross-Origin Resource Sharing)
// Enable CORS for all origins in development.
// In production, configure CORS more restrictively for security.
// app.use(cors({
//     origin: 'http://localhost:5173', // or specify your frontend URL(s) in production, e.g., ['http://localhost:3000', 'https://your-frontend-domain.com']
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true, // If you need to handle cookies or authorization headers across origins
//     optionsSuccessStatus: 204, // Some legacy browsers or systems may require this
// }));

// 2. Body Parser Middleware
// to parse JSON request bodies
app.use(bodyParser.json());
// to parse URL-encoded request bodies (e.g., from forms)
app.use(bodyParser.urlencoded({ extended: true })); // 'extended: true' allows for parsing rich objects and arrays in URL-encoded format

// 3. (Optional) Logging Middleware - Example using Morgan (install: npm install morgan)
// const morgan = require('morgan');
// app.use(morgan('dev')); // 'dev' is a common format for development logging

// 4. (Optional) Security Middleware - Example using Helmet (install: npm install helmet)
// const helmet = require('helmet');
// app.use(helmet()); // Enables a set of security-enhancing HTTP headers

// API Routes - Mount your routes here
app.use('/auth', authRoutes); // Routes for authentication (login, register, etc.)
app.use('/api', folderRoutes); // Routes for folder operations
app.use('/file', fileRoutes);   // Routes for file operations
app.use('/uploads', express.static('uploads'));
// Default route for API documentation or health check (optional)
app.get('/', (req, res) => {
    res.send('File Management API is running. See /api-docs for documentation (if you set up Swagger/OpenAPI)');
});

// Error Handling Middleware - Placed after all routes
// This is a basic error handler. Customize for your application's needs.
app.use((err, req, res, next) => {
    console.error('ERROR HANDLER - Global Error:', err); // Log the full error for debugging (in development)

    // Customize error responses based on error type or status codes if needed
    let statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
    let message = err.message || 'Internal Server Error';

    if (statusCode === 500) {
        message = 'Something went wrong on the server.'; // Generic message for 500 in production
    }

    res.status(statusCode).json({
        error: {
            message: message,
            // ...(err.stack && process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}) // Optionally send stack trace in development only
        },
    });
});

// Export the app instance to be used by server.js
module.exports = app;