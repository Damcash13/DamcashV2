import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Trophy,
  Activity,
  Calendar,
  Clock,
  Swords,
  UserPlus,
  MessageCircle,
  Settings,
  Zap,
  Flame,
  Target,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useRealTime } from '../contexts/RealTimeContext'
import { useToast } from '../contexts/ToastContext'
import { MiniCheckersBoard, MiniChessBoard } from '../components/game/MiniBoards'
import { supabase } from '../lib/supabase'

// Mock Data Structure
interface UserStats {
  rating: number
  games: number
  wins: number
  draws: number
  losses: number
  rank?: number
  percentile?: number
}

interface GameActivity {
  id: string
  date: Date
  type: 'game'
  variant: 'bullet' | 'blitz' | 'rapid'
  gameType: 'checkers' | 'chess'
  result: 'win' | 'loss' | 'draw'
  opponent: string
  opponentRating: number
  ratingChange: number
  moves: number
  opening?: string
}

interface TournamentActivity {
  id: string
  date: Date
  type: 'tournament'
  variant: 'bullet' | 'blitz' | 'rapid'
  gameType: 'checkers' | 'chess'
  tournamentName: string
  rank: number
  totalPlayers: number
  wins: number
  draws: number
  losses: number
}

type ActivityItem = GameActivity | TournamentActivity

interface UserProfile {
  id: string
  username: string
  bio?: string
  joinedDate: Date
  followers: number
  tournamentPoints: number
  studies: number
  forumPosts: number
  stats: {
    bullet: UserStats
    blitz: UserStats
    rapid: UserStats
  }
  recentActivity: ActivityItem[]
  trophies: {
    id: string
    icon: string
    name: string
    date: Date
  }[]
}

