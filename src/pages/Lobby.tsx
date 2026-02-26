import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Users,
  Clock,
  Circle,
  ChevronDown,
  RefreshCw,
  Zap,
  Swords,
  Hourglass
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useRealTime } from '../contexts/RealTimeContext'
import { useToast } from '../contexts/ToastContext'
import { WaitingGame, LobbyPlayer } from '../types/lobby'
import WaitingGameCard from '../components/lobby/WaitingGameCard'
import CreateGameModal from '../components/game/CreateGameModal'
import Username from '../components/Username'
import ChallengeModal from '../components/ChallengeModal'
import { useInvitations } from '../hooks/useInvitations'
import { supabase } from '../lib/supabase'
// import { wagerAPI } from '../api/wagerAPI'



const mockPlayers: LobbyPlayer[] = [
  { id: '1', username: 'DamierPro', elo: 1850, tier: 'diamond', status: 'available', lastSeen: new Date(), gamesPlayed: 342, winRate: 62 },
  { id: '2', username: 'CheckerKing', elo: 1720, tier: 'platinum', status: 'available', lastSeen: new Date(), gamesPlayed: 256, winRate: 58 },
  { id: '3', username: 'QueenSlayer', elo: 1680, tier: 'platinum', status: 'playing', lastSeen: new Date(), gamesPlayed: 189, winRate: 55 },
  { id: '4', username: 'FastMoves', elo: 1590, tier: 'gold', status: 'available', lastSeen: new Date(), gamesPlayed: 423, winRate: 51 },
  { id: '5', username: 'StrategyMaster', elo: 1540, tier: 'gold', status: 'available', lastSeen: new Date(), gamesPlayed: 178, winRate: 49 },
  { id: '6', username: 'Rookie2024', elo: 1320, tier: 'silver', status: 'available', lastSeen: new Date(), gamesPlayed: 67, winRate: 45 },
  { id: '7', username: 'NightOwl', elo: 1450, tier: 'silver', status: 'away', lastSeen: new Date(), gamesPlayed: 234, winRate: 52 },
  { id: '8', username: 'BoardWizard', elo: 1980, tier: 'diamond', status: 'playing', lastSeen: new Date(), gamesPlayed: 567, winRate: 68 },
]

// Mock waiting games data
// const mockWaitingGames: WaitingGame[] = [ ... ]

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

