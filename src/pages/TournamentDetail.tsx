import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Calendar, Users, Clock, ChevronLeft, Shield, Zap, Target,
  Star, Medal, Crown, MessageSquare, Gift, Play, Eye, UserPlus, X, Coins
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import UserPopover from '../components/user/UserPopover'
import Username from '../components/Username'
import TournamentCompleted from '../components/tournament/TournamentCompleted'
import { useRealTime } from '../contexts/RealTimeContext'

interface Participant {
  id: string
  rank: number
  username: string
  avatarUrl?: string
  elo: number
  tier: string
  score: number
  wins: number
  losses: number
  draws: number
  isOnline: boolean
  status: 'playing' | 'waiting' | 'eliminated' | 'finished'
  // Extended fields for popover
  country?: string
  bio?: string
  eloChess?: number
  eloCheckers?: number
}

interface Round {
  number: number
  status: 'upcoming' | 'ongoing' | 'completed'
  pairings: {
    id: string
    player1: Participant
    player2: Participant | null
    result?: string
    status: 'pending' | 'playing' | 'finished'
  }[]
}

const mockParticipants: Participant[] = [
  { id: '1', rank: 1, username: 'GrandMaster_X', elo: 2547, tier: 'Grand Master', score: 6, wins: 6, losses: 0, draws: 0, isOnline: true, status: 'waiting', country: 'FR', bio: 'Grandmaster of Checkers. Loves playing bullet games.', eloChess: 2400, eloCheckers: 2547 },
  { id: '2', rank: 2, username: 'CheckerQueen', elo: 2489, tier: 'Master', score: 5.5, wins: 5, losses: 0, draws: 1, isOnline: true, status: 'playing', country: 'US', eloChess: 2100, eloCheckers: 2489 },
  { id: '3', rank: 3, username: 'StrategyKing', elo: 2456, tier: 'Master', score: 5, wins: 4, losses: 1, draws: 2, isOnline: true, status: 'playing' },
  { id: '4', rank: 4, username: 'DamesMaster', elo: 2398, tier: 'Expert', score: 4.5, wins: 4, losses: 1, draws: 1, isOnline: false, status: 'waiting' },
  { id: '5', rank: 5, username: 'TacticalPro', elo: 2345, tier: 'Expert', score: 4, wins: 3, losses: 2, draws: 2, isOnline: true, status: 'waiting' },
  { id: '6', rank: 6, username: 'BlitzPlayer', elo: 2287, tier: 'Diamond', score: 3.5, wins: 3, losses: 2, draws: 1, isOnline: true, status: 'waiting' },
  { id: '7', rank: 7, username: 'EndgameExpert', elo: 2234, tier: 'Diamond', score: 3, wins: 2, losses: 3, draws: 2, isOnline: false, status: 'eliminated' },
  { id: '8', rank: 8, username: 'PositionalPro', elo: 2198, tier: 'Diamond', score: 2.5, wins: 2, losses: 4, draws: 1, isOnline: true, status: 'eliminated' },
]

const mockRounds: Round[] = [
  {
    number: 1,
    status: 'completed',
    pairings: [
      { id: '1', player1: mockParticipants[0], player2: mockParticipants[7], result: '1-0', status: 'finished' },
      { id: '2', player1: mockParticipants[1], player2: mockParticipants[6], result: '1-0', status: 'finished' },
      { id: '3', player1: mockParticipants[2], player2: mockParticipants[5], result: '½-½', status: 'finished' },
      { id: '4', player1: mockParticipants[3], player2: mockParticipants[4], result: '1-0', status: 'finished' },
    ]
  },
  {
    number: 2,
    status: 'ongoing',
    pairings: [
      { id: '5', player1: mockParticipants[0], player2: mockParticipants[3], status: 'finished', result: '1-0' },
      { id: '6', player1: mockParticipants[1], player2: mockParticipants[2], status: 'playing' },
      { id: '7', player1: mockParticipants[4], player2: mockParticipants[5], status: 'pending' },
      { id: '8', player1: mockParticipants[6], player2: mockParticipants[7], status: 'pending' },
    ]
  },
  {
    number: 3,
    status: 'upcoming',
    pairings: []
  }
]