export default function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { themeColors } = useTheme()
  const { user } = useAuth()
  const { sendInvitation, isConnected } = useRealTime()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<'activity' | 'stats'>('activity')
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'declined'>('none')

  const isOwnProfile = !userId || userId === user?.id

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const targetId = userId || user?.id

        if (!targetId) {
          setLoading(false)
          return
        }

        // 1. Fetch Profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single()

        if (profileError) throw profileError

        // 2. Fetch Recent Games
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select(`
                id,
                created_at,
                game_type,
                variant,
                status,
                winner_id,
                white_player:white_player_id(username, elo_checkers, elo_chess),
                black_player:black_player_id(username, elo_checkers, elo_chess)
            `)
          .or(`white_player_id.eq.${targetId},black_player_id.eq.${targetId}`)
          .eq('status', 'finished')
          .order('created_at', { ascending: false })
          .limit(10)

        if (gamesError) throw gamesError

        // Process Data
        // Process Data
        const recentActivity: ActivityItem[] = games.map((g: any) => {
          const isWhite = g.white_player?.username === profile.username || g.white_player_id === targetId
          const opponent = isWhite ? g.black_player : g.white_player
          let result: 'win' | 'loss' | 'draw' = 'draw'

          if (g.winner_id === targetId) result = 'win'
          else if (g.winner_id) result = 'loss'

          return {
            id: g.id,
            date: new Date(g.created_at),
            type: 'game',
            variant: g.variant || 'standard',
            gameType: g.game_type,
            result,
            opponent: opponent?.username || 'Unknown',
            opponentRating: g.game_type === 'checkers' ? (opponent?.elo_checkers || 1200) : (opponent?.elo_chess || 1200),
            ratingChange: 0,
            moves: 0,
            opening: ''
          }
        })

        // Let's fix the query to include IDs in join, see below replacement.

      } catch (error) {
        console.error('Error loading profile:', error)
        // Fallback/Error state handled by UI
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId, user?.id])

  // Improved Fetch Implementation
  useEffect(() => {
    const loadData = async () => {
      const targetId = userId || user?.id
      if (!targetId) return

      setLoading(true)
      try {
        // Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single()

        if (!profile) throw new Error('Profile not found')

        // Games
        const { data: games } = await supabase
          .from('games')
          .select(`
                    *,
                    white_player:white_player_id(id, username, elo_checkers, elo_chess),
                    black_player:black_player_id(id, username, elo_checkers, elo_chess)
                `)
          .or(`white_player_id.eq.${targetId},black_player_id.eq.${targetId}`)
          .eq('status', 'finished')
          .order('created_at', { ascending: false })
          .limit(20)

        // Map stats
        const stats = {
          bullet: { rating: (profile.elo_checkers || 1200), games: 0, wins: 0, draws: 0, losses: 0 }, // Simplified for now
          blitz: { rating: (profile.elo_checkers || 1200), games: profile.games_played || 0, wins: profile.wins || 0, draws: profile.draws || 0, losses: profile.losses || 0 },
          rapid: { rating: (profile.elo_checkers || 1200), games: 0, wins: 0, draws: 0, losses: 0 }
        }

        // Map Activity
        const activity = (games || []).map((g: any) => {
          const isWhite = g.white_player_id === targetId
          const opponent = isWhite ? g.black_player : g.white_player
          const result = g.winner_id === targetId ? 'win' : (g.winner_id ? 'loss' : 'draw')

          return {
            id: g.id,
            date: new Date(g.created_at),
            type: 'game',
            variant: g.variant || 'standard',
            gameType: g.game_type,
            result,
            opponent: opponent?.username || 'Unknown',
            opponentRating: g.game_type === 'checkers' ? (opponent?.elo_checkers || 1200) : (opponent?.elo_chess || 1200),
            ratingChange: 0, // We need to store this in DB to show it, or calculate it. skipped for now.
            moves: 0, // Need to count moves or store it
            opening: ''
          }
        })

        setProfileData({
          id: profile.id,
          username: profile.username,
          joinedDate: new Date(profile.created_at),
          followers: 0,
          tournamentPoints: 0,
          studies: 0,
          forumPosts: 0,
          stats: stats,
          recentActivity: activity as ActivityItem[],
          trophies: []
        })

        // Check Friend Status logic can remain or fetch from a 'friends' table if exists

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [userId, user?.id])

  // Removed old processProfileData as it's handled in useEffect

  const handleChallenge = () => {
    if (profileData) {
      sendInvitation(profileData.id, 'checkers', { timeControl: 'blitz' })
      showToast('Défi envoyé !', 'success', `En attente de ${profileData.username}...`)
    }
  }

  const handleAddFriend = async () => {
    if (!profileData || !user) return
    try {
      const res = await fetch('http://localhost:8000/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: profileData.id })
      })
      if (res.ok) {
        setFriendStatus('pending')
        showToast('Demande envoyée', 'success')
      } else {
        const err = await res.json()
        showToast(err.error || 'Erreur', 'error')
      }
    } catch (e) {
      showToast('Erreur de connexion', 'error')
    }
  }

  const handleSendMessage = async () => {
    if (!profileData || !user) return
    const msg = prompt('Votre message :')
    if (!msg) return

    try {
      const res = await fetch('http://localhost:8000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: profileData.id, content: msg })
      })
      if (res.ok) {
        showToast('Message envoyé', 'success')
      } else {
        showToast('Erreur envoi message', 'error')
      }
    } catch (e) {
      showToast('Erreur de connexion', 'error')
    }
  }

  // Group activity by date
  const groupedActivity = useMemo(() => {
    if (!profileData?.recentActivity) return []
    const groups: { [key: string]: { date: Date, items: ActivityItem[], stats: { wins: number, draws: number, losses: number, total: number } } } = {}

    profileData.recentActivity.forEach(item => {
      const dateKey = item.date.toLocaleDateString('en-GB') // DD/MM/YYYY
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: item.date,
          items: [],
          stats: { wins: 0, draws: 0, losses: 0, total: 0 }
        }
      }
      groups[dateKey].items.push(item)
      groups[dateKey].stats.total++

      if (item.type === 'game') {
        if (item.result === 'win') groups[dateKey].stats.wins++
        else if (item.result === 'draw') groups[dateKey].stats.draws++
        else groups[dateKey].stats.losses++
      } else {
        // For tournaments, we add the aggregate stats
        groups[dateKey].stats.wins += item.wins
        groups[dateKey].stats.draws += item.draws
        groups[dateKey].stats.losses += item.losses
        groups[dateKey].stats.total += (item.wins + item.draws + item.losses - 1) // -1 because the item itself is counted as 1
      }
    })

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [profileData?.recentActivity])

  if (loading) {
    return <div className="flex items-center justify-center h-full min-h-[500px] text-gray-500">Chargement du profil...</div>
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-gray-500 gap-4">
        <p>Profil introuvable ou vous n'êtes pas connecté.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#c9b037] text-black rounded-lg font-bold hover:bg-[#b09a30] transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-20 md:pb-0">
      {/* Header Section - Professional Design */}
      <div className={`${themeColors.card} rounded-t-2xl border-b ${themeColors.border} relative overflow-hidden`}>
        {/* Simple Header Background */}
        <div className="h-32 relative bg-gradient-to-br from-[#252320] to-[#1a1815]">
          {/* Floating elements */}
          <div className="absolute top-4 right-4 flex gap-3">
            <div className="bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded border border-white/10 text-xs text-white/60 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Joined {new Date(profileData.joinedDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 mt-[-40px] flex flex-col md:flex-row items-start md:items-end justify-between relative z-10 gap-4">
          <div className="flex items-end gap-4">
            {/* Simplified Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-lg border-2 border-[#3d3933] bg-gradient-to-br from-[#3d3933] to-[#2e2a24] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                <span className="relative z-10">{profileData.username ? profileData.username[0].toUpperCase() : '?'}</span>
                {/* Online indicator */}
                {isOwnProfile && (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-[#252320] rounded-full ${isConnected ? 'bg-green-600' : 'bg-gray-500'}`} title={isConnected ? 'En ligne' : 'Hors ligne'}></div>
                )}
              </div>
            </div>
            <div className="mb-1">
              {/* Username without Crown icon */}
              <h1 className={`text-2xl font-bold ${themeColors.text} tracking-tight`}>
                {profileData.username}
              </h1>
              <p className="text-gray-400 text-sm mt-1 max-w-md">{profileData.bio || 'Joueur passionné de dames et d\'échecs'}</p>
              <div className={`flex gap-4 text-sm ${themeColors.textMuted} mt-2`}>
                <span className="flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /><b>{profileData.followers}</b> Followers</span>
                <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /><b>{profileData.tournamentPoints?.toLocaleString() || 0}</b> Points</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges - No emojis, simple text */}
          {(profileData.trophies && profileData.trophies.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {profileData.trophies.slice(0, 3).map(t => (
                <div
                  key={t.id}
                  className="px-3 py-1.5 rounded border border-[#3d3933] bg-[#2e2a24] text-xs text-gray-300 hover:bg-[#3d3933] transition-colors cursor-pointer"
                  title={t.name}
                >
                  {t.name}
                </div>
              ))}
              {(profileData.trophies?.length || 0) > 3 && (
                <div className="px-3 py-1.5 rounded border border-[#3d3933] bg-[#2e2a24] text-xs text-gray-500">
                  +{(profileData.trophies?.length || 0) - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className={`${themeColors.card} border-x border-b ${themeColors.border} p-4 flex justify-between items-center rounded-b-2xl mb-6 shadow-lg`}>
        <div className="flex gap-2">
          {!isOwnProfile && (
            <>
              <button onClick={handleChallenge} className={`${themeColors.accent} text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all`}>
                <Swords className="w-4 h-4" /> Défier
              </button>
              <button
                onClick={handleAddFriend}
                disabled={friendStatus !== 'none'}
                className={`bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors ${friendStatus !== 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={friendStatus === 'accepted' ? 'Déjà amis' : friendStatus === 'pending' ? 'Demande envoyée' : 'Ajouter ami'}
              >
                <UserPlus className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                className={`bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </>
          )}
          {isOwnProfile && (
            <button onClick={() => navigate('/settings')} className={`bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-600 transition-colors`}>
              <Settings className="w-4 h-4" /> Paramètres
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'activity' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Activité
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'stats' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Statistiques
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {activeTab === 'activity' && (
            <div className="space-y-8 pl-4">
              {groupedActivity.length === 0 && (
                <div className="text-gray-500 text-center py-10">Aucune activité récente.</div>
              )}
              {groupedActivity.map((group, groupIndex) => (
                <div key={groupIndex} className="relative pl-8 border-l-2 border-dashed border-gray-700 pb-8 last:pb-0">
                  {/* Date Header & Stats */}
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-gray-700 border-4 border-[#121212]"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-amber-500 mb-2 md:mb-0">
                      {group.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex gap-4 text-sm font-medium bg-white/5 p-2 rounded-lg">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {group.stats.wins} <span className="text-gray-500">wins</span></div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> {group.stats.draws} <span className="text-gray-500">draws</span></div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {group.stats.losses} <span className="text-gray-500">losses</span></div>
                    </div>
                  </div>

                  {/* List of Activities */}
                  <div className="space-y-4">
                    {group.items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${themeColors.card} rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all group cursor-pointer`}
                        onClick={() => {
                          if (item.type === 'game') navigate(`/game/${item.id}?mode=replay`)
                          else navigate(`/tournaments/${item.id}`)
                        }}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Board Visual (Left) */}
                          <div className="w-full md:w-48 bg-[#2d1b0f] relative flex items-center justify-center p-2 min-h-[160px]">
                            <div className="w-36 h-36 pointer-events-none select-none transform scale-95 group-hover:scale-100 transition-transform">
                              {item.gameType === 'chess' ? <MiniChessBoard size={144} /> : <MiniCheckersBoard size={144} />}
                            </div>
                            {/* Result Overlay on Board */}
                            {item.type === 'game' && (
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${item.result === 'win' ? 'bg-green-500 text-white' :
                                item.result === 'loss' ? 'bg-red-500 text-white' :
                                  'bg-gray-500 text-white'
                                } shadow-lg`}>
                                {item.result === 'win' ? '1' : item.result === 'loss' ? '0' : '½'}
                              </div>
                            )}
                          </div>

                          {/* Details (Right) */}
                          <div className="flex-1 p-5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-800">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                {item.variant === 'bullet' && <Zap className="w-4 h-4 text-yellow-500" />}
                                {item.variant === 'blitz' && <Flame className="w-4 h-4 text-orange-500" />}
                                {item.variant === 'rapid' && <Clock className="w-4 h-4 text-green-500" />}
                                <span className="font-bold text-gray-300 uppercase text-xs tracking-wider">
                                  {item.variant || 'Standard'} • {item.gameType === 'checkers' ? 'Dames' : 'Échecs'} • {item.type === 'game' ? 'Rated' : 'Tournament'}
                                </span>
                                {item.type === 'tournament' && (
                                  <span className="text-blue-400 text-xs flex items-center gap-1 ml-2 bg-blue-500/10 px-2 py-0.5 rounded">
                                    <Trophy className="w-3 h-3" /> {item.tournamentName}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 font-mono">{item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {item.type === 'game' ? (
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                      <div className="font-bold text-lg text-white flex items-center gap-2">
                                        {item.result === 'win' ? 'Victoire' : item.result === 'loss' ? 'Défaite' : 'Nulle'}
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${item.ratingChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                                          {item.ratingChange > 0 ? '+' : ''}{item.ratingChange}
                                        </span>
                                      </div>
                                      <span className="text-gray-400 text-sm flex items-center gap-1">
                                        vs <span className="text-white font-medium">{item.opponent}</span>
                                        <span className="text-gray-600">({item.opponentRating})</span>
                                      </span>
                                    </div>
                                    <div className="hidden md:block h-10 w-px bg-gray-800"></div>
                                    <div className="hidden md:block text-gray-500 text-sm font-mono">
                                      <div className="flex items-center gap-2"><Swords className="w-3 h-3" /> {item.moves} coups</div>
                                      <div className="text-xs opacity-70">{item.opening}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm">
                                    <div className="font-bold text-white text-lg">Ranked #{item.rank}</div>
                                    <div className="text-gray-500">Best of {item.totalPlayers} players</div>
                                  </div>
                                )}
                              </div>

                              <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stats' && profileData.stats && (
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(profileData.stats).map(([key, stat]) => (
                <div key={key} className={`${themeColors.card} rounded-xl p-6 border ${themeColors.border}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-3 text-2xl capitalize text-white">
                      <div className={`p-2 rounded-lg ${key === 'bullet' ? 'bg-yellow-500/10' : key === 'blitz' ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                        {key === 'bullet' && <Zap className="w-6 h-6 text-yellow-500" />}
                        {key === 'blitz' && <Flame className="w-6 h-6 text-orange-500" />}
                        {key === 'rapid' && <Clock className="w-6 h-6 text-green-500" />}
                      </div>
                      {key}
                    </h3>
                    <span className="text-3xl font-mono font-bold text-white tracking-tight">{stat.rating}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Total Games</span>
                      <span className="font-bold text-white">{stat.games}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden flex">
                        <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${stat.games ? (stat.wins / stat.games) * 100 : 0}%` }}></div>
                        <div className="bg-gray-600 h-full transition-all duration-1000" style={{ width: `${stat.games ? (stat.draws / stat.games) * 100 : 0}%` }}></div>
                        <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${stat.games ? (stat.losses / stat.games) * 100 : 0}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs font-medium font-mono">
                        <span className="text-green-500">{stat.wins}W ({stat.games ? Math.round((stat.wins / stat.games) * 100) : 0}%)</span>
                        <span className="text-gray-400">{stat.draws}D ({stat.games ? Math.round((stat.draws / stat.games) * 100) : 0}%)</span>
                        <span className="text-red-500">{stat.losses}L ({stat.games ? Math.round((stat.losses / stat.games) * 100) : 0}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Sidebar / Quick Stats */}
        <div className="space-y-6">
          <div className={`${themeColors.card} p-5 rounded-xl border ${themeColors.border} sticky top-24`}>
            <h4 className="font-bold text-gray-500 mb-6 text-xs uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Global Performance
            </h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <span className="text-gray-400">Games Played</span>
                <span className="font-bold text-white text-xl">{profileData.stats.bullet?.games + profileData.stats.blitz?.games + profileData.stats.rapid?.games || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex flex-col">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-xs text-green-500">+2.5% this week</span>
                </div>
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#374151" strokeWidth="4" fill="transparent" />
                    <circle cx="32" cy="32" r="28" stroke="#22c55e" strokeWidth="4" fill="transparent" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.6)}`} />
                  </svg>
                  <span className="absolute font-bold text-white text-sm">60%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tournament Points</span>
                <span className="font-bold text-amber-500 text-xl">{profileData.tournamentPoints}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800">
              <h4 className="font-bold text-gray-500 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Best Variant
              </h4>
              <div className="bg-gradient-to-br from-[#3d3933] to-transparent p-4 rounded-lg border border-[#3d3933] flex items-center gap-3">
                <Zap className="w-7 h-7 text-gray-400" />
                <div>
                  <div className="font-bold text-white">Bullet</div>
                  <div className="text-xs text-gray-400 font-mono">{profileData.stats?.bullet.rating || 1200} ELO</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