export default function Lobby() {
  const { gameType, themeColors } = useTheme()
  // const { user } = useAuth() // Unused
  const { sendInvitation, sendMessage, subscribe } = useRealTime()
  const { sendGameInvitation, sendWagerChallenge } = useInvitations({ listen: false })
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [players, setPlayers] = useState<LobbyPlayer[]>(mockPlayers)
  const [waitingGames, setWaitingGames] = useState<WaitingGame[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'playing'>('all')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'elo' | 'winRate' | 'games'>('elo')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<LobbyPlayer | null>(null)
  const [challengeOpponent, setChallengeOpponent] = useState<LobbyPlayer | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter and sort players
  const filteredPlayers = players
    .filter((p) => {
      if (searchQuery && !p.username.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterTier !== 'all' && p.tier !== filterTier) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'elo') return b.elo - a.elo
      if (sortBy === 'winRate') return b.winRate - a.winRate
      return b.gamesPlayed - a.gamesPlayed
    })

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      showToast('Liste mise à jour', 'info', `${players.length} joueurs en ligne`)
    }, 1000)
  }

  const handleChallenge = (player: LobbyPlayer) => {
    if (player.status !== 'available') {
      showToast('Joueur indisponible', 'warning', `${player.username} est actuellement en partie`)
      return
    }
    setChallengeOpponent(player)
    setSelectedPlayer(null)
  }

  const handleSendChallenge = (params: {
    timeControl: string
    variant: string
    wager?: number
    message?: string
  }) => {
    if (!challengeOpponent) return

    if (params.wager && params.wager > 0) {
      sendWagerChallenge(challengeOpponent.id, params.wager, gameType, params.timeControl, params.variant)
    } else {
      sendGameInvitation(challengeOpponent.id, gameType, params.timeControl, params.variant)
    }
    setChallengeOpponent(null)
  }

  const handleJoinGame = (gameId: string) => {
    showToast('Connexion...', 'info', 'Rejoindre la partie')
    navigate(`/game/${gameId}`)
  }

  // Supabase listener for waiting games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select(`
            id,
            game_type,
            variant,
            time_control,
            wager_amount,
            created_at,
            white_player:white_player_id(id, username, elo_checkers, elo_chess),
            black_player:black_player_id(id, username, elo_checkers, elo_chess)
          `)
          .eq('status', 'waiting')
          .eq('game_type', gameType)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to WaitingGame type
        const games: WaitingGame[] = data.map((g: any) => {
          const creator = g.white_player || g.black_player;
          const elo = gameType === 'checkers' ? creator?.elo_checkers : creator?.elo_chess;
          return {
            id: g.id,
            creatorId: creator?.id,
            creatorName: creator?.username || 'Unknown',
            creatorElo: elo || 1200,
            creatorTier: 'gold', // Helper needed for tier
            timeControl: g.time_control,
            variant: g.variant,
            mode: g.wager_amount > 0 ? 'wager' : 'rated', // Simplification
            wagerAmount: g.wager_amount,
            createdAt: new Date(g.created_at),
            gameType: g.game_type
          };
        });
        setWaitingGames(games);

      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGames();

    // Realtime Subscription
    const channel = supabase
      .channel('public:games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `status=eq.waiting` }, (payload) => {
        // Simplest approach: refetch all (or handle insert/delete)
        // For now, let's refetch to get the joined player data easily
        fetchGames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameType]);

  const availableCount = players.filter((p) => p.status === 'available').length
  const playingCount = players.filter((p) => p.status === 'playing').length

  return (
    <div className="min-h-full pb-20 md:pb-0">
      {/* Header with Action */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${themeColors.text} mb-1`}>
            Lobby {gameType === 'checkers' ? 'Dames' : 'Échecs'}
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span className={`flex items-center gap-1 ${themeColors.textMuted}`}>
              <Circle className="w-3 h-3 fill-green-500 text-green-500" />
              {availableCount} disponibles
            </span>
            <span className={`flex items-center gap-1 ${themeColors.textMuted}`}>
              <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              {playingCount} en partie
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={`px-4 py-2.5 rounded-lg text-white font-bold shadow-md active:scale-[0.98] transition-all flex items-center gap-2 text-sm whitespace-nowrap`}
          style={{ backgroundColor: themeColors.accent }}
        >
          <Swords className="w-4 h-4" />
          Créer une partie
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl ${themeColors.card} border ${themeColors.border}`}>
            <Search className={`w-5 h-5 ${themeColors.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un joueur..."
              className={`flex-1 bg-transparent ${themeColors.text} outline-none`}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 md:flex-none px-4 py-3 rounded-xl ${showFilters ? themeColors.accent + ' text-white' : themeColors.card + ' ' + themeColors.text} border ${themeColors.border} flex items-center justify-center gap-2`}
            >
              <Filter className="w-5 h-5" />
              <span className="md:hidden">Filtres</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={handleRefresh}
              className={`px-4 py-3 rounded-xl ${themeColors.card} ${themeColors.text} border ${themeColors.border}`}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`${themeColors.card} rounded-xl p-4 border ${themeColors.border}`}
            >
              <div className="grid grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className={`text-sm ${themeColors.textMuted} mb-2 block`}>Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg ${themeColors.cardHover} ${themeColors.text} border ${themeColors.border} outline-none`}
                  >
                    <option value="all">Tous</option>
                    <option value="available">Disponibles</option>
                    <option value="playing">En partie</option>
                  </select>
                </div>

                {/* Tier Filter */}
                <div>
                  <label className={`text-sm ${themeColors.textMuted} mb-2 block`}>Rang</label>
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${themeColors.cardHover} ${themeColors.text} border ${themeColors.border} outline-none`}
                  >
                    <option value="all">Tous</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Argent</option>
                    <option value="gold">Or</option>
                    <option value="platinum">Platine</option>
                    <option value="diamond">Diamant</option>
                    <option value="master">Maître</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className={`text-sm ${themeColors.textMuted} mb-2 block`}>Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg ${themeColors.cardHover} ${themeColors.text} border ${themeColors.border} outline-none`}
                  >
                    <option value="elo">ELO</option>
                    <option value="winRate">Win Rate</option>
                    <option value="games">Parties jouées</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Waiting Games Section */}
      <AnimatePresence>
        {waitingGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${themeColors.card} rounded-2xl border ${themeColors.border} mb-6 overflow-hidden`}
          >
            <div className={`px-5 py-4 border-b ${themeColors.border} bg-gradient-to-r ${themeColors.accent} bg-opacity-10`}>
              <h3 className={`font-bold ${themeColors.text} flex items-center gap-2`}>
                <Hourglass className="w-5 h-5" />
                Parties en Attente ({waitingGames.length})
              </h3>
              <p className={`text-sm ${themeColors.textMuted} mt-1`}>
                Rejoignez une partie déjà configurée
              </p>
            </div>

            <div className="p-4 space-y-3">
              {waitingGames.map(game => (
                <WaitingGameCard
                  key={game.id}
                  game={game}
                  onJoin={handleJoinGame}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Match Section */}
      <div className={`${themeColors.card} rounded-2xl p-5 border ${themeColors.border} mb-6`}>
        <h3 className={`font-bold ${themeColors.text} mb-4 flex items-center gap-2`}>
          <Zap className="w-5 h-5" />
          Partie Rapide
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/game?mode=online&time=bullet')}
            className={`p-4 rounded-xl border ${themeColors.border} ${themeColors.text} hover:bg-white/5 transition-colors`}
          >
            <Clock className="w-6 h-6 mb-2" />
            <p className="font-bold">Bullet</p>
            <p className="text-sm opacity-75">1+0</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/game?mode=online&time=blitz')}
            className={`p-4 rounded-xl border ${themeColors.border} ${themeColors.text} hover:bg-white/5 transition-colors`}
          >
            <Zap className="w-6 h-6 mb-2" />
            <p className="font-bold">Blitz</p>
            <p className="text-sm opacity-75">5+0</p>
          </motion.button>
        </div>
      </div>

      {/* Players List */}
      <div className={`${themeColors.card} rounded-2xl border ${themeColors.border} overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${themeColors.border}`}>
          <h3 className={`font-bold ${themeColors.text} flex items-center gap-2`}>
            <Users className="w-5 h-5" />
            Joueurs ({filteredPlayers.length})
          </h3>
        </div>

        <div className="divide-y divide-opacity-10">
          {filteredPlayers.length === 0 ? (
            <div className={`p-8 text-center ${themeColors.textMuted}`}>
              Aucun joueur trouvé
            </div>
          ) : (
            filteredPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 flex items-center justify-between hover:${themeColors.cardHover} transition cursor-pointer`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar with tier badge */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tierColors[player.tier]} flex items-center justify-center text-white font-bold text-lg`}>
                      {player.username[0].toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm ${player.status === 'available' ? 'bg-green-500' :
                      player.status === 'playing' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                      {tierIcons[player.tier]}
                    </div>
                  </div>

                  <div>
                    <Username
                      userId={player.id}
                      username={player.username}
                      elo={player.elo}
                      title={player.tier}
                      className={`font-medium ${themeColors.text}`}
                    />
                    <div className="flex items-center gap-3 text-sm">
                      <span className={themeColors.textMuted}>ELO {player.elo}</span>
                      <span className={`${player.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                        {player.winRate}% WR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${player.status === 'available' ? 'bg-green-500/20 text-green-500' :
                    player.status === 'playing' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                    {player.status === 'available' ? 'Disponible' :
                      player.status === 'playing' ? 'En partie' : 'Absent'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleChallenge(player)
                    }}
                    disabled={player.status !== 'available'}
                    className={`p-2 rounded-lg ${player.status === 'available'
                      ? `${themeColors.accent} text-white`
                      : `${themeColors.cardHover} ${themeColors.textMuted}`
                      } disabled:opacity-50`}
                  >
                    <Swords className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${themeColors.card} rounded-2xl p-6 w-full max-w-sm border ${themeColors.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Player Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierColors[selectedPlayer.tier]} flex items-center justify-center text-white font-bold text-2xl`}>
                  {selectedPlayer.username[0].toUpperCase()}
                </div>
                <div>
                  <Username
                    userId={selectedPlayer.id}
                    username={selectedPlayer.username}
                    elo={selectedPlayer.elo}
                    title={selectedPlayer.tier}
                    className={`text-xl font-bold ${themeColors.text} block`}
                  />
                  <p className={`${themeColors.textMuted} flex items-center gap-2`}>
                    <span>{tierIcons[selectedPlayer.tier]}</span>
                    <span className="capitalize">{selectedPlayer.tier}</span>
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className={`${themeColors.cardHover} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${themeColors.text}`}>{selectedPlayer.elo}</p>
                  <p className={`text-xs ${themeColors.textMuted}`}>ELO</p>
                </div>
                <div className={`${themeColors.cardHover} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${selectedPlayer.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedPlayer.winRate}%
                  </p>
                  <p className={`text-xs ${themeColors.textMuted}`}>Win Rate</p>
                </div>
                <div className={`${themeColors.cardHover} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${themeColors.text}`}>{selectedPlayer.gamesPlayed}</p>
                  <p className={`text-xs ${themeColors.textMuted}`}>Parties</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleChallenge(selectedPlayer)}
                  disabled={selectedPlayer.status !== 'available'}
                  className={`w-full py-4 rounded-xl ${themeColors.accent} text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  <Swords className="w-5 h-5" />
                  Défier
                </button>
                <button
                  onClick={() => navigate(`/profile/${selectedPlayer.id}`)}
                  className={`w-full py-4 rounded-xl ${themeColors.cardHover} ${themeColors.text} font-medium border ${themeColors.border}`}
                >
                  Voir le profil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      {challengeOpponent && (
        <ChallengeModal
          isOpen={!!challengeOpponent}
          onClose={() => setChallengeOpponent(null)}
          opponentId={challengeOpponent.id}
          opponentName={challengeOpponent.username}
          gameType={gameType}
          onSendChallenge={handleSendChallenge}
        />
      )}
    </div>
  )
}
