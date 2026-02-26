import { useState, useEffect } from 'react';
import { CheckerBoard } from '../types';
import { createInitialBoard, executeMove } from '../utils/checkersLogic';
import { useGameSounds } from '../hooks/useGameSounds';

export function useGameEngine(
    mode: string,
    gameId: string | undefined,
    gameType: string,
    gameStarted: boolean,
    setGameStarted: (val: boolean) => void,
    switchTurn: () => void,
    sendMove: (moveData: any, notation: string) => void
) {
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [boardStates, setBoardStates] = useState<CheckerBoard[]>([]);
    const [replayLoaded, setReplayLoaded] = useState(false);
    const { playMove, playCapture } = useGameSounds();

    // Replay logic
    useEffect(() => {
        if (mode === 'replay' && gameId) {
            const fetchGame = async () => {
                try {
                    const res = await fetch(`http://localhost:8000/api/games/${gameId}`);
                    if (res.ok) {
                        const data = await res.json();
                        const game = data.game;
                        if (game.gameType === 'checkers') {
                            const movesRaw = JSON.parse(game.moves || '[]');
                            let currentBoard = createInitialBoard();
                            const states: CheckerBoard[] = [currentBoard];
                            const visualMoves: string[] = [];

                            movesRaw.forEach((m: any) => {
                                if (m.from && m.to) {
                                    currentBoard = executeMove(currentBoard, m);
                                    states.push(currentBoard);
                                    visualMoves.push(m.notation || 'move');
                                }
                            });

                            setBoardStates(states);
                            setMoveHistory(visualMoves);
                            setCurrentMoveIndex(states.length - 1);
                            setReplayLoaded(true);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load replay", err);
                }
            };
            fetchGame();
        }
    }, [mode, gameId]);

    const handleLocalMove = (notation: string, moveData: any = null, isCapture: boolean = false) => {
        if (!gameStarted) setGameStarted(true);

        setMoveHistory((prev) => [...prev, notation]);
        setCurrentMoveIndex((prev) => prev + 1);

        switchTurn();

        if (isCapture) {
            playCapture();
        } else {
            playMove();
        }

        sendMove(moveData, notation);
    };

    return {
        moveHistory,
        currentMoveIndex,
        setCurrentMoveIndex,
        boardStates,
        replayLoaded,
        handleLocalMove
    };
}
