import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckerBoard, PlayerColor, AIDifficulty, Move } from '../types';
import { getValidMoves } from '../utils/checkersLogic';

// International Draughts 10x10 mapping
// The 50 playable squares are numbered 1 to 50
// Row 0 Col 1 is 1 ... Row 9 Col 8 is 50
function positionToIndex(row: number, col: number): number | null {
    if ((row + col) % 2 === 0) return null; // White squares are not playable
    return Math.floor((row * 5) + (col / 2)) + 1;
}

function indexToPosition(index: number): { row: number, col: number } {
    const row = Math.floor((index - 1) / 5);
    const col = ((index - 1) % 5) * 2 + (row % 2 === 0 ? 1 : 0);
    return { row, col };
}

// Generates a 'Hub' format string for Scan 3.1
// Format: 1 char for turn (W or B), then 50 chars for the board squares:
// 'w' (white man), 'b' (black man), 'W' (white king), 'B' (black king), 'e' (empty)
function generateDraughtsHubPos(board: CheckerBoard, turn: PlayerColor): string {
    const turnChar = turn === 'white' ? 'W' : 'B';
    let squaresStr = '';

    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if ((r + c) % 2 === 0) continue; // Skip unplayable white squares

            const piece = board[r][c];
            if (!piece) {
                squaresStr += 'e';
            } else if (piece === 'w') {
                squaresStr += 'w';
            } else if (piece === 'W') {
                squaresStr += 'W';
            } else if (piece === 'b') {
                squaresStr += 'b';
            } else if (piece === 'B') {
                squaresStr += 'B';
            }
        }
    }

    return turnChar + squaresStr;
}

export function useCheckersEngine(difficulty: AIDifficulty) {
    const [engineReady, setEngineReady] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const resolveMoveRef = useRef<((move: Move) => void) | null>(null);
    const currentBoardRef = useRef<CheckerBoard | null>(null);
    const currentTurnRef = useRef<PlayerColor | null>(null);

    useEffect(() => {
        // Initialize the Web Worker using the downloaded Scan scripts
        const worker = new Worker('/scan/scan_normal.js');
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const msg = e.data;
            console.log('[Scan Engine] Received:', msg);

            if (typeof msg !== 'string') return;

            // Set engine ready only when we get "wait" which is the end of hub protocol initialization
            if (msg === 'wait') {
                setEngineReady(true);
            }

            if (msg.startsWith('done')) {
                // e.g. "done move=32-28" or "done move=32x21 ponder=..."
                const match = msg.match(/move=([^ ]+)/);
                if (match && match[1]) {
                    const moveString = match[1].replace(/"/g, ''); // strip optional quotes
                    parseAndResolveMove(moveString);
                } else {
                    // Engine finished but no move found (e.g. checkmate or invalid pos)
                    if (resolveMoveRef.current) {
                        resolveMoveRef.current(null as any);
                        resolveMoveRef.current = null;
                    }
                }
            }
        };

        worker.postMessage('hub');

        return () => {
            worker.terminate();
        };
    }, []);

    const parseAndResolveMove = useCallback((moveString: string) => {
        if (!resolveMoveRef.current || !currentBoardRef.current || !currentTurnRef.current) return;

        // Scan moves are like "32-28" (normal) or "32x21" (capture)
        const isCapture = moveString.includes('x');
        const separator = isCapture ? 'x' : '-';
        const squares = moveString.split(separator).map(s => parseInt(s, 10));

        // We only need the start and end squares to find the corresponding Move object
        const startIdx = squares[0];
        const endIdx = squares[squares.length - 1];

        const from = indexToPosition(startIdx);
        const to = indexToPosition(endIdx);

        const validMoves = getValidMoves(currentBoardRef.current, from, currentTurnRef.current);

        // Find the move that ends at 'to'
        const bestMove = validMoves.find(m => m.to.row === to.row && m.to.col === to.col);

        if (bestMove) {
            resolveMoveRef.current(bestMove);
        } else {
            console.error('[Scan Engine] Engine returned invalid move:', moveString, validMoves);
        }

        resolveMoveRef.current = null;
    }, []);

    const requestMove = useCallback((board: CheckerBoard, turn: PlayerColor): Promise<Move | null> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current || !engineReady) {
                reject(new Error('Engine not ready'));
                return;
            }

            const hubPos = generateDraughtsHubPos(board, turn);
            console.log('[Scan Engine] Setting HUB position:', hubPos);

            resolveMoveRef.current = resolve;
            currentBoardRef.current = board;
            currentTurnRef.current = turn;

            workerRef.current.postMessage(`pos pos="${hubPos}"`);

            // Map difficulty to search depths and times
            // Example defaults: grandmaster searches depth 12, easy searches depth 2
            let depth = 4;
            let moveTime = 1.0;
            switch (difficulty) {
                case 'easy': depth = 2; moveTime = 0.5; break;
                case 'medium': depth = 6; moveTime = 1.0; break;
                case 'hard': depth = 10; moveTime = 2.0; break;
                case 'expert': depth = 16; moveTime = 5.0; break;
            }

            console.log(`[Scan Engine] Starting search at depth ${depth} for ${moveTime}s...`);
            workerRef.current.postMessage(`level depth=${depth} move-time=${moveTime}`);
            workerRef.current.postMessage(`go`);
        });
    }, [engineReady, difficulty]);

    const abortSearch = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.postMessage('stop');
            resolveMoveRef.current = null;
        }
    }, []);

    return { engineReady, requestMove, abortSearch };
}
