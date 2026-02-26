#!/usr/bin/env python3
"""
Script to generate simple test sound files for the game.
Requires: pip install pydub numpy
"""

try:
    from pydub import AudioSegment
    from pydub.generators import Sine, Square
    import numpy as np
except ImportError:
    print("Error: Required libraries not installed.")
    print("Please install: pip install pydub numpy")
    print("\nAlternatively, download free sounds from:")
    print("- https://mixkit.co/free-sound-effects/")
    print("- https://freesound.org/")
    exit(1)

def create_game_start():
    """Create an energetic game start sound"""
    # Ascending notes (C, E, G, C)
    note1 = Sine(523).to_audio_segment(duration=150)  # C
    note2 = Sine(659).to_audio_segment(duration=150)  # E
    note3 = Sine(784).to_audio_segment(duration=150)  # G
    note4 = Sine(1047).to_audio_segment(duration=300) # C (higher)
    
    sound = note1 + note2 + note3 + note4
    sound = sound.fade_in(50).fade_out(100)
    return sound - 10  # Reduce volume

def create_move():
    """Create a short click sound for piece movement"""
    click = Square(800).to_audio_segment(duration=50)
    click = click.fade_in(5).fade_out(20)
    return click - 15

def create_capture():
    """Create a capture sound (click + impact)"""
    click = Square(600).to_audio_segment(duration=80)
    impact = Sine(200).to_audio_segment(duration=120)
    sound = click.overlay(impact)
    sound = sound.fade_in(5).fade_out(50)
    return sound - 12

def create_victory():
    """Create a triumphant victory fanfare"""
    # Victory melody: C, E, G, C, G, C
    notes = [
        (523, 200),   # C
        (659, 200),   # E
        (784, 200),   # G
        (1047, 300),  # C (high)
        (784, 200),   # G
        (1047, 500),  # C (high, long)
    ]
    
    sound = AudioSegment.silent(duration=0)
    for freq, duration in notes:
        note = Sine(freq).to_audio_segment(duration=duration)
        note = note.fade_in(20).fade_out(50)
        sound += note
    
    return sound - 10

def create_defeat():
    """Create a descending defeat sound"""
    # Descending notes
    notes = [
        (523, 300),   # C
        (392, 300),   # G (lower)
        (330, 300),   # E (lower)
        (262, 500),   # C (low, long)
    ]
    
    sound = AudioSegment.silent(duration=0)
    for freq, duration in notes:
        note = Sine(freq).to_audio_segment(duration=duration)
        note = note.fade_in(20).fade_out(100)
        sound += note
    
    return sound - 10

def main():
    import os
    
    # Create sounds directory if it doesn't exist
    sounds_dir = "public/sounds"
    os.makedirs(sounds_dir, exist_ok=True)
    
    print("Generating game sounds...")
    
    # Generate each sound
    sounds = {
        "game-start.mp3": create_game_start(),
        "move.mp3": create_move(),
        "capture.mp3": create_capture(),
        "victory.mp3": create_victory(),
        "defeat.mp3": create_defeat(),
    }
    
    # Export to MP3
    for filename, sound in sounds.items():
        filepath = os.path.join(sounds_dir, filename)
        sound.export(filepath, format="mp3", bitrate="128k")
        print(f"✓ Created {filename}")
    
    print("\n✅ All sounds generated successfully!")
    print(f"Files saved to: {sounds_dir}/")

if __name__ == "__main__":
    main()
