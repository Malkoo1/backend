require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'YOUR_FALLBACK_DEV_SECRET',
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT || 587,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    emailFrom: process.env.EMAIL_FROM || 'noreply@yourdomain.com',

    // MongoDB Configuration
    mongoURI: process.env.mongoURI,
    // If using MongoDB Atlas, replace with your Atlas connection string:
    // mongoURI: 'mongodb+srv://naveedmalik436392:BfFbsyzbTdXz0mmQ@cluster0.to5pf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
};