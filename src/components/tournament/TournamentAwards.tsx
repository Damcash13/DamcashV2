import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Crown } from 'lucide-react'
import { TournamentStanding } from '../../hooks/useTournament'

interface TournamentAwardsProps {
    standings: TournamentStanding[]
    tournamentName: string
    onClose: () => void
    show: boolean
    themeColors: any
}

export default function TournamentAwards({
    standings,
    tournamentName,
    onClose,
    show,
    themeColors
}: TournamentAwardsProps) {
    if (!show || standings.length === 0) return null

    const top3 = standings.slice(0, 3)

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.8 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200 } }
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-tighter mb-4">
                        Podium
                    </h2>
                    <p className={`text-xl ${themeColors.textMuted}`}>{tournamentName}</p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 w-full"
                >
                    {/* 2nd Place */}
                    {top3[1] && (
                        <motion.div variants={itemVariants} className="flex flex-col items-center order-2 md:order-1">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-400 shadow-[0_0_30px_rgba(200,200,200,0.3)]">
                                    <span className="text-3xl font-bold text-gray-600">2</span>
                                </div>
                                <Medal className="absolute -bottom-2 -right-2 text-gray-400 w-10 h-10 drop-shadow-lg" />
                            </div>
                            <div className={`bg-gray-800/80 p-6 rounded-2xl w-48 text-center border border-gray-600`}>
                                <div className="font-bold text-white truncate text-lg">{top3[1].username}</div>
                                <div className="text-gray-400 text-sm mb-2">{top3[1].rating} ELO</div>
                                <div className="font-mono font-bold text-2xl text-gray-300">{top3[1].score} pts</div>
                            </div>
                        </motion.div>
                    )}

                    {/* 1st Place */}
                    {top3[0] && (
                        <motion.div variants={itemVariants} className="flex flex-col items-center order-1 md:order-2 z-10 -mb-8 md:mb-12">
                            <div className="relative mb-6">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                    <Crown className="w-16 h-16 text-yellow-400 animate-bounce" fill="currentColor" />
                                </div>
                                <div className="w-32 h-32 rounded-full bg-yellow-400 flex items-center justify-center border-4 border-yellow-200 shadow-[0_0_50px_rgba(250,204,21,0.5)]">
                                    <span className="text-5xl font-bold text-yellow-800">1</span>
                                </div>
                                <Trophy className="absolute -bottom-2 -right-2 text-yellow-500 w-12 h-12 drop-shadow-lg" fill="currentColor" />
                            </div>
                            <div className={`bg-gradient-to-b from-yellow-900/80 to-black/80 p-8 rounded-2xl w-64 text-center border border-yellow-600 shadow-2xl`}>
                                <div className="font-bold text-white truncate text-2xl mb-1">{top3[0].username}</div>
                                <div className="text-yellow-400/80 font-bold text-sm mb-3">CHAMPION</div>
                                <div className="font-mono font-black text-4xl text-yellow-400">{top3[0].score} pts</div>
                                <div className="mt-4 text-xs text-yellow-200/50 uppercase tracking-widest">Performance {top3[0].performance}</div>
                            </div>
                        </motion.div>
                    )}

                    {/* 3rd Place */}
                    {top3[2] && (
                        <motion.div variants={itemVariants} className="flex flex-col items-center order-3 md:order-3">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full bg-orange-700 flex items-center justify-center border-4 border-orange-500 shadow-[0_0_30px_rgba(194,65,12,0.3)]">
                                    <span className="text-3xl font-bold text-orange-200">3</span>
                                </div>
                                <Medal className="absolute -bottom-2 -right-2 text-orange-600 w-10 h-10 drop-shadow-lg" />
                            </div>
                            <div className={`bg-gray-800/80 p-6 rounded-2xl w-48 text-center border border-orange-900`}>
                                <div className="font-bold text-white truncate text-lg">{top3[2].username}</div>
                                <div className="text-gray-400 text-sm mb-2">{top3[2].rating} ELO</div>
                                <div className="font-mono font-bold text-2xl text-orange-400">{top3[2].score} pts</div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 1.5 } }}
                    onClick={onClose}
                    className="mt-20 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full font-bold uppercase tracking-widest text-sm transition-all border border-white/20"
                >
                    Fermer
                </motion.button>
            </div>
        </div>
    )
}
