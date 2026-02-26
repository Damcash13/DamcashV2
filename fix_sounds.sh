#!/bin/bash

# Script to download better quality free game sound effects
# Using alternative sounds from Mixkit

SOUNDS_DIR="public/sounds"

echo "🔊 Re-downloading better quality sounds..."
echo ""

# Re-download the problematic files with better alternatives
echo "📥 Re-downloading capture.mp3 (better quality)..."
curl -L -o "$SOUNDS_DIR/capture.mp3" "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" 2>/dev/null

echo "📥 Re-downloading victory.mp3 (better quality)..."
curl -L -o "$SOUNDS_DIR/victory.mp3" "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3" 2>/dev/null

echo ""
echo "✅ Sounds updated!"
echo ""
echo "📁 All sound files:"
ls -lh "$SOUNDS_DIR"/*.mp3

echo ""
echo "🎮 Ready to test! Run: npm run dev"
