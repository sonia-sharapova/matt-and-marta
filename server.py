#!/usr/bin/env python3
# server.py - Python Flask backend for RSVP form
# Install dependencies: pip install flask flask-cors python-dotenv

from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Email configuration from environment variables
SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASS = os.getenv('SMTP_PASS')
RECIPIENT_EMAIL = os.getenv('RECIPIENT_EMAIL')

def send_email(rsvp_data):
    """Send RSVP data via email"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Wedding RSVP: {rsvp_data['fullName']}"
        msg['From'] = SMTP_USER
        msg['To'] = RECIPIENT_EMAIL

        # Plain text version
        text_content = f"""
New RSVP Submission

Name: {rsvp_data['fullName']}
Email: {rsvp_data['email']}
Phone: {rsvp_data['phone']}
Attending: {rsvp_data['attending']}
Attending Afterparty: {rsvp_data['afterparty']}
Dietary Restrictions: {rsvp_data['dietary']}
Submitted: {rsvp_data['timestamp']}
        """

        # HTML version
        html_content = f"""
        <html>
            <body>
                <h2>New RSVP Submission</h2>
                <p><strong>Name:</strong> {rsvp_data['fullName']}</p>
                <p><strong>Email:</strong> {rsvp_data['email']}</p>
                <p><strong>Phone:</strong> {rsvp_data['phone']}</p>
                <p><strong>Attending:</strong> {rsvp_data['attending']}</p>
                <p><strong>Attending Afterparty:</strong> {rsvp_data['afterparty']}</p>
                <p><strong>Dietary Restrictions:</strong> {rsvp_data['dietary']}</p>
                <p><strong>Submitted:</strong> {rsvp_data['timestamp']}</p>
            </body>
        </html>
        """

        # Attach both versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def save_to_file(rsvp_data):
    """Save RSVP to JSON file as backup"""
    try:
        filename = 'rsvps.json'
        rsvps = []
        
        # Read existing data if file exists
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                rsvps = json.load(f)
        
        # Append new RSVP
        rsvps.append(rsvp_data)
        
        # Write back to file
        with open(filename, 'w') as f:
            json.dump(rsvps, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving to file: {e}")
        return False

@app.route('/api/rsvp', methods=['POST'])
def handle_rsvp():
    """Handle RSVP form submission"""
    try:
        # Get form data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fullName', 'email', 'phone', 'attending', 'afterparty', 'dietary']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Add timestamp if not provided
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
        
        # Send email
        email_sent = send_email(data)
        
        # Save to file
        file_saved = save_to_file(data)
        
        if email_sent or file_saved:
            return jsonify({
                'success': True,
                'message': 'RSVP submitted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Error processing RSVP'
            }), 500
            
    except Exception as e:
        print(f"Error processing RSVP: {e}")
        return jsonify({
            'success': False,
            'message': 'Error submitting RSVP',
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running'
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)
