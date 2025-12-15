#!/bin/bash

# Voice Matching Service Startup Script

echo "🎤 Starting Voice Matching Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Start the service
echo "Starting Flask server on port 5001..."
echo "📡 Service will be available at http://localhost:5001"
echo "Press Ctrl+C to stop"
echo ""

python voice_matching_service.py

