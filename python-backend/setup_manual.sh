#!/bin/bash

echo "🎤 Manual Setup for Voice Matching Service"
echo ""
echo "Step 1: Installing dependencies..."

# Use python3 directly and install to user directory to avoid permission issues
python3 -m pip install --user --upgrade pip
python3 -m pip install --user -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server, run:"
echo "  python3 voice_matching_service.py"
