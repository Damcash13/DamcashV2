import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Bot,
  Trophy,
  Puzzle,
  Clock,
  Zap,
  Crown,
  ChevronRight,
  Target,
  TrendingUp,
  Settings,
  Users,
  Swords,
  UserPlus,
  Search,
} from 'lucide-react'
import GameModesGrid from '../components/home/GameModesGrid'
import LiveGamesList from '../components/home/LiveGamesList'
import LeaderboardWidget from '../components/home/LeaderboardWidget'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useRealTime } from '../contexts/RealTimeContext'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'
import CreateGameModal from '../components/game/CreateGameModal'
import { MiniCheckersBoard, MiniChessBoard } from '../components/game/MiniBoards'
import WagerModal from '../components/game/WagerModal'
import SnGLobbyWidget from '../components/SnGLobbyWidget'
import ChessBoard from '../components/game/ChessBoard'
import CheckersBoard from '../components/game/CheckersBoard'
import Username from '../components/Username'
import DailyPuzzleWidget from '../components/DailyPuzzleWidget'
import { formatTimeControl } from '../data/mockLiveGames'
import { gamesAPI, type LiveGame } from '../api/gamesAPI'
import type { CheckerBoard, CheckerPiece } from '../types'

const DAILY_PUZZLE_CHESS = {
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', // Mate in 1
  solution: { notation: 'Qxf7', move: { from: { row: 3, col: 7 }, to: { row: 1, col: 5 } } }, // h5 -> f7
  title: 'Le Baiser de la Dame',
  description: 'Trouvez le coup gagnant pour les blancs (Mat en 1).',
  hint: 'Visez la case f7.'
}

// Simple 2-for-1 shot for White
// Black pieces at (3,4) and (5,4). White at (2,5). Jump 2-4 -> 4-4 -> 6-4?
// Let's make a standard layout 10x10.
// White pieces: 'w', Black pieces: 'b'
// Position: White on 32 (row 6, col 3 ?). Black on 27, 18.
// Let's construct a 10x10 board manually.
// Custom Puzzle from User
const createPuzzleBoard = (): CheckerBoard => {
  const board: CheckerPiece[][] = Array(10).fill(null).map(() => Array(10).fill(null));

  // Black pieces (Top)
  board[1][2] = 'b';
  board[2][1] = 'b';
  board[2][5] = 'b';
  board[3][2] = 'b';
  board[3][8] = 'b';
  board[4][3] = 'b'; // Center-ish
  board[4][7] = 'b';
  board[6][9] = 'b'; // Low right
  board[8][1] = 'b'; // Low left

  // White pieces (Bottom)
  board[5][0] = 'w';
  board[5][4] = 'w';
  board[5][6] = 'w';
  board[6][1] = 'w';
  board[6][3] = 'w';
  board[6][5] = 'w';
  board[7][4] = 'w';
  board[7][8] = 'w'; // Right side
  board[9][4] = 'w'; // Base

  return board;
}


const DAILY_PUZZLE_CHECKERS = {
  board: createPuzzleBoard(),
  solution: { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } },
  title: 'Défi Utilisateur',
  description: 'Problème de la communauté. Les blancs jouent et gagnent.',
  hint: 'Indice : 26-21'
}



type GameMode = 'quick' | 'ai' | 'friend' | 'tournament' | 'custom'
type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'custom'
type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

const timeControls: Record<Exclude<TimeControl, 'custom'>, { name: string; time: string; icon: React.ReactNode }> = {
  bullet: { name: 'Bullet', time: '1+0', icon: <Zap className="w-5 h-5" /> },
  blitz: { name: 'Blitz', time: '5+0', icon: <Clock className="w-5 h-5" /> },
  rapid: { name: 'Rapide', time: '15+10', icon: <Clock className="w-5 h-5" /> },
  classical: { name: 'Classique', time: '30+20', icon: <Crown className="w-5 h-5" /> }
}

const aiDifficulties: Record<AIDifficulty, { name: string; elo: string; color: string }> = {
  easy: { name: 'Facile', elo: '800', color: 'text-green-500' },
  medium: { name: 'Moyen', elo: '1200', color: 'text-yellow-500' },
  hard: { name: 'Difficile', elo: '1600', color: 'text-orange-500' },
  expert: { name: 'Expert', elo: '2000+', color: 'text-red-500' }
}
// Shared mock games are now in src/data/mockLiveGames.ts


