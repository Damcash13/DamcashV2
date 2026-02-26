#!/bin/bash

# Script to download free game sound effects
# Using sounds from Mixkit (free license)

SOUNDS_DIR="public/sounds"

echo "🔊 Downloading game sound effects..."
echo ""

# Create sounds directory
mkdir -p "$SOUNDS_DIR"

# Download sounds from Mixkit (all free to use)
echo "📥 Downloading game-start.mp3..."
curl -L -o "$SOUNDS_DIR/game-start.mp3" "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3" 2>/dev/null

echo "📥 Downloading move.mp3..."
curl -L -o "$SOUNDS_DIR/move.mp3" "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" 2>/dev/null

echo "📥 Downloading capture.mp3..."
curl -L -o "$SOUNDS_DIR/capture.mp3" "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" 2>/dev/null

echo "📥 Downloading victory.mp3..."
curl -L -o "$SOUNDS_DIR/victory.mp3" "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3" 2>/dev/null

echo "📥 Downloading defeat.mp3..."
curl -L -o "$SOUNDS_DIR/defeat.mp3" "https://assets.mixkit.co/active_storage/sfx/1468/1468-preview.mp3" 2>/dev/null

echo ""
echo "✅ All sounds downloaded successfully!"
echo ""
echo "📁 Files saved to: $SOUNDS_DIR/"
ls -lh "$SOUNDS_DIR"/*.mp3 2>/dev/null || echo "Note: Some files may not have downloaded correctly"

echo ""
echo "🎮 Sound effects ready! Start the dev server to test:"
echo "   npm run dev"
