import { useEffect, useRef, useState, useCallback } from 'react';

interface GameSounds {
    playGameStart: () => void;
    playMove: () => void;
    playCapture: () => void;
    playCheck: () => void;
    playGameEnd: () => void;
    playVictory: () => void;
    playDefeat: () => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    isMuted: boolean;
    volume: number;
}

export function useGameSounds(): GameSounds {
    // Load saved preferences from localStorage
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem('game-sounds-volume');
        return saved ? Number(saved) : 70;
    });

    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('game-sounds-muted');
        return saved === 'true';
    });

    // Create audio elements
    const sounds = useRef<Record<string, HTMLAudioElement>>({});
    const initialized = useRef(false);

    // Initialize sounds
    useEffect(() => {
        if (initialized.current) return;

        try {
            sounds.current = {
                gameStart: new Audio('/sounds/game-start.mp3'),
                move: new Audio('/sounds/move.mp3'),
                capture: new Audio('/sounds/capture.mp3'),
                victory: new Audio('/sounds/victory.mp3'),
                defeat: new Audio('/sounds/defeat.mp3'),
                check: new Audio('/sounds/move.mp3'), // Fallback to move or specific check sound
                gameEnd: new Audio('/sounds/victory.mp3'), // Fallback
            };

            // Preload all sounds
            Object.values(sounds.current).forEach(sound => {
                sound.preload = 'auto';
                sound.load();
            });

            initialized.current = true;
        } catch (error) {
            console.warn('Failed to initialize game sounds:', error);
        }
    }, []);

    // Update volume for all sounds
    useEffect(() => {
        Object.values(sounds.current).forEach(sound => {
            sound.volume = isMuted ? 0 : volume / 100;
        });
    }, [volume, isMuted]);

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem('game-sounds-volume', volume.toString());
    }, [volume]);

    useEffect(() => {
        localStorage.setItem('game-sounds-muted', isMuted.toString());
    }, [isMuted]);

    // Play sound function
    const play = useCallback((soundName: string) => {
        if (isMuted) {
            console.log(`[Sound] Skipped ${soundName} (Muted)`);
            return;
        }

        const sound = sounds.current[soundName];
        if (sound) {
            console.log(`[Sound] Attempting to play: ${soundName}`);
            sound.currentTime = 0;
            sound.play().then(() => {
                console.log(`[Sound] Successfully played ${soundName}`);
            }).catch(err => {
                console.error(`[Sound] Play failed for ${soundName}:`, err);
            });
        } else {
            console.warn(`[Sound] Sound not found: ${soundName}`);
        }
    }, [isMuted]);

    const setVolume = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(100, newVolume));
        setVolumeState(clampedVolume);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return {
        playGameStart: () => play('gameStart'),
        playMove: () => play('move'),
        playCapture: () => play('capture'),
        playCheck: () => play('check'),
        playGameEnd: () => play('gameEnd'),
        playVictory: () => play('victory'),
        playDefeat: () => play('defeat'),
        setVolume,
        toggleMute,
        isMuted,
        volume,
    };
}
