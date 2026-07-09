const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
                <p><strong>Email:</strong> ${rsvp.email || '—'}</p>
                <p><strong>Phone:</strong> ${rsvp.phone || '—'}</p>
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
Email: ${rsvp.email || '—'}
Phone: ${rsvp.phone || '—'}
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
                html: emailHtml,
                attachments: [{
                    filename: `rsvp-${rsvp.fullName.replace(/\s+/g, '-').toLowerCase()}.json`,
                    content: JSON.stringify(rsvp, null, 2),
                    contentType: 'application/json'
                }]
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

        if (!rsvp.fullName || (!rsvp.email && !rsvp.phone) || !rsvp.attending || !rsvp.dietary) {
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

app.post('/api/rsvp/confirm', async (req, res) => {
    try {
        const { email, name, cardImage, rsvpData } = req.body;
        if (!email || !cardImage) return res.status(400).json({ error: 'Missing fields' });

        const base64Data = cardImage.replace(/^data:image\/png;base64,/, '');

        await transporter.sendMail({
            from: '"Marta & Matt" <rsvp@matt-and-marta.com>',
            to: email,
            subject: 'Your RSVP — Marta & Matt, August 23, 2026',
            html: `
                <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; color: #333;">
                    <p style="font-size: 22px; letter-spacing: 0.1em; margin-bottom: 8px;">marta &amp; matt</p>
                    <p style="font-size: 12px; color: #888; margin-bottom: 24px;">August 23, 2026 · Blooming Hill Farm</p>
                    <p style="font-size: 14px; margin-bottom: 16px;">Hi ${name},</p>
                    <p style="font-size: 13px; line-height: 1.6; margin-bottom: 24px;">Thank you so much for your RSVP! We're so excited to celebrate with you. Your confirmation card is attached below.</p>
                    <p style="font-size: 13px; line-height: 1.6; margin-bottom: 24px;">Please reach out to us directly at <a href="tel:+14088130951" style="color: #8b7355;">(408) 813-0951</a> if you have any questions, concerns or requests.</p>
                    <p style="font-size: 13px;">With love,<br>Marta &amp; Matt</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 28px 0;">
                    <img src="cid:rsvp-card" style="max-width: 100%; border: 1px solid #e0dcd8;">
                </div>
            `,
            attachments: [{
                filename: 'marta-matt-rsvp.png',
                content: base64Data,
                encoding: 'base64',
                cid: 'rsvp-card'
            }]
        });

        console.log(`Confirmation sent to ${email}`);

        if (rsvpData) {
            const owners = ['derpcode01@gmail.com', 'marta.sharapova@gmail.com'];
            for (const to of owners) {
                await transporter.sendMail({
                    from: '"Wedding RSVP" <rsvp@matt-and-marta.com>',
                    to,
                    subject: `RSVP Confirmed: ${name}`,
                    text: `Confirmation email sent to ${email}.`,
                    attachments: [{
                        filename: `rsvp-${name.replace(/\s+/g, '-').toLowerCase()}.json`,
                        content: JSON.stringify(rsvpData, null, 2),
                        contentType: 'application/json'
                    }]
                });
            }
            console.log(`JSON confirmation forwarded to owners for ${name}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error sending confirmation:', error);
        res.status(500).json({ error: 'Failed to send confirmation' });
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
