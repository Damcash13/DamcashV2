import { motion } from 'framer-motion'
import { Play, Zap } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { TournamentPairing } from '../../hooks/useTournament'

interface PairingCardProps {
    pairing: TournamentPairing
    myUserId: string
    opponentName: string
    opponentRating: number
    allowBerserk: boolean
    onPlay: () => void
    onBerserk?: () => void
}

export default function PairingCard({
    pairing,
    myUserId,
    opponentName,
    opponentRating,
    allowBerserk,
    onPlay,
    onBerserk
}: PairingCardProps) {
    const { themeColors } = useTheme()

    const isWhite = pairing.whiteId === myUserId
    const myColor = isWhite ? 'Blancs' : 'Noirs'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${themeColors.card} rounded-xl border-2 border-green-500/50 p-6 shadow-xl shadow-green-500/20`}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={`text-xl font-bold ${themeColors.text} mb-1`}>
                        Votre Appariement
                    </h3>
                    <p className={`text-sm ${themeColors.textMuted}`}>
                        Vous jouez les {myColor}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-green-500" />
                </div>
            </div>

            <div className={`${themeColors.cardHover} rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className={`font-bold ${themeColors.text} text-lg`}>{opponentName}</div>
                        <div className={`text-sm ${themeColors.textMuted}`}>Rating: {opponentRating}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-full ${isWhite ? 'bg-gray-800' : 'bg-gray-200'} border-2 ${themeColors.border}`} />
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onPlay}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                    <Play size={20} />
                    JOUER
                </button>

                {allowBerserk && onBerserk && (
                    <button
                        onClick={onBerserk}
                        className="px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-orange-500/30"
                        title="Berserk: Divise votre temps par 2, +1 point si victoire"
                    >
                        <Zap size={20} />
                    </button>
                )}
            </div>

            {allowBerserk && (
                <p className="text-xs text-center mt-3 text-orange-400">
                    ⚡ Berserk: Temps divisé par 2, +1 point bonus si victoire
                </p>
            )}
        </motion.div>
    )
}
