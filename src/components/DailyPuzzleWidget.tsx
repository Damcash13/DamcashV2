import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import CheckersBoard from './game/CheckersBoard';

import ChessBoard from './game/ChessBoard';

interface DailyPuzzleWidgetProps {
    themeColors: any;
    gameType: 'checkers' | 'chess';
}

// Helper function to convert puzzle position to board array
function createBoardFromPosition(position: any) {
    const board: any[][] = Array(10).fill(null).map(() => Array(10).fill(null));

    // Place white pieces
    position.white?.forEach((pos: number) => {
        const row = Math.floor((pos - 1) / 5);
        // Standard draughts 10x10: Squares 1-50 are dark squares.
        // Row 0 (even): dark squares at cols 1, 3, 5, 7, 9
        // Row 1 (odd): dark squares at cols 0, 2, 4, 6, 8
        // col = ((pos-1)%5)*2 + (1 - (row%2))
        const col = ((pos - 1) % 5) * 2 + (1 - (row % 2));
        board[row][col] = position.kings?.includes(pos) ? 'W' : 'w';
    });

    // Place black pieces
    position.black?.forEach((pos: number) => {
        const row = Math.floor((pos - 1) / 5);
        const col = ((pos - 1) % 5) * 2 + (1 - (row % 2));
        board[row][col] = position.kings?.includes(pos) ? 'B' : 'b';
    });

    return board;
}

export default function DailyPuzzleWidget({ themeColors, gameType }: DailyPuzzleWidgetProps) {
    const navigate = useNavigate();
    const [puzzle, setPuzzle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [moveIndex, setMoveIndex] = useState(0);
    const [solved, setSolved] = useState(false);

    const coordsToPos = (row: number, col: number) => {
        return row * 5 + Math.floor(col / 2) + 1;
    };

    useEffect(() => {
        loadDailyPuzzle();
    }, []);

    const loadDailyPuzzle = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);

            const response = await fetch(`http://localhost:8000/api/puzzle/daily?gameType=${gameType}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            setPuzzle(data);
            setLoading(false);
        } catch (error) {
            console.warn('Backend unreachable, using mock puzzle data for widget:', error);

            // Mock data for offline/fallback mode
            if (gameType === 'chess') {
                setPuzzle({
                    id: 'chess_daily',
                    title: "Le Baiser de la Dame",
                    difficulty: "medium",
                    theme: "Mat en 1",
                    gameType: "chess",
                    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
                    solution: { notation: 'Qxf7', move: { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } } }
                });
            } else {
                setPuzzle({
                    id: 1,
                    title: "Défi Utilisateur",
                    difficulty: "easy",
                    theme: "Fin de partie",
                    gameType: "checkers",
                    position: {
                        white: [37, 38, 42, 43, 46, 47],
                        black: [13, 14, 18, 23, 27, 28, 32, 33],
                        kings: [],
                        turn: "white"
                    }
                });
            }
            setLoading(false);
        }
    };

    // Reload puzzle if gameType changes
    useEffect(() => {
        setLoading(true);
        loadDailyPuzzle();
    }, [gameType]);

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'hard': return '#ef4444';
            default: return themeColors.accent;
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'FACILE';
            case 'medium': return 'MOYEN';
            case 'hard': return 'DIFFICILE';
            default: return difficulty.toUpperCase();
        }
    };

    if (loading || !puzzle || puzzle.gameType !== gameType) {
        return (
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🧩</span>
                    <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Puzzle du jour</h2>
                </div>
                <div className="text-center py-8">
                    <p style={{ color: themeColors.textMuted }}>Chargement...</p>
                </div>
            </div>
        );
    }

    // Extra safety guard: checkers puzzles need position data
    if (gameType === 'checkers' && !puzzle.position) {
        return (
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🧩</span>
                    <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Puzzle du jour</h2>
                </div>
                <div className="text-center py-8">
                    <p style={{ color: themeColors.textMuted }}>Aucun puzzle disponible pour l'instant.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧩</span>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Puzzle du jour</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Board */}
                <div>
                    <div className="aspect-square w-full max-w-[400px]">
                        {gameType === 'checkers' ? (
                            <CheckersBoard
                                key={solved ? `solved-${gameType}` : `play-${gameType}-${moveIndex}`}
                                initialBoard={createBoardFromPosition(puzzle.position)}
                                onMove={async (move) => {
                                    if (solved) return;
                                    const fromPos = coordsToPos(move.from.row, move.from.col);
                                    const toPos = coordsToPos(move.to.row, move.to.col);

                                    try {
                                        const response = await fetch(`http://localhost:8000/api/puzzle/${puzzle.id}/solve`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                moves: [{ from: fromPos, to: toPos }],
                                                moveIndex: moveIndex
                                            })
                                        });
                                        const result = await response.json();

                                        if (result.correct) {
                                            if (result.completed) {
                                                setSolved(true);
                                            } else {
                                                setMoveIndex(moveIndex + 1);
                                            }
                                        } else {
                                            alert('Coup incorrect !');
                                            setMoveIndex(moveIndex + 1); // Trigger re-render to reset position
                                        }
                                    } catch (error) {
                                        console.error('Failed to verify checkmove:', error);
                                        // Mock fallback
                                        if (move.from.row === 5 && move.from.col === 0 && move.to.row === 4 && move.to.col === 1) {
                                            setSolved(true);
                                        } else {
                                            setMoveIndex(moveIndex + 1);
                                        }
                                    }
                                }}
                                onGameEnd={() => { }}
                                aiDifficulty="medium"
                                vsAI={false}
                                playerColor="white"
                            />
                        ) : (
                            <ChessBoard
                                key={solved ? `solved-${gameType}` : `play-${gameType}-${moveIndex}`}
                                initialFEN={puzzle.fen}
                                onMove={(from, to, notation) => {
                                    if (solved) return;
                                    if (notation === puzzle.solution.notation || notation?.includes('#')) {
                                        setSolved(true);
                                    } else {
                                        setMoveIndex(moveIndex + 1); // Reset
                                    }
                                }}
                                vsAI={false}
                                playerColor="white"
                            />
                        )}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="flex flex-col justify-between">
                    <div>
                        {/* Difficulty badge */}
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="px-3 py-1 rounded-lg text-xs font-bold"
                                style={{
                                    backgroundColor: getDifficultyColor(puzzle.difficulty) + '30',
                                    color: getDifficultyColor(puzzle.difficulty),
                                }}
                            >
                                {getDifficultyLabel(puzzle.difficulty)}
                            </div>
                            <span style={{ color: themeColors.textMuted }}>{puzzle.theme}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold mb-3" style={{ color: themeColors.text }}>
                            Défi Utilisateur
                        </h3>

                        {/* Description */}
                        <p className="mb-6" style={{ color: themeColors.textMuted }}>
                            {gameType === 'chess'
                                ? puzzle.description || 'Trouvez le coup gagnant pour les blancs.'
                                : `Problème de la communauté. Les ${puzzle.position?.turn === 'white' ? 'blancs' : 'noirs'} jouent et gagnent.`}
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80"
                            style={{
                                backgroundColor: themeColors.card,
                                color: themeColors.text,
                                border: `1px solid ${themeColors.border}`,
                            }}
                        >
                            <RotateCcw size={18} />
                            Reset
                        </button>
                        <button
                            onClick={() => navigate('/puzzle')}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold transition-all hover:opacity-90"
                            style={{
                                backgroundColor: '#c9b037',
                                color: '#1a1a1a',
                            }}
                        >
                            <Lightbulb size={18} />
                            Indice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
