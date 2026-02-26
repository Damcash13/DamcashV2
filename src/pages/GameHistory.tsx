import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Calendar,
  Trophy,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Share2,
  Eye,
  Zap,
  Award,
  Users,
  Bot,
  Swords,
  X
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Username from '../components/Username';

interface Game {
  id: string;
  gameType: 'checkers' | 'chess';
  opponent: {
    id: string;
    username: string;
    avatar: string;
    elo: number;
    isBot?: boolean;
    botLevel?: string;
  };
  result: 'win' | 'loss' | 'draw';
  eloChange: number;
  timeControl: string;
  duration: number;
  movesCount: number;
  opening?: string;
  context: 'ranked' | 'casual' | 'tournament' | 'league' | 'friendly';
  contextName?: string;
  date: string;
  hasAnalysis: boolean;
}

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgDuration: number;
  avgMoves: number;
  longestWinStreak: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'draw';
}

const GameHistory: React.FC = () => {
  const { themeColors, gameType } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameType, setSelectedGameType] = useState<'all' | 'checkers' | 'chess'>('all');
  const [selectedResult, setSelectedResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [selectedContext, setSelectedContext] = useState<'all' | 'ranked' | 'casual' | 'tournament' | 'league' | 'friendly'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 10;

  // Selected game for details
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Mock data
  useEffect(() => {
    const mockGames: Game[] = [
      {
        id: '1',
        gameType: 'checkers',
        opponent: {
          id: '2',
          username: 'GrandMaster42',
          avatar: '👑',
          elo: 1850
        },
        result: 'win',
        eloChange: 15,
        timeControl: '10+5',
        duration: 1245,
        movesCount: 48,
        context: 'ranked',
        date: '2024-01-07T14:30:00Z',
        hasAnalysis: true
      },
      {
        id: '2',
        gameType: 'checkers',
        opponent: {
          id: '3',
          username: 'QueenSlayer',
          avatar: '⚔️',
          elo: 1720
        },
        result: 'loss',
        eloChange: -12,
        timeControl: '5+3',
        duration: 542,
        movesCount: 32,
        context: 'tournament',
        contextName: 'Tournoi Hebdo #45',
        date: '2024-01-07T10:15:00Z',
        hasAnalysis: true
      },
      {
        id: '3',
        gameType: 'chess',
        opponent: {
          id: '4',
          username: 'ChessWizard',
          avatar: '🧙',
          elo: 1680
        },
        result: 'win',
        eloChange: 18,
        timeControl: '15+10',
        duration: 2150,
        movesCount: 56,
        opening: 'Défense Sicilienne',
        context: 'ranked',
        date: '2024-01-06T18:45:00Z',
        hasAnalysis: true
      },
      {
        id: '4',
        gameType: 'checkers',
        opponent: {
          id: 'bot',
          username: 'Bot Expert',
          avatar: '🤖',
          elo: 2000,
          isBot: true,
          botLevel: 'expert'
        },
        result: 'draw',
        eloChange: 0,
        timeControl: '∞',
        duration: 1820,
        movesCount: 62,
        context: 'casual',
        date: '2024-01-06T15:00:00Z',
        hasAnalysis: false
      },
      {
        id: '5',
        gameType: 'chess',
        opponent: {
          id: '5',
          username: 'KnightRider',
          avatar: '🐴',
          elo: 1590
        },
        result: 'win',
        eloChange: 10,
        timeControl: '3+2',
        duration: 320,
        movesCount: 28,
        opening: 'Ouverture Italienne',
        context: 'friendly',
        date: '2024-01-06T12:30:00Z',
        hasAnalysis: true
      },
      {
        id: '6',
        gameType: 'checkers',
        opponent: {
          id: '6',
          username: 'DameLover',
          avatar: '♛',
          elo: 1750
        },
        result: 'win',
        eloChange: 14,
        timeControl: '10+5',
        duration: 1450,
        movesCount: 52,
        context: 'league',
        contextName: 'Ligue Diamant S3',
        date: '2024-01-05T20:00:00Z',
        hasAnalysis: true
      },
      {
        id: '7',
        gameType: 'checkers',
        opponent: {
          id: '7',
          username: 'Tactician99',
          avatar: '🎯',
          elo: 1820
        },
        result: 'loss',
        eloChange: -16,
        timeControl: '5+3',
        duration: 480,
        movesCount: 38,
        context: 'ranked',
        date: '2024-01-05T16:30:00Z',
        hasAnalysis: true
      },
      {
        id: '8',
        gameType: 'chess',
        opponent: {
          id: '8',
          username: 'PawnStorm',
          avatar: '♟️',
          elo: 1620
        },
        result: 'win',
        eloChange: 12,
        timeControl: '10+5',
        duration: 1680,
        movesCount: 44,
        opening: 'Défense Française',
        context: 'tournament',
        contextName: 'Open Blitz #12',
        date: '2024-01-05T11:00:00Z',
        hasAnalysis: true
      },
      {
        id: '9',
        gameType: 'checkers',
        opponent: {
          id: 'bot',
          username: 'Bot Moyen',
          avatar: '🤖',
          elo: 1400,
          isBot: true,
          botLevel: 'medium'
        },
        result: 'win',
        eloChange: 0,
        timeControl: '∞',
        duration: 920,
        movesCount: 36,
        context: 'casual',
        date: '2024-01-04T19:15:00Z',
        hasAnalysis: false
      },
      {
        id: '10',
        gameType: 'chess',
        opponent: {
          id: '9',
          username: 'BishopMaster',
          avatar: '🧝',
          elo: 1710
        },
        result: 'draw',
        eloChange: 2,
        timeControl: '15+10',
        duration: 2840,
        movesCount: 68,
        opening: 'Gambit Dame',
        context: 'ranked',
        date: '2024-01-04T14:00:00Z',
        hasAnalysis: true
      },
      {
        id: '11',
        gameType: 'checkers',
        opponent: {
          id: '10',
          username: 'SwiftMoves',
          avatar: '⚡',
          elo: 1680
        },
        result: 'win',
        eloChange: 11,
        timeControl: '3+2',
        duration: 285,
        movesCount: 24,
        context: 'ranked',
        date: '2024-01-04T10:30:00Z',
        hasAnalysis: true
      },
      {
        id: '12',
        gameType: 'checkers',
        opponent: {
          id: '11',
          username: 'DiagonalKing',
          avatar: '👑',
          elo: 1900
        },
        result: 'loss',
        eloChange: -8,
        timeControl: '10+5',
        duration: 1120,
        movesCount: 42,
        context: 'league',
        contextName: 'Ligue Diamant S3',
        date: '2024-01-03T21:00:00Z',
        hasAnalysis: true
      }
    ];

    const mockStats: Stats = {
      totalGames: 156,
      wins: 92,
      losses: 48,
      draws: 16,
      winRate: 59,
      avgDuration: 1245,
      avgMoves: 42,
      longestWinStreak: 8,
      currentStreak: 3,
      streakType: 'win'
    };

    setTimeout(() => {
      setGames(mockGames);
      setFilteredGames(mockGames);
      setStats(mockStats);
      setIsLoading(false);
    }, 500);
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...games];

    // Search filter
    if (searchQuery) {
      result = result.filter(game =>
        game.opponent.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.opening?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.contextName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Game type filter
    if (selectedGameType !== 'all') {
      result = result.filter(game => game.gameType === selectedGameType);
    }

    // Result filter
    if (selectedResult !== 'all') {
      result = result.filter(game => game.result === selectedResult);
    }

    // Context filter
    if (selectedContext !== 'all') {
      result = result.filter(game => game.context === selectedContext);
    }

    // Period filter
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      result = result.filter(game => new Date(game.date) >= startDate);
    }

    setFilteredGames(result);
    setCurrentPage(1);
  }, [games, searchQuery, selectedGameType, selectedResult, selectedContext, selectedPeriod]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-500';
      case 'loss': return 'text-red-500';
      case 'draw': return 'text-gray-400';
      default: return themeColors.text;
    }
  };

  const getResultBg = (result: string) => {
    switch (result) {
      case 'win': return 'bg-green-500/20 border-green-500/30';
      case 'loss': return 'bg-red-500/20 border-red-500/30';
      case 'draw': return 'bg-gray-500/20 border-gray-500/30';
      default: return '';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return 'Victoire';
      case 'loss': return 'Défaite';
      case 'draw': return 'Nulle';
      default: return '';
    }
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'ranked': return <Swords className="w-4 h-4" />;
      case 'tournament': return <Trophy className="w-4 h-4" />;
      case 'league': return <Award className="w-4 h-4" />;
      case 'friendly': return <Users className="w-4 h-4" />;
      case 'casual': return <Target className="w-4 h-4" />;
      default: return null;
    }
  };

  const getContextLabel = (context: string) => {
    switch (context) {
      case 'ranked': return 'Classé';
      case 'tournament': return 'Tournoi';
      case 'league': return 'Ligue';
      case 'friendly': return 'Amical';
      case 'casual': return 'Casual';
      default: return '';
    }
  };

  const handleExport = () => {
    showToast('Export en cours...', 'info');
    setTimeout(() => {
      showToast('Historique exporté avec succès', 'success');
    }, 1500);
  };

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);
  const startIndex = (currentPage - 1) * gamesPerPage;
  const paginatedGames = filteredGames.slice(startIndex, startIndex + gamesPerPage);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGameType('all');
    setSelectedResult('all');
    setSelectedContext('all');
    setSelectedPeriod('all');
  };

  const hasActiveFilters = searchQuery || selectedGameType !== 'all' || selectedResult !== 'all' || selectedContext !== 'all' || selectedPeriod !== 'all';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${themeColors.accent} transparent transparent transparent` }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b" style={{ backgroundColor: `${themeColors.background}ee`, borderColor: themeColors.border }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${themeColors.accent}20` }}>
                <History className="w-6 h-6" style={{ color: themeColors.accent }} />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold" style={{ color: themeColors.text }}>
                  Historique
                </h1>
                <p style={{ color: themeColors.textMuted }}>
                  {filteredGames.length} parties • {stats?.winRate}% de victoires
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <Download className="w-5 h-5" style={{ color: themeColors.textMuted }} />
            </button>
          </div>

          {/* Search and Filters Toggle */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: themeColors.textMuted }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un adversaire, ouverture..."
                className="w-full pl-10 pr-4 py-2 rounded-xl transition-all"
                style={{
                  backgroundColor: themeColors.card,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`
                }}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: showFilters || hasActiveFilters ? `${themeColors.accent}20` : themeColors.card,
                color: showFilters || hasActiveFilters ? themeColors.accent : themeColors.text
              }}
            >
              <Filter className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColors.accent }} />
              )}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {/* Game Type */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Type:</span>
                    {['all', 'checkers', 'chess'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedGameType(type as typeof selectedGameType)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedGameType === type ? 'font-medium' : ''
                          }`}
                        style={{
                          backgroundColor: selectedGameType === type ? themeColors.accent : themeColors.card,
                          color: selectedGameType === type ? '#fff' : themeColors.text
                        }}
                      >
                        {type === 'all' ? 'Tous' : type === 'checkers' ? 'Dames' : 'Échecs'}
                      </button>
                    ))}
                  </div>

                  {/* Result */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Résultat:</span>
                    {['all', 'win', 'loss', 'draw'].map((result) => (
                      <button
                        key={result}
                        onClick={() => setSelectedResult(result as typeof selectedResult)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedResult === result ? 'font-medium' : ''
                          }`}
                        style={{
                          backgroundColor: selectedResult === result ? themeColors.accent : themeColors.card,
                          color: selectedResult === result ? '#fff' : themeColors.text
                        }}
                      >
                        {result === 'all' ? 'Tous' : getResultText(result)}
                      </button>
                    ))}
                  </div>

                  {/* Context */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Mode:</span>
                    {['all', 'ranked', 'tournament', 'league', 'friendly', 'casual'].map((ctx) => (
                      <button
                        key={ctx}
                        onClick={() => setSelectedContext(ctx as typeof selectedContext)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedContext === ctx ? 'font-medium' : ''
                          }`}
                        style={{
                          backgroundColor: selectedContext === ctx ? themeColors.accent : themeColors.card,
                          color: selectedContext === ctx ? '#fff' : themeColors.text
                        }}
                      >
                        {ctx === 'all' ? 'Tous' : getContextLabel(ctx)}
                      </button>
                    ))}
                  </div>

                  {/* Period */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Période:</span>
                    {[
                      { value: 'all', label: 'Tout' },
                      { value: 'today', label: "Aujourd'hui" },
                      { value: 'week', label: '7 jours' },
                      { value: 'month', label: '30 jours' },
                      { value: 'year', label: '1 an' }
                    ].map((period) => (
                      <button
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedPeriod === period.value ? 'font-medium' : ''
                          }`}
                        style={{
                          backgroundColor: selectedPeriod === period.value ? themeColors.accent : themeColors.card,
                          color: selectedPeriod === period.value ? '#fff' : themeColors.text
                        }}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-sm"
                      style={{ color: themeColors.accent }}
                    >
                      <X className="w-4 h-4" />
                      Effacer les filtres
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm" style={{ color: themeColors.textMuted }}>Victoires</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
              <div className="text-sm" style={{ color: themeColors.textMuted }}>{stats.winRate}%</div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-red-500" />
                <span className="text-sm" style={{ color: themeColors.textMuted }}>Défaites</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
              <div className="text-sm" style={{ color: themeColors.textMuted }}>{Math.round((stats.losses / stats.totalGames) * 100)}%</div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: themeColors.accent }} />
                <span className="text-sm" style={{ color: themeColors.textMuted }}>Série actuelle</span>
              </div>
              <div className={`text-2xl font-bold ${stats.streakType === 'win' ? 'text-green-500' : stats.streakType === 'loss' ? 'text-red-500' : 'text-gray-400'}`}>
                {stats.currentStreak}
              </div>
              <div className="text-sm" style={{ color: themeColors.textMuted }}>
                {stats.streakType === 'win' ? 'victoires' : stats.streakType === 'loss' ? 'défaites' : 'nulles'}
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" style={{ color: themeColors.accent }} />
                <span className="text-sm" style={{ color: themeColors.textMuted }}>Durée moy.</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                {formatDuration(stats.avgDuration)}
              </div>
              <div className="text-sm" style={{ color: themeColors.textMuted }}>{stats.avgMoves} coups</div>
            </div>
          </motion.div>
        )}

        {/* Games List */}
        <div className="space-y-3">
          {paginatedGames.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <History className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: themeColors.textMuted }} />
              <p style={{ color: themeColors.textMuted }}>Aucune partie trouvée</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                >
                  Effacer les filtres
                </button>
              )}
            </motion.div>
          ) : (
            paginatedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedGame(game)}
                className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{ backgroundColor: themeColors.card }}
              >
                <div className="flex items-center gap-4">
                  {/* Result indicator */}
                  <div className={`w-1.5 h-16 rounded-full ${game.result === 'win' ? 'bg-green-500' :
                    game.result === 'loss' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />

                  {/* Opponent */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{game.opponent.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <Username
                            userId={game.opponent.id}
                            username={game.opponent.username}
                            elo={game.opponent.elo}
                            className="font-medium"
                          />
                          {game.opponent.isBot && (
                            <Bot className="w-4 h-4" style={{ color: themeColors.accent }} />
                          )}
                          <span className="text-sm px-2 py-0.5 rounded-lg" style={{ backgroundColor: themeColors.hover, color: themeColors.textMuted }}>
                            {game.opponent.elo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: themeColors.textMuted }}>
                          <span className={`px-2 py-0.5 rounded text-xs ${game.gameType === 'checkers' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {game.gameType === 'checkers' ? 'Dames' : 'Échecs'}
                          </span>
                          <span className="flex items-center gap-1">
                            {getContextIcon(game.context)}
                            {game.contextName || getContextLabel(game.context)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Game details */}
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-4 text-sm" style={{ color: themeColors.textMuted }}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {game.timeControl}
                      </div>
                      <div>{formatDuration(game.duration)}</div>
                      <div>{game.movesCount} coups</div>
                    </div>
                    {game.opening && (
                      <div className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
                        {game.opening}
                      </div>
                    )}
                  </div>

                  {/* Result and ELO change */}
                  <div className="text-right">
                    <div className={`font-bold text-lg ${getResultColor(game.result)}`}>
                      {getResultText(game.result)}
                    </div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${game.eloChange > 0 ? 'text-green-500' :
                      game.eloChange < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                      {game.eloChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : game.eloChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      {game.eloChange > 0 ? '+' : ''}{game.eloChange}
                    </div>
                    <div className="text-xs mt-1" style={{ color: themeColors.textMuted }}>
                      {formatDate(game.date)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg disabled:opacity-50 transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: themeColors.text }} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span style={{ color: themeColors.textMuted }}>...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className="w-10 h-10 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: currentPage === page ? themeColors.accent : themeColors.card,
                        color: currentPage === page ? '#fff' : themeColors.text
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg disabled:opacity-50 transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: themeColors.text }} />
            </button>
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedGame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
              style={{ backgroundColor: themeColors.card }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>
                  Détails de la partie
                </h3>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: themeColors.hover }}
                >
                  <X className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                </button>
              </div>

              {/* Result Banner */}
              <div className={`p-4 rounded-xl mb-6 border ${getResultBg(selectedGame.result)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{user?.avatar || '👤'}</div>
                    <div>
                      <div className="font-medium" style={{ color: themeColors.text }}>Vous</div>
                      <div className="text-sm" style={{ color: themeColors.textMuted }}>
                        {user?.eloCheckers || 1500}
                      </div>
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <div className={`text-2xl font-bold ${getResultColor(selectedGame.result)}`}>
                      {selectedGame.result === 'win' ? '1' : selectedGame.result === 'loss' ? '0' : '½'}
                      {' - '}
                      {selectedGame.result === 'win' ? '0' : selectedGame.result === 'loss' ? '1' : '½'}
                    </div>
                    <div className={`text-sm ${selectedGame.eloChange > 0 ? 'text-green-500' :
                      selectedGame.eloChange < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                      {selectedGame.eloChange > 0 ? '+' : ''}{selectedGame.eloChange} ELO
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium" style={{ color: themeColors.text }}>
                        {selectedGame.opponent.username}
                      </div>
                      <div className="text-sm" style={{ color: themeColors.textMuted }}>
                        {selectedGame.opponent.elo}
                      </div>
                    </div>
                    <div className="text-3xl">{selectedGame.opponent.avatar}</div>
                  </div>
                </div>
              </div>

              {/* Game Info */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span style={{ color: themeColors.textMuted }}>Type de jeu</span>
                  <span style={{ color: themeColors.text }}>
                    {selectedGame.gameType === 'checkers' ? 'Dames internationales' : 'Échecs'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: themeColors.textMuted }}>Mode</span>
                  <span className="flex items-center gap-1" style={{ color: themeColors.text }}>
                    {getContextIcon(selectedGame.context)}
                    {selectedGame.contextName || getContextLabel(selectedGame.context)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: themeColors.textMuted }}>Cadence</span>
                  <span style={{ color: themeColors.text }}>{selectedGame.timeControl}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: themeColors.textMuted }}>Durée</span>
                  <span style={{ color: themeColors.text }}>{formatDuration(selectedGame.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: themeColors.textMuted }}>Coups joués</span>
                  <span style={{ color: themeColors.text }}>{selectedGame.movesCount}</span>
                </div>
                {selectedGame.opening && (
                  <div className="flex justify-between">
                    <span style={{ color: themeColors.textMuted }}>Ouverture</span>
                    <span style={{ color: themeColors.text }}>{selectedGame.opening}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: themeColors.textMuted }}>Date</span>
                  <span style={{ color: themeColors.text }}>{formatDate(selectedGame.date)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/replay/${selectedGame.id}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                  style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                >
                  <Play className="w-5 h-5" />
                  Revoir la partie
                </Link>
                {selectedGame.hasAnalysis ? (
                  <Link
                    to={`/replay/${selectedGame.id}?tab=analysis`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                  >
                    <Zap className="w-5 h-5" />
                    Analyse
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      showToast('Analyse en cours...', 'info');
                    }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                  >
                    <Zap className="w-5 h-5" />
                    Analyser
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://damcash.com/game/${selectedGame.id}`);
                    showToast('Lien copié !', 'success');
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                  style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                >
                  <Share2 className="w-5 h-5" />
                  Partager
                </button>
                <button
                  onClick={() => {
                    showToast('Téléchargement...', 'info');
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                  style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                >
                  <Download className="w-5 h-5" />
                  PGN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameHistory;