const tierColors: Record<string, string> = {
  'Grand Master': 'bg-gradient-to-r from-purple-600 to-pink-600',
  'Master': 'bg-gradient-to-r from-red-600 to-orange-600',
  'Expert': 'bg-gradient-to-r from-yellow-500 to-amber-600',
  'Diamond': 'bg-gradient-to-r from-cyan-500 to-blue-600',
  'Platinum': 'bg-gradient-to-r from-slate-400 to-slate-600',
  'Gold': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
}

type TabType = 'standings' | 'rounds' | 'chat'

export default function TournamentDetail() {
  const { tournamentId } = useParams()
  const { themeColors } = useTheme()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('standings')
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants)
  const [rounds, setRounds] = useState<Round[]>(mockRounds)
  const [chatMessages, setChatMessages] = useState<{ id: string; username: string; content: string; time: Date }[]>([
    { id: '1', username: 'GrandMaster_X', content: 'Bonne chance à tous !', time: new Date(Date.now() - 10 * 60 * 1000) },
    { id: '2', username: 'CheckerQueen', content: 'Merci, que le meilleur gagne !', time: new Date(Date.now() - 8 * 60 * 1000) },
    { id: '3', username: 'StrategyKing', content: 'Super tournoi, bien organisé', time: new Date(Date.now() - 5 * 60 * 1000) },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [tournamentData, setTournamentData] = useState<any>(null)

  const { subscribe, sendMessage, isConnected } = useRealTime()

  useEffect(() => {
    if (isConnected && tournamentId) {
      sendMessage('join_tournament_lobby', { tournamentId, userId: user?.id })

      const handleStandingsUpdate = (payload: any) => {
        if (payload.tournamentId === tournamentId) {
          setParticipants(payload.standings)
        }
      }

      const handleListUpdate = (payload: any) => {
        const t = payload.data.find((item: any) => item.id === tournamentId)
        if (t) setTournamentData(t)
      }

      const unsubStandings = subscribe('tournament_standings_update', handleStandingsUpdate)
      const unsubList = subscribe('tournament_list_update', handleListUpdate)

      return () => {
        unsubStandings()
        unsubList()
      }
    }
  }, [isConnected, tournamentId, user?.id, sendMessage, subscribe])

  const tournament = {
    id: tournamentId || '1',
    name: 'Championnat Hebdomadaire',
    format: 'swiss' as const,
    status: 'ongoing' as 'ongoing' | 'upcoming' | 'completed',
    startTime: new Date(Date.now() - 30 * 60 * 1000),
    rounds: 7,
    currentRound: 7,
    maxParticipants: 64,
    currentParticipants: 48,
    prizePool: 5000,
    entryFee: 100,
    timeControl: '5+3',
    description: 'Tournoi hebdomadaire officiel avec classement ELO',
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'swiss': return Shield
      case 'arena': return Zap
      case 'knockout': return Target
      default: return Trophy
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />
    return <span className={`text-sm font-bold ${themeColors.textMuted}`}>#{rank}</span>
  }

  const handleRegister = () => {
    if (isRegistered) {
      setIsRegistered(false)
      showToast('Désinscription effectuée', 'info')
    } else {
      setIsRegistered(true)
      showToast('Inscription confirmée !', 'success')
    }
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    setChatMessages([...chatMessages, {
      id: Date.now().toString(),
      username: user?.username || 'Vous',
      content: chatInput,
      time: new Date()
    }])
    setChatInput('')
  }

  const FormatIcon = getFormatIcon(tournament.format)

  if (tournament.status === 'completed') {
    return (
      <div className={`min-h-screen ${themeColors.background} pb-20 md:pb-8`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link to="/tournaments" className={`inline-flex items-center gap-2 ${themeColors.textMuted} hover:${themeColors.text} mb-6 transition-colors`}>
            <ChevronLeft className="w-5 h-5" />
            Retour aux tournois
          </Link>
          <TournamentCompleted
            participants={participants}
            tournamentName={tournament.name}
            totalPlayers={tournament.currentParticipants}
            averageElo={2150}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeColors.background} pb-20 md:pb-8`}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Link */}
        <Link to="/tournaments" className={`inline-flex items-center gap-2 ${themeColors.textMuted} hover:${themeColors.text} mb-6 transition-colors`}>
          <ChevronLeft className="w-5 h-5" />
          Retour aux tournois
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeColors.card} rounded-2xl p-6 mb-6 shadow-card`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl ${themeColors.buttonPrimary} flex items-center justify-center`}>
                <FormatIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl md:text-3xl font-display font-bold ${themeColors.text}`}>
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    En cours - Ronde {tournament.currentRound}/{tournament.rounds}
                  </span>
                  <span className={`text-sm ${themeColors.textMuted}`}>
                    Format Suisse • {tournament.timeControl}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegister}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${isRegistered
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : `${themeColors.buttonPrimary} text-white`
                  }`}
              >
                {isRegistered ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isRegistered ? 'Se désinscrire' : "S'inscrire"}
              </button>

              {isRegistered && tournament?.status === 'ongoing' && (
                <button
                  onClick={() => sendMessage('game_berserk', { tournamentId, userId: user?.id })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  BERSERK!
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${themeColors.accent} font-bold text-xl`}>
                <Gift className="w-5 h-5" />
                {tournamentData?.prizePool || tournament.prizePool}
              </div>
              <div className={`text-xs ${themeColors.textMuted}`}>Prix total</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${themeColors.text} font-bold text-xl`}>
                <Coins className="w-5 h-5 text-yellow-500" />
                {tournamentData?.entryFee ?? tournament.entryFee}
              </div>
              <div className={`text-xs ${themeColors.textMuted}`}>Frais d'accès</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${themeColors.text} font-bold text-xl`}>
                <Users className="w-5 h-5" />
                {tournament.currentParticipants}/{tournament.maxParticipants}
              </div>
              <div className={`text-xs ${themeColors.textMuted}`}>Joueurs</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${themeColors.text} font-bold text-xl`}>
                <Trophy className="w-5 h-5" />
                {tournament.rounds}
              </div>
              <div className={`text-xs ${themeColors.textMuted}`}>Rondes</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${themeColors.text} font-bold text-xl`}>
                <Clock className="w-5 h-5" />
                {tournament.timeControl}
              </div>
              <div className={`text-xs ${themeColors.textMuted}`}>Cadence</div>
            </div>
            <div className="text-center">
              <div className={`${themeColors.accent} font-bold text-xl`}>
                {tournament.entryFee > 0 ? `${tournament.entryFee} 🪙` : 'Gratuit'}
              </div>
              <div className={`text-xs ${themeColors.textMuted}`}>Entrée</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'standings', label: 'Classement', icon: Trophy },
            { id: 'rounds', label: 'Rondes', icon: Shield },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === id
                ? `${themeColors.buttonPrimary} text-white`
                : `${themeColors.buttonSecondary} ${themeColors.text} hover:opacity-80`
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Standings Tab */}
          {activeTab === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`${themeColors.card} rounded-xl overflow-hidden shadow-card`}
            >
              {/* Table Header */}
              <div className={`grid grid-cols-12 gap-2 px-4 py-3 ${themeColors.background} border-b border-white/10 text-sm font-medium ${themeColors.textMuted}`}>
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5 md:col-span-4">Joueur</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-center hidden md:block">ELO</div>
                <div className="col-span-2 text-center hidden md:block">W/L/D</div>
                <div className="col-span-4 md:col-span-1 text-center">Status</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {participants.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:${themeColors.hover} transition-colors group`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      {getRankIcon(player.rank)}
                    </div>

                    {/* Player Info with Popover */}
                    <div className="col-span-5 md:col-span-4">
                      <UserPopover user={{
                        username: player.username,
                        avatar: player.avatarUrl,
                        country: player.country,
                        bio: player.bio,
                        eloCheckers: player.eloCheckers || player.elo,
                        eloChess: player.eloChess
                      }} align="left">
                        <div className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center overflow-hidden font-semibold ${themeColors.text}`}>
                              {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
                              ) : (
                                <span>{player.username[0].toUpperCase()}</span>
                              )}
                            </div>
                            {player.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <Username
                              userId={player.id}
                              username={player.username}
                              elo={player.eloCheckers || player.elo}
                              title={player.tier}
                              className={`font-medium ${themeColors.text} truncate transition-colors`}
                            />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[player.tier] || 'bg-gray-500'} text-white`}>
                              {player.tier}
                            </span>
                          </div>
                        </div>
                      </UserPopover>
                    </div>

                    {/* Score */}
                    <div className={`col-span-2 text-center font-bold ${themeColors.accent} text-lg`}>
                      {player.score}
                    </div>

                    {/* ELO */}
                    <div className={`col-span-2 text-center hidden md:block ${themeColors.text}`}>
                      {player.elo}
                    </div>

                    {/* W/L/D */}
                    <div className="col-span-2 hidden md:flex justify-center gap-1 text-sm">
                      <span className="text-green-500">{player.wins}</span>
                      <span className={themeColors.textMuted}>/</span>
                      <span className="text-red-500">{player.losses}</span>
                      <span className={themeColors.textMuted}>/</span>
                      <span className="text-gray-500">{player.draws}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-4 md:col-span-1 flex justify-center">
                      {player.status === 'playing' ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          <Play className="w-3 h-3" />
                          <span className="hidden sm:inline">En jeu</span>
                        </span>
                      ) : player.status === 'eliminated' ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                          Éliminé
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                          Attente
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rounds Tab */}
          {activeTab === 'rounds' && (
            <motion.div
              key="rounds"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {rounds.map((round, roundIndex) => (
                <motion.div
                  key={round.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * roundIndex }}
                  className={`${themeColors.card} rounded-xl overflow-hidden shadow-card`}
                >
                  <div className={`px-4 py-3 ${themeColors.background} border-b border-white/10 flex items-center justify-between`}>
                    <h3 className={`font-semibold ${themeColors.text}`}>
                      Ronde {round.number}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${round.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                      round.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                      {round.status === 'ongoing' ? 'En cours' : round.status === 'completed' ? 'Terminée' : 'À venir'}
                    </span>
                  </div>

                  {round.pairings.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {round.pairings.map((pairing) => (
                        <div key={pairing.id} className={`p-4 hover:${themeColors.hover} transition-colors`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {/* Player 1 */}
                              <div className="flex items-center gap-2 flex-1">
                                <div className={`w-8 h-8 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center text-sm font-semibold ${themeColors.text}`}>
                                  {pairing.player1.username[0]}
                                </div>
                                <Username
                                  userId={pairing.player1.id}
                                  username={pairing.player1.username}
                                  elo={pairing.player1.elo}
                                  title={pairing.player1.tier}
                                  className={`font-medium ${themeColors.text} truncate pointer-events-auto`}
                                />
                                <span className={`text-xs ${themeColors.textMuted}`}>
                                  ({pairing.player1.elo})
                                </span>
                              </div>

                              {/* Result */}
                              <div className={`px-4 py-1 rounded-lg ${themeColors.buttonSecondary} font-mono font-bold ${themeColors.text}`}>
                                {pairing.result || (pairing.status === 'playing' ? (
                                  <span className="flex items-center gap-1 text-green-400">
                                    <Play className="w-4 h-4" />
                                  </span>
                                ) : '- : -')}
                              </div>

                              {/* Player 2 */}
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                {pairing.player2 ? (
                                  <>
                                    <span className={`text-xs ${themeColors.textMuted}`}>
                                      ({pairing.player2.elo})
                                    </span>
                                    <Username
                                      userId={pairing.player2.id}
                                      username={pairing.player2.username}
                                      elo={pairing.player2.elo}
                                      title={pairing.player2.tier}
                                      className={`font-medium ${themeColors.text} truncate pointer-events-auto`}
                                    />
                                    <div className={`w-8 h-8 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center text-sm font-semibold ${themeColors.text}`}>
                                      {pairing.player2.username[0]}
                                    </div>
                                  </>
                                ) : (
                                  <span className={`${themeColors.textMuted} italic`}>BYE</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            {pairing.status === 'playing' && (
                              <button className={`ml-4 p-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text} hover:opacity-80`}>
                                <Eye className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-8 text-center ${themeColors.textMuted}`}>
                      Les appariements seront disponibles après la ronde précédente
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`${themeColors.card} rounded-xl shadow-card flex flex-col h-[500px]`}
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center text-sm font-semibold ${themeColors.text} flex-shrink-0`}>
                      {msg.username[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-medium ${themeColors.text}`}>{msg.username}</span>
                        <span className={`text-xs ${themeColors.textMuted}`}>
                          {msg.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`${themeColors.textMuted} break-words`}>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Écrire un message..."
                    className={`flex-1 px-4 py-2.5 rounded-xl ${themeColors.surface} ${themeColors.text} focus:outline-none focus:ring-2 ${themeColors.ring}`}
                  />
                  <button
                    onClick={handleSendChat}
                    className={`px-5 py-2.5 rounded-xl ${themeColors.buttonPrimary} text-white font-medium`}
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
