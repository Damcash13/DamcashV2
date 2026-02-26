import { motion } from 'framer-motion'
import { Crown, Flame } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { TournamentStanding } from '../../hooks/useTournament'

interface StandingsTableProps {
    standings: TournamentStanding[]
    currentUserId?: string
    compact?: boolean
}

export default function StandingsTable({ standings, currentUserId, compact = false }: StandingsTableProps) {
    const { themeColors } = useTheme()

    const getPerformanceColor = (perf: number) => {
        if (perf >= 2200) return 'text-purple-400'
        if (perf >= 2000) return 'text-blue-400'
        if (perf >= 1800) return 'text-green-400'
        if (perf >= 1500) return 'text-yellow-400'
        return 'text-orange-400'
    }

    return (
        <div className={`${themeColors.card} rounded-xl border ${themeColors.border} overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${themeColors.border} flex items-center justify-between`}>
                <span className={`font-bold ${themeColors.text}`}>Classement</span>
                <span className={`text-sm ${themeColors.textMuted}`}>{standings.length} joueurs</span>
            </div>

            {/* Header */}
            <div className={`grid ${compact ? 'grid-cols-8' : 'grid-cols-12'} gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold border-b ${themeColors.border} ${themeColors.textMuted}`}>
                <div className="col-span-1">#</div>
                <div className={compact ? 'col-span-3' : 'col-span-4'}>Joueur</div>
                {!compact && <div className="col-span-2 text-center">Rating</div>}
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-1 text-center">GP</div>
                {!compact && <div className="col-span-2 text-center">Perf</div>}
            </div>

            {/* Standings */}
            <div className="max-h-[600px] overflow-y-auto">
                {standings.map((standing, idx) => (
                    <motion.div
                        key={standing.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`grid ${compact ? 'grid-cols-8' : 'grid-cols-12'} gap-2 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${standing.userId === currentUserId ? 'bg-blue-500/10' : ''
                            } ${standing.isPlaying ? 'bg-green-500/5' : ''}`}
                    >
                        {/* Rank */}
                        <div className={`col-span-1 font-bold ${themeColors.text} flex items-center gap-1`}>
                            {standing.rank}
                            {standing.rank <= 3 && (
                                <Crown className={`w-3 h-3 ${standing.rank === 1 ? 'text-yellow-400' :
                                        standing.rank === 2 ? 'text-gray-300' :
                                            'text-amber-600'
                                    }`} />
                            )}
                        </div>

                        {/* Username */}
                        <div className={`${compact ? 'col-span-3' : 'col-span-4'} flex items-center gap-2`}>
                            <span className={`font-medium ${themeColors.text} truncate`}>{standing.username}</span>
                            {standing.onFire && <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
                            {standing.isPlaying && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                        </div>

                        {/* Rating */}
                        {!compact && (
                            <div className={`col-span-2 text-center ${themeColors.textMuted}`}>
                                {standing.rating}
                            </div>
                        )}

                        {/* Score */}
                        <div className={`col-span-2 text-center font-bold ${themeColors.text}`}>
                            {standing.score}
                        </div>

                        {/* Games Played */}
                        <div className={`col-span-1 text-center text-xs ${themeColors.textMuted}`}>
                            {standing.games}
                        </div>

                        {/* Performance */}
                        {!compact && (
                            <div className={`col-span-2 text-center font-mono ${getPerformanceColor(standing.performance)}`}>
                                {standing.performance > 0 ? standing.performance.toFixed(0) : '-'}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
