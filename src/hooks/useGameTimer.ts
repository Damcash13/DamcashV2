import { useState, useEffect, useCallback } from 'react';

export function useGameTimer(initialTimeControl: string, berserk: boolean) {
    const [whiteTime, setWhiteTime] = useState(300);
    const [blackTime, setBlackTime] = useState(300);
    const [increment, setIncrement] = useState(0);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);

    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);

    // Initialize time based on time control
    useEffect(() => {
        const times: Record<string, number> = {
            bullet: 60,
            blitz: 300,
            rapid: 900,
            classical: 1800
        };

        let initialTime = 300; // Default 5 mins

        if (times[initialTimeControl]) {
            initialTime = times[initialTimeControl];
        } else if (initialTimeControl && (initialTimeControl.includes('+') || initialTimeControl.includes(' '))) {
            const separator = initialTimeControl.includes('+') ? '+' : ' ';
            const [minutes, inc] = initialTimeControl.split(separator).map(Number);
            if (!isNaN(minutes)) {
                initialTime = minutes * 60;
                if (!isNaN(inc)) setIncrement(inc);
            }
        }

        if (berserk) {
            initialTime = Math.floor(initialTime / 2);
        }

        setWhiteTime(initialTime);
        setBlackTime(initialTime);
    }, [initialTimeControl, berserk]);

    // Timer countdown
    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const interval = setInterval(() => {
            if (isWhiteTurn) {
                setWhiteTime((t) => {
                    if (t <= 0) {
                        setGameOver(true);
                        setWinner('black');
                        return 0;
                    }
                    return t - 1;
                });
            } else {
                setBlackTime((t) => {
                    if (t <= 0) {
                        setGameOver(true);
                        setWinner('white');
                        return 0;
                    }
                    return t - 1;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameStarted, gameOver, isWhiteTurn]);

    const switchTurn = useCallback(() => {
        if (!gameStarted) setGameStarted(true);

        if (isWhiteTurn) {
            setWhiteTime(prev => prev + increment);
        } else {
            setBlackTime(prev => prev + increment);
        }

        setIsWhiteTurn(prev => !prev);
    }, [gameStarted, increment, isWhiteTurn]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        whiteTime,
        blackTime,
        isWhiteTurn,
        gameStarted,
        gameOver,
        winner,
        setGameStarted,
        setGameOver,
        setWinner,
        switchTurn,
        formatTime,
        setIsWhiteTurn
    };
}
