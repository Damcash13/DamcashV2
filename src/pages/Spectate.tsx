import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Eye,
  Users,
  Clock,
  Star,
  Trophy,
  Zap,
  Filter,
  Search,
  ArrowLeft,
  Play,
  ChevronRight,
  Target,
  Flame,
  TrendingUp,
  Radio,
  MessageSquare,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import CheckersBoard from '../components/game/CheckersBoard';
import Username from '../components/Username';
import { formatTimeControl } from '../data/mockLiveGames';
import { gamesAPI, type LiveGame } from '../api/gamesAPI';

// Live games are now imported from MOCK_LIVE_GAMES


const topStreamers = [
  { id: '1', username: 'GM_Viktor', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viktor', viewers: 1250, isLive: true },
  { id: '2', username: 'ChessQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=queen', viewers: 890, isLive: true },
  { id: '3', username: 'DamesMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dames', viewers: 456, isLive: false },
  { id: '4', username: 'TacticsPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tactics', viewers: 234, isLive: true },
];

type FilterType = 'all' | 'checkers' | 'chess' | 'tournament';

const Spectate: React.FC = () => {
  const { themeColors, currentTheme, setGameType } = useTheme();
  const navigate = useNavigate();
  const { gameId } = useParams();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);

  // Handle direct link to game
  useEffect(() => {
    if (gameId) {
      const game = liveGames.find(g => g.id === gameId);
      if (game) {
        setSelectedGame(game);
      }
    }
  }, [gameId, liveGames]);
  const [showChat, setShowChat] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { id: '1', user: 'Fan123', message: 'What a game!' },
    { id: '2', user: 'ChessLover', message: 'Amazing sacrifice!' },
    { id: '3', user: 'Spectator42', message: 'GG incoming' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const filteredGames = liveGames.filter(game => {
    if (filter === 'checkers' && game.gameType !== 'checkers') return false;
    if (filter === 'chess' && game.gameType !== 'chess') return false;
    if (filter === 'tournament' && !game.tournament) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (game.whitePlayer?.username || '').toLowerCase().includes(query) ||
        (game.blackPlayer?.username || '').toLowerCase().includes(query) ||
        (game.tournament || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const featuredGames = filteredGames.filter(g => g.featured);
  const regularGames = filteredGames.filter(g => !g.featured);

  const getTierColor = (tier?: string) => {
    if (!tier) return 'text-gray-500';
    const colors: Record<string, string> = {
      grandmaster: 'text-purple-500',
      master: 'text-red-500',
      expert: 'text-yellow-500',
      diamond: 'text-cyan-500',
      platinum: 'text-slate-400',
    };
    return colors[tier] || 'text-gray-500';
  };

  const formatDuration = (startedAt: Date) => {
    const minutes = Math.floor((Date.now() - startedAt.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), user: 'You', message: newMessage }]);
      setNewMessage('');
    }
  };

  const handleWatchGame = (game: LiveGame) => {
    setSelectedGame(game);
  };

  // Fetch live games from backend
  useEffect(() => {
    const fetchLiveGames = async () => {
      const games = await gamesAPI.getLiveGames();
      setLiveGames(games);
    };
    fetchLiveGames();

    // Refresh every 5 seconds for spectate page
    const interval = setInterval(fetchLiveGames, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mock board state for preview (using string notation: 'w'=white, 'W'=white king, 'b'=black, 'B'=black king)
  const mockBoardState = Array(10).fill(null).map((_, row) =>
    Array(10).fill(null).map((_, col) => {
      if ((row + col) % 2 === 1) {
        if (row < 4) return row === 0 ? 'B' : 'b'; // Black pieces, kings on row 0
        if (row > 5) return row === 9 ? 'W' : 'w'; // White pieces, kings on row 9
      }
      return null;
    })
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-4" style={{ backgroundColor: themeColors.background }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                <ArrowLeft size={20} style={{ color: themeColors.text }} />
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                  <Eye size={24} style={{ color: themeColors.accent }} />
                  Spectate
                </h1>
                <p className="text-sm" style={{ color: themeColors.textMuted }}>
                  Watch live games
                </p>
              </div>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ backgroundColor: themeColors.card }}>
              <Radio size={16} className="text-red-500 animate-pulse" />
              <span style={{ color: themeColors.text }}>{liveGames.length} Live</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder="Search players or tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
                style={{
                  backgroundColor: themeColors.card,
                  color: themeColors.text,
                }}
              />
            </div>
            <button
              className="p-3 rounded-xl"
              style={{ backgroundColor: themeColors.card }}
            >
              <RefreshCw size={20} style={{ color: themeColors.textMuted }} />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Games', icon: <Eye size={16} /> },
              { id: 'checkers', label: 'Dames', icon: <Target className="w-4 h-4" /> },
              { id: 'chess', label: 'Échecs', icon: <ChevronRight className="w-4 h-4" /> },
              { id: 'tournament', label: 'Tournaments', icon: <Trophy size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilter(tab.id as FilterType);
                  if (tab.id === 'chess' || tab.id === 'checkers') {
                    setGameType(tab.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all"
                style={{
                  backgroundColor: filter === tab.id ? themeColors.accent : themeColors.card,
                  color: filter === tab.id ? '#fff' : themeColors.text,
                }}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Selected Game View */}
        <AnimatePresence>
          {selectedGame && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                {/* Game Header */}
                <div className="p-4 flex items-center justify-between"
                  style={{ borderBottom: `1px solid ${themeColors.hover}` }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: themeColors.hover }}
                    >
                      <ArrowLeft size={18} style={{ color: themeColors.text }} />
                    </button>
                    {selectedGame.tournament && (
                      <div className="flex items-center gap-2">
                        <Trophy size={16} style={{ color: themeColors.accent }} />
                        <span className="font-medium" style={{ color: themeColors.accent }}>
                          {selectedGame.tournament}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20">
                      <Radio size={12} className="text-red-500" />
                      <span className="text-red-500 text-sm font-medium">LIVE</span>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full"
                      style={{ backgroundColor: themeColors.hover }}>
                      <Eye size={14} style={{ color: themeColors.textMuted }} />
                      <span className="text-sm" style={{ color: themeColors.textMuted }}>
                        {selectedGame.spectators}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game Content */}
                <div className="flex flex-col lg:flex-row">
                  {/* Board Area */}
                  <div className="flex-1 p-4">
                    {/* Players */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedGame.blackPlayer?.avatarUrl}
                          alt={selectedGame.blackPlayer?.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <Username
                            userId={selectedGame.blackPlayer?.id || ''}
                            username={selectedGame.blackPlayer?.username || ''}
                            elo={selectedGame.gameType === 'checkers' ? selectedGame.blackPlayer?.eloCheckers : selectedGame.blackPlayer?.eloChess}
                            title={selectedGame.gameType === 'checkers' ? selectedGame.blackPlayer?.tierCheckers : selectedGame.blackPlayer?.tierChess}
                            className={`font-bold ${getTierColor(selectedGame.gameType === 'checkers' ? selectedGame.blackPlayer?.tierCheckers : selectedGame.blackPlayer?.tierChess)}`}
                          />
                          <p className="text-sm" style={{ color: themeColors.textMuted }}>
                            {selectedGame.gameType === 'checkers' ? selectedGame.blackPlayer?.eloCheckers : selectedGame.blackPlayer?.eloChess}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
                        <span className="font-mono font-bold" style={{ color: themeColors.text }}>5:42</span>
                      </div>
                    </div>

                    {/* Board Preview */}
                    <div className="aspect-square max-w-md mx-auto rounded-xl overflow-hidden">
                      {/* @ts-ignore - CheckersBoard prop mismatch */}
                      <CheckersBoard
                        board={mockBoardState}
                        onSquareClick={() => { }}
                        selectedPiece={null}
                        validMoves={[]}
                        currentTurn="white"
                        isPlayerTurn={false}
                      />
                    </div>

                    {/* White Player */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedGame.whitePlayer?.avatarUrl}
                          alt={selectedGame.whitePlayer?.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <Username
                            userId={selectedGame.whitePlayer?.id || ''}
                            username={selectedGame.whitePlayer?.username || ''}
                            elo={selectedGame.gameType === 'checkers' ? selectedGame.whitePlayer?.eloCheckers : selectedGame.whitePlayer?.eloChess}
                            title={selectedGame.gameType === 'checkers' ? selectedGame.whitePlayer?.tierCheckers : selectedGame.whitePlayer?.tierChess}
                            className={`font-bold ${getTierColor(selectedGame.gameType === 'checkers' ? selectedGame.whitePlayer?.tierCheckers : selectedGame.whitePlayer?.tierChess)}`}
                          />
                          <p className="text-sm" style={{ color: themeColors.textMuted }}>
                            {selectedGame.gameType === 'checkers' ? selectedGame.whitePlayer?.eloCheckers : selectedGame.whitePlayer?.eloChess}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-xl" style={{ backgroundColor: themeColors.accent }}>
                        <span className="font-mono font-bold text-white">7:15</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: themeColors.hover }}
                      >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                      </button>
                      <button
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: themeColors.hover }}
                      >
                        <Share2 size={20} style={{ color: themeColors.textMuted }} />
                      </button>
                      <button
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: themeColors.hover }}
                      >
                        <Heart size={20} style={{ color: themeColors.textMuted }} />
                      </button>
                      <button
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: themeColors.hover }}
                      >
                        <Maximize2 size={20} style={{ color: themeColors.textMuted }} />
                      </button>
                    </div>
                  </div>

                  {/* Chat Area */}
                  {showChat && (
                    <div className="w-full lg:w-80 flex flex-col"
                      style={{ borderLeft: `1px solid ${themeColors.hover}` }}>
                      <div className="p-3 flex items-center justify-between"
                        style={{ borderBottom: `1px solid ${themeColors.hover}` }}>
                        <span className="font-medium" style={{ color: themeColors.text }}>Live Chat</span>
                        <button onClick={() => setShowChat(false)}>
                          <MessageSquare size={18} style={{ color: themeColors.textMuted }} />
                        </button>
                      </div>
                      <div className="flex-1 p-3 space-y-2 max-h-64 overflow-y-auto">
                        {chatMessages.map((msg) => (
                          <div key={msg.id}>
                            <span className="font-medium" style={{ color: themeColors.accent }}>{msg.user}: </span>
                            <span style={{ color: themeColors.text }}>{msg.message}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-3" style={{ borderTop: `1px solid ${themeColors.hover}` }}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Send a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                          />
                          <button
                            onClick={handleSendMessage}
                            className="px-4 py-2 rounded-lg"
                            style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Games */}
        {featuredGames.length > 0 && !selectedGame && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
              <Star size={20} style={{ color: themeColors.accent }} />
              Featured Games
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleWatchGame(game)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.accent}20, ${themeColors.accent}40)`,
                    border: `2px solid ${themeColors.accent}50`,
                  }}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500">
                      <Radio size={10} className="text-white" />
                      <span className="text-white text-xs font-medium">LIVE</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {game.tournament && (
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy size={14} style={{ color: themeColors.accent }} />
                        <span className="text-xs font-medium" style={{ color: themeColors.accent }}>
                          {game.tournament}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {/* White Player */}
                      <div className="flex items-center gap-3">
                        <img
                          src={game.whitePlayer?.avatarUrl}
                          alt={game.whitePlayer?.username}
                          className="w-12 h-12 rounded-full border-2 border-white"
                        />
                        <div>
                          <Username
                            userId={game.whitePlayer?.id || ''}
                            username={game.whitePlayer?.username || ''}
                            elo={game.gameType === 'checkers' ? game.whitePlayer?.eloCheckers : game.whitePlayer?.eloChess}
                            title={game.gameType === 'checkers' ? game.whitePlayer?.tierCheckers : game.whitePlayer?.tierChess}
                            className={`font-bold ${getTierColor(game.gameType === 'checkers' ? game.whitePlayer?.tierCheckers : game.whitePlayer?.tierChess)}`}
                          />
                          <p className="text-sm" style={{ color: themeColors.textMuted }}>
                            {game.gameType === 'checkers' ? game.whitePlayer?.eloCheckers : game.whitePlayer?.eloChess}
                          </p>
                        </div>
                      </div>

                      <div className="text-2xl font-bold" style={{ color: themeColors.text }}>VS</div>

                      {/* Black Player */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Username
                            userId={game.blackPlayer?.id || ''}
                            username={game.blackPlayer?.username || ''}
                            elo={game.gameType === 'checkers' ? game.blackPlayer?.eloCheckers : game.blackPlayer?.eloChess}
                            title={game.gameType === 'checkers' ? game.blackPlayer?.tierCheckers : game.blackPlayer?.tierChess}
                            className={`font-bold ${getTierColor(game.gameType === 'checkers' ? game.blackPlayer?.tierCheckers : game.blackPlayer?.tierChess)}`}
                          />
                          <p className="text-sm" style={{ color: themeColors.textMuted }}>
                            {game.gameType === 'checkers' ? game.blackPlayer?.eloCheckers : game.blackPlayer?.eloChess}
                          </p>
                        </div>
                        <img
                          src={game.blackPlayer?.avatarUrl}
                          alt={game.blackPlayer?.username}
                          className="w-12 h-12 rounded-full border-2 border-gray-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3"
                      style={{ borderTop: `1px solid ${themeColors.hover}` }}>
                      <div className="flex items-center gap-4 text-sm" style={{ color: themeColors.textMuted }}>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{game.spectators}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{formatTimeControl(game.timeControl)}</span>
                        </div>
                        <span>Move {game.moveNumber}</span>
                      </div>
                      <button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        <Play size={16} />
                        Watch
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Live Games */}
        {!selectedGame && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
              <Zap size={20} style={{ color: themeColors.accent }} />
              All Live Games
            </h2>
            <div className="space-y-3">
              {(featuredGames.length > 0 ? regularGames : filteredGames).map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleWatchGame(game)}
                  className="p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Game Type Icon */}
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: themeColors.hover }}>
                        {game.gameType === 'checkers' ? <Target className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>

                      {/* Players */}
                      <div>
                        <div className="flex items-center gap-2">
                          <Username
                            userId={game.whitePlayer?.id || ''}
                            username={game.whitePlayer?.username || ''}
                            elo={game.gameType === 'checkers' ? game.whitePlayer?.eloCheckers : game.whitePlayer?.eloChess}
                            title={game.gameType === 'checkers' ? game.whitePlayer?.tierCheckers : game.whitePlayer?.tierChess}
                            className={`font-medium ${getTierColor(game.gameType === 'checkers' ? game.whitePlayer?.tierCheckers : game.whitePlayer?.tierChess)}`}
                          />
                          <span style={{ color: themeColors.textMuted }}>
                            ({game.gameType === 'checkers' ? game.whitePlayer?.eloCheckers : game.whitePlayer?.eloChess})
                          </span>
                          <span style={{ color: themeColors.textMuted }}>vs</span>
                          <Username
                            userId={game.blackPlayer?.id || ''}
                            username={game.blackPlayer?.username || ''}
                            elo={game.gameType === 'checkers' ? game.blackPlayer?.eloCheckers : game.blackPlayer?.eloChess}
                            title={game.gameType === 'checkers' ? game.blackPlayer?.tierCheckers : game.blackPlayer?.tierChess}
                            className={`font-medium ${getTierColor(game.gameType === 'checkers' ? game.blackPlayer?.tierCheckers : game.blackPlayer?.tierChess)}`}
                          />
                          <span style={{ color: themeColors.textMuted }}>
                            ({game.gameType === 'checkers' ? game.blackPlayer?.eloCheckers : game.blackPlayer?.eloChess})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: themeColors.textMuted }}>
                          {game.tournament && (
                            <span className="flex items-center gap-1">
                              <Trophy size={12} />
                              {game.tournament}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTimeControl(game.timeControl)}
                          </span>
                          <span>Move {game.moveNumber}</span>
                          <span>{game.startedAt ? formatDuration(game.startedAt) : '10m'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{ backgroundColor: themeColors.hover }}>
                        <Eye size={14} style={{ color: themeColors.textMuted }} />
                        <span className="text-sm" style={{ color: themeColors.textMuted }}>
                          {game.spectators}
                        </span>
                      </div>
                      <ChevronRight size={20} style={{ color: themeColors.textMuted }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Top Streamers */}
        {!selectedGame && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
              <Radio size={20} style={{ color: themeColors.accent }} />
              Top Streamers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topStreamers.map((streamer, index) => (
                <motion.div
                  key={streamer.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl text-center"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="relative inline-block">
                    <img
                      src={streamer.avatar}
                      alt={streamer.username}
                      className="w-16 h-16 rounded-full mx-auto"
                    />
                    {streamer.isLive && (
                      <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        LIVE
                      </div>
                    )}
                  </div>
                  <Username
                    userId={streamer.id}
                    username={streamer.username}
                    className="font-bold mt-2 block"
                  />
                  <p className="text-sm flex items-center justify-center gap-1" style={{ color: themeColors.textMuted }}>
                    <Eye size={12} />
                    {streamer.viewers.toLocaleString()} viewers
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* No Games Found */}
        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <Eye size={48} className="mx-auto mb-4" style={{ color: themeColors.textMuted }} />
            <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>No live games found</h3>
            <p style={{ color: themeColors.textMuted }}>Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Spectate;
