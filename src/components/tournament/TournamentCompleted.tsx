import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Crown, TrendingUp, Zap, Clock, Target, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import UserPopover from '../user/UserPopover'

interface Participant {
    id: string
    rank: number
    username: string
    items?: string // For avatar styling if needed
    elo: number
    tier: string
    score: number
    wins: number
    losses: number
    draws: number
    performance?: number
    berserkRate?: number
    // Extended fields for popover
    avatarUrl?: string
    country?: string
    bio?: string
    eloChess?: number
    eloCheckers?: number
}

interface TournamentCompletedProps {
    participants: Participant[]
    tournamentName: string
    totalPlayers: number
    averageElo: number
}

export default function TournamentCompleted({ participants, tournamentName, totalPlayers, averageElo }: TournamentCompletedProps) {
    const { themeColors } = useTheme()
    const [showAllStats, setShowAllStats] = useState(false)

    const top3 = participants.filter(p => p.rank <= 3).sort((a, b) => a.rank - b.rank)
    const winner = top3.find(p => p.rank === 1)
    const second = top3.find(p => p.rank === 2)
    const third = top3.find(p => p.rank === 3)
    const others = participants.filter(p => p.rank > 3).sort((a, b) => a.rank - b.rank)

    const getPopoverUser = (p: Participant) => ({
        username: p.username,
        avatar: p.avatarUrl,
        country: p.country,
        bio: p.bio,
        eloCheckers: p.eloCheckers || p.elo,
        eloChess: p.eloChess
    })

    return (
        <div className="space-y-8">
            {/* Title */}
            <div className="text-center space-y-2">
                <h2 className={`text-2xl font-display font-medium ${themeColors.textMuted}`}>Tournoi terminé</h2>
                <motion.h1
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-4xl md:text-5xl font-display font-bold ${themeColors.accent}`}
                >
                    {tournamentName}
                </motion.h1>
            </div>

            {/* Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 py-8 min-h-[400px]">

                {/* 2nd Place */}
                {second && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 max-w-[280px]"
                    >
                        <div className="relative mb-4">
                            <Trophy className="w-24 h-24 text-gray-300 drop-shadow-[0_0_15px_rgba(209,213,219,0.3)]" />
                            <div className="absolute -top-2 -right-2 bg-gray-700 text-gray-300 font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-600">
                                2
                            </div>
                        </div>
                        <div className={`w-full ${themeColors.card} rounded-xl p-6 text-center border-t-4 border-gray-400 shadow-card`}>
                            <UserPopover user={getPopoverUser(second)}>
                                <h3 className={`text-xl font-bold ${themeColors.text} mb-1 truncate cursor-pointer hover:text-blue-400 transition-colors`}>{second.username}</h3>
                            </UserPopover>
                            <div className={`text-2xl font-bold ${themeColors.accent} mb-4`}>{second.score} <span className="text-sm font-normal text-gray-500">pts</span></div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Performance</span>
                                    <span className={`font-mono ${themeColors.text}`}>{second.performance || second.elo + 50}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Victoires</span>
                                    <span className="font-mono text-green-500">{Math.round((second.wins / (second.wins + second.losses + second.draws)) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 1st Place */}
                {winner && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 max-w-[320px] -mt-12 md:-mt-20 z-10"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
                            <Trophy className="relative w-32 h-32 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                            <div className="absolute -top-2 -right-2 bg-yellow-600 text-yellow-100 font-bold w-10 h-10 rounded-full flex items-center justify-center border-2 border-yellow-400 text-xl shadow-lg">
                                1
                            </div>
                        </div>
                        <div className={`w-full ${themeColors.card} rounded-2xl p-8 text-center border-t-4 border-yellow-400 shadow-2xl transform md:scale-110`}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                            </div>
                            <UserPopover user={getPopoverUser(winner)}>
                                <h3 className={`text-2xl font-bold ${themeColors.text} mb-1 truncate cursor-pointer hover:text-blue-400 transition-colors`}>{winner.username}</h3>
                            </UserPopover>
                            <div className={`text-4xl font-bold ${themeColors.accent} mb-6`}>{winner.score} <span className="text-base font-normal text-gray-500">pts</span></div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                                    <span className={themeColors.textMuted}>Performance</span>
                                    <span className={`font-mono font-bold ${themeColors.text} text-lg`}>{winner.performance || winner.elo + 100}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Victoires</span>
                                    <span className="font-mono text-green-500">{Math.round((winner.wins / (winner.wins + winner.losses + winner.draws)) * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Berserk</span>
                                    <span className="font-mono text-orange-500">{winner.berserkRate || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3rd Place */}
                {third && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="order-3 flex flex-col items-center w-full md:w-1/3 max-w-[280px]"
                    >
                        <div className="relative mb-4">
                            <Trophy className="w-24 h-24 text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]" />
                            <div className="absolute -top-2 -right-2 bg-orange-800 text-orange-200 font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-orange-600">
                                3
                            </div>
                        </div>
                        <div className={`w-full ${themeColors.card} rounded-xl p-6 text-center border-t-4 border-orange-500 shadow-card`}>
                            <UserPopover user={getPopoverUser(third)}>
                                <h3 className={`text-xl font-bold ${themeColors.text} mb-1 truncate cursor-pointer hover:text-blue-400 transition-colors`}>{third.username}</h3>
                            </UserPopover>
                            <div className={`text-2xl font-bold ${themeColors.accent} mb-4`}>{third.score} <span className="text-sm font-normal text-gray-500">pts</span></div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Performance</span>
                                    <span className={`font-mono ${themeColors.text}`}>{third.performance || third.elo + 20}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Victoires</span>
                                    <span className="font-mono text-green-500">{Math.round((third.wins / (third.wins + third.losses + third.draws)) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rankings Table */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className={`text-xl font-semibold ${themeColors.text} flex items-center gap-2`}>
                        <Shield className="w-5 h-5 text-gray-400" />
                        Classement complet
                    </h3>

                    <div className={`${themeColors.card} rounded-xl overflow-hidden shadow-card border border-white/5`}>
                        <div className={`grid grid-cols-12 gap-2 px-4 py-3 ${themeColors.background} border-b border-white/10 text-sm font-medium ${themeColors.textMuted}`}>
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-1"></div> { /* Rank change icon */}
                            <div className="col-span-5 md:col-span-4">Joueur</div>
                            <div className="col-span-2 text-center">Score</div>
                            <div className="col-span-2 text-center hidden md:block">Perf</div>
                            <div className="col-span-2 text-center hidden md:block">Berserk</div>
                        </div>

                        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                            {others.map((player) => (
                                <div key={player.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:${themeColors.hover} transition-colors text-sm`}>
                                    <div className="col-span-1 text-center font-bold text-gray-500">{player.rank}</div>
                                    <div className="col-span-1 text-center">
                                        { /* Random rank change for visual */}
                                        {player.rank % 3 === 0 ? <span className="text-green-500 text-xs">▲</span> :
                                            player.rank % 3 === 1 ? <span className="text-red-500 text-xs">▼</span> :
                                                <span className="text-gray-600 text-xs">-</span>}
                                    </div>
                                    <div className="col-span-5 md:col-span-4 font-medium text-white truncate flex items-center gap-2">
                                        <UserPopover user={getPopoverUser(player)} align="left">
                                            <div className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-6 h-6 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center text-xs`}>
                                                    {player.avatarUrl ? (
                                                        <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        player.username[0]
                                                    )}
                                                </div>
                                                <span className="group-hover:text-blue-400 transition-colors">{player.username}</span>
                                                <span className={`text-xs ${themeColors.textMuted} font-normal group-hover:text-blue-300`}>({player.elo})</span>
                                            </div>
                                        </UserPopover>
                                    </div>
                                    <div className={`col-span-2 text-center font-bold ${themeColors.accent}`}>{player.score}</div>
                                    <div className="col-span-2 text-center hidden md:block text-gray-400 font-mono">{player.performance || player.elo}</div>
                                    <div className="col-span-2 text-center hidden md:block text-orange-400/70 font-mono">{player.berserkRate || 0}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tournament Stats */}
                <div className="space-y-4">
                    <h3 className={`text-xl font-semibold ${themeColors.text} flex items-center gap-2`}>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        Statistiques
                    </h3>

                    <div className={`${themeColors.card} rounded-xl p-6 shadow-card border border-white/5 space-y-6`}>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">ELO Moyen</div>
                            <div className="text-3xl font-bold text-white font-mono">{Math.round(averageElo)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Parties jouées</div>
                                <div className="text-xl font-bold text-white">{Math.floor(totalPlayers * 3.5)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Coups joués</div>
                                <div className="text-xl font-bold text-white">{(totalPlayers * 3.5 * 40).toLocaleString()}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 mb-2">Résultats</div>
                            <div className="flex h-4 rounded-full overflow-hidden w-full">
                                <div className="bg-white/90 h-full" style={{ width: '43%' }} title="Victoires Blancs"></div>
                                <div className="bg-white/30 h-full" style={{ width: '16%' }} title="Nulles"></div>
                                <div className="bg-white/10 h-full" style={{ width: '42%' }} title="Victoires Noirs"></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-gray-400">
                                <span>43% Blancs</span>
                                <span>16% Nulles</span>
                                <span>42% Noirs</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-xs text-gray-500">Taux de Berserk</div>
                                <div className="text-xs font-bold text-orange-400">2%</div>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '2%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
