import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Star,
  Shield,
  Crown,
  Flame,
  Target,
  Clock,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Award,
  Medal
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Mock data
const leagues = [
  {
    id: '1',
    name: 'Diamond League',
    gameType: 'checkers',
    season: 'Season 4',
    tier: 'diamond',
    participants: 128,
    maxParticipants: 150,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15'),
    status: 'active',
    prizePool: 50000,
    description: 'Compete with the best diamond-tier players',
    userRank: 24,
    userPoints: 856,
  },
  {
    id: '2',
    name: 'Masters Championship',
    gameType: 'checkers',
    season: 'Season 4',
    tier: 'master',
    participants: 64,
    maxParticipants: 64,
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-02-20'),
    status: 'active',
    prizePool: 100000,
    description: 'Elite league for master-tier players',
    userRank: null,
    userPoints: null,
  },
  {
    id: '3',
    name: 'Chess Premier League',
    gameType: 'chess',
    season: 'Season 2',
    tier: 'expert',
    participants: 96,
    maxParticipants: 128,
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-02-10'),
    status: 'active',
    prizePool: 75000,
    description: 'The premier chess competition',
    userRank: 45,
    userPoints: 620,
  },
  {
    id: '4',
    name: 'Rising Stars League',
    gameType: 'checkers',
    season: 'Season 6',
    tier: 'gold',
    participants: 180,
    maxParticipants: 200,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-03-01'),
    status: 'upcoming',
    prizePool: 25000,
    description: 'For up-and-coming players',
    userRank: null,
    userPoints: null,
  },
  {
    id: '5',
    name: 'Grand Masters Elite',
    gameType: 'chess',
    season: 'Season 1',
    tier: 'grandmaster',
    participants: 32,
    maxParticipants: 32,
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    status: 'completed',
    prizePool: 200000,
    description: 'The most prestigious chess league',
    userRank: null,
    userPoints: null,
  },
];

const myLeagueStats = {
  currentLeagues: 2,
  totalPoints: 1476,
  bestRank: 15,
  seasonsPlayed: 8,
  trophies: 3,
};

type FilterType = 'all' | 'active' | 'upcoming' | 'completed';
type GameFilter = 'all' | 'checkers' | 'chess';

