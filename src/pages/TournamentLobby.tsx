import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ChevronLeft, Users, Wifi, Clock } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTournament } from '../hooks/useTournament'
import StandingsTable from '../components/tournament/StandingsTable'

export default function TournamentLobby() {
    const { tournamentId } = useParams()
    const navigate = useNavigate()
    const { themeColors, gameType } = useTheme()
    const { user } = useAuth()
    const { showToast } = useToast()

    const {
        tournament,
        standings,
        myPlayer,
        isConnected,
        isLoading,
        error,
        joinTournament,
        leaveTournament,
        getTimeRemaining
    } = useTournament(tournamentId || '', user?.id)

    useEffect(() => {
        if (error) {
            showToast('Erreur', 'error', error)
        }
    }, [error, showToast])

    // Auto-redirect to active page when tournament starts
    useEffect(() => {
        if (tournament?.status === 'ongoing') {
            navigate(`/tournament/${tournamentId}`)
        }
    }, [tournament?.status, tournamentId, navigate])

    const handleJoin = async () => {
        if (!user) {
            showToast('Erreur', 'error', 'Vous devez être connecté')
            return
        }

        const rating = gameType === 'checkers' ? user.eloCheckers : user.eloChess
        const success = await joinTournament(user.username, rating)

        if (success) {
            showToast('Inscription réussie !', 'success', `Vous êtes inscrit au tournoi`)
        } else {
            showToast('Erreur', 'error', 'Impossible de rejoindre le tournoi')
        }
    }

    const handleLeave = async () => {
        const success = await leaveTournament()

        if (success) {
            showToast('Désinscription', 'info', 'Vous vous êtes désinscrit du tournoi')
        } else {
            showToast('Erreur', 'error', 'Impossible de quitter le tournoi')
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className={`text-xl ${themeColors.text}`}>Chargement...</div>
            </div>
        )
    }

    if (!tournament) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className={`text-xl ${themeColors.text}`}>Tournoi introuvable</div>
            </div>
        )
    }

    const timeRemaining = getTimeRemaining()
    const isJoined = !!myPlayer

    return (
        <div className={`min-h-screen ${themeColors.background} pb-20 md:pb-8`}>
            <div className="max-w-[1400px] mx-auto p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/tournaments')}
                        className={`p-2 rounded-lg ${themeColors.card} border ${themeColors.border} hover:bg-white/5 transition-colors`}
                    >
                        <ChevronLeft className={`w-5 h-5 ${themeColors.text}`} />
                    </button>

                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className={`text-2xl font-bold ${themeColors.text} flex items-center gap-2`}>
                                <Trophy className="w-6 h-6 text-orange-500" />
                                {tournament.name}
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <Wifi className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-gray-500'}`} />
                                <span className="text-xs text-gray-400">
                                    {isConnected ? 'Live' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <p className={`text-sm ${themeColors.textMuted}`}>
                            {tournament.variant} • {tournament.rated ? 'Rated' : 'Casual'} • {tournament.gameType === 'checkers' ? 'Dames' : 'Échecs'}
                        </p>
                    </div>

                    <div className={`text-3xl font-bold font-mono ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                        {formatTime(timeRemaining)}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Sidebar - Tournament Info */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className={`${themeColors.card} rounded-xl p-4 border ${themeColors.border}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: themeColors.accent }}>
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className={`font-bold`} style={{ color: themeColors.text }}>{tournament.variant}</p>
                                    <p className={`text-xs ${themeColors.textMuted}`}>
                                        {tournament.rated ? 'Rated' : 'Casual'} • Arena
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className={themeColors.textMuted}>Durée:</span>
                                    <span className={`font-medium`} style={{ color: themeColors.text }}>{tournament.duration} min</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className={themeColors.textMuted}>Joueurs:</span>
                                    <span className={`font-medium`} style={{ color: themeColors.text }}>
                                        {tournament.players.length}
                                        {tournament.maxPlayers && `/${tournament.maxPlayers}`}
                                    </span>
                                </div>
                                {tournament.minRating && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={themeColors.textMuted}>Rating min:</span>
                                        <span className={`font-medium`} style={{ color: themeColors.text }}>{tournament.minRating}</span>
                                    </div>
                                )}
                                {tournament.allowBerserk && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={themeColors.textMuted}>Berserk:</span>
                                        <span className={`font-medium text-orange-500`}>⚡ Activé</span>
                                    </div>
                                )}
                            </div>

                            {!isJoined ? (
                                <button
                                    onClick={handleJoin}
                                    className={`w-full py-3 rounded-lg font-bold text-white hover:brightness-110 transition-all`}
                                    style={{ backgroundColor: themeColors.accent }}
                                >
                                    S'INSCRIRE
                                </button>
                            ) : (
                                <button
                                    onClick={handleLeave}
                                    className="w-full py-3 rounded-lg font-bold bg-red-500 hover:bg-red-600 text-white transition-all"
                                >
                                    SE DÉSINSCRIRE
                                </button>
                            )}
                        </div>

                        {/* Countdown */}
                        <div className={`${themeColors.card} rounded-xl p-4 border ${themeColors.border}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className={`w-5 h-5 ${themeColors.textMuted}`} />
                                <span className={`text-sm font-medium ${themeColors.text}`}>Démarre dans</span>
                            </div>
                            <div className={`text-4xl font-bold font-mono text-center ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-orange-500'
                                }`}>
                                {formatTime(timeRemaining)}
                            </div>
                            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${timeRemaining < 60 ? 'bg-red-500' : 'bg-orange-500'
                                        }`}
                                    style={{ width: `${Math.min(100, (timeRemaining / 600) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Center - Participants */}
                    <div className="lg:col-span-6">
                        <StandingsTable
                            standings={standings}
                            currentUserId={user?.id}
                        />
                    </div>

                    {/* Right Sidebar - Info */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4`}>
                            <h3 className={`text-sm font-bold ${themeColors.text} mb-3 flex items-center gap-2`}>
                                <Users className="w-4 h-4" />
                                Statistiques
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Participants:</span>
                                    <span className={`font-medium ${themeColors.text}`}>{tournament.players.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Parties totales:</span>
                                    <span className={`font-medium ${themeColors.text}`}>{tournament.totalGames}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Terminées:</span>
                                    <span className={`font-medium text-green-500`}>{tournament.finishedGames}</span>
                                </div>
                            </div>
                        </div>

                        {myPlayer && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4`}
                            >
                                <h3 className={`text-sm font-bold ${themeColors.text} mb-3`}>
                                    Votre Position
                                </h3>
                                <div className="text-center">
                                    <div className={`text-4xl font-bold ${themeColors.text} mb-2`}>
                                        #{standings.find(s => s.userId === user?.id)?.rank || '-'}
                                    </div>
                                    <div className={`text-sm ${themeColors.textMuted}`}>
                                        {myPlayer.score} points
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4`}>
                            <h3 className={`text-sm font-bold ${themeColors.text} mb-3`}>
                                Format Arena
                            </h3>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p>• Appariement automatique</p>
                                <p>• Victoire: 2 points</p>
                                <p>• Nul: 1 point</p>
                                <p>• Série 🔥: Points x2</p>
                                {tournament.allowBerserk && <p>• Berserk ⚡: +1 point</p>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
