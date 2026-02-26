import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// import { useRealTime } from '../../contexts/RealTimeContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface CreateGameModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateGameModal({ isOpen, onClose }: CreateGameModalProps) {
    const { themeColors, gameType } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    // const { sendMessage, subscribe } = useRealTime();
    const { showToast } = useToast();

    // Game-type aware variants
    const checkersVariants = ['Standard', 'International', 'Russian', 'Brazilian', 'Frisian'];
    const chessVariants = ['Standard', 'Crazyhouse', 'Chess960', 'King of the Hill', 'Three-check'];
    const variants = gameType === 'checkers' ? checkersVariants : chessVariants;

    const [variant, setVariant] = useState(variants[0]);
    const [timeControl, setTimeControl] = useState('Real time');
    const [minutes, setMinutes] = useState(5);
    const [increment, setIncrement] = useState(8);
    const [mode, setMode] = useState<'casual' | 'rated' | 'wager'>('rated');
    const [wagerAmount, setWagerAmount] = useState(100);
    const [seriesLength, setSeriesLength] = useState(1);

    const handleCreate = async (color: 'white' | 'random' | 'black') => {
        if (!user) {
            showToast('Erreur', 'error', 'Vous devez être connecté pour créer une partie.');
            return;
        }

        // Determine creator's color
        let myColor = color;
        if (myColor === 'random') {
            myColor = Math.random() < 0.5 ? 'white' : 'black';
        }

        const gameData = {
            game_type: gameType,
            variant: variant.toLowerCase(),
            time_control: timeControl === 'Real time' ? `${minutes}+${increment}` : 'unlimited',
            status: 'waiting',
            is_rated: mode === 'rated',
            wager_amount: mode === 'wager' ? wagerAmount : 0,
            series_length: seriesLength,  // Add this field
            white_player_id: myColor === 'white' ? user.id : null,
            black_player_id: myColor === 'black' ? user.id : null,
            // Initialize board state if needed, or let Game.tsx handle default
        };

        try {
            const { data, error } = await supabase
                .from('games')
                .insert(gameData)
                .select()
                .single();

            if (error) throw error;

            showToast('Partie créée !', 'success', 'En attente d\'un adversaire...');
            navigate(`/game/${data.id}?mode=online`);
            onClose();

        } catch (error: any) {
            console.error('Failed to create game:', error);
            showToast('Erreur', 'error', error.message || 'Impossible de créer la partie');
        }
    };

    // Removed WebSocket listener for game_created as we await the promise directly now

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#2a2a2a] rounded-lg shadow-2xl max-w-md w-full overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className={`text-xl font-light text-center w-full ${themeColors.text}`}>
                        Créer une partie
                    </h2>
                    <button
                        onClick={onClose}
                        className={`absolute right-4 p-1 rounded-full hover:bg-white/10 ${themeColors.textMuted} transition-colors`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Variant Selector */}
                    <div className="flex items-center justify-between">
                        <label className={`text-sm ${themeColors.textMuted}`}>Variante</label>
                        <select
                            value={variant}
                            onChange={(e) => setVariant(e.target.value)}
                            className={`bg-white/10 border-none rounded px-3 py-1.5 text-sm font-medium ${themeColors.text} focus:ring-1 focus:ring-white/20 outline-none w-40 text-right cursor-pointer`}
                        >
                            {variants.map(v => (
                                <option key={v} className="bg-gray-800" value={v}>{v}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Time Control Selector */}
                    <div className="flex items-center justify-between">
                        <label className={`text-sm ${themeColors.textMuted}`}>Cadence</label>
                        <div className="flex gap-2 bg-white/5 rounded p-1">
                            <button
                                onClick={() => setTimeControl('Real time')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${timeControl === 'Real time' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                Temps réel
                            </button>
                            <button
                                onClick={() => setTimeControl('Unlimited')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${timeControl === 'Unlimited' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                Illimité
                            </button>
                        </div>
                    </div>

                    {timeControl === 'Real time' && (
                        <div className="space-y-6 pt-2">
                            {/* Minutes Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs uppercase tracking-wider font-bold text-gray-400">
                                    <span>Minutes par joueur: <span className="text-white text-sm">{minutes}</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="60"
                                    step="1"
                                    value={minutes}
                                    onChange={(e) => setMinutes(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#5f9e40]"
                                />
                            </div>

                            {/* Increment Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs uppercase tracking-wider font-bold text-gray-400">
                                    <span>Incrément (secondes): <span className="text-white text-sm">{increment}</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="60"
                                    value={increment}
                                    onChange={(e) => setIncrement(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#5f9e40]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-white/10" />

                    {/* Mode Selection: Rated / Casual / Wager */}
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => setMode('casual')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${mode === 'casual' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-transparent text-gray-400 hover:bg-white/5'}`}
                        >
                            Amical
                        </button>
                        <button
                            onClick={() => setMode('rated')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${mode === 'rated' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-transparent text-gray-400 hover:bg-white/5'}`}
                        >
                            Classé
                        </button>
                        <button
                            onClick={() => setMode('wager')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1 ${mode === 'wager' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-transparent text-gray-400 hover:bg-white/5'}`}
                        >
                            <Coins size={14} />
                            Paris
                        </button>
                    </div>

                    {/* Wager Amount Input */}
                    {mode === 'wager' && (
                        <div className="space-y-2">
                            <label className={`text-xs ${themeColors.textMuted}`}>
                                Montant du pari (Solde: {user?.coins || 0} 🪙)
                            </label>
                            <input
                                type="number"
                                min="10"
                                max={user?.coins || 1000}
                                value={wagerAmount}
                                onChange={(e) => setWagerAmount(parseInt(e.target.value) || 0)}
                                className={`w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 ${themeColors.text} focus:ring-1 focus:ring-yellow-500 outline-none`}
                            />
                        </div>
                    )}

                    {/* Series Length Selector (Available for all modes) */}
                    <div className="space-y-2">
                        <label className={`text-xs ${themeColors.textMuted}`}>
                            Série de jeux (Best of)
                        </label>
                        <div className="flex gap-2">
                            {[1, 3, 5, 10, 20].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setSeriesLength(num)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${seriesLength === num
                                        ? 'bg-yellow-500 text-black border-yellow-500'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 text-center">
                            {seriesLength > 1
                                ? `Le gagnant est déterminé après ${seriesLength} parties.${mode === 'wager' ? ' Paiement à la fin.' : ''}`
                                : `Partie unique.${mode === 'wager' ? ' Paiement immédiat.' : ''}`}
                        </p>
                    </div>

                    {/* Color Selection */}
                    <div className="flex justify-center gap-4 pt-4">
                        {/* Black */}
                        <button
                            onClick={() => handleCreate('black')}
                            className="group relative w-20 h-20 rounded bg-[#f0f0f0] border-b-4 border-[#ccc] hover:border-[#bbb] hover:translate-y-[1px] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center shadow-lg"
                        >
                            <div className="w-12 h-12 rounded-full bg-black shadow-inner border border-gray-800" />
                        </button>

                        {/* Random */}
                        <button
                            onClick={() => handleCreate('random')}
                            className="group relative w-20 h-20 rounded bg-[#f0f0f0] border-b-4 border-[#ccc] hover:border-[#bbb] hover:translate-y-[1px] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center shadow-lg overflow-hidden"
                        >
                            <div className="flex w-12 h-12 rounded-full overflow-hidden shadow-inner border border-gray-400">
                                <div className="w-1/2 h-full bg-white" />
                                <div className="w-1/2 h-full bg-black" />
                            </div>
                        </button>

                        {/* White */}
                        <button
                            onClick={() => handleCreate('white')}
                            className="group relative w-20 h-20 rounded bg-[#f0f0f0] border-b-4 border-[#ccc] hover:border-[#bbb] hover:translate-y-[1px] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center shadow-lg"
                        >
                            <div className="w-12 h-12 rounded-full bg-white shadow-inner border border-gray-300" />
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
