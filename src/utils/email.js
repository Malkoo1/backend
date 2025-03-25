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
        // const verificationLink = `${config.appBaseUrl}/auth/verify-email/${verificationToken}`;

        const verificationLink = `${config.frontBaseUrl}/verify/${verificationToken}`;



        const mailOptions = {
            from: config.emailFrom,
            to: email,
            subject: 'Verify Your Email Address',
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .header {
                        background-color: #FF6F61;
                        color: white;
                        padding: 20px;
                        text-align: center;
                    }
                    .content {
                        padding: 30px;
                        background-color: #ffffff;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #FF6F61;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                    .footer {
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        background-color: #f9f9f9;
                    }
                    .logo {
                        max-width: 150px;
                        margin-bottom: 20px;
                    }
                    .code {
                        font-family: monospace;
                        background-color: #f5f5f5;
                        padding: 2px 4px;
                        border-radius: 3px;
                    }
                    .expiry-note {
                        color: #d97706;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <!-- Replace with your logo -->
                        <h1>Welcome to Sato Studio</h1>
                    </div>
                    
                    <div class="content">
                        <h2>Email Verification Required</h2>
                        <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" class="button">Verify Email Address</a>
                        </div>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p><a href="${verificationLink}">${verificationLink}</a></p>
                        
                        <p class="expiry-note">This verification link will expire in 24 hours.</p>
                        
                        <p>If you didn't create an account with us, please ignore this email or contact support if you have questions.</p>
                    </div>
                    
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Sato Studio. All rights reserved.</p>
                        <p>
                            <a href="${config.frontBaseUrl}/privacy">Privacy Policy</a> | 
                            <a href="${config.frontBaseUrl}/terms">Terms of Service</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `,
            text: `Please verify your email address by clicking on the following link: ${verificationLink}\n\nThis link will expire in 24 hours.`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
        console.log('Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('Full error sending verification email:', {
            error: error.message,
            stack: error.stack,
            smtpConfig: {
                host: config.smtpHost,
                port: config.smtpPort,
                user: config.smtpUser,
            }
        });
        throw new Error('Failed to send verification email: ' + error.message);
    }
};