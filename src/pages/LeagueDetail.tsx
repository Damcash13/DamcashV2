import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Users,
  Calendar,
  ChevronLeft,
  Medal,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Crown,
  Star,
  Shield,
  Swords,
  Eye,
  MessageSquare,
  Share2,
  Bell,
  BellOff,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface LeagueParticipant {
  id: string;
  rank: number;
  previousRank: number;
  user: {
    id: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  points: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  streak: number;
  lastResults: ('W' | 'L' | 'D')[];
}

interface LeagueMatch {
  id: string;
  round: number;
  player1: {
    id: string;
    username: string;
    avatar: string;
  };
  player2: {
    id: string;
    username: string;
    avatar: string;
  };
  result: string | null;
  scheduledAt: string;
  playedAt: string | null;
  isLive: boolean;
}

interface League {
  id: string;
  name: string;
  description: string;
  gameType: 'checkers' | 'chess';
  season: number;
  division: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  endDate: string;
  currentRound: number;
  totalRounds: number;
  participantsCount: number;
  maxParticipants: number;
  prizePool: number;
  isRegistered: boolean;
  isNotificationEnabled: boolean;
}

const LeagueDetail: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { themeColors, gameType } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'standings' | 'schedule' | 'stats'>('standings');
  const [selectedRound, setSelectedRound] = useState<number>(3);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<LeagueParticipant[]>([]);
  const [schedule, setSchedule] = useState<LeagueMatch[]>([]);

  // Mock data
  useEffect(() => {
    setLeague({
      id: leagueId || '1',
      name: 'Ligue Diamond - Saison 4',
      description: 'Ligue compétitive pour les joueurs Diamond et au-dessus',
      gameType: gameType,
      season: 4,
      division: 'Diamond',
      status: 'ongoing',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      currentRound: 3,
      totalRounds: 7,
      participantsCount: 12,
      maxParticipants: 16,
      prizePool: 50000,
      isRegistered: true,
      isNotificationEnabled: true
    });

    setStandings([
      {
        id: '1',
        rank: 1,
        previousRank: 2,
        user: { id: '1', username: 'GrandMaster99', avatar: '👑', isOnline: true },
        points: 15,
        wins: 5,
        losses: 0,
        draws: 0,
        gamesPlayed: 5,
        streak: 5,
        lastResults: ['W', 'W', 'W', 'W', 'W']
      },
      {
        id: '2',
        rank: 2,
        previousRank: 1,
        user: { id: '2', username: 'ProPlayer42', avatar: '🎯', isOnline: true },
        points: 13,
        wins: 4,
        losses: 1,
        draws: 1,
        gamesPlayed: 6,
        streak: 2,
        lastResults: ['W', 'W', 'L', 'D', 'W']
      },
      {
        id: '3',
        rank: 3,
        previousRank: 3,
        user: { id: '3', username: 'TacticalKing', avatar: '♟️', isOnline: false },
        points: 11,
        wins: 3,
        losses: 1,
        draws: 2,
        gamesPlayed: 6,
        streak: 1,
        lastResults: ['D', 'W', 'L', 'D', 'W']
      },
      {
        id: '4',
        rank: 4,
        previousRank: 5,
        user: { id: '4', username: 'StrategyMaster', avatar: '🏆', isOnline: true },
        points: 10,
        wins: 3,
        losses: 2,
        draws: 1,
        gamesPlayed: 6,
        streak: -1,
        lastResults: ['L', 'W', 'W', 'D', 'W']
      },
      {
        id: '5',
        rank: 5,
        previousRank: 4,
        user: { id: user?.id || '5', username: user?.username || 'You', avatar: '⭐', isOnline: true },
        points: 9,
        wins: 3,
        losses: 3,
        draws: 0,
        gamesPlayed: 6,
        streak: -2,
        lastResults: ['L', 'L', 'W', 'W', 'W']
      },
      {
        id: '6',
        rank: 6,
        previousRank: 6,
        user: { id: '6', username: 'RookieRiser', avatar: '🚀', isOnline: false },
        points: 7,
        wins: 2,
        losses: 3,
        draws: 1,
        gamesPlayed: 6,
        streak: 1,
        lastResults: ['W', 'L', 'D', 'L', 'L']
      }
    ]);

    setSchedule([
      {
        id: '1',
        round: 3,
        player1: { id: '1', username: 'GrandMaster99', avatar: '👑' },
        player2: { id: '2', username: 'ProPlayer42', avatar: '🎯' },
        result: null,
        scheduledAt: '2024-01-15T14:00:00',
        playedAt: null,
        isLive: true
      },
      {
        id: '2',
        round: 3,
        player1: { id: '3', username: 'TacticalKing', avatar: '♟️' },
        player2: { id: '4', username: 'StrategyMaster', avatar: '🏆' },
        result: null,
        scheduledAt: '2024-01-15T15:00:00',
        playedAt: null,
        isLive: false
      },
      {
        id: '3',
        round: 3,
        player1: { id: '5', username: 'You', avatar: '⭐' },
        player2: { id: '6', username: 'RookieRiser', avatar: '🚀' },
        result: null,
        scheduledAt: '2024-01-15T16:00:00',
        playedAt: null,
        isLive: false
      },
      {
        id: '4',
        round: 2,
        player1: { id: '1', username: 'GrandMaster99', avatar: '👑' },
        player2: { id: '3', username: 'TacticalKing', avatar: '♟️' },
        result: '2-1',
        scheduledAt: '2024-01-10T14:00:00',
        playedAt: '2024-01-10T14:45:00',
        isLive: false
      },
      {
        id: '5',
        round: 2,
        player1: { id: '2', username: 'ProPlayer42', avatar: '🎯' },
        player2: { id: '5', username: 'You', avatar: '⭐' },
        result: '1-2',
        scheduledAt: '2024-01-10T15:00:00',
        playedAt: '2024-01-10T15:30:00',
        isLive: false
      }
    ]);
  }, [leagueId, gameType, user]);

  const handleToggleNotifications = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    showToast(
      isNotificationEnabled ? 'Notifications désactivées' : 'Notifications activées',
      'info'
    );
  };

  const getRankChange = (current: number, previous: number) => {
    const diff = previous - current;
    if (diff > 0) return { icon: ArrowUp, color: 'text-green-500', value: diff };
    if (diff < 0) return { icon: ArrowDown, color: 'text-red-500', value: Math.abs(diff) };
    return { icon: Minus, color: 'text-gray-500', value: 0 };
  };

  const getResultColor = (result: 'W' | 'L' | 'D') => {
    switch (result) {
      case 'W': return 'bg-green-500';
      case 'L': return 'bg-red-500';
      case 'D': return 'bg-yellow-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'À venir' };
      case 'ongoing':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'En cours' };
      case 'completed':
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Terminée' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
    }
  };

  if (!league) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColors.accent }}></div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(league.status);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ backgroundColor: `${themeColors.background}ee` }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/leagues"
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <ChevronLeft className="w-6 h-6" style={{ color: themeColors.text }} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold" style={{ color: themeColors.text }}>
                {league.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
                <span className="text-sm" style={{ color: themeColors.textMuted }}>
                  Round {league.currentRound}/{league.totalRounds}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              {isNotificationEnabled ? (
                <Bell className="w-5 h-5" style={{ color: themeColors.accent }} />
              ) : (
                <BellOff className="w-5 h-5" style={{ color: themeColors.textMuted }} />
              )}
            </button>
            <button
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <Share2 className="w-5 h-5" style={{ color: themeColors.text }} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {/* League Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ backgroundColor: themeColors.card }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${themeColors.accent}20` }}
            >
              <Trophy style={{ color: themeColors.accent }} />
            </div>
            <div className="flex-1">
              <p className="text-sm" style={{ color: themeColors.textMuted }}>
                {league.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
                  <Users className="w-5 h-5 mx-auto mb-1" style={{ color: themeColors.accent }} />
                  <p className="text-lg font-bold" style={{ color: themeColors.text }}>
                    {league.participantsCount}/{league.maxParticipants}
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Participants</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
                  <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: themeColors.accent }} />
                  <p className="text-lg font-bold" style={{ color: themeColors.text }}>
                    {league.currentRound}/{league.totalRounds}
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Rounds</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
                  <Medal className="w-5 h-5 mx-auto mb-1" style={{ color: themeColors.accent }} />
                  <p className="text-lg font-bold" style={{ color: themeColors.text }}>
                    {league.prizePool.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Prix (coins)</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
                  <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: themeColors.accent }} />
                  <p className="text-lg font-bold" style={{ color: themeColors.text }}>
                    {league.division}
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Division</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: themeColors.card }}>
          {[
            { id: 'standings', label: 'Classement', icon: Trophy },
            { id: 'schedule', label: 'Calendrier', icon: Calendar },
            { id: 'stats', label: 'Statistiques', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                activeTab === tab.id ? 'shadow-lg' : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? themeColors.accent : 'transparent',
                color: activeTab === tab.id ? '#fff' : themeColors.textMuted
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {standings.slice(0, 3).map((player, index) => {
                  const podiumOrder = [1, 0, 2];
                  const podiumPlayer = standings[podiumOrder[index]];
                  const heights = ['h-24', 'h-32', 'h-20'];
                  const medals = ['🥈', '🥇', '🥉'];
                  
                  return (
                    <motion.div
                      key={podiumPlayer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="text-3xl mb-2">{podiumPlayer.user.avatar}</div>
                      <p className="text-sm font-medium truncate max-w-full" style={{ color: themeColors.text }}>
                        {podiumPlayer.user.username}
                      </p>
                      <p className="text-xs" style={{ color: themeColors.textMuted }}>
                        {podiumPlayer.points} pts
                      </p>
                      <div
                        className={`w-full ${heights[index]} rounded-t-xl mt-2 flex items-start justify-center pt-2`}
                        style={{ backgroundColor: `${themeColors.accent}${index === 1 ? '40' : '20'}` }}
                      >
                        <span className="text-2xl">{medals[index]}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Standings Table */}
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="grid grid-cols-12 gap-2 p-3 text-xs font-medium border-b" style={{ borderColor: themeColors.border, color: themeColors.textMuted }}>
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Joueur</div>
                  <div className="col-span-2 text-center">Pts</div>
                  <div className="col-span-2 text-center">V/D/N</div>
                  <div className="col-span-3 text-center">Forme</div>
                </div>
                {standings.map((player, index) => {
                  const rankChange = getRankChange(player.rank, player.previousRank);
                  const isCurrentUser = player.user.id === user?.id;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`grid grid-cols-12 gap-2 p-3 items-center border-b last:border-0 ${
                        isCurrentUser ? 'bg-opacity-20' : ''
                      }`}
                      style={{ 
                        borderColor: themeColors.border,
                        backgroundColor: isCurrentUser ? `${themeColors.accent}15` : 'transparent'
                      }}
                    >
                      <div className="col-span-1 flex items-center gap-1">
                        <span className="font-bold" style={{ color: themeColors.text }}>
                          {player.rank}
                        </span>
                        <rankChange.icon className={`w-3 h-3 ${rankChange.color}`} />
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="relative">
                          <span className="text-xl">{player.user.avatar}</span>
                          {player.user.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2" style={{ borderColor: themeColors.card }} />
                          )}
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: themeColors.text }}>
                          {player.user.username}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="font-bold" style={{ color: themeColors.accent }}>
                          {player.points}
                        </span>
                      </div>
                      <div className="col-span-2 text-center text-xs" style={{ color: themeColors.textMuted }}>
                        {player.wins}/{player.losses}/{player.draws}
                      </div>
                      <div className="col-span-3 flex justify-center gap-0.5">
                        {player.lastResults.slice(0, 5).map((result, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${getResultColor(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Round Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Array.from({ length: league.totalRounds }, (_, i) => i + 1).map((round) => (
                  <button
                    key={round}
                    onClick={() => setSelectedRound(round)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      selectedRound === round ? 'shadow-lg' : ''
                    }`}
                    style={{
                      backgroundColor: selectedRound === round ? themeColors.accent : themeColors.card,
                      color: selectedRound === round ? '#fff' : themeColors.textMuted
                    }}
                  >
                    Round {round}
                    {round === league.currentRound && (
                      <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">En cours</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Matches */}
              <div className="space-y-3">
                {schedule
                  .filter((match) => match.round === selectedRound)
                  .map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: themeColors.card }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Player 1 */}
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{match.player1.avatar}</span>
                          <div>
                            <p className="font-medium" style={{ color: themeColors.text }}>
                              {match.player1.username}
                            </p>
                            {match.result && (
                              <p className="text-sm font-bold" style={{ color: themeColors.accent }}>
                                {match.result.split('-')[0]}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* VS / Status */}
                        <div className="flex flex-col items-center px-4">
                          {match.isLive ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-red-400 text-sm font-medium">LIVE</span>
                            </div>
                          ) : match.result ? (
                            <span className="text-lg font-bold" style={{ color: themeColors.text }}>
                              {match.result}
                            </span>
                          ) : (
                            <span className="text-sm" style={{ color: themeColors.textMuted }}>
                              VS
                            </span>
                          )}
                          <span className="text-xs mt-1" style={{ color: themeColors.textMuted }}>
                            {match.playedAt 
                              ? new Date(match.playedAt).toLocaleDateString()
                              : new Date(match.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          </span>
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <div className="text-right">
                            <p className="font-medium" style={{ color: themeColors.text }}>
                              {match.player2.username}
                            </p>
                            {match.result && (
                              <p className="text-sm font-bold" style={{ color: themeColors.accent }}>
                                {match.result.split('-')[1]}
                              </p>
                            )}
                          </div>
                          <span className="text-2xl">{match.player2.avatar}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {match.isLive && (
                        <div className="mt-3 pt-3 border-t flex gap-2" style={{ borderColor: themeColors.border }}>
                          <Link
                            to={`/spectate/${match.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-colors"
                            style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Regarder</span>
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* League Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm font-medium" style={{ color: themeColors.text }}>
                      Parties jouées
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: themeColors.accent }}>
                    24
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>
                    sur 42 prévues
                  </p>
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm font-medium" style={{ color: themeColors.text }}>
                      Durée moyenne
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: themeColors.accent }}>
                    18:32
                  </p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>
                    minutes par partie
                  </p>
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm font-medium" style={{ color: themeColors.text }}>
                      Plus de victoires
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    <div>
                      <p className="font-bold" style={{ color: themeColors.text }}>GrandMaster99</p>
                      <p className="text-xs" style={{ color: themeColors.textMuted }}>5 victoires</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm font-medium" style={{ color: themeColors.text }}>
                      Meilleure série
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    <div>
                      <p className="font-bold" style={{ color: themeColors.text }}>GrandMaster99</p>
                      <p className="text-xs" style={{ color: themeColors.textMuted }}>5 victoires d'affilée</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: themeColors.card }}>
                <h3 className="text-lg font-display font-bold mb-4" style={{ color: themeColors.text }}>
                  Meilleurs joueurs
                </h3>
                <div className="space-y-3">
                  {standings.slice(0, 3).map((player, index) => {
                    const winRate = Math.round((player.wins / player.gamesPlayed) * 100);
                    return (
                      <div key={player.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xl">{player.user.avatar}</span>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: themeColors.text }}>
                            {player.user.username}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${winRate}%`, backgroundColor: themeColors.accent }}
                              />
                            </div>
                            <span className="text-xs" style={{ color: themeColors.textMuted }}>
                              {winRate}% victoires
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LeagueDetail;
