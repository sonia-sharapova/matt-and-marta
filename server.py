#!/usr/bin/env python3
# server.py - Python Flask backend for RSVP form using system mail command
# Install dependencies: pip3 install flask flask-cors python-dotenv

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import json
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Email recipients from environment variables (comma-separated)
RECIPIENT_EMAILS = os.getenv('RECIPIENT_EMAILS', 'rsvp@matt-and-marta.com')

def send_email_via_mail(rsvp_data):
    """Send RSVP data via system mail command"""
    try:
        # Parse recipients (comma-separated)
        recipients = [email.strip() for email in RECIPIENT_EMAILS.split(',')]

        # Create email subject
        subject = f"Wedding RSVP: {rsvp_data['fullName']}"

        # Create email body
        body = f"""New RSVP Submission

Name: {rsvp_data['fullName']}
Email: {rsvp_data['email']}
Phone: {rsvp_data['phone']}
Attending: {rsvp_data['attending']}
Attending Afterparty: {rsvp_data['afterparty']}
Dietary Restrictions: {rsvp_data['dietary']}
Submitted: {rsvp_data['timestamp']}
"""

        # Send to each recipient using mail command
        for recipient in recipients:
            process = subprocess.Popen(
                ['mail', '-s', subject, recipient],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=body)

            if process.returncode != 0:
                print(f"Error sending to {recipient}: {stderr}")
                return False

        print(f"Successfully sent email to: {', '.join(recipients)}")
        return True

    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def save_to_json(rsvp_data):
    """Save RSVP to JSON file"""
    try:
        filename = 'rsvps.json'
        rsvps = []

        # Read existing data if file exists
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                try:
                    rsvps = json.load(f)
                except json.JSONDecodeError:
                    rsvps = []

        # Append new RSVP
        rsvps.append(rsvp_data)

        # Write back to file with pretty formatting
        with open(filename, 'w') as f:
            json.dump(rsvps, f, indent=2)

        print(f"Saved RSVP to {filename}")
        return True

    except Exception as e:
        print(f"Error saving to JSON: {e}")
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

        # Save to JSON file (primary storage)
        json_saved = save_to_json(data)

        # Send email notification
        email_sent = send_email_via_mail(data)

        if json_saved:
            return jsonify({
                'success': True,
                'message': 'RSVP submitted successfully',
                'email_sent': email_sent
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Error saving RSVP'
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

@app.route('/api/rsvps', methods=['GET'])
def get_rsvps():
    """Get all RSVPs (optional - for viewing submissions)"""
    try:
        filename = 'rsvps.json'
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                rsvps = json.load(f)
            return jsonify({
                'success': True,
                'count': len(rsvps),
                'rsvps': rsvps
            }), 200
        else:
            return jsonify({
                'success': True,
                'count': 0,
                'rsvps': []
            }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=False)