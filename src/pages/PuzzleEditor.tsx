import React, { useState } from 'react';
import { Share, Download, Trash, Check, X } from 'lucide-react';
import CheckersBoard from '../components/game/CheckersBoard';

interface PuzzleDraft {
    id: number;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    theme: string;
    ply: number;
    position: {
        white: number[];
        black: number[];
        kings: number[];
        turn: 'white' | 'black';
    };
    solution: string; // "1. 27-22 18x27..."
    hints: string[];
}

export function PuzzleEditor() {
    const [boardType, setBoardType] = useState<'empty' | 'standard'>('empty');
    const [activeColor, setActiveColor] = useState<'white' | 'black'>('white');
    const [isKingMode, setIsKingMode] = useState(false);

    const [whitePieces, setWhitePieces] = useState<number[]>([]);
    const [blackPieces, setBlackPieces] = useState<number[]>([]);
    const [kings, setKings] = useState<number[]>([]);

    const [solutionStr, setSolutionStr] = useState('');
    const [puzzleId, setPuzzleId] = useState(321);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    const [savedJson, setSavedJson] = useState<string>('');

    const handleCellClick = (index: number) => {
        // Checkers uses 1-50 indexing for playable squares. 
        // The CheckersBoard component index is 0-49 for playable black squares.
        const squareId = index + 1;

        // Toggle piece logic
        const isWhite = whitePieces.includes(squareId);
        const isBlack = blackPieces.includes(squareId);

        if (activeColor === 'white') {
            if (isWhite && (isKingMode === kings.includes(squareId))) {
                setWhitePieces(prev => prev.filter(p => p !== squareId));
                setKings(prev => prev.filter(p => p !== squareId));
            } else {
                setBlackPieces(prev => prev.filter(p => p !== squareId));
                setWhitePieces(prev => [...new Set([...prev, squareId])].sort((a, b) => a - b));
                if (isKingMode) {
                    setKings(prev => [...new Set([...prev, squareId])]);
                } else {
                    setKings(prev => prev.filter(p => p !== squareId));
                }
            }
        } else {
            if (isBlack && (isKingMode === kings.includes(squareId))) {
                setBlackPieces(prev => prev.filter(p => p !== squareId));
                setKings(prev => prev.filter(p => p !== squareId));
            } else {
                setWhitePieces(prev => prev.filter(p => p !== squareId));
                setBlackPieces(prev => [...new Set([...prev, squareId])].sort((a, b) => a - b));
                if (isKingMode) {
                    setKings(prev => [...new Set([...prev, squareId])]);
                } else {
                    setKings(prev => prev.filter(p => p !== squareId));
                }
            }
        }
    };

    const parseSolutionToFormat = (rawText: string) => {
        // Extremely basic transform for now, normally we need to parse actual moves
        // But for this editor we just generate the JSON
        return [];
    };

    const handleGenerateJSON = () => {
        const draft: PuzzleDraft = {
            id: puzzleId,
            title: `Puzzle Classique #${puzzleId}`,
            difficulty,
            theme: "Classique",
            ply: 3, // Approximation
            position: {
                white: whitePieces,
                black: blackPieces,
                kings: kings,
                turn: 'white'
            },
            solution: solutionStr as any, // Need to parse later or keep as string depending on backend
            hints: ["Analysez la position"]
        };
        setSavedJson(JSON.stringify(draft, null, 2));
    };

    const handleClear = () => {
        setWhitePieces([]);
        setBlackPieces([]);
        setKings([]);
        setSolutionStr('');
    }

    // Generate board array for CheckersBoard (10x10 matrix)
    const board = Array(10).fill(null).map(() => Array(10).fill(null));

    // Helper to convert 1-50 Draughts notation to row/col
    const posToRowCol = (id: number) => {
        const row = Math.floor((id - 1) / 5);
        const col = ((id - 1) % 5) * 2 + (row % 2 === 0 ? 1 : 0);
        return { row, col };
    };

    whitePieces.forEach(id => {
        const { row, col } = posToRowCol(id);
        board[row][col] = kings.includes(id) ? 'W' : 'w';
    });

    blackPieces.forEach(id => {
        const { row, col } = posToRowCol(id);
        board[row][col] = kings.includes(id) ? 'B' : 'b';
    });

    return (
        <div className="max-w-7xl mx-auto p-6 text-white pt-24">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold font-display text-white">Éditeur de Puzzles</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Board Editor */}
                <div className="bg-[#1a1c23] rounded-2xl border border-white/5 p-6">
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveColor('white')}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium border transition-all ${activeColor === 'white' ? 'bg-white/10 border-white/20' : 'border-transparent opacity-50'}`}
                        >
                            Placer Blancs
                        </button>
                        <button
                            onClick={() => setActiveColor('black')}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium border transition-all ${activeColor === 'black' ? 'bg-white/10 border-white/20' : 'border-transparent opacity-50'}`}
                        >
                            Placer Noirs
                        </button>
                        <button
                            onClick={() => setIsKingMode(!isKingMode)}
                            className={`py-3 px-4 rounded-xl font-medium border transition-all ${isKingMode ? 'bg-[#ffb03a]/20 border-[#ffb03a]/40 text-[#ffb03a]' : 'border-transparent opacity-50'}`}
                        >
                            Dame Mode
                        </button>
                    </div>

                    <div className="aspect-square w-full max-w-[500px] mx-auto bg-black border-[12px] border-[#2A2A2A] rounded-md shadow-2xl relative">
                        <CheckersBoard
                            board={board}
                            onCellClick={handleCellClick}
                        />
                    </div>

                    <button onClick={handleClear} className="mt-6 w-full py-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2">
                        <Trash className="w-5 h-5" /> Vider le damier
                    </button>
                </div>

                {/* Right: Metadata Editor */}
                <div className="space-y-6">
                    <div className="bg-[#1a1c23] rounded-2xl border border-white/5 p-6 space-y-4">
                        <h2 className="text-xl font-bold">Informations</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">ID du Puzzle</label>
                                <input type="number" value={puzzleId} onChange={e => setPuzzleId(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffb03a]" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Difficulté</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffb03a]">
                                    <option value="easy">Facile</option>
                                    <option value="medium">Moyen</option>
                                    <option value="hard">Difficile</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Solution Texto (ex: 1. 27-22 18x27...)</label>
                            <textarea value={solutionStr} onChange={e => setSolutionStr(e.target.value)} rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ffb03a]" />
                        </div>

                        <button onClick={handleGenerateJSON} className="w-full py-4 bg-[#ffb03a] text-black font-bold rounded-xl hover:bg-[#ffb03a]/90 transition-colors flex justify-center items-center gap-2">
                            <Check className="w-5 h-5" />
                            Générer le JSON
                        </button>
                    </div>

                    {savedJson && (
                        <div className="bg-[#1a1c23] rounded-2xl border border-white/5 p-6">
                            <div className="flex justify-between mb-4">
                                <h2 className="text-xl font-bold">Résultat JSON</h2>
                                <button onClick={() => navigator.clipboard.writeText(savedJson)} className="text-[#ffb03a] flex gap-2"><Share className="w-5 h-5" /> Copier</button>
                            </div>
                            <pre className="bg-black/50 p-4 rounded-xl text-sm overflow-x-auto text-green-400 font-mono">
                                {savedJson}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
