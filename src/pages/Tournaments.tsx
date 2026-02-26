import { motion } from 'framer-motion'
import { Trophy, Users, Zap, Clock, Calendar, Medal, Flame, Target, Coins } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useRealTime } from '../contexts/RealTimeContext'
import CreateTournamentModal from '../components/CreateTournamentModal'

// Types
interface Tournament {
  id: string
  name: string
  gameType: 'checkers' | 'chess'
  variant: string
  status: 'upcoming' | 'ongoing' | 'completed'
  startTime: Date
  duration: number
  players: number
  rated: boolean
  winner?: string
  prize?: string
  entryFee: number
  prizePool?: number
}


const LEADERBOARD_DATA = {
  checkers: [
    { name: 'JcobP', rating: 2650, rank: 1, avatar: '🏆' },
    { name: 'bialoczarne', rating: 2610, rank: 2, avatar: '🥈' },
    { name: 'spion', rating: 2580, rank: 3, avatar: '🥉' },
    { name: 'yaounde2015', rating: 2565, rank: 4, avatar: '👤' },
    { name: 'FrisianChief', rating: 2540, rank: 5, avatar: '👤' },
  ],
  chess: [
    { name: 'MagnusCarlsen', rating: 2882, rank: 1, avatar: '🏆' },
    { name: 'Hikaru', rating: 2820, rank: 2, avatar: '🥈' },
    { name: 'FabianoCaruana', rating: 2805, rank: 3, avatar: '🥉' },
    { name: 'ArjunErigaisi', rating: 2799, rank: 4, avatar: '👤' },
    { name: 'GukeshD', rating: 2795, rank: 5, avatar: '👤' },
  ]
}

const RECURRING_EVENTS = {
  checkers: [
    { name: 'Checkers Damcash 24/7', time: 'Every hour', icon: '🏆', players: 120 },
    { name: 'Daily Frysk!', time: 'in 5 hours', icon: '🌿', players: 45 },
    { name: 'Monthly Rapid', time: 'in 7 hours', icon: '🐇', players: 89 },
    { name: 'Daily Bullet', time: 'in 7 hours', icon: '⚡', players: 156 },
    { name: 'Daily Russian', time: 'in 7 hours', icon: '🇷🇺', players: 67 },
  ],
  chess: [
    { name: 'Chess Damcash 24/7', time: 'Every hour', icon: '🏆', players: 250 },
    { name: 'Titled Tuesday', time: 'in 2 hours', icon: '🏆', players: 312 },
    { name: 'Arena Kings', time: 'in 5 hours', icon: '👑', players: 245 },
    { name: 'Rapid Arena', time: 'in 8 hours', icon: '⏱️', players: 178 },
    { name: 'Bullet Brawl', time: 'tomorrow', icon: '🔫', players: 423 },
  ]
}