const mockCorrespondenceGames = [
  { id: 'c1', opponent: 'GrandMaster_X', timeControl: '1 day', lastMove: '2h', myTurn: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gm1' },
  { id: 'c2', opponent: 'Novice_99', timeControl: '3 days', lastMove: '1d', myTurn: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ck2' }
];

export default function Home() {
  const { gameType, themeColors } = useTheme()
  const { user } = useAuth()
  const { onlineUsers, pendingInvitations, sendInvitation, sendMessage, subscribe } = useRealTime()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz')
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium')
  const [isSearching, setIsSearching] = useState(false)
  const [matchmakingTime, setMatchmakingTime] = useState(0)
  const [matchmakingInterval, setMatchmakingInterval] = useState<any | null>(null)
  const [pendingRequest, setPendingRequest] = useState<{ timeControl: string, gameType: string }>({ timeControl: '5+0', gameType: 'chess' })
  const [showCreateGameModal, setShowCreateGameModal] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveGames, setLiveGames] = useState<LiveGame[]>([])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (matchmakingInterval) clearInterval(matchmakingInterval)
    }
  }, [matchmakingInterval])

  // Timer Logic
  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setMatchmakingTime(prev => {
          if (prev >= 30) {
            // Timeout Logic handled in separate effect or here
            return prev
          }
          return prev + 1
        })
      }, 1000)
      setMatchmakingInterval(interval)
      return () => clearInterval(interval)
    }
  }, [isSearching])

  // Timeout Handler
  useEffect(() => {
    if (isSearching && matchmakingTime >= 30) {
      // Timeout reached: Create waiting game
      sendMessage('create_waiting_game', {
        userId: user?.id,
        gameType: pendingRequest.gameType, // Use stored gameType
        variant: 'standard',
        timeControl: pendingRequest.timeControl,
        mode: 'rated',
        color: 'random'
      })
    }
  }, [isSearching, matchmakingTime, pendingRequest, sendMessage, user])


  // Listen for match_found
  useEffect(() => {
    const handleMatchFound = (payload: any) => {
      if (isSearching) {
        setIsSearching(false)
        showToast('Adversaire trouvé !', 'success', 'La partie commence...')
        navigate(`/game/${payload.gameId}`)
      }
    }

    const unsubscribe = subscribe('match_found', handleMatchFound)
    return () => {
      unsubscribe()
    }
  }, [isSearching, subscribe, navigate, showToast])

  const handleQuickPlay = (timeControl?: string) => {
    const timeParam = timeControl || selectedTimeControl

    // Determine actual time string
    let finalTime = timeParam
    // Map 'blitz' -> '5+0' etc if needed, or use existing map
    if (timeControls[timeParam as any]) {
      finalTime = timeControls[timeParam as any].time
    } else {
      const qp = quickPairings.find(q => q.id === timeParam)
      if (qp) finalTime = qp.time
    }

    setPendingRequest({ timeControl: finalTime, gameType })
    setIsSearching(true)
    setMatchmakingTime(0)

    sendMessage('quick_match', {
      userId: user?.id,
      gameType,
      timeControl: finalTime
    })
  }

  // Fetch live games from backend
  useEffect(() => {
    const fetchLiveGames = async () => {
      const games = await gamesAPI.getLiveGames()
      setLiveGames(games)
    }
    fetchLiveGames()

    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveGames, 10000)
    return () => clearInterval(interval)
  }, [])

  const handlePlayVsAI = () => {
    const gameId = `ai_${Date.now()}`
    navigate(`/game/${gameId}?mode=ai&difficulty=${selectedDifficulty}`)
  }

  const handlePlayWithFriend = (friendId: string) => {
    sendInvitation(friendId, gameType, { initial: 300, increment: 0 }) // Default 5+0
    showToast('Invitation envoyée !', 'success', 'En attente de réponse...')
    setSelectedMode(null)
  }

  const handleAcceptInvitation = (invitationId: string) => {
    // Accept invitation logic
    showToast('Invitation acceptée !', 'success', 'La partie commence...')
    navigate(`/game/${invitationId}`)
  }

  // Quick Pairing Time Controls
  const quickPairings = [
    { id: '1+0', name: 'Bullet', time: '1+0', type: 'bullet', icon: <Zap className="w-5 h-5" /> },
    { id: '2+1', name: 'Bullet', time: '2+1', type: 'bullet', icon: <Zap className="w-5 h-5" /> },
    { id: '3+0', name: 'Blitz', time: '3+0', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
    { id: '3+2', name: 'Blitz', time: '3+2', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
    { id: '5+0', name: 'Blitz', time: '5+0', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
    { id: '5+3', name: 'Blitz', time: '5+3', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
    { id: '10+0', name: 'Rapide', time: '10+0', type: 'rapid', icon: <Target className="w-5 h-5" /> },
    { id: '15+15', name: 'Classique', time: '15+15', type: 'classical', icon: <Crown className="w-5 h-5" /> },
    { id: 'custom', name: 'Custom', time: 'Custom', type: 'custom', icon: <Settings className="w-5 h-5" /> },
  ]

  const [activeTab, setActiveTab] = useState<'quick' | 'sng' | 'lobby' | 'correspondence'>('quick')
  const [puzzleState, setPuzzleState] = useState<'idle' | 'solved' | 'failed'>('idle')
  const [puzzleKey, setPuzzleKey] = useState(0)

  const handlePuzzleReset = () => {
    setPuzzleState('idle')
    setPuzzleKey(prev => prev + 1)
  }

  const handleShowHint = () => {
    const hint = gameType === 'checkers' ? DAILY_PUZZLE_CHECKERS.hint : DAILY_PUZZLE_CHESS.hint
    showToast(hint, 'info', 'Indice')
  }



  const currentPuzzle = gameType === 'checkers' ? DAILY_PUZZLE_CHECKERS : DAILY_PUZZLE_CHESS

  const handlePuzzleMove = (moveOrNotation: any, chessNotation?: string) => {
    // Logic for Chess
    if (gameType === 'chess') {
      if (chessNotation?.includes('#') || chessNotation === 'Qxf7') {
        setPuzzleState('solved')
        showToast('Puzzle Résolu !', 'success')
      } else {
        setPuzzleState('failed')
        showToast('Coup Incorrect', 'error')
      }
    }
    // Logic for Checkers
    else {
      // Checkers Check
      const target = DAILY_PUZZLE_CHECKERS.solution;
      // CheckersBoard onMove passes (move, notation). Move object has from/to.
      if (moveOrNotation.from.row === target.from.row &&
        moveOrNotation.from.col === target.from.col &&
        moveOrNotation.to.row === target.to.row &&
        moveOrNotation.to.col === target.to.col) {
        setPuzzleState('solved');
        showToast('Bien joué !', 'success');
      } else {
        setPuzzleState('failed');
        showToast('Mauvais coup', 'error');
      }
    }
  }



  return (
    <div className="min-h-full pb-20 md:pb-0 px-4 md:px-0 max-w-7xl mx-auto pt-8">

      {/* Top Bar Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3">
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${themeColors.card} border ${themeColors.border} ${themeColors.text}`}>
            ELO: {gameType === 'checkers' ? user?.eloCheckers : user?.eloChess}
          </span>
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-green-500/10 text-green-500 border border-green-500/20`}>
            Daily: +{user?.dailyScore || 0}
          </span>
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap`} style={{ backgroundColor: themeColors.accent, color: '#000000' }}>
            {onlineUsers.length + 1} joueurs en ligne
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-mono">
          <span className={themeColors.textMuted}>
            <span className="font-bold text-green-500 mr-1">{onlineUsers.length + 143}</span>
            {t('home.players')}
          </span>
          <span className={themeColors.textMuted}>
            <span className="font-bold text-blue-500 mr-1">54</span>
            {t('home.games')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT COLUMN: Main Game Grid */}
        <div className="lg:col-span-2">

          {/* Tabs */}
          <div className="flex mb-0">
            {[
              { id: 'quick', label: t('home.quickPairing') },
              { id: 'sng', label: 'Salons Cash' },
              { id: 'lobby', label: t('home.lobby') },
              { id: 'correspondence', label: t('home.correspondence') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm transition-colors border-t border-l border-r rounded-t-lg
                            ${activeTab === tab.id
                    ? `${themeColors.bg} ${themeColors.text} border-${themeColors.border}`
                    : `bg-transparent ${themeColors.textMuted} border-transparent hover:${themeColors.text}`
                  }
                        `}
                style={{
                  borderBottom: activeTab === tab.id ? `2px solid ${gameType === 'checkers' ? '#7fa650' : '#3692e7'}` : '1px solid transparent',
                  marginBottom: -1
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className={`${themeColors.card} border ${themeColors.border} rounded-b-lg rounded-tr-lg p-6 shadow-sm min-h-[400px]`}>

            {activeTab === 'quick' && (
              <GameModesGrid
                themeColors={themeColors}
                onQuickPlay={(id) => handleQuickPlay(id)}
                onCreateGame={() => setShowCreateGameModal(true)}
                gameType={gameType}
              />
            )}

            {activeTab === 'lobby' && (
              <div className="text-center py-20">
                <p className={themeColors.textMuted}>{t('home.noPublicGames')}</p>
                <button
                  onClick={() => setShowCreateGameModal(true)}
                  className={`mt-4 px-6 py-2 rounded ${themeColors.buttonPrimary} font-medium`}
                >
                  {t('home.createGameBtn')}
                </button>
              </div>
            )}

            {activeTab === 'sng' && (
              <div className="py-2">
                <SnGLobbyWidget
                  onJoin={(tierId) => {
                    navigate(`/tournament/${tierId}`);
                  }}
                />
              </div>
            )}

            {activeTab === 'correspondence' && (
              <div className="py-2">
                <p className={`text-sm mb-6 ${themeColors.textMuted} text-center`}>
                  {t('home.correspondenceDescription')}
                </p>

                {/* Active Games Section */}
                {mockCorrespondenceGames.length > 0 && (
                  <div className="mb-6">
                    <h3 className={`font-bold mb-3 ${themeColors.text} flex items-center gap-2`}>
                      <Clock className="w-4 h-4" /> {t('home.activeGames')}
                    </h3>
                    <div className="space-y-3">
                      {mockCorrespondenceGames.map(game => (
                        <div
                          key={game.id}
                          className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${themeColors.cardHover}`}
                          style={{ borderColor: themeColors.border }}
                        >
                          <div className="flex items-center gap-3">
                            <img src={game.avatar} alt={game.opponent} className="w-10 h-10 rounded-full bg-gray-200" />
                            <div>
                              <p className={`font-medium ${themeColors.text}`}>{game.opponent}</p>
                              <p className={`text-xs ${themeColors.textMuted}`}>
                                {game.timeControl} • {t('home.waitingOpponent')} {game.lastMove}
                              </p>
                            </div>
                          </div>
                          <div>
                            {game.myTurn ? (
                              <button
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm ${themeColors.buttonPrimary}`}
                              >
                                {t('home.yourTurn')}
                              </button>
                            ) : (
                              <span className={`text-xs font-medium px-3 py-1 rounded-full bg-gray-500/10 ${themeColors.textMuted}`}>
                                {t('home.waitingOpponent')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Start New Game Section */}
                <div className="border-t pt-6" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold ${themeColors.text}`}>{t('home.randomOpponent')}</h3>
                    <button
                      onClick={() => setSelectedMode('friend')}
                      className={`text-sm px-3 py-1 rounded-lg border ${themeColors.border} ${themeColors.cardHover} ${themeColors.text} transition-colors flex items-center gap-2`}
                    >
                      <Users className="w-4 h-4" />
                      {t('home.challengeFriend')}
                    </button>
                  </div>

                  <p className={`text-xs mb-3 ${themeColors.textMuted}`}>
                    {t('home.findOpponent')}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {[1, 3, 7].map(days => (
                      <button
                        key={days}
                        onClick={() => showToast(t('home.invitationSent'), 'success')}
                        className={`p-3 rounded-lg border transition-all hover:scale-105 ${themeColors.cardHover}`}
                        style={{ borderColor: themeColors.border }}
                      >
                        <div className={`font-bold text-lg ${themeColors.text}`}>{days}</div>
                        <div className={`text-xs ${themeColors.textMuted}`}>{days > 1 ? t('home.days') : t('home.day')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons below grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <button
              onClick={() => setShowCreateGameModal(true)}
              className={`py-3 px-4 rounded shadow-sm text-sm font-medium transition-colors border ${themeColors.border} ${themeColors.card} ${themeColors.text} hover:brightness-95`}
            >
              {t('common.createGame')}
            </button>
            <button
              onClick={() => setSelectedMode('friend')}
              className={`py-3 px-4 rounded shadow-sm text-sm font-medium transition-colors border ${themeColors.border} ${themeColors.card} ${themeColors.text} hover:brightness-95`}
            >
              {t('common.playFriend')}
            </button>
            <button
              onClick={() => setSelectedMode('ai')}
              className={`py-3 px-4 rounded shadow-sm text-sm font-medium transition-colors border ${themeColors.border} ${themeColors.card} ${themeColors.text} hover:brightness-95`}
            >
              {t('common.playComputer')}
            </button>
          </div>

        </div>

        {/* CENTER/RIGHT COLUMN: Leaderboards & Tournaments */}
        <div className="lg:col-span-2 space-y-6">




          {/* Daily Puzzle Widget - Now from backend */}
          <DailyPuzzleWidget themeColors={themeColors} gameType={gameType} />

          <LeaderboardWidget themeColors={themeColors} t={t} />

        </div>

      </div>

      {/* Pending Invitations (Floating or Integrated) */}
      <AnimatePresence>
        {pendingInvitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 w-80 ${themeColors.card} border ${themeColors.border} rounded-lg shadow-xl p-4 z-50`}
          >
            {/* ... existing invitation code adapted ... */}
            <h3 className={`text-sm font-bold mb-3 ${themeColors.text}`}>
              {t('home.pendingInvitations')} ({pendingInvitations.length})
            </h3>
            {/* Minimalist list */}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Quick Stats */}
      <div className={`${themeColors.card} rounded-2xl p-5 border ${themeColors.border} mb-8`}>
        <h3 className={`font-bold ${themeColors.text} mb-4 flex items-center gap-2`}>
          <TrendingUp className="w-5 h-5" />
          Vos Statistiques
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${themeColors.text}`}>156</p>
            <p className={`text-sm ${themeColors.textMuted}`}>{t('home.games')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">89</p>
            <p className={`text-sm ${themeColors.textMuted}`}>{t('home.wins')}</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${themeColors.text}`}>57.1%</p>
            <p className={`text-sm ${themeColors.textMuted}`}>{t('home.winRate')}</p>
          </div>
        </div>
      </div>

      {/* Online Friends */}
      <div className={`${themeColors.card} rounded-2xl p-5 border ${themeColors.border}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${themeColors.text} flex items-center gap-2`}>
            <Users className="w-5 h-5" />
            {t('home.onlineFriends')} ({onlineUsers.length})
          </h3>
          <button
            onClick={() => setShowAddFriend(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium`}
            style={{ backgroundColor: themeColors.accent, color: '#000000' }}
          >
            <UserPlus className="w-4 h-4" />
            {t('home.add')}
          </button>
        </div>
        <div className="space-y-3">
          {onlineUsers.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gameType === 'checkers' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500'
                    } flex items-center justify-center text-white font-bold`}>
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className={`font-medium ${themeColors.text}`}>{friend.username}</p>
                  <p className={`text-sm ${themeColors.textMuted}`}>
                    {friend.isOnline ? `🟢 ${t('common.online')}` : `⚪️ ${t('common.offline')}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handlePlayWithFriend(friend.id)}
                className={`p-2 rounded-lg ${themeColors.cardHover} ${themeColors.text} hover:${themeColors.accent} hover:text-white transition`}
              >
                <Swords className="w-5 h-5" />
              </button>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p className={`text-center py-4 ${themeColors.textMuted}`}>
              {t('home.noOnlineFriends')}
            </p>
          )}
        </div>
      </div>

      {/* Live Games - Full Width Section at Bottom */}
      <div className={`${themeColors.card} rounded-2xl p-5 border ${themeColors.border} mt-8`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-bold ${themeColors.text} flex items-center gap-2`}>
            <Zap className="w-5 h-5 text-red-500" />
            {t('home.liveGames')}
          </h3>
          <button
            onClick={() => navigate('/spectate')}
            className={`text-sm hover:underline ${themeColors.textMuted}`}
          >
            {t('home.seeAll')}
          </button>
        </div>

        <LiveGamesList
          liveGames={liveGames}
          gameType={gameType}
          themeColors={themeColors}
          t={t}
        />
      </div>

      {/* Matchmaking Modal */}
      {isSearching && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black font-mono text-white">{30 - matchmakingTime}</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Recherche d'un adversaire...</h2>
            <p className="text-gray-400 mb-8">
              {pendingRequest.timeControl} • {gameType === 'checkers' ? 'Dames' : 'Échecs'}
            </p>

            <div className="text-sm text-gray-500 mb-8">
              {matchmakingTime > 15
                ? "Désolé pour l'attente, création d'une partie publique imminente..."
                : "Nous recherchons un joueur disponible..."}
            </div>

            <button
              onClick={() => setIsSearching(false)}
              className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Mode Selection Modal */}
      {selectedMode && selectedMode !== 'tournament' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMode(null)}
        >
          <div
            className={`${themeColors.card} rounded-2xl p-6 w-full max-w-md border ${themeColors.border}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Play Mode */}
            {selectedMode === 'quick' && (
              <>
                <h2 className={`text-xl font-bold ${themeColors.text} mb-4`}>Partie Rapide</h2>
                <p className={`${themeColors.textMuted} mb-6`}>Choisissez le contrôle de temps</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(Object.keys(timeControls) as TimeControl[]).map((tc) => (
                    <button
                      key={tc}
                      onClick={() => setSelectedTimeControl(tc)}
                      className={`p-4 rounded-xl border-2 transition-all ${selectedTimeControl === tc
                        ? `${themeColors.accent} border-transparent text-white`
                        : `${themeColors.cardHover} ${themeColors.border} ${themeColors.text}`
                        }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {timeControls[tc].icon}
                      </div>
                      <p className="font-bold">{timeControls[tc].name}</p>
                      <p className="text-sm opacity-75">{timeControls[tc].time}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleQuickPlay()}
                  disabled={isSearching}
                  className={`w-full py-4 rounded-xl ${themeColors.accent} text-white font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50`}
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      Trouver un adversaire
                    </>
                  )}
                </button>
              </>
            )}

            {/* AI Mode */}
            {selectedMode === 'ai' && (
              <>
                <h2 className={`text-xl font-bold ${themeColors.text} mb-4`}>Jouer contre l'IA</h2>
                <p className={`${themeColors.textMuted} mb-6`}>Choisissez la difficulté</p>

                <div className="space-y-3 mb-6">
                  {(Object.keys(aiDifficulties) as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${selectedDifficulty === diff
                        ? `${themeColors.accent} border-transparent text-white`
                        : `${themeColors.cardHover} ${themeColors.border} ${themeColors.text}`
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6" />
                        <span className="font-bold">{aiDifficulties[diff].name}</span>
                      </div>
                      <span className={selectedDifficulty === diff ? 'text-white' : aiDifficulties[diff].color}>
                        ~{aiDifficulties[diff].elo} ELO
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePlayVsAI}
                  className={`w-full py-4 rounded-xl ${themeColors.accent} text-white font-bold text-lg flex items-center justify-center gap-3`}
                >
                  <Bot className="w-6 h-6" />
                  Commencer la partie
                </button>
              </>
            )}

            {/* Friend Mode */}
            {selectedMode === 'friend' && (
              <>
                <h2 className={`text-xl font-bold ${themeColors.text} mb-4`}>Défier un Ami</h2>
                <p className={`${themeColors.textMuted} mb-6`}>Sélectionnez un ami en ligne</p>

                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {onlineUsers.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handlePlayWithFriend(friend.id)}
                      className={`w-full p-4 rounded-xl ${themeColors.cardHover} border ${themeColors.border} flex items-center justify-between transition-all hover:scale-[1.02]`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gameType === 'checkers' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500'
                          } flex items-center justify-center text-white font-bold`}>
                          {friend.username[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${themeColors.text}`}>{friend.username}</p>
                          <p className={`text-sm ${themeColors.textMuted}`}>
                            {friend.isOnline ? 'Disponible' : 'Hors ligne'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${themeColors.textMuted}`} />
                    </button>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className={`text-center py-8 ${themeColors.textMuted}`}>
                      Aucun ami en ligne pour le moment
                    </p>
                  )}
                </div>

                <button
                  onClick={() => navigate('/lobby')}
                  className={`w-full py-4 rounded-xl ${themeColors.cardHover} ${themeColors.text} font-bold text-lg border ${themeColors.border}`}
                >
                  Voir le Lobby
                </button>
              </>
            )}

            {/* Custom Mode (Create a game default) */}
            {selectedMode === 'custom' && (
              <>
                <h2 className={`text-xl font-bold ${themeColors.text} mb-4`}>Créer une partie</h2>
                <p className={`${themeColors.textMuted} mb-6`}>Partie personnalisée</p>
                <div className="text-center py-8">
                  <p className={themeColors.textMuted}>Options personnalisées bientôt disponibles.</p>
                </div>
                <button className={`w-full py-4 rounded-xl ${themeColors.accent} text-white font-bold`} onClick={() => navigate('/lobby')}>
                  Aller au lobby
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedMode(null)}
              className={`w-full mt-4 py-3 rounded-xl ${themeColors.textMuted} hover:${themeColors.text} transition`}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${themeColors.card} rounded-2xl p-6 w-full max-w-md border ${themeColors.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={`text-xl font-bold ${themeColors.text} mb-4`}>Ajouter un ami</h2>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeColors.textMuted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom d'utilisateur..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${themeColors.cardHover} border ${themeColors.border} ${themeColors.text} placeholder:${themeColors.textMuted} focus:ring-2 focus:ring-${themeColors.accent} outline-none`}
                />
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {[
                  { id: 'u1', username: 'GrandMaster42', elo: 1850, isOnline: true },
                  { id: 'u2', username: 'ChessKing99', elo: 1720, isOnline: false },
                  { id: 'u3', username: 'QueenSlayer', elo: 1650, isOnline: true },
                  { id: 'u4', username: 'TacticalGenius', elo: 1580, isOnline: false },
                  { id: 'u5', username: 'RookMaster', elo: 1490, isOnline: true },
                ].filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${themeColors.cardHover} border ${themeColors.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gameType === 'checkers' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-indigo-500'} flex items-center justify-center text-white font-bold`}>
                          {user.username[0].toUpperCase()}
                        </div>
                        {user.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${themeColors.text}`}>{user.username}</p>
                        <p className={`text-sm ${themeColors.textMuted}`}>ELO: {user.elo}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        showToast(`Demande d'ami envoyée à ${user.username}`, 'success');
                        setShowAddFriend(false);
                      }}
                      className={`px-4 py-2 rounded-lg ${themeColors.accent} text-white hover:opacity-90 transition-opacity text-sm font-medium`}
                    >
                      Ajouter
                    </button>
                  </div>
                ))}
                {searchQuery && [
                  { id: 'u1', username: 'GrandMaster42', elo: 1850 },
                  { id: 'u2', username: 'ChessKing99', elo: 1720 },
                  { id: 'u3', username: 'QueenSlayer', elo: 1650 },
                  { id: 'u4', username: 'TacticalGenius', elo: 1580 },
                  { id: 'u5', username: 'RookMaster', elo: 1490 },
                ].filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-8">
                      <p className={themeColors.textMuted}>Aucun utilisateur trouvé</p>
                    </div>
                  )}
              </div>

              <button
                onClick={() => setShowAddFriend(false)}
                className={`w-full py-3 rounded-xl ${themeColors.cardHover} ${themeColors.text} font-medium border ${themeColors.border}`}
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateGameModal
        isOpen={showCreateGameModal}
        onClose={() => setShowCreateGameModal(false)}
      />
    </div>
  )
}
