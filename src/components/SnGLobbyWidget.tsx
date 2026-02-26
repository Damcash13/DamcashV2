import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Zap, Trophy, Play, Diamond, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../api/tournamentAPI';

interface SnGTier {
    id: string;
    name: string;
    fee: number;
    prize: number;
    maxPlayers: number;
    currentPlayers: number;
    color: string;
    icon: React.ElementType;
}

interface SnGLobbyWidgetProps {
    onJoin: (tierId: string) => void;
}

export default function SnGLobbyWidget({ onJoin }: SnGLobbyWidgetProps) {
    const { themeColors, gameType } = useTheme();
    const { user } = useAuth();

    const [sngs, setSngs] = useState<SnGTier[]>([]);

    useEffect(() => {
        const fetchSNGs = async () => {
            try {
                const data = await tournamentAPI.getTournaments();
                const activeSngs = data.filter(t => t.type === 'SNG' && (t.status === 'upcoming' || t.status === 'created') && t.gameType === gameType);

                const mapped: SnGTier[] = activeSngs.map(t => {
                    let color = 'from-gray-300/20 to-slate-400/20';
                    let icon = Zap;
                    if (t.name.includes('Bronze')) { color = 'from-[#CD7F32]/20 to-[#A0522D]/20'; icon = Target; }
                    else if (t.name.includes('Argent')) { color = 'from-gray-300/20 to-slate-400/20'; icon = Zap; }
                    else if (t.name.includes('Or')) { color = 'from-yellow-400/20 to-amber-600/20'; icon = Trophy; }
                    else if (t.name.includes('Platine')) { color = 'from-blue-300/20 to-cyan-500/20'; icon = Star; }
                    else if (t.name.includes('Diamant')) { color = 'from-fuchsia-400/20 to-purple-600/20'; icon = Diamond; }

                    return {
                        id: t.id,
                        name: t.name,
                        fee: t.entryFee || 0,
                        prize: t.prizePool || 0,
                        maxPlayers: t.maxPlayers || 4,
                        currentPlayers: t.players?.length || 0,
                        color,
                        icon
                    };
                });

                // Sort by fee
                setSngs(mapped.sort((a, b) => a.fee - b.fee));
            } catch (error) {
                console.error("Failed to fetch SNGs:", error);
            }
        };

        fetchSNGs();
        const interval = setInterval(fetchSNGs, 10000);
        return () => clearInterval(interval);
    }, [gameType]);

    return (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: themeColors.border }}>
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: themeColors.hover }}>
                        <Play size={20} style={{ color: themeColors.accent }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: themeColors.text }}>Salons Sit & Go</h3>
                        <p className="text-xs" style={{ color: themeColors.textMuted }}>
                            Démarrage automatique quand la table est pleine
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto style-scrollbar">
                {sngs.length === 0 && (
                    <div className="col-span-full text-center py-8 opacity-50">
                        Recherche de salons disponibles...
                    </div>
                )}
                {sngs.map((tier) => {
                    const progress = (tier.currentPlayers / tier.maxPlayers) * 100;
                    const canAfford = (user?.coins || 0) >= tier.fee;

                    return (
                        <motion.div
                            key={tier.id}
                            whileHover={{ scale: 1.02 }}
                            className={`relative rounded-xl border p-4 flex flex-col justify-between bg-gradient-to-br ${tier.color}`}
                            style={{ borderColor: themeColors.border }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <tier.icon size={18} style={{ color: themeColors.text }} />
                                    <span className="font-bold" style={{ color: themeColors.text }}>{tier.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-yellow-500">
                                        Prix: {tier.prize.toLocaleString()} 💰
                                    </div>
                                    <div className="text-xs" style={{ color: themeColors.textMuted }}>
                                        Entrée: {tier.fee} coins
                                    </div>
                                </div>
                            </div>

                            {/* Circular/Bar Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span style={{ color: themeColors.textMuted }}>Joueurs:</span>
                                    <span className="font-bold" style={{ color: themeColors.text }}>
                                        {tier.currentPlayers} / {tier.maxPlayers}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: themeColors.hover }}>
                                    <div
                                        className="h-full bg-green-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={() => onJoin(tier.id)}
                                disabled={!canAfford}
                                className={`w-full py-2 rounded-lg font-bold transition-colors flex justify-center items-center gap-2 ${canAfford
                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50 text-gray-300'
                                    }`}
                            >
                                <Play size={16} />
                                {canAfford ? 'Rejoindre Table' : 'Fonds Insuffisants'}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
