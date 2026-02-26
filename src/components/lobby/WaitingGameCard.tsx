import { motion } from 'framer-motion'
import { Clock, Coins, Swords, Trophy } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { WaitingGame } from '../../types/lobby'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Username from '../Username'

interface WaitingGameCardProps {
    game: WaitingGame
    onJoin: (gameId: string) => void
}

const tierColors: Record<string, string> = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-cyan-400 to-cyan-600',
    diamond: 'from-purple-400 to-purple-600',
    master: 'from-red-500 to-pink-600'
}

const tierIcons: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
    diamond: '👑',
    master: '🏆'
}

const modeColors = {
    casual: 'from-blue-400 to-blue-600',
    rated: 'from-orange-400 to-orange-600',
    wager: 'from-yellow-400 to-yellow-600'
}

const modeLabels = {
    casual: 'Amical',
    rated: 'Classé',
    wager: 'Paris'
}

export default function WaitingGameCard({ game, onJoin }: WaitingGameCardProps) {
    const { themeColors } = useTheme()

    const timeAgo = formatDistanceToNow(new Date(game.createdAt), {
        addSuffix: true,
        locale: fr
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.01 }}
            className={`${themeColors.card} rounded-xl p-4 border ${themeColors.border} hover:${themeColors.cardHover} transition-all cursor-pointer`}
        >
            <div className="flex items-center justify-between">
                {/* Left: Player Info */}
                <div className="flex items-center gap-3 flex-1">
                    {/* Avatar with tier badge */}
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tierColors[game.creatorTier]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                            {game.creatorName[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-xs">
                            {tierIcons[game.creatorTier]}
                        </div>
                    </div>

                    {/* Player Details */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Username
                                userId={game.creatorId}
                                username={game.creatorName}
                                elo={game.creatorElo}
                                title={game.creatorTier.toUpperCase()}
                                className={`font-bold ${themeColors.text}`}
                            />
                            <span className={`text-sm px-2 py-0.5 rounded ${themeColors.textMuted} bg-white/5`}>
                                {game.creatorElo}
                            </span>
                        </div>

                        {/* Game Parameters */}
                        <div className="flex items-center gap-3 text-sm">
                            {/* Time Control */}
                            <div className="flex items-center gap-1 text-blue-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-medium">{game.timeControl}</span>
                            </div>

                            {/* Variant */}
                            <div className="flex items-center gap-1 text-purple-400">
                                <Trophy className="w-3.5 h-3.5" />
                                <span className="font-medium">{game.variant}</span>
                            </div>

                            {/* Wager (if applicable) */}
                            {game.mode === 'wager' && game.wagerAmount && (
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Coins className="w-3.5 h-3.5" />
                                    <span className="font-medium">{game.wagerAmount}🪙</span>
                                </div>
                            )}

                            {/* Mode Badge */}
                            <div className={`px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${modeColors[game.mode]} text-white`}>
                                {modeLabels[game.mode]}
                            </div>
                        </div>

                        {/* Time ago */}
                        <div className={`text-xs ${themeColors.textMuted} mt-1`}>
                            Créée {timeAgo}
                        </div>
                    </div>
                </div>

                {/* Right: Join Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onJoin(game.id)}
                    className={`px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all`}
                    style={{ backgroundColor: themeColors.accent }}
                >
                    <Swords className="w-5 h-5" />
                    Rejoindre
                </motion.button>
            </div>
        </motion.div>
    )
}
