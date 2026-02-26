import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, XCircle, RotateCcw, Home } from 'lucide-react'
import { SeriesState } from '../../contexts/SeriesContext'

interface GameEndOverlayProps {
    winner: 'white' | 'black' | 'draw'
    isSelfWinner: boolean
    ratingChange?: number
    onRematch: () => void
    onExit: () => void
    show: boolean
    themeColors: any
    series?: SeriesState | null // Add series prop
}

export default function GameEndOverlay({
    winner,
    isSelfWinner,
    ratingChange,
    onRematch,
    onExit,
    show,
    themeColors,
    series // Destructure series
}: GameEndOverlayProps) {
    if (!show) return null

    // Animation variants
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    const cardVariants = {
        hidden: { scale: 0.5, opacity: 0, y: 50 },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 15,
                stiffness: 200,
                delay: 0.1
            }
        }
    }

    const iconVariants = {
        hidden: { scale: 0, rotate: -180 },
        visible: {
            scale: 1,
            rotate: 0,
            transition: {
                type: 'spring',
                damping: 10,
                stiffness: 150,
                delay: 0.3
            }
        }
    }

    const isDraw = winner === 'draw'

    return (
        <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
            <motion.div
                variants={cardVariants}
                className={`${themeColors.card} p-1 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden relative border ${themeColors.border}`}
            >
                {/* Background Gradients/Effects */}
                <div className={`absolute inset-0 opacity-10 ${isDraw ? 'bg-gray-500' :
                    isSelfWinner ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />

                {/* Confetti/Particles simulated via CSS (if wanted later) */}

                <div className="bg-[#121212] rounded-[22px] p-8 relative z-10 h-full flex flex-col items-center text-center">

                    <motion.div variants={iconVariants} className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg ${isDraw ? 'bg-gray-800 text-gray-400' :
                        isSelfWinner ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-yellow-500/20' :
                            'bg-red-900/30 text-red-500'
                        }`}>
                        {isDraw ? <RotateCcw className="w-12 h-12" /> :
                            isSelfWinner ? <Trophy className="w-12 h-12" /> :
                                <XCircle className="w-12 h-12" />}
                    </motion.div>

                    <h2 className={`text-4xl font-black italic uppercase tracking-tight mb-2 ${themeColors.text}`}>
                        {isDraw ? 'MATCH NUL' :
                            isSelfWinner ? 'VICTOIRE !' : 'DÉFAITE'}
                    </h2>

                    <p className="text-sm opacity-60 mb-8 font-medium">
                        {isDraw ? 'Égalité parfaite' :
                            isSelfWinner ? 'Bien joué, Champion !' : 'Ne lâchez rien.'}
                    </p>

                    {/* Rating Change / Series Info */}
                    {series && series.isActive ? (
                        <div className="mb-8">
                            <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Série en cours ({series.currentGameNumber}/{series.totalGames})</p>
                            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                                <span className={series.scores.me > series.scores.opponent ? 'text-green-500' : ''}>{series.scores.me}</span>
                                <span className="text-gray-500">-</span>
                                <span className={series.scores.opponent > series.scores.me ? 'text-green-500' : ''}>{series.scores.opponent}</span>
                            </div>
                        </div>
                    ) : (
                        ratingChange !== undefined && (
                            <div className={`mb-8 text-2xl font-mono font-bold ${ratingChange > 0 ? 'text-green-500' : ratingChange < 0 ? 'text-red-500' : 'text-gray-500'
                                }`}>
                                {ratingChange > 0 ? '+' : ''}{ratingChange}
                            </div>
                        )
                    )}

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onExit}
                            className={`flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-wider border border-white/10 hover:bg-white/5 active:scale-95 transition-all flex flex-col items-center gap-1 ${themeColors.text}`}
                        >
                            <Home className="w-4 h-4 mb-1" />
                            {series && series.isActive ? 'Abandonner' : 'Accueil'}
                        </button>

                        <button
                            onClick={onRematch}
                            className={`flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center gap-1 ${isSelfWinner ? 'bg-yellow-500 text-black hover:bg-yellow-400' : themeColors.buttonPrimary
                                }`}
                        >
                            <RotateCcw className="w-4 h-4 mb-1" />
                            {series && series.isActive ? 'Match Suivant' : 'Rejouer'}
                        </button>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    )
}
