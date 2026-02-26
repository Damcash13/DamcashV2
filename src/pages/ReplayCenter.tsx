import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Search,
  Filter,
  Clock,
  Calendar,
  Target,
  Zap,
  AlertTriangle,
  Settings,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import CheckersBoard from '../components/game/CheckersBoard';

interface GameReplay {
  id: string;
  gameType: 'checkers' | 'chess';
  whitePlayer: {
    id: string;
    username: string;
    avatar: string;
    elo: number;
  };
  blackPlayer: {
    id: string;
    username: string;
    avatar: string;
    elo: number;
  };
  result: 'white' | 'black' | 'draw';
  moves: string[];
  duration: number;
  playedAt: string;
  opening: string;
  analysis?: {
    blunders: number[];
    mistakes: number[];
    brilliant: number[];
  };
  isBookmarked: boolean;
  views: number;
}

interface MoveAnalysis {
  moveNumber: number;
  move: string;
  evaluation: number;
  type: 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'normal';
  comment?: string;
}

const ReplayCenter: React.FC = () => {
  const { themeColors, gameType } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedGame, setSelectedGame] = useState<GameReplay | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-games' | 'featured' | 'bookmarked'>('my-games');

  // Mock data
  const games: GameReplay[] = [
    {
      id: '1',
      gameType: 'checkers',
      whitePlayer: { id: user?.id || '1', username: user?.username || 'You', avatar: '⭐', elo: 1850 },
      blackPlayer: { id: '2', username: 'GrandMaster99', avatar: '👑', elo: 2450 },
      result: 'black',
      moves: ['32-28', '19-23', '28-19', '14-23', '34-30', '10-14', '37-32', '5-10', '41-37', '20-25', '30-19', '14-23', '32-28', '23-32', '37-28', '17-21'],
      duration: 1245,
      playedAt: '2024-01-15T14:30:00',
      opening: 'Défense Classique',
      analysis: { blunders: [8, 14], mistakes: [5, 11], brilliant: [3] },
      isBookmarked: true,
      views: 124
    },
    {
      id: '2',
      gameType: 'checkers',
      whitePlayer: { id: '3', username: 'TacticalKing', avatar: '♟️', elo: 2280 },
      blackPlayer: { id: user?.id || '1', username: user?.username || 'You', avatar: '⭐', elo: 1850 },
      result: 'black',
      moves: ['32-28', '18-23', '28-19', '14-23', '33-28', '12-18', '39-33', '7-12', '44-39', '1-7', '50-44', '20-25'],
      duration: 980,
      playedAt: '2024-01-14T18:00:00',
      opening: 'Ouverture Agressive',
      analysis: { blunders: [], mistakes: [7], brilliant: [5, 9] },
      isBookmarked: false,
      views: 89
    },
    {
      id: '3',
      gameType: 'checkers',
      whitePlayer: { id: user?.id || '1', username: user?.username || 'You', avatar: '⭐', elo: 1850 },
      blackPlayer: { id: '4', username: 'ProPlayer42', avatar: '🎯', elo: 2150 },
      result: 'draw',
      moves: ['32-28', '17-22', '28-17', '11-22', '37-32', '6-11', '41-37', '1-6', '34-29', '19-23', '29-24', '20-25'],
      duration: 1560,
      playedAt: '2024-01-13T10:15:00',
      opening: 'Système Symétrique',
      analysis: { blunders: [], mistakes: [], brilliant: [] },
      isBookmarked: true,
      views: 56
    }
  ];

  const featuredGames: GameReplay[] = [
    {
      id: '4',
      gameType: 'checkers',
      whitePlayer: { id: '5', username: 'WorldChamp', avatar: '🏆', elo: 2650 },
      blackPlayer: { id: '6', username: 'Challenger', avatar: '⚡', elo: 2580 },
      result: 'white',
      moves: ['32-28', '19-23', '28-19', '14-23', '34-30', '10-14', '37-32', '5-10', '41-37', '20-25', '30-19', '14-23'],
      duration: 2340,
      playedAt: '2024-01-10T15:00:00',
      opening: 'Finale de Championnat',
      analysis: { blunders: [], mistakes: [4], brilliant: [7, 11, 15] },
      isBookmarked: false,
      views: 5420
    }
  ];

  // Playback control
  useEffect(() => {
    // @ts-ignore - NodeJS.Timeout type issue
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedGame && currentMoveIndex < selectedGame.moves.length - 1) {
      interval = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          if (prev >= selectedGame.moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedGame, currentMoveIndex, playbackSpeed]);

  const getMoveAnalysis = (moveIndex: number): MoveAnalysis | null => {
    if (!selectedGame?.analysis) return null;

    let type: MoveAnalysis['type'] = 'normal';
    if (selectedGame.analysis.blunders.includes(moveIndex)) type = 'blunder';
    else if (selectedGame.analysis.mistakes.includes(moveIndex)) type = 'mistake';
    else if (selectedGame.analysis.brilliant.includes(moveIndex)) type = 'brilliant';

    return {
      moveNumber: Math.floor(moveIndex / 2) + 1,
      move: selectedGame.moves[moveIndex],
      evaluation: Math.random() * 2 - 1,
      type
    };
  };

  const getMoveTypeColor = (type: string) => {
    switch (type) {
      case 'brilliant': return '#22c55e';
      case 'good': return '#3b82f6';
      case 'inaccuracy': return '#eab308';
      case 'mistake': return '#f97316';
      case 'blunder': return '#ef4444';
      default: return themeColors.textMuted;
    }
  };

  const getMoveTypeIcon = (type: string) => {
    switch (type) {
      case 'brilliant': return Zap;
      case 'blunder': return AlertTriangle;
      case 'mistake': return AlertTriangle;
      default: return Target;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} `;
  };

  const handleSelectGame = (game: GameReplay) => {
    setSelectedGame(game);
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  };

  const getDisplayGames = () => {
    switch (activeTab) {
      case 'featured': return featuredGames;
      case 'bookmarked': return games.filter(g => g.isBookmarked);
      default: return games;
    }
  };

  const filteredGames = getDisplayGames().filter((game) =>
    game.whitePlayer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.blackPlayer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.opening.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ backgroundColor: `${themeColors.background} ee` }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <Play style={{ color: themeColors.accent }} />
                Centre de Replay
              </h1>
              <p className="text-sm" style={{ color: themeColors.textMuted }}>
                Revivez et analysez vos parties
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'my-games', label: 'Mes parties' },
              { id: 'featured', label: 'À la une' },
              { id: 'bookmarked', label: 'Favoris' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px - 4 py - 2 rounded - xl text - sm font - medium transition - all ${activeTab === tab.id ? 'shadow-lg' : ''
                  } `}
                style={{
                  backgroundColor: activeTab === tab.id ? themeColors.accent : themeColors.card,
                  color: activeTab === tab.id ? '#fff' : themeColors.textMuted
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder="Rechercher une partie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: themeColors.card,
                  color: themeColors.text
                }}
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="p-3 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <Filter className="w-5 h-5" style={{ color: themeColors.textMuted }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Games List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-display font-bold" style={{ color: themeColors.text }}>
              Parties ({filteredGames.length})
            </h2>

            {filteredGames.map((game) => (
              <motion.button
                key={game.id}
                onClick={() => handleSelectGame(game)}
                className={`w - full rounded - 2xl p - 4 text - left transition - all hover: scale - [1.02] ${selectedGame?.id === game.id ? 'ring-2' : ''
                  } `}
                style={{
                  backgroundColor: themeColors.card
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center -space-x-2">
                    <span className="text-xl">{game.whitePlayer.avatar}</span>
                    <span className="text-xl">{game.blackPlayer.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: themeColors.text }}>
                      {game.whitePlayer.username} vs {game.blackPlayer.username}
                    </p>
                    <p className="text-xs" style={{ color: themeColors.textMuted }}>
                      {game.opening}
                    </p>
                  </div>
                  {game.isBookmarked && (
                    <BookmarkCheck className="w-4 h-4" style={{ color: themeColors.accent }} />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: themeColors.textMuted }}>
                  <div className="flex items-center gap-3">
                    <span className={`font - medium ${game.result === 'white' ? 'text-white' :
                      game.result === 'black' ? 'text-gray-400' : 'text-yellow-500'
                      } `}>
                      {game.result === 'white' ? '1-0' : game.result === 'black' ? '0-1' : '½-½'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(game.duration)}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {game.views}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Replay Viewer */}
          <div className="lg:col-span-2">
            {selectedGame ? (
              <div className="space-y-4">
                {/* Players Info */}
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedGame.whitePlayer.avatar}</span>
                      <div>
                        <p className="font-medium" style={{ color: themeColors.text }}>
                          {selectedGame.whitePlayer.username}
                        </p>
                        <p className="text-sm" style={{ color: themeColors.accent }}>
                          {selectedGame.whitePlayer.elo} ELO
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xl font-bold" style={{ color: themeColors.text }}>
                        {selectedGame.result === 'white' ? '1-0' : selectedGame.result === 'black' ? '0-1' : '½-½'}
                      </p>
                      <p className="text-xs" style={{ color: themeColors.textMuted }}>
                        {new Date(selectedGame.playedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium" style={{ color: themeColors.text }}>
                          {selectedGame.blackPlayer.username}
                        </p>
                        <p className="text-sm" style={{ color: themeColors.accent }}>
                          {selectedGame.blackPlayer.elo} ELO
                        </p>
                      </div>
                      <span className="text-2xl">{selectedGame.blackPlayer.avatar}</span>
                    </div>
                  </div>
                </div>

                {/* Board & Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Board */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: themeColors.card }}
                  >
                    {/* @ts-ignore - CheckersBoard prop mismatch */}
                    <CheckersBoard
                      board={[]}
                      onMove={() => { }}
                      disabled={true}
                      currentTurn="white"
                    />
                  </div>

                  {/* Moves & Analysis */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: themeColors.card }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-bold" style={{ color: themeColors.text }}>
                        Coups
                      </h3>
                      <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className={`px - 3 py - 1 rounded - lg text - xs font - medium ${showAnalysis ? '' : 'opacity-50'
                          } `}
                        style={{ backgroundColor: themeColors.background, color: themeColors.accent }}
                      >
                        Analyse
                      </button>
                    </div>

                    <div className="h-64 overflow-y-auto space-y-1 mb-4">
                      {selectedGame.moves.map((move, index) => {
                        const analysis = getMoveAnalysis(index);
                        const MoveIcon = analysis ? getMoveTypeIcon(analysis.type) : null;

                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentMoveIndex(index)}
                            className={`w - full px - 3 py - 2 rounded - lg text - left flex items - center gap - 2 transition - all ${index === currentMoveIndex ? 'ring-1' : ''
                              } `}
                            style={{
                              backgroundColor: index === currentMoveIndex ? `${themeColors.accent} 20` : 'transparent'
                            }}
                          >
                            <span className="w-6 text-xs" style={{ color: themeColors.textMuted }}>
                              {index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ''}
                            </span>
                            <span style={{ color: themeColors.text }}>{move}</span>
                            {showAnalysis && analysis && analysis.type !== 'normal' && MoveIcon && (
                              <MoveIcon
                                className="w-4 h-4 ml-auto"
                                style={{ color: getMoveTypeColor(analysis.type) }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Analysis Summary */}
                    {showAnalysis && selectedGame.analysis && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span style={{ color: themeColors.textMuted }}>
                            {selectedGame.analysis.brilliant.length} brillants
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span style={{ color: themeColors.textMuted }}>
                            {selectedGame.analysis.mistakes.length} erreurs
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span style={{ color: themeColors.textMuted }}>
                            {selectedGame.analysis.blunders.length} gaffes
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Playback Controls */}
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentMoveIndex(0)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ backgroundColor: themeColors.background }}
                    >
                      <SkipBack className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                    </button>
                    <button
                      onClick={() => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1))}
                      className="p-2 rounded-xl transition-colors"
                      style={{ backgroundColor: themeColors.background }}
                    >
                      <ChevronLeft className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-4 rounded-xl transition-transform hover:scale-105"
                      style={{ backgroundColor: themeColors.accent }}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setCurrentMoveIndex(Math.min(selectedGame.moves.length - 1, currentMoveIndex + 1))}
                      className="p-2 rounded-xl transition-colors"
                      style={{ backgroundColor: themeColors.background }}
                    >
                      <ChevronRight className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                    </button>
                    <button
                      onClick={() => setCurrentMoveIndex(selectedGame.moves.length - 1)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ backgroundColor: themeColors.background }}
                    >
                      <SkipForward className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                    </button>
                  </div>

                  {/* Progress & Speed */}
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>
                      {currentMoveIndex + 1}/{selectedGame.moves.length}
                    </span>
                    <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: themeColors.background }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${((currentMoveIndex + 1) / selectedGame.moves.length) * 100}% `,
                          backgroundColor: themeColors.accent
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {[0.5, 1, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px - 2 py - 1 rounded text - xs font - medium transition - all ${playbackSpeed === speed ? '' : 'opacity-50'
                            } `}
                          style={{
                            backgroundColor: playbackSpeed === speed ? themeColors.accent : themeColors.background,
                            color: playbackSpeed === speed ? '#fff' : themeColors.textMuted
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: themeColors.background, color: themeColors.textMuted }}
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: themeColors.background, color: themeColors.textMuted }}
                    >
                      <Share2 className="w-4 h-4" />
                      Partager
                    </button>
                    <button
                      onClick={() => {
                        showToast(selectedGame.isBookmarked ? 'Retiré des favoris' : 'Ajouté aux favoris', 'info');
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
                      style={{ backgroundColor: themeColors.background, color: selectedGame.isBookmarked ? themeColors.accent : themeColors.textMuted }}
                    >
                      {selectedGame.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                      Favori
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ backgroundColor: themeColors.card }}
              >
                <Play className="w-16 h-16 mx-auto mb-4" style={{ color: themeColors.textMuted }} />
                <h3 className="text-xl font-display font-bold mb-2" style={{ color: themeColors.text }}>
                  Sélectionnez une partie
                </h3>
                <p style={{ color: themeColors.textMuted }}>
                  Choisissez une partie dans la liste pour la revoir et l'analyser
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayCenter;