const Leagues: React.FC = () => {
  const { themeColors, currentTheme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeagues = leagues.filter(league => {
    if (statusFilter !== 'all' && league.status !== statusFilter) return false;
    if (gameFilter !== 'all' && league.gameType !== gameFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return league.name.toLowerCase().includes(query) || league.description.toLowerCase().includes(query);
    }
    return true;
  });

  const myLeagues = leagues.filter(l => l.userRank !== null);

  const getTierColor = (tier: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      grandmaster: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
      master: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
      expert: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
      diamond: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
      platinum: { bg: 'bg-slate-400/20', text: 'text-slate-400', border: 'border-slate-400/50' },
      gold: { bg: 'bg-yellow-600/20', text: 'text-yellow-500', border: 'border-yellow-500/50' },
    };
    return colors[tier] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleJoinLeague = (leagueId: string) => {
    showToast('success', 'Successfully joined the league!');
  };

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
                  <Shield size={24} style={{ color: themeColors.accent }} />
                  Leagues
                </h1>
                <p className="text-sm" style={{ color: themeColors.textMuted }}>
                  Compete in seasonal leagues
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: themeColors.textMuted }} />
            <input
              type="text"
              placeholder="Search leagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
              style={{
                backgroundColor: themeColors.card,
                color: themeColors.text,
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {(['all', 'active', 'upcoming', 'completed'] as FilterType[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: statusFilter === status ? themeColors.accent : themeColors.card,
                  color: statusFilter === status ? '#fff' : themeColors.text,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <div className="w-px mx-2" style={{ backgroundColor: themeColors.hover }} />
            {(['all', 'checkers', 'chess'] as GameFilter[]).map((game) => (
              <button
                key={game}
                onClick={() => setGameFilter(game)}
                className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  backgroundColor: gameFilter === game ? themeColors.accent : themeColors.card,
                  color: gameFilter === game ? '#fff' : themeColors.text,
                }}
              >
                {game === 'all' ? 'All Games' : game === 'checkers' ? 'Dames' : 'Échecs'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-6xl mx-auto space-y-6">
        {/* My Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl"
          style={{ backgroundColor: themeColors.card }}
        >
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
            <Star size={18} style={{ color: themeColors.accent }} />
            My League Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>{myLeagueStats.currentLeagues}</p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Active Leagues</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{myLeagueStats.totalPoints.toLocaleString()}</p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Total Points</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>#{myLeagueStats.bestRank}</p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Best Rank</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{myLeagueStats.seasonsPlayed}</p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Seasons</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.hover }}>
              <p className="text-2xl font-bold text-yellow-500">{myLeagueStats.trophies}</p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Trophies</p>
            </div>
          </div>
        </motion.div>

        {/* My Active Leagues */}
        {myLeagues.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
              <Flame size={20} style={{ color: themeColors.accent }} />
              My Active Leagues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLeagues.map((league, index) => {
                const tierColor = getTierColor(league.tier);
                return (
                  <motion.div
                    key={league.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/leagues/${league.id}`}
                      className={`block p-4 rounded-2xl border-2 ${tierColor.border} hover:scale-[1.02] transition-transform`}
                      style={{ backgroundColor: themeColors.card }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{league.gameType === 'checkers' ? '🎯' : '♟️'}</span>
                          <div>
                            <h3 className="font-bold" style={{ color: themeColors.text }}>{league.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor.bg} ${tierColor.text}`}>
                              {league.tier.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>#{league.userRank}</p>
                          <p className="text-xs" style={{ color: themeColors.textMuted }}>{league.userPoints} pts</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm" style={{ color: themeColors.textMuted }}>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {league.participants}/{league.maxParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Ends {formatDate(league.endDate)}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* All Leagues */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
            <Trophy size={20} style={{ color: themeColors.accent }} />
            All Leagues
          </h2>
          <div className="space-y-3">
            {filteredLeagues.map((league, index) => {
              const tierColor = getTierColor(league.tier);
              const isJoined = league.userRank !== null;
              const isFull = league.participants >= league.maxParticipants;
              
              return (
                <motion.div
                  key={league.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${tierColor.bg}`}>
                        {league.gameType === 'checkers' ? '🎯' : '♟️'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold" style={{ color: themeColors.text }}>{league.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor.bg} ${tierColor.text}`}>
                            {league.tier.toUpperCase()}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(league.status)}`} />
                        </div>
                        <p className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
                          {league.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: themeColors.textMuted }}>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {league.participants}/{league.maxParticipants}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {league.season}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy size={14} />
                            {league.prizePool.toLocaleString()} coins
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(league.startDate)} - {formatDate(league.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isJoined ? (
                        <Link
                          to={`/leagues/${league.id}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
                          style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                        >
                          View
                          <ChevronRight size={16} />
                        </Link>
                      ) : league.status === 'upcoming' ? (
                        <button
                          onClick={() => handleJoinLeague(league.id)}
                          disabled={isFull}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium disabled:opacity-50"
                          style={{ 
                            backgroundColor: isFull ? themeColors.hover : themeColors.accent, 
                            color: isFull ? themeColors.textMuted : '#fff' 
                          }}
                        >
                          {isFull ? 'Full' : 'Register'}
                        </button>
                      ) : league.status === 'active' ? (
                        <button
                          onClick={() => handleJoinLeague(league.id)}
                          disabled={isFull}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium disabled:opacity-50"
                          style={{ 
                            backgroundColor: isFull ? themeColors.hover : themeColors.accent, 
                            color: isFull ? themeColors.textMuted : '#fff' 
                          }}
                        >
                          {isFull ? 'Full' : 'Join Now'}
                        </button>
                      ) : (
                        <Link
                          to={`/leagues/${league.id}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
                          style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                        >
                          Results
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {filteredLeagues.length === 0 && (
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto mb-4" style={{ color: themeColors.textMuted }} />
            <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>No leagues found</h3>
            <p style={{ color: themeColors.textMuted }}>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leagues;
