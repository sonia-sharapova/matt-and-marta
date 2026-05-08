const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    tls: { rejectUnauthorized: false }
});

const RSVP_FILE = path.join(__dirname, 'rsvps.json');

if (!fs.existsSync(RSVP_FILE)) {
    fs.writeFileSync(RSVP_FILE, JSON.stringify([], null, 2));
}

function loadRSVPs() {
    try {
        return JSON.parse(fs.readFileSync(RSVP_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveRSVP(rsvp) {
    const rsvps = loadRSVPs();
    const entry = { ...rsvp, id: Date.now(), submittedAt: new Date().toISOString() };
    rsvps.push(entry);
    fs.writeFileSync(RSVP_FILE, JSON.stringify(rsvps, null, 2));
    return entry;
}

async function sendEmailNotifications(rsvp) {
    const formattedDate = new Date().toLocaleString();

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="background: #f8f9fa; padding: 16px; border-radius: 4px;">New Wedding RSVP — ${rsvp.fullName}</h2>
                <p><strong>Submitted:</strong> ${formattedDate}</p>
                <p><strong>Name:</strong> ${rsvp.fullName}</p>
                <p><strong>Contact:</strong> ${rsvp.contact}</p>
                <p><strong>Attending:</strong> ${rsvp.attending}</p>
                <p><strong>Afterparty:</strong> ${rsvp.afterparty}</p>
                <p><strong>Meal Preference:</strong> ${rsvp.meal}</p>
                <p><strong>Dietary Restrictions:</strong> ${rsvp.dietary}</p>
                <p><strong>Song Requests:</strong> ${rsvp.songs || '—'}</p>
                <p><strong>Message:</strong> ${rsvp.message || '—'}</p>
            </div>
        </body>
        </html>
    `;

    const emailText = `
New Wedding RSVP — ${rsvp.fullName}
Submitted: ${formattedDate}
Name: ${rsvp.fullName}
Contact: ${rsvp.contact}
Attending: ${rsvp.attending}
Afterparty: ${rsvp.afterparty}
Meal Preference: ${rsvp.meal}
Dietary Restrictions: ${rsvp.dietary}
Song Requests: ${rsvp.songs || '—'}
Message: ${rsvp.message || '—'}
    `.trim();

    const recipients = ['derpcode01@gmail.com', 'marta.sharapova@gmail.com'];

    try {
        for (const to of recipients) {
            await transporter.sendMail({
                from: '"Wedding RSVP" <rsvp@matt-and-marta.com>',
                to,
                subject: `New Wedding RSVP: ${rsvp.fullName}`,
                text: emailText,
                html: emailHtml
            });
            console.log(`Email sent to ${to}`);
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

app.post('/api/rsvp', async (req, res) => {
    try {
        const rsvp = req.body;

        if (!rsvp.fullName || !rsvp.contact || !rsvp.attending || !rsvp.dietary) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        if (rsvp.attending === 'yes' && (!rsvp.afterparty || !rsvp.meal)) {
            return res.status(400).json({ error: 'Afterparty and meal preference are required' });
        }

        const saved = saveRSVP(rsvp);
        console.log('RSVP saved:', saved.fullName);

        const emailsSent = await sendEmailNotifications(rsvp);

        res.json({ success: true, rsvpId: saved.id, emailsSent });

    } catch (error) {
        console.error('Error processing RSVP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/rsvps', (req, res) => {
    const auth = req.headers.authorization;
    if (auth === 'Bearer your-secret-token') {
        res.json(loadRSVPs());
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

app.listen(PORT, () => {
    console.log(`RSVP API server running on port ${PORT}`);
});
