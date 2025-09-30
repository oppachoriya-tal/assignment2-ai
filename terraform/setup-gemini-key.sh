#!/bin/bash

# Script to help users set up their Gemini API key
# Run this script on the deployed EC2 instance

echo "=== Gemini API Key Setup ==="
echo "This script will help you configure your Gemini API key for the BookReview application."
echo ""

# Check if we're on the right server
if [ ! -f "/opt/app/backend/.env" ]; then
    echo "Error: BookReview application not found. Please run this script on the deployed EC2 instance."
    exit 1
fi

echo "Current Gemini API Key configuration:"
grep "GEMINI_API_KEY" /opt/app/backend/.env || echo "GEMINI_API_KEY not found in .env file"

echo ""
echo "To get your Gemini API key:"
echo "1. Visit: https://makersuite.google.com/app/apikey"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API Key'"
echo "4. Copy the generated API key"
echo ""

read -p "Enter your Gemini API key (or press Enter to skip): " GEMINI_KEY

if [ -n "$GEMINI_KEY" ]; then
    # Update the .env file
    if grep -q "GEMINI_API_KEY" /opt/app/backend/.env; then
        sed -i "s|GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|g" /opt/app/backend/.env
    else
        echo "GEMINI_API_KEY=$GEMINI_KEY" >> /opt/app/backend/.env
    fi
    
    echo "✓ Gemini API key updated successfully!"
    echo ""
    echo "Restarting backend service to apply changes..."
    cd /opt/app
    docker compose restart backend
    
    echo "✓ Backend restarted. AI features should now be available!"
    echo ""
    echo "You can test the AI features by:"
    echo "1. Visiting the frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3333"
    echo "2. Trying the recommendation features"
    echo "3. Checking the backend health: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000/health"
else
    echo "Skipped API key setup. You can run this script again later."
fi

echo ""
echo "=== Setup Complete ==="
