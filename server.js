// server.js - Node.js backend for RSVP form
// Install dependencies: npm install express cors nodemailer dotenv

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,        // e.g., 'smtp.gmail.com' or your GoDaddy SMTP
    port: process.env.SMTP_PORT || 587, // Usually 587 for TLS
    secure: false,                       // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,    // Your email address
        pass: process.env.SMTP_PASS     // Your email password or app password
    }
});

// RSVP endpoint
app.post('/api/rsvp', async (req, res) => {
    try {
        const { fullName, email, phone, attending, afterparty, dietary, timestamp } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !attending || !afterparty || !dietary) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Create email content
        const emailContent = `
New RSVP Submission

Name: ${fullName}
Email: ${email}
Phone: ${phone}
Attending: ${attending}
Attending Afterparty: ${afterparty}
Dietary Restrictions: ${dietary}
Submitted: ${timestamp || new Date().toISOString()}
        `;

        // Email options
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.RECIPIENT_EMAIL,     // Your email where RSVPs should go
            subject: `Wedding RSVP: ${fullName}`,
            text: emailContent,
            html: `
                <h2>New RSVP Submission</h2>
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Attending:</strong> ${attending}</p>
                <p><strong>Attending Afterparty:</strong> ${afterparty}</p>
                <p><strong>Dietary Restrictions:</strong> ${dietary}</p>
                <p><strong>Submitted:</strong> ${timestamp || new Date().toISOString()}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Optional: Save to a JSON file as backup
        const fs = require('fs');
        const rsvpData = {
            fullName,
            email,
            phone,
            attending,
            afterparty,
            dietary,
            timestamp: timestamp || new Date().toISOString()
        };

        // Append to rsvps.json file
        const filename = 'rsvps.json';
        let rsvps = [];
        if (fs.existsSync(filename)) {
            const data = fs.readFileSync(filename, 'utf8');
            rsvps = JSON.parse(data);
        }
        rsvps.push(rsvpData);
        fs.writeFileSync(filename, JSON.stringify(rsvps, null, 2));

        res.json({ 
            success: true, 
            message: 'RSVP submitted successfully' 
        });

    } catch (error) {
        console.error('Error processing RSVP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting RSVP',
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
