import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Clock, Zap, Trophy, Lightbulb, RotateCcw, ChevronLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import CheckersBoard from '../components/game/CheckersBoard';

// Helper function to convert puzzle position to board array
function createBoardFromPosition(position: any) {
    const board: any[][] = Array(10).fill(null).map(() => Array(10).fill(null));

    // Place white pieces
    position.white?.forEach((pos: number) => {
        const row = Math.floor((pos - 1) / 5);
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

interface Puzzle {
    id: number;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    theme: string;
    position: {
        white: number[];
        black: number[];
        kings: number[];
        turn: 'white' | 'black';
    };
}

export default function DailyPuzzle() {
    const { themeColors } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [completed, setCompleted] = useState(false);

    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime] = useState<number>(Date.now());
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintText, setHintText] = useState('');

    const [moveIndex, setMoveIndex] = useState(0);
    const [moveHistory, setMoveHistory] = useState<any[]>([]);

    // Helper to convert (row, col) to 1-50
    const coordsToPos = (row: number, col: number) => {
        return row * 5 + Math.floor(col / 2) + 1;
    };

    // Load today's puzzle
    useEffect(() => {
        loadDailyPuzzle();
        if (user) {
            loadStats();
        }
    }, [user]);

    // Timer
    useEffect(() => {
        if (completed) return;
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [completed, startTime]);

    // Mock data for offline/fallback mode
    const MOCK_PUZZLE: Puzzle = {
        id: 1,
        title: "Puzzle Classique #1 (Mode Hors-ligne)",
        difficulty: "easy",
        theme: "Fin de partie",
        position: {
            white: [37, 38, 42, 43, 46, 47],
            black: [13, 14, 18, 23, 27, 28, 32, 33],
            kings: [],
            turn: "white"
        }
    };

    const loadDailyPuzzle = async () => {
        try {
            // Try to fetch from backend with short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);

            const response = await fetch('http://localhost:8000/api/puzzle/daily', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            setPuzzle(data);
            setLoading(false);
        } catch (error) {
            console.warn('Backend unreachable, using mock puzzle data:', error);
            // Fallback to mock data
            setPuzzle(MOCK_PUZZLE);
            setLoading(false);
        }
    };

    const loadStats = async () => {
        if (!user) return;
        try {
            const response = await fetch(`http://localhost:8000/api/puzzle/stats/${user.id}`);
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Mock stats or leave null
        }
    };

    const getHint = async () => {
        if (!puzzle || hintsUsed >= 3) return;

        try {
            const response = await fetch(
                `http://localhost:8000/api/puzzle/${puzzle.id}/hint?moveIndex=0`
            );
            const data = await response.json();

            setHintText(data.hint);
            setShowHint(true);
            setHintsUsed(hintsUsed + 1);

            setTimeout(() => setShowHint(false), 5000);
        } catch (error) {
            console.error('Failed to get hint:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'hard': return '#ef4444';
            default: return themeColors.accent;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <Brain size={48} style={{ color: themeColors.accent }} />
                </motion.div>
            </div>
        );
    }

    if (!puzzle) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
                <div className="text-center">
                    <p style={{ color: themeColors.text }}>Failed to load puzzle</p>
                    <button
                        onClick={loadDailyPuzzle}
                        className="mt-4 px-6 py-2 rounded-lg"
                        style={{ backgroundColor: themeColors.accent, color: '#1a1a1a' }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: themeColors.background }}>
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-lg hover:opacity-80"
                            style={{ backgroundColor: themeColors.surface }}
                        >
                            <ChevronLeft size={24} style={{ color: themeColors.text }} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: themeColors.text }}>
                                <Brain size={32} style={{ color: themeColors.accent }} />
                                Daily Puzzle #{puzzle.id}
                            </h1>
                            <p style={{ color: themeColors.textMuted }}>{puzzle.title}</p>
                        </div>
                    </div>

                    {/* Streak indicator */}
                    {stats && stats.currentStreak > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: themeColors.surface }}>
                            <Zap size={20} style={{ color: '#f59e0b' }} />
                            <span className="font-bold" style={{ color: themeColors.text }}>
                                {stats.currentStreak} day streak! 🔥
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main puzzle area */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.surface }}>
                        {/* Puzzle info */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div
                                    className="px-3 py-1 rounded-lg text-sm font-bold"
                                    style={{
                                        backgroundColor: getDifficultyColor(puzzle.difficulty) + '20',
                                        color: getDifficultyColor(puzzle.difficulty),
                                    }}
                                >
                                    {puzzle.difficulty.toUpperCase()}
                                </div>
                                <div style={{ color: themeColors.textMuted }}>
                                    Theme: {puzzle.theme}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-lg font-mono" style={{ color: themeColors.text }}>
                                <Clock size={20} />
                                {formatTime(elapsedTime)}
                            </div>
                        </div>

                        {/* Interactive Checkers Board */}
                        <div className="mb-8 flex justify-center">
                            <div className="aspect-square w-full max-w-[500px] shadow-2xl rounded-lg overflow-hidden border-4 border-amber-900/20">
                                <CheckersBoard
                                    initialBoard={createBoardFromPosition(puzzle.position)}
                                    onMove={async (move) => {
                                        if (completed) return;

                                        const fromPos = coordsToPos(move.from.row, move.from.col);
                                        const toPos = coordsToPos(move.to.row, move.to.col);
                                        const currentMove = { from: fromPos, to: toPos };

                                        try {
                                            const response = await fetch(`http://localhost:8000/api/puzzle/${puzzle.id}/solve`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    moves: [currentMove],
                                                    moveIndex: moveIndex
                                                })
                                            });
                                            const result = await response.json();

                                            if (result.correct) {
                                                if (result.completed) {
                                                    setCompleted(true);
                                                    // Record completion
                                                    if (user) {
                                                        await fetch(`http://localhost:8000/api/puzzle/${puzzle.id}/complete`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': 'Bearer placeholder'
                                                            },
                                                            body: JSON.stringify({
                                                                userId: user.id,
                                                                timeSeconds: elapsedTime,
                                                                hintsUsed,
                                                                moves: [...moveHistory, currentMove]
                                                            })
                                                        });
                                                        loadStats();
                                                    }
                                                } else {
                                                    setMoveIndex(moveIndex + 1);
                                                    setMoveHistory([...moveHistory, currentMove]);
                                                }
                                            } else {
                                                // Wrong move - could reset or show error
                                                alert('Coup incorrect ! Essayez encore.');
                                                window.location.reload();
                                            }
                                        } catch (error) {
                                            console.error('Failed to verify move:', error);
                                        }
                                    }}
                                    onGameEnd={(winner) => {
                                        console.log('Game ended, winner:', winner);
                                    }}
                                    aiDifficulty="medium"
                                    vsAI={false}
                                    playerColor="white"
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                                <button
                                    onClick={getHint}
                                    disabled={hintsUsed >= 3 || completed}
                                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                    style={{
                                        backgroundColor: themeColors.accent + '20',
                                        color: themeColors.accent,
                                    }}
                                >
                                    <Lightbulb size={18} />
                                    Show Hint ({3 - hintsUsed} left)
                                </button>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                                    style={{
                                        backgroundColor: '#ef4444' + '20',
                                        color: '#ef4444',
                                    }}
                                >
                                    <RotateCcw size={18} />
                                    Reset
                                </button>
                            </div>

                            {completed && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#10b981' + '20', color: '#10b981' }}>
                                    <Trophy size={20} />
                                    <span className="font-bold">Solved in {formatTime(elapsedTime)}!</span>
                                </div>
                            )}
                        </div>

                        {/* Hint display */}
                        {showHint && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 rounded-lg"
                                style={{ backgroundColor: themeColors.accent + '20', color: themeColors.text }}
                            >
                                <div className="flex items-start gap-2">
                                    <Lightbulb size={20} style={{ color: themeColors.accent }} />
                                    <p>{hintText}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Stats sidebar */}
                <div className="space-y-6">
                    {/* Progress card */}
                    <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.surface }}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                            <Trophy size={24} style={{ color: themeColors.accent }} />
                            Your Stats
                        </h3>

                        {stats ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span style={{ color: themeColors.textMuted }}>Puzzles Solved</span>
                                        <span className="font-bold" style={{ color: themeColors.text }}>{stats.totalCompleted}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span style={{ color: themeColors.textMuted }}>Current Streak</span>
                                        <span className="font-bold" style={{ color: themeColors.text }}>{stats.currentStreak} days 🔥</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span style={{ color: themeColors.textMuted }}>Longest Streak</span>
                                        <span className="font-bold" style={{ color: themeColors.text }}>{stats.longestStreak} days</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t" style={{ borderColor: themeColors.border }}>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-sm" style={{ color: themeColors.textMuted }}>Easy</div>
                                            <div className="font-bold" style={{ color: '#10b981' }}>{stats.easyCompleted}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm" style={{ color: themeColors.textMuted }}>Medium</div>
                                            <div className="font-bold" style={{ color: '#f59e0b' }}>{stats.mediumCompleted}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm" style={{ color: themeColors.textMuted }}>Hard</div>
                                            <div className="font-bold" style={{ color: '#ef4444' }}>{stats.hardCompleted}</div>
                                        </div>
                                    </div>
                                </div>

                                {stats.averageTime > 0 && (
                                    <div className="pt-4 border-t" style={{ borderColor: themeColors.border }}>
                                        <div className="flex justify-between mb-2">
                                            <span style={{ color: themeColors.textMuted }}>Avg Time</span>
                                            <span className="font-mono" style={{ color: themeColors.text }}>{formatTime(stats.averageTime)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{ color: themeColors.textMuted }}>Best Time</span>
                                            <span className="font-mono font-bold" style={{ color: themeColors.accent }}>{formatTime(stats.fastestTime)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: themeColors.textMuted }}>Login to track your progress!</p>
                        )}
                    </div>

                    {/* Instructions card */}
                    <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.surface }}>
                        <h3 className="text-lg font-bold mb-3" style={{ color: themeColors.text }}>How to Play</h3>
                        <ul className="space-y-2" style={{ color: themeColors.textMuted }}>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Find the winning sequence of moves</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Use hints if you get stuck (max 3)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Solve it as fast as you can!</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>•</span>
                                <span>Come back daily for new puzzles</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
