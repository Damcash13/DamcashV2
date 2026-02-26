import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ChevronLeft, Users, Wifi, Target, Flame, Clock } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTournament } from '../hooks/useTournament'
import StandingsTable from '../components/tournament/StandingsTable'
import TournamentTimer from '../components/tournament/TournamentTimer'
import PairingCard from '../components/tournament/PairingCard'
import TournamentAwards from '../components/tournament/TournamentAwards'

export default function TournamentActive() {
    const { tournamentId } = useParams()
    const navigate = useNavigate()
    const { themeColors, gameType } = useTheme()
    const { user } = useAuth()
    const { showToast } = useToast()

    const {
        tournament,
        standings,
        myPlayer,
        myPairing,
        isConnected,
        isLoading,
        error,
        markReady,
        setBerserk,
        getTimeRemaining,
        joinTournament,
        isPairingLocked
    } = useTournament(tournamentId || '', user?.id)

    const [showAwards, setShowAwards] = useState(false)

    useEffect(() => {
        if (error) {
            showToast('Erreur', 'error', error)
        }
    }, [error, showToast])

    // Auto-mark ready when not playing
    useEffect(() => {
        if (tournament?.status === 'ongoing' && myPlayer && !myPlayer.isPlaying && !myPairing) {
            markReady()
        }
    }, [tournament, myPlayer, myPairing, markReady])

    // Show awards automatically when finished
    useEffect(() => {
        if (tournament?.status === 'finished' || tournament?.status === 'completed') {
            setShowAwards(true)
        }
    }, [tournament?.status])

    const handlePlay = () => {
        if (myPairing) {
            navigate(`/game/${myPairing.gameId}?tournament=${tournamentId}`)
        }
    }

    const handleBerserk = () => {
        if (myPairing && tournament?.allowBerserk) {
            setBerserk(myPairing.gameId)
            showToast('Berserk activé !', 'success', 'Votre temps est divisé par 2, +1 point si victoire')
        }
    }

    const handleBack = () => {
        if (tournament?.status === 'upcoming') {
            navigate(`/tournament/${tournamentId}/lobby`)
        } else {
            navigate('/tournaments')
        }
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

    const opponentPlayer = myPairing
        ? tournament.players.find(p =>
            p.userId === (myPairing.whiteId === user?.id ? myPairing.blackId : myPairing.whiteId)
        )
        : null

    const myGames = tournament.games.filter(g =>
        g.whiteId === user?.id || g.blackId === user?.id
    )

    const endTime = new Date(new Date(tournament.startTime).getTime() + tournament.duration * 60000)
    const isSNG = tournament.type === 'SNG'
    const isUpcomingSNG = isSNG && tournament.status === 'upcoming'

    return (
        <div className={`min-h-screen ${themeColors.background} pb-20 md:pb-8`}>
            <div className="max-w-[1800px] mx-auto p-4 md:p-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={handleBack}
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
                            {tournament.variant} • {tournament.rated ? 'Rated' : 'Casual'} • {tournament.status === 'ongoing' ? 'En cours' : 'Terminé'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Timer */}
                        {!isUpcomingSNG ? (
                            <TournamentTimer
                                endTime={endTime}
                                status={tournament.status}
                            />
                        ) : (
                            <div className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4 text-center`}>
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Clock className={`w-8 h-8 ${themeColors.accent}`} />
                                    <span className={`text-sm font-medium ${themeColors.textMuted}`}>En attente de joueurs</span>
                                    <div className={`text-2xl font-bold ${themeColors.text}`}>
                                        {tournament.players?.length || 0} / {tournament.maxPlayers || 2}
                                    </div>
                                    <div className="w-full mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full ${themeColors.accent.replace('text-', 'bg-')}`}
                                            style={{ width: `${Math.min(100, ((tournament.players?.length || 0) / (tournament.maxPlayers || 2)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* My Stats */}
                        {myPlayer && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4`}
                            >
                                <h3 className={`text-sm font-bold ${themeColors.text} mb-3 flex items-center gap-2`}>
                                    <Target className="w-4 h-4" />
                                    Vos Statistiques
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className={themeColors.textMuted}>Score:</span>
                                        <span className={`font-bold ${themeColors.text} flex items-center gap-1`}>
                                            {myPlayer.score}
                                            {myPlayer.onFire && <Flame className="w-4 h-4 text-orange-500" />}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={themeColors.textMuted}>Parties:</span>
                                        <span className={`font-medium ${themeColors.text}`}>{myPlayer.games}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={themeColors.textMuted}>Victoires:</span>
                                        <span className={`font-medium text-green-500`}>{myPlayer.wins}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={themeColors.textMuted}>Nuls:</span>
                                        <span className={`font-medium text-yellow-500`}>{myPlayer.draws}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={themeColors.textMuted}>Défaites:</span>
                                        <span className={`font-medium text-red-500`}>{myPlayer.losses}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={themeColors.textMuted}>Série:</span>
                                        <span className={`font-bold ${myPlayer.onFire ? 'text-orange-500' : themeColors.text}`}>
                                            {myPlayer.streak} {myPlayer.onFire && '🔥'}
                                        </span>
                                    </div>
                                    {myPlayer.performance > 0 && (
                                        <div className="flex justify-between">
                                            <span className={themeColors.textMuted}>Performance:</span>
                                            <span className={`font-mono text-purple-400`}>{myPlayer.performance.toFixed(0)}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Tournament Info */}
                        <div className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4`}>
                            <h3 className={`text-sm font-bold ${themeColors.text} mb-3 flex items-center gap-2`}>
                                <Users className="w-4 h-4" />
                                Informations
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Joueurs:</span>
                                    <span className={`font-medium ${themeColors.text}`}>{tournament.players?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Parties totales:</span>
                                    <span className={`font-medium ${themeColors.text}`}>{tournament.totalGames || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>Terminées:</span>
                                    <span className={`font-medium text-green-500`}>{tournament.finishedGames || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className={themeColors.textMuted}>En cours:</span>
                                    <span className={`font-medium text-orange-500`}>
                                        {(tournament.totalGames || 0) - (tournament.finishedGames || 0)}
                                    </span>
                                </div>
                            </div>

                            {!myPlayer && (
                                <button
                                    onClick={async () => {
                                        if (!user) {
                                            showToast('Erreur', 'error', 'Vous devez être connecté')
                                            return
                                        }
                                        const rating = gameType === 'checkers' ? user.eloCheckers : user.eloChess
                                        const success = await joinTournament(user.username, rating)
                                        if (success) {
                                            showToast('Succès', 'success', 'Vous avez rejoint le tournoi !')
                                        } else {
                                            showToast('Erreur', 'error', 'Impossible de rejoindre le tournoi')
                                        }
                                    }}
                                    className={`w-full mt-4 py-3 rounded-lg font-bold text-white hover:brightness-110 transition-all shadow-lg animate-pulse`}
                                    style={{ backgroundColor: themeColors.accent }}
                                >
                                    REJOINDRE LE TOURNOI
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Center - Standings */}
                    <div className="lg:col-span-6">
                        {/* Current Pairing */}
                        {myPairing && opponentPlayer && tournament.status === 'ongoing' && (
                            <div className="mb-6">
                                <PairingCard
                                    pairing={myPairing}
                                    myUserId={user?.id || ''}
                                    opponentName={opponentPlayer.username}
                                    opponentRating={opponentPlayer.rating}
                                    allowBerserk={tournament.allowBerserk}
                                    onPlay={handlePlay}
                                    onBerserk={handleBerserk}
                                />
                            </div>
                        )}

                        {/* Waiting for pairing or Locked */}
                        {!myPairing && myPlayer && !myPlayer.isPlaying && tournament.status === 'ongoing' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`${themeColors.card} rounded-xl border ${themeColors.border} p-6 mb-6 text-center`}
                            >
                                {isPairingLocked ? (
                                    <>
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <Wifi className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className={`text-xl font-bold ${themeColors.text} mb-2`}>
                                            Appariements terminés
                                        </h3>
                                        <p className={`text-sm ${themeColors.textMuted}`}>
                                            Le tournoi touche à sa fin. Plus de nouvelles parties.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Users className="w-8 h-8 text-blue-500 animate-pulse" />
                                        </div>
                                        <h3 className={`text-xl font-bold ${themeColors.text} mb-2`}>
                                            Recherche d'adversaire...
                                        </h3>
                                        <p className={`text-sm ${themeColors.textMuted}`}>
                                            Vous serez apparié automatiquement
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Standings */}
                        <StandingsTable
                            standings={standings}
                            currentUserId={user?.id}
                        />
                    </div>

                    {/* Right Sidebar - My Games */}
                    <div className="lg:col-span-3">
                        <div className={`${themeColors.card} rounded-xl border ${themeColors.border} overflow-hidden`}>
                            <div className={`px-4 py-3 border-b ${themeColors.border}`}>
                                <span className={`font-bold ${themeColors.text}`}>Mes Parties</span>
                            </div>
                            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                                {myGames.length === 0 ? (
                                    <p className={`text-sm text-center py-8 ${themeColors.textMuted}`}>
                                        Aucune partie jouée
                                    </p>
                                ) : (
                                    myGames.map((game, idx) => {
                                        const isWhite = game.whiteId === user?.id
                                        const opponentName = isWhite ? game.blackUsername : game.whiteUsername
                                        const myPoints = isWhite ? game.whitePoints : game.blackPoints
                                        const result = game.result
                                        const won = (isWhite && result === 'white') || (!isWhite && result === 'black')
                                        const draw = result === 'draw'

                                        return (
                                            <motion.div
                                                key={game.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`${themeColors.cardHover} rounded-lg p-3 border ${themeColors.border}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-sm font-medium ${themeColors.text}`}>
                                                        vs {opponentName}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${won ? 'bg-green-500/20 text-green-400' :
                                                        draw ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {won ? 'Victoire' : draw ? 'Nul' : 'Défaite'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className={themeColors.textMuted}>
                                                        {isWhite ? 'Blancs' : 'Noirs'}
                                                    </span>
                                                    <span className={`font-bold ${themeColors.text}`}>
                                                        +{myPoints} pts
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <TournamentAwards
                show={showAwards}
                standings={standings}
                tournamentName={tournament?.name || 'Tournoi'}
                onClose={() => setShowAwards(false)}
                themeColors={themeColors}
            />
        </div>
    )
}
