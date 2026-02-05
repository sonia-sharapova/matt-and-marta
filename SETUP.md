# Wedding RSVP Backend Setup

This backend receives RSVP form submissions and emails them to you. Choose either Node.js or Python.

## Option 1: Node.js Setup

### Installation
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your email settings
nano .env  # or use your preferred editor
```

### Configuration
Edit `.env` file with your email settings:

**For Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
RECIPIENT_EMAIL=rsvp@yourdomain.com
```

To get Gmail app password:
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password
3. Use that password in SMTP_PASS

**For GoDaddy Email:**
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=rsvp@yourdomain.com
SMTP_PASS=your-email-password
RECIPIENT_EMAIL=rsvp@yourdomain.com
```

### Running the Server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server will run on http://localhost:3000

---

## Option 2: Python Setup

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your email settings
nano .env  # or use your preferred editor
```

### Configuration
Edit `.env` file (same as Node.js above)

### Running the Server
```bash
# Development
python server.py

# Production with gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3000 server:app
```

---

## Update Your HTML Form

In `rsvp.html`, update the server endpoint:

```javascript
const SERVER_ENDPOINT = 'http://your-server-ip:3000/api/rsvp';
```

If running on the same server as your website:
```javascript
const SERVER_ENDPOINT = '/api/rsvp';  // Use reverse proxy
```

---

## Setting Up Reverse Proxy (Recommended)

### With Nginx
Add to your nginx config:

```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### With Apache
Enable proxy modules and add to your config:

```apache
ProxyPass /api/ http://localhost:3000/api/
ProxyPassReverse /api/ http://localhost:3000/api/
```

---

## Running as a Service (Linux)

### Systemd Service
Create `/etc/systemd/system/wedding-rsvp.service`:

**For Node.js:**
```ini
[Unit]
Description=Wedding RSVP Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**For Python:**
```ini
[Unit]
Description=Wedding RSVP Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/backend
ExecStart=/usr/bin/python3 server.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable wedding-rsvp
sudo systemctl start wedding-rsvp
sudo systemctl status wedding-rsvp
```

---

## Testing

Test the server is running:
```bash
curl http://localhost:3000/health
```

Test RSVP submission:
```bash
curl -X POST http://localhost:3000/api/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "555-1234",
    "attending": "yes",
    "afterparty": "yes",
    "dietary": "none"
  }'
```

---

## Troubleshooting

**Email not sending:**
- Check SMTP credentials in `.env`
- For Gmail, ensure "Less secure app access" is enabled OR use app password
- For GoDaddy, check port (465 or 587)
- Check server logs for error messages

**CORS errors:**
- The server has CORS enabled by default
- If issues persist, check your domain is allowed

**Port already in use:**
- Change PORT in `.env` file
- Or kill process using port 3000: `sudo lsof -ti:3000 | xargs kill -9`

---

## Security Notes

1. Never commit `.env` file to git
2. Use HTTPS for production
3. Consider rate limiting for the API endpoint
4. Keep dependencies updated
5. Use a firewall to restrict access to the backend port

---

## Backup

All RSVPs are automatically saved to `rsvps.json` file as backup.
Regularly backup this file to prevent data loss.
