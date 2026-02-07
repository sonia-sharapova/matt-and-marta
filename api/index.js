const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

// RSVP storage file
const RSVP_FILE = path.join(__dirname, 'rsvps.json');

// Ensure storage file exists
if (!fs.existsSync(RSVP_FILE)) {
    fs.writeFileSync(RSVP_FILE, JSON.stringify([], null, 2));
}

// Load existing RSVPs
function loadRSVPs() {
    try {
        const data = fs.readFileSync(RSVP_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save RSVP
function saveRSVP(rsvp) {
    const rsvps = loadRSVPs();
    rsvps.push({
        ...rsvp,
        id: Date.now(),
        submittedAt: new Date().toISOString()
    });
    fs.writeFileSync(RSVP_FILE, JSON.stringify(rsvps, null, 2));
    return rsvps[rsvps.length - 1];
}

// Send email notifications
async function sendEmailNotifications(rsvp) {
    const formattedDate = new Date().toLocaleString();
    
    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
                .rsvp-details { margin: 20px 0; }
                .field { margin-bottom: 10px; }
                .label { font-weight: bold; color: #555; }
                .value { margin-left: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>New Wedding RSVP Received!</h2>
                    <p>Submitted on: ${formattedDate}</p>
                </div>
                <div class="rsvp-details">
                    <div class="field">
                        <span class="label">Name:</span>
                        <span class="value">${rsvp.fullName}</span>
                    </div>
                    <div class="field">
                        <span class="label">Email:</span>
                        <span class="value">${rsvp.email}</span>
                    </div>
                    <div class="field">
                        <span class="label">Phone:</span>
                        <span class="value">${rsvp.phone}</span>
                    </div>
                    <div class="field">
                        <span class="label">Attending Wedding:</span>
                        <span class="value">${rsvp.attending === 'yes' ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div class="field">
                        <span class="label">Attending Afterparty:</span>
                        <span class="value">${rsvp.afterparty === 'yes' ? '✅ Yes' : rsvp.afterparty === 'maybe' ? '🤔 Maybe' : '❌ No'}</span>
                    </div>
                    <div class="field">
                        <span class="label">Dietary Restrictions:</span>
                        <span class="value">${rsvp.dietary}</span>
                    </div>
                </div>
                <p>This RSVP has been automatically saved to the server.</p>
            </div>
        </body>
        </html>
    `;

    const emailText = `
    New Wedding RSVP Received!
    --------------------------
    Submitted: ${formattedDate}
    Name: ${rsvp.fullName}
    Email: ${rsvp.email}
    Phone: ${rsvp.phone}
    Attending Wedding: ${rsvp.attending === 'yes' ? 'Yes' : 'No'}
    Attending Afterparty: ${rsvp.afterparty}
    Dietary Restrictions: ${rsvp.dietary}
    --------------------------
    This RSVP has been automatically saved to the server.
    `;

    // Email 1: Send to your personal email (UPDATE THIS)
    const mailOptions1 = {
        from: '"Wedding RSVP System" <rsvp@matt-and-marta.com>',
        to: 'derpcode01@gmail.com', // CHANGE TO YOUR EMAIL
        subject: `New Wedding RSVP: ${rsvp.fullName}`,
        text: emailText,
        html: emailHtml
    };

    // Email 2: Send to a separate email (UPDATE THIS)
    const mailOptions2 = {
        from: '"Wedding RSVP System" <rsvp@matt-and-marta.com>',
        to: 'sonia.sharapova@yahoo.com', // CHANGE TO SECOND EMAIL
        subject: `Wedding RSVP: ${rsvp.fullName}`,
        text: emailText,
        html: emailHtml
    };

    try {
        // Send both emails
        await transporter.sendMail(mailOptions1);
        console.log('Email sent to primary address');
        
        await transporter.sendMail(mailOptions2);
        console.log('Email sent to secondary address');
        
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// API endpoint
app.post('/api/rsvp', async (req, res) => {
    try {
        const rsvpData = req.body;
        
        // Validate required fields
        if (!rsvpData.fullName || !rsvpData.email || !rsvpData.phone || 
            !rsvpData.attending || !rsvpData.afterparty || !rsvpData.dietary) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Save to JSON file
        const savedRSVP = saveRSVP(rsvpData);
        console.log('RSVP saved:', savedRSVP.fullName);

        // Send email notifications
        const emailsSent = await sendEmailNotifications(rsvpData);

        // Respond to client
        res.json({
            success: true,
            message: 'RSVP received successfully',
            rsvpId: savedRSVP.id,
            emailsSent: emailsSent
        });

    } catch (error) {
        console.error('Error processing RSVP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Optional: Get all RSVPs (password protected)
app.get('/api/rsvps', (req, res) => {
    const auth = req.headers.authorization;
    // Simple auth - you can improve this
    if (auth === 'Bearer your-secret-token') { // CHANGE THIS
        const rsvps = loadRSVPs();
        res.json(rsvps);
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.listen(PORT, () => {
    console.log(`RSVP API server running on port ${PORT}`);
});