export default function Tournaments() {
  const { gameType, themeColors } = useTheme()
  const navigate = useNavigate()
  const { tournaments: allTournaments, sendMessage, isConnected } = useRealTime()
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (isConnected) {
      sendMessage('get_tournaments', { gameType })
    }
  }, [isConnected, gameType, sendMessage])

  const currentTournaments = (allTournaments || []).filter(t => t.gameType === gameType)
  const ongoing = currentTournaments.filter(t => t.status === 'ongoing')
  const upcoming = currentTournaments.filter(t => t.status === 'upcoming').sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const completed = currentTournaments.filter(t => t.status === 'completed').sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  const leaderboard = gameType === 'checkers' ? LEADERBOARD_DATA.checkers : LEADERBOARD_DATA.chess
  const recurring = gameType === 'checkers' ? RECURRING_EVENTS.checkers : RECURRING_EVENTS.chess

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 0) return 'En cours'
    if (minutes < 60) return `Dans ${minutes}min`
    const hours = Math.floor(minutes / 60)
    return `Dans ${hours}h${minutes % 60}min`
  }

  const getVariantColor = (variant: string) => {
    if (variant.includes('1+')) return 'from-orange-500 to-red-600'
    if (variant.includes('3+')) return 'from-blue-500 to-indigo-600'
    if (variant.includes('5+') || variant.includes('10+')) return 'from-green-500 to-emerald-600'
    return 'from-purple-500 to-pink-600'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <span className="px-2 py-1 text-xs font-bold bg-green-500/20 text-green-400 rounded-full border border-green-500/30 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          EN COURS
        </span>
      case 'upcoming':
        return <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
          À VENIR
        </span>
      case 'completed':
        return <span className="px-2 py-1 text-xs font-bold bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
          TERMINÉ
        </span>
    }
  }


  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])





  // Clean up legacy single mock check
  // Generate mocks for next 6 hours if missing
  const displayUpcoming = [...upcoming];
  for (let i = 1; i <= 6; i++) {
    const nextTime = new Date(now)
    nextTime.setHours(nextTime.getHours() + i, 0, 0, 0)

    // Check if tournament exists for this hour
    const exists = displayUpcoming.some(t => {
      const tDate = new Date(t.startTime)
      return Math.abs(tDate.getTime() - nextTime.getTime()) < 60000 && t.name.includes('24/7')
    })

    if (!exists) {
      const timeControls = ['3+2', '5+0', '3+0']
      const tcIndex = nextTime.getHours() % 3
      const mockVariant = timeControls[tcIndex]

      // Every 3rd tournament is Paid
      const isPaid = i % 3 === 0
      const entryFee = isPaid ? 50 : 0
      const prize = isPaid ? '1000' : undefined

      displayUpcoming.push({
        id: `mock-next-hourly-${nextTime.getTime()}`,
        name: `${gameType === 'checkers' ? 'Checkers' : 'Chess'} Damcash 24/7`,
        gameType,
        variant: mockVariant,
        status: 'upcoming',
        startTime: nextTime,
        duration: 55,
        players: 0,
        rated: true,
        entryFee,
        prize
      })
    }
  }

  // Sort again to be safe
  displayUpcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const formatCountdown = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const diff = d.getTime() - now.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 0) return 'En cours'

    // Less than 3 minutes (180 seconds)
    if (seconds <= 180) {
      const secs = seconds % 60
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    if (minutes < 60) return `Dans ${minutes}min`
    const hours = Math.floor(minutes / 60)
    return `Dans ${hours}h${minutes % 60}min`
  }

  const isJoinable = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const diff = d.getTime() - now.getTime()
    // Joinable if less than 3 minutes remaining
    return diff <= 180 * 1000 && diff > 0
  }

  return (
    <div className={`min-h-screen ${themeColors.background} pb-20 md:pb-8`}>
      <div className="max-w-[1800px] mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${themeColors.text} mb-2`}>Tournois</h1>
            <p className={`${themeColors.textMuted}`}>Participez aux arènes et gagnez des récompenses</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-green-500/30"
          >
            <Trophy className="inline mr-2" size={20} />
            Créer un Tournoi
          </button>
        </div>

        <CreateTournamentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={(params) => sendMessage('tournament_create', params)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT SIDEBAR - Leaderboard */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${themeColors.card} border ${themeColors.border} rounded-2xl overflow-hidden backdrop-blur-sm`}
            >
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Medal className="text-yellow-500" size={24} />
                  <h2 className={`text-lg font-bold ${themeColors.text}`}>Classement</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {leaderboard.map((player, idx) => (
                  <motion.div
                    key={player.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${idx < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' : 'bg-white/5'
                      } hover:scale-105 transition-transform cursor-pointer`}
                  >
                    <div className="text-2xl">{player.avatar}</div>
                    <div className="flex-1">
                      <div className={`font-bold ${themeColors.text}`}>{player.name}</div>
                      <div className={`text-xs ${themeColors.textMuted}`}>#{player.rank}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${idx < 3 ? 'text-yellow-500' : themeColors.text}`}>
                        {player.rating}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-6 space-y-6">

            {/* Ongoing Tournaments */}
            {ongoing.length > 0 && (
              <div>
                <h2 className={`text-2xl font-bold ${themeColors.text} mb-4 flex items-center gap-2`}>
                  <Flame className="text-orange-500" />
                  En Direct
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ongoing.map((tour, idx) => (
                    <motion.div
                      key={tour.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => navigate(`/tournament/${tour.id}/lobby`)}
                      className={`relative p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all shadow-xl bg-gradient-to-br ${getVariantColor(tour.variant)} overflow-hidden group`}
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          {getStatusBadge(tour.status)}
                          <Zap className="text-white/80" size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{tour.name}</h3>

                        <div className="flex items-center gap-4 text-white/90 text-sm mb-4">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {tour.variant}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {tour.players}
                          </span>
                          {tour.entryFee > 0 ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/30 rounded-lg border border-yellow-500/30 text-yellow-200 font-bold">
                              <Coins size={12} />
                              {tour.entryFee}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/30 rounded-lg border border-green-500/30 text-green-200 font-bold uppercase text-[10px]">
                              Gratuit
                            </span>
                          )}
                        </div>

                        {(tour.prizePool || tour.prize) && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-bold">
                            <Trophy size={14} />
                            {tour.prizePool || tour.prize} coins
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Tournaments */}
            <div>
              <h2 className={`text-2xl font-bold ${themeColors.text} mb-4 flex items-center gap-2`}>
                <Calendar className="text-blue-500" />
                À Venir
              </h2>
              {displayUpcoming.length === 0 ? (
                <div className={`text-center p-8 rounded-2xl border ${themeColors.border} bg-white/5`}>
                  <p className={`${themeColors.textMuted}`}>Aucun tournoi à venir pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayUpcoming.map((tour, idx) => (
                    <motion.div
                      key={tour.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/tournament/${tour.id}/lobby`)}
                      className={`${themeColors.card} border ${themeColors.border} p-5 rounded-2xl cursor-pointer hover:scale-105 hover:border-blue-500/50 transition-all backdrop-blur-sm relative overflow-hidden`}
                    >
                      {/* Highlight if joining soon */}
                      {isJoinable(tour.startTime) && (
                        <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                      )}

                      <div className="flex justify-between items-start mb-3 relative z-10">
                        {getStatusBadge(tour.status)}
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getVariantColor(tour.variant)}`}>
                          <Target className="text-white" size={20} />
                        </div>
                      </div>

                      <h3 className={`text-lg font-bold ${themeColors.text} mb-2 relative z-10`}>{tour.name}</h3>

                      <div className={`flex items-center gap-3 ${themeColors.textMuted} text-sm mb-3 relative z-10`}>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {/* Show Time Control and Start Time */}
                          <span className="font-mono">{tour.variant}</span>
                          <span className="mx-1">•</span>
                          <span>
                            {new Date(tour.startTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {tour.players}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap size={12} />
                          {tour.duration}min
                        </span>
                      </div>

                      <div className="flex justify-between items-center relative z-10">
                        <span className={`text-sm font-bold ${isJoinable(tour.startTime) ? 'text-red-500 animate-pulse' : themeColors.accent}`}>
                          {formatCountdown(tour.startTime)}
                        </span>

                        {isJoinable(tour.startTime) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/tournament/${tour.id}/lobby`)
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-green-500/30 animate-bounce hover:scale-110 transition-transform cursor-pointer"
                          >
                            REJOINDRE
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {tour.entryFee > 0 ? (
                              <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full font-bold flex items-center gap-1">
                                <Coins size={12} /> {tour.entryFee}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-bold uppercase">
                                Gratuit
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tournaments */}
            {completed.length > 0 && (
              <div>
                <h2 className={`text-2xl font-bold ${themeColors.text} mb-4`}>Terminés</h2>
                <div className={`${themeColors.card} border ${themeColors.border} rounded-2xl overflow-hidden backdrop-blur-sm`}>
                  {completed.map((tour, idx) => (
                    <div
                      key={tour.id}
                      className={`flex items-center p-4 ${idx !== completed.length - 1 ? `border-b ${themeColors.border}` : ''} hover:bg-white/5 cursor-pointer transition-colors`}
                      onClick={() => navigate(`/tournament/${tour.id}`)}
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getVariantColor(tour.variant)} mr-4`}>
                        <Trophy className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold ${themeColors.text}`}>{tour.name}</div>
                        <div className={`text-xs ${themeColors.textMuted}`}>
                          {tour.variant} • {tour.players} joueurs
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className={`text-xs ${themeColors.textMuted} mb-1`}>Vainqueur</div>
                        <div className={`text-sm font-bold ${themeColors.accent}`}>{tour.winner}</div>
                      </div>
                      {tour.prize && (
                        <div className="text-yellow-500 font-bold">
                          🏆 {tour.prize}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Recurring Events */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${themeColors.card} border ${themeColors.border} rounded-2xl overflow-hidden backdrop-blur-sm`}
            >
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Calendar className="text-purple-500" size={24} />
                  <h2 className={`text-lg font-bold ${themeColors.text}`}>Événements Récurrents</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {recurring.map((evt, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all hover:scale-105"
                  >
                    <div className="text-3xl">{evt.icon}</div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${themeColors.text}`}>{evt.name}</div>
                      <div className={`text-xs ${themeColors.textMuted}`}>{evt.time}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${themeColors.textMuted}`}>
                        <Users size={12} className="inline mr-1" />
                        {evt.players}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
