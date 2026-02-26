import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, DollarSign, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface WagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    maxBalance: number;
    opponentName?: string;
}

export default function WagerModal({ isOpen, onClose, onConfirm, maxBalance, opponentName = "l'adversaire" }: WagerModalProps) {
    const { themeColors } = useTheme();
    const [amount, setAmount] = useState<number>(0);
    const [error, setError] = useState<string>('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (isNaN(val)) {
            setAmount(0);
            return;
        }
        setAmount(val);

        if (val > maxBalance) {
            setError('Solde insuffisant');
        } else if (val < 0) {
            setError('Mise invalide');
        } else {
            setError('');
        }
    };

    const handleConfirm = () => {
        if (amount <= 0) {
            setError('La mise doit être supérieure à 0');
            return;
        }
        if (amount > maxBalance) {
            setError('Solde insuffisant');
            return;
        }
        onConfirm(amount);
    };

    const quickBets = [10, 50, 100, 500];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`${themeColors.card} rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-yellow-500/20`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-500/10 rounded-xl">
                                    <Coins className="w-8 h-8 text-yellow-500" />
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${themeColors.text}`}>Placer un pari</h2>
                                    <p className={`text-xs ${themeColors.textMuted}`}>vs {opponentName}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-full hover:bg-white/5 ${themeColors.textMuted}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Amount Input */}
                            <div className="relative">
                                <label className={`block text-sm font-medium ${themeColors.textMuted} mb-2`}>
                                    Montant de la mise
                                </label>
                                <div className="relative">
                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500" />
                                    <input
                                        type="number"
                                        value={amount === 0 ? '' : amount}
                                        onChange={handleAmountChange}
                                        placeholder="0"
                                        className={`
                      w-full pl-12 pr-4 py-4 rounded-xl text-2xl font-bold 
                      bg-black/20 border-2 ${error ? 'border-red-500 focus:border-red-500' : `${themeColors.border} focus:border-yellow-500`}
                      ${themeColors.text} focus:outline-none transition-colors
                    `}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-yellow-500">
                                        COINS
                                    </div>
                                </div>
                                {error && (
                                    <div className="flex items-center gap-1 text-red-500 text-xs mt-2 font-medium">
                                        <AlertCircle size={12} />
                                        {error}
                                    </div>
                                )}
                                <div className={`text-right text-xs ${themeColors.textMuted} mt-2`}>
                                    Solde disponible: <span className="text-yellow-500 font-bold">{maxBalance} 🪙</span>
                                </div>
                            </div>

                            {/* Quick Bets */}
                            <div className="grid grid-cols-4 gap-2">
                                {quickBets.map(bet => (
                                    <button
                                        key={bet}
                                        onClick={() => {
                                            setAmount(bet);
                                            setError('');
                                        }}
                                        disabled={bet > maxBalance}
                                        className={`
                      py-2 rounded-lg text-sm font-bold border transition-all
                      ${amount === bet
                                                ? 'bg-yellow-500 text-black border-yellow-500'
                                                : `bg-transparent ${themeColors.border} ${themeColors.text} hover:bg-white/5`
                                            }
                      ${bet > maxBalance ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                                    >
                                        {bet}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <button
                                    onClick={handleConfirm}
                                    disabled={!!error || amount <= 0}
                                    className={`
                    w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all
                    ${!error && amount > 0
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:brightness-110 active:scale-95'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }
                  `}
                                >
                                    <DollarSign className="w-5 h-5" />
                                    Proposer le pari
                                </button>
                                <p className={`text-center text-[10px] ${themeColors.textMuted} mt-4`}>
                                    Le montant sera bloqué jusqu'à la fin de la partie.
                                    <br />Le gagnant remporte tout le pot.
                                </p>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
