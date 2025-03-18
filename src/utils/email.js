// backend/src/utils/email.js
const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
    // Configure your email transport here (e.g., SMTP, SendGrid, Mailgun)
    // Example using SMTP (replace with your actual email provider details):
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure, // true for 465, false for other ports
    auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
    },
});

exports.sendVerificationEmail = async (email, verificationToken) => {
    try {
        const verificationLink = `${config.appBaseUrl}/auth/verify-email/${verificationToken}`; // Construct verification link

        const mailOptions = {
            from: config.emailFrom,
            to: email,
            subject: 'Verify your email address',
            html: `<p>Please verify your email address by clicking on the following link:</p><a href="${verificationLink}">${verificationLink}</a><p>This link will expire in 24 hours.</p>`, // Customize email body
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email.'); // Or handle error appropriately
    }
};