import React from 'react'
import { Trophy, Crown } from 'lucide-react'

interface LeaderboardWidgetProps {
    themeColors: any
    t: (key: string) => string
}

export default function LeaderboardWidget({ themeColors, t }: LeaderboardWidgetProps) {

    const topPlayers = [
        { name: 'DrNykterstein', rating: 2843, rank: 1 },
        { name: 'Alireza2003', rating: 2802, rank: 2 },
        { name: 'Hikaru', rating: 2795, rank: 3 },
        { name: 'FabiCaruana', rating: 2788, rank: 4 },
        { name: 'NepoChess', rating: 2773, rank: 5 },
    ]

    const tournaments = [
        { time: '15:00', name: 'Bullet Arena', winner: 'Penguingm1' },
        { time: '16:00', name: 'Blitz Titled', winner: 'MagnusCarlsen' },
        { time: '17:00', name: 'Rapid Shield', winner: 'Nodirbek' },
        { time: '18:00', name: 'Hourly Super', winner: 'Danya' },
        { time: '19:00', name: 'Daily Classical', winner: 'AnishGiri' },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <div className={`${themeColors.card} border ${themeColors.border} rounded-lg overflow-hidden`}>
                <div className={`p-3 border-b ${themeColors.border} flex justify-between items-center bg-opacity-50 bg-black/5`}>
                    <h3 className={`font-medium ${themeColors.text} flex items-center gap-2`}>
                        <Trophy className="w-4 h-4" /> {t('home.leaderboard')}
                    </h3>
                    <span className="text-xs text-blue-500 cursor-pointer hover:underline">{t('common.more')}</span>
                </div>
                <div className="divide-y divide-opacity-10" style={{ borderColor: themeColors.border }}>
                    {topPlayers.map(player => (
                        <div key={player.name} className={`p-2 px-3 flex items-center justify-between text-sm ${themeColors.cardHover}`}>
                            <div className="flex items-center gap-2">
                                <span className="w-4 text-xs font-bold opacity-50">#{player.rank}</span>
                                <span className={`${themeColors.text}`}>{player.name}</span>
                            </div>
                            <span className="font-mono font-bold opacity-80">{player.rating}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tournament Winners */}
            <div className={`${themeColors.card} border ${themeColors.border} rounded-lg overflow-hidden`}>
                <div className={`p-3 border-b ${themeColors.border} flex justify-between items-center bg-opacity-50 bg-black/5`}>
                    <h3 className={`font-medium ${themeColors.text} flex items-center gap-2`}>
                        <Crown className="w-4 h-4" /> {t('common.tournaments')}
                    </h3>
                    <span className="text-xs text-blue-500 cursor-pointer hover:underline">{t('common.more')}</span>
                </div>
                <div className="divide-y divide-opacity-10" style={{ borderColor: themeColors.border }}>
                    {tournaments.map((t, i) => (
                        <div key={i} className={`p-2 px-3 flex items-center justify-between text-sm ${themeColors.cardHover}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xs font-mono opacity-50 flex-shrink-0">{t.time}</span>
                                <span className={`${themeColors.text} truncate`}>{t.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                <span className="opacity-80 truncate max-w-[80px]">{t.winner}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
