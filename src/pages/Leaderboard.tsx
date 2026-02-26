import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus,
  Search, Filter, ChevronDown, Star, Flame, Users, Calendar
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Username from '../components/Username'
import { supabase } from '../lib/supabase'

interface LeaderboardPlayer {
  id: string
  rank: number
  previousRank: number
  username: string
  avatarUrl?: string
  elo: number
  tier: string
  wins: number
  losses: number
  draws: number
  winStreak: number
  country?: string
  isOnline: boolean
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'allTime'
type LeaderboardType = 'elo' | 'winStreak' | 'gamesPlayed'

const mockLeaderboardData: LeaderboardPlayer[] = [
  { id: '1', rank: 1, previousRank: 1, username: 'GrandMaster_X', elo: 2547, tier: 'Grand Master', wins: 342, losses: 45, draws: 23, winStreak: 15, country: 'FR', isOnline: true },
  { id: '2', rank: 2, previousRank: 3, username: 'CheckerQueen', elo: 2489, tier: 'Master', wins: 298, losses: 52, draws: 18, winStreak: 8, country: 'BE', isOnline: true },
  { id: '3', rank: 3, previousRank: 2, username: 'StrategyKing', elo: 2456, tier: 'Master', wins: 287, losses: 61, draws: 31, winStreak: 5, country: 'NL', isOnline: false },
  { id: '4', rank: 4, previousRank: 5, username: 'DamesMaster', elo: 2398, tier: 'Expert', wins: 256, losses: 78, draws: 14, winStreak: 12, country: 'FR', isOnline: true },
  { id: '5', rank: 5, previousRank: 4, username: 'TacticalPro', elo: 2345, tier: 'Expert', wins: 234, losses: 89, draws: 27, winStreak: 3, country: 'DE', isOnline: false },
  { id: '6', rank: 6, previousRank: 8, username: 'BlitzPlayer', elo: 2287, tier: 'Diamond', wins: 198, losses: 92, draws: 21, winStreak: 7, country: 'ES', isOnline: true },
  { id: '7', rank: 7, previousRank: 6, username: 'EndgameExpert', elo: 2234, tier: 'Diamond', wins: 176, losses: 101, draws: 33, winStreak: 2, country: 'IT', isOnline: false },
  { id: '8', rank: 8, previousRank: 7, username: 'PositionalPro', elo: 2198, tier: 'Diamond', wins: 165, losses: 98, draws: 19, winStreak: 4, country: 'PT', isOnline: true },
  { id: '9', rank: 9, previousRank: 12, username: 'RisingChamp', elo: 2156, tier: 'Platinum', wins: 143, losses: 87, draws: 15, winStreak: 9, country: 'PL', isOnline: true },
  { id: '10', rank: 10, previousRank: 9, username: 'ClassicMaster', elo: 2123, tier: 'Platinum', wins: 134, losses: 92, draws: 22, winStreak: 1, country: 'UK', isOnline: false },
  { id: '11', rank: 11, previousRank: 10, username: 'QuickMover', elo: 2098, tier: 'Platinum', wins: 128, losses: 95, draws: 17, winStreak: 6, country: 'SE', isOnline: false },
  { id: '12', rank: 12, previousRank: 15, username: 'NewStar', elo: 2067, tier: 'Gold', wins: 112, losses: 78, draws: 11, winStreak: 11, country: 'NO', isOnline: true },
  { id: '13', rank: 13, previousRank: 11, username: 'DefensiveWall', elo: 2045, tier: 'Gold', wins: 98, losses: 89, draws: 28, winStreak: 2, country: 'DK', isOnline: false },
  { id: '14', rank: 14, previousRank: 14, username: 'AttackMode', elo: 2023, tier: 'Gold', wins: 95, losses: 82, draws: 13, winStreak: 4, country: 'FI', isOnline: true },
  { id: '15', rank: 15, previousRank: 13, username: 'PatientPlayer', elo: 1998, tier: 'Gold', wins: 89, losses: 76, draws: 21, winStreak: 1, country: 'AT', isOnline: false },
]

const tierColors: Record<string, { bg: string, text: string, border: string }> = {
  'Grand Master': { bg: 'bg-gradient-to-r from-purple-600 to-pink-600', text: 'text-white', border: 'border-purple-400' },
  'Master': { bg: 'bg-gradient-to-r from-red-600 to-orange-600', text: 'text-white', border: 'border-red-400' },
  'Expert': { bg: 'bg-gradient-to-r from-yellow-500 to-amber-600', text: 'text-black', border: 'border-yellow-400' },
  'Diamond': { bg: 'bg-gradient-to-r from-cyan-500 to-blue-600', text: 'text-white', border: 'border-cyan-400' },
  'Platinum': { bg: 'bg-gradient-to-r from-slate-400 to-slate-600', text: 'text-white', border: 'border-slate-400' },
  'Gold': { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', text: 'text-black', border: 'border-yellow-500' },
  'Silver': { bg: 'bg-gradient-to-r from-gray-300 to-gray-500', text: 'text-black', border: 'border-gray-400' },
  'Bronze': { bg: 'bg-gradient-to-r from-orange-400 to-orange-600', text: 'text-white', border: 'border-orange-400' },
}

export default function Leaderboard() {
  const { gameType, themeColors } = useTheme()
  const { user } = useAuth()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('allTime')
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('elo')
  const [searchQuery, setSearchQuery] = useState('')
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [userRank, setUserRank] = useState<LeaderboardPlayer | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  // Fetch Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order(gameType === 'checkers' ? 'elo_checkers' : 'elo_chess', { ascending: false })
          .limit(50)

        if (error) throw error

        const rankedPlayers: LeaderboardPlayer[] = data.map((p: any, index: number) => ({
          id: p.id,
          rank: index + 1,
          previousRank: index + 1, // No history yet
          username: p.username || 'User',
          avatarUrl: p.avatar_url,
          elo: gameType === 'checkers' ? p.elo_checkers : p.elo_chess,
          tier: 'Gold', // Derive from ELO ideally
          wins: p.wins || 0,
          losses: p.losses || 0,
          draws: p.draws || 0,
          winStreak: 0,
          country: p.country || 'FR', // Use profile country or FR fallback
          isOnline: false
        }))

        setPlayers(rankedPlayers)

        // Set user rank
        if (user) {
          const myRank = rankedPlayers.find(p => p.id === user.id)
          if (myRank) setUserRank(myRank)
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      }
    }

    fetchLeaderboard()
  }, [gameType, user])

  const filteredPlayers = players.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRankChange = (current: number, previous: number) => {
    const diff = previous - current
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500', value: `+${diff}` }
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-500', value: `${diff}` }
    return { icon: Minus, color: 'text-gray-500', value: '0' }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>
  }

  const getTierStyle = (tier: string) => {
    return tierColors[tier] || tierColors['Bronze']
  }

  return (
    <div className={`min-h-screen ${themeColors.background} pb-20 md:pb-8`}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className={`w-8 h-8 ${themeColors.accent}`} />
            <h1 className={`text-3xl font-display font-bold ${themeColors.text}`}>
              Classement {gameType === 'checkers' ? 'Dames' : 'Échecs'}
            </h1>
          </div>
          <p className={`${themeColors.textMuted}`}>
            Les meilleurs joueurs de la plateforme
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${themeColors.card} rounded-xl p-4 mb-6 shadow-card`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeColors.textMuted}`} />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg ${themeColors.input} ${themeColors.text} focus:outline-none focus:ring-2 ${themeColors.ring}`}
              />
            </div>

            {/* Time Period */}
            <div className="flex gap-2">
              {[
                { id: 'daily', label: 'Jour', icon: Calendar },
                { id: 'weekly', label: 'Semaine', icon: Calendar },
                { id: 'monthly', label: 'Mois', icon: Calendar },
                { id: 'allTime', label: 'Total', icon: Trophy },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTimePeriod(id as TimePeriod)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${timePeriod === id
                    ? `${themeColors.buttonPrimary} text-white shadow-lg`
                    : `${themeColors.buttonSecondary} ${themeColors.text} hover:opacity-80`
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden flex items-center gap-2 px-4 py-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text}`}
            >
              <Filter className="w-5 h-5" />
              Filtres
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters (Mobile) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden mt-4 pt-4 border-t border-white/10"
              >
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'elo', label: 'Par ELO', icon: Trophy },
                    { id: 'winStreak', label: 'Séries', icon: Flame },
                    { id: 'gamesPlayed', label: 'Parties', icon: Users },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setLeaderboardType(id as LeaderboardType)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${leaderboardType === id
                        ? `${themeColors.buttonPrimary} text-white`
                        : `${themeColors.buttonSecondary} ${themeColors.text}`
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User's Rank Card (if logged in) */}
        {userRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`${themeColors.card} rounded-xl p-4 mb-6 border-2 ${themeColors.border} shadow-card`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${themeColors.buttonPrimary} flex items-center justify-center text-white font-bold text-lg`}>
                  #{userRank.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${themeColors.text}`}>{userRank.username}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Vous</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`${getTierStyle(userRank.tier).bg} ${getTierStyle(userRank.tier).text} text-xs px-2 py-0.5 rounded-full`}>
                      {userRank.tier}
                    </span>
                    <span className={`text-sm ${themeColors.textMuted}`}>{userRank.elo} ELO</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const change = getRankChange(userRank.rank, userRank.previousRank)
                  return (
                    <>
                      <change.icon className={`w-5 h-5 ${change.color}`} />
                      <span className={`font-medium ${change.color}`}>{change.value}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex justify-center items-end gap-4 mb-8"
        >
          {[filteredPlayers[1], filteredPlayers[0], filteredPlayers[2]].filter(Boolean).map((player, index) => {
            const heights = ['h-32', 'h-40', 'h-28']
            const ranks = [2, 1, 3]
            const rank = ranks[index]

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <Link to={`/profile/${player.id}`}>
                  <div className="relative mb-2">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${rank === 1 ? 'from-yellow-400 to-yellow-600' :
                      rank === 2 ? 'from-gray-300 to-gray-500' :
                        'from-orange-400 to-orange-600'
                      } p-1`}>
                      <div className={`w-full h-full rounded-full ${themeColors.card} flex items-center justify-center text-2xl`}>
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{player.username[0].toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    {player.isOnline && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${rank === 1 ? 'bg-yellow-500' :
                      rank === 2 ? 'bg-gray-400' :
                        'bg-orange-500'
                      } text-white font-bold text-sm shadow-lg`}>
                      {rank}
                    </div>
                  </div>
                </Link>
                <Username
                  userId={player.id}
                  username={player.username}
                  elo={player.elo}
                  title={player.tier}
                  country={player.country}
                  className={`font-semibold ${themeColors.text} text-center`}
                />
                <span className={`${themeColors.accent} font-bold`}>{player.elo}</span>
                <div className={`${heights[index]} w-24 mt-4 rounded-t-xl ${rank === 1 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' :
                  rank === 2 ? 'bg-gradient-to-t from-gray-500 to-gray-300' :
                    'bg-gradient-to-t from-orange-600 to-orange-400'
                  } flex items-end justify-center pb-2`}>
                  {getRankIcon(rank)}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${themeColors.card} rounded-xl overflow-hidden shadow-card`}
        >
          {/* Table Header */}
          <div className={`grid grid-cols-12 gap-2 px-4 py-3 ${themeColors.background} border-b border-white/10 text-sm font-medium ${themeColors.textMuted}`}>
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 md:col-span-4">Joueur</div>
            <div className="col-span-2 text-center hidden md:block">Tier</div>
            <div className="col-span-2 text-center">ELO</div>
            <div className="col-span-2 text-center hidden md:block">W/L/D</div>
            <div className="col-span-4 md:col-span-1 text-center">Δ</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {filteredPlayers.map((player, index) => {
              const change = getRankChange(player.rank, player.previousRank)
              const tierStyle = getTierStyle(player.tier)

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:${themeColors.hover} transition-colors cursor-pointer`}
                  onClick={() => window.location.href = `/profile/${player.id}`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(player.rank)}
                  </div>

                  {/* Player Info */}
                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center font-semibold ${themeColors.text}`}>
                        {player.avatarUrl ? (
                          <img src={player.avatarUrl} alt={player.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          player.username[0].toUpperCase()
                        )}
                      </div>
                      {player.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Username
                          userId={player.id}
                          username={player.username}
                          elo={player.elo}
                          title={player.tier}
                          country={player.country}
                          className={`font-medium ${themeColors.text} truncate`}
                        />
                        {player.winStreak >= 5 && (
                          <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      {player.country && (
                        <span className="text-xs text-gray-500">{player.country}</span>
                      )}
                    </div>
                  </div>

                  {/* Tier */}
                  <div className="col-span-2 hidden md:flex justify-center">
                    <span className={`${tierStyle.bg} ${tierStyle.text} text-xs px-2 py-1 rounded-full font-medium`}>
                      {player.tier}
                    </span>
                  </div>

                  {/* ELO */}
                  <div className={`col-span-2 text-center font-bold ${themeColors.accent}`}>
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

                  {/* Rank Change */}
                  <div className="col-span-4 md:col-span-1 flex items-center justify-center gap-1">
                    <change.icon className={`w-4 h-4 ${change.color}`} />
                    <span className={`text-sm font-medium ${change.color}`}>{change.value}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Load More */}
          <div className="p-4 flex justify-center">
            <button className={`px-6 py-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text} font-medium hover:opacity-80 transition-opacity`}>
              Charger plus de joueurs
            </button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
        >
          {[
            { label: 'Joueurs actifs', value: '12,847', icon: Users },
            { label: 'Parties jouées', value: '1.2M', icon: Trophy },
            { label: 'ELO moyen', value: '1,423', icon: Star },
            { label: 'En ligne', value: '847', icon: Flame },
          ].map(({ label, value, icon: Icon }, index) => (
            <div
              key={label}
              className={`${themeColors.card} rounded-xl p-4 text-center shadow-card`}
            >
              <Icon className={`w-8 h-8 ${themeColors.accent} mx-auto mb-2`} />
              <div className={`text-2xl font-bold ${themeColors.text}`}>{value}</div>
              <div className={`text-sm ${themeColors.textMuted}`}>{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
