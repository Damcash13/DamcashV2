import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

interface GameState {
    id: string;
    gameType: 'checkers' | 'chess';
    whitePlayerId: string;
    blackPlayerId: string;
    boardState: string;
    currentTurn: 'white' | 'black';
    status: 'active' | 'finished' | 'aborted';
    winnerId?: string;
    moves: string[];
}

export function useGameSpectate(gameId: string | null) {
    const { send, on, isConnected } = useWebSocket();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [spectatorCount, setSpectatorCount] = useState(0);

    useEffect(() => {
        if (!isConnected || !gameId) return;

        // Join as spectator
        send({
            type: 'spectate_join',
            payload: { gameId }
        });

        // Listen for game state updates
        const unsubState = on('game_state', (msg) => {
            if (msg.gameId === gameId) {
                setGameState(msg.state);
            }
        });

        // Listen for game moves
        const unsubMove = on('game_move', (msg) => {
            if (msg.payload?.gameId === gameId) {
                setGameState(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        moves: [...prev.moves, msg.payload.move],
                        currentTurn: prev.currentTurn === 'white' ? 'black' : 'white'
                    };
                });
            }
        });

        // Listen for spectator count
        const unsubCount = on('spectator_count', (msg) => {
            if (msg.gameId === gameId) {
                setSpectatorCount(msg.count);
            }
        });

        // Leave on unmount
        return () => {
            send({
                type: 'spectate_leave',
                payload: { gameId }
            });
            unsubState();
            unsubMove();
            unsubCount();
        };
    }, [gameId, send, on, isConnected]);

    return { gameState, spectatorCount, isConnected };
}
