import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Trophy,
  ChevronLeft,
  Crown,
  Shield,
  Star,
  Settings,
  UserPlus,
  UserMinus,
  MessageSquare,
  Share2,
  MoreVertical,
  Swords,
  TrendingUp,
  Calendar,
  Clock,
  Check,
  X,
  Edit,
  LogOut,
  Ban,
  Award
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface TeamMember {
  id: string;
  username: string;
  avatar: string;
  role: 'captain' | 'officer' | 'member';
  elo: number;
  wins: number;
  losses: number;
  joinedAt: string;
  isOnline: boolean;
  contribution: number;
}

interface TeamMatch {
  id: string;
  opponent: {
    id: string;
    name: string;
    logo: string;
  };
  result: 'win' | 'loss' | 'draw';
  score: string;
  type: 'league' | 'tournament' | 'friendly';
  playedAt: string;
  mvp: {
    id: string;
    username: string;
    avatar: string;
  };
}

interface Team {
  id: string;
  name: string;
  description: string;
  logo: string;
  tier: string;
  rank: number;
  memberCount: number;
  maxMembers: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalGames: number;
  trophies: number;
  createdAt: string;
  isMember: boolean;
  isPending: boolean;
  isPublic: boolean;
}

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { themeColors, gameType } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'members' | 'matches' | 'stats'>('members');
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Mock data
  useEffect(() => {
    setTeam({
      id: teamId || '1',
      name: 'Les Maîtres du Damier',
      description: 'Équipe compétitive pour les joueurs sérieux de dames. Nous participons aux ligues et tournois majeurs. Rejoignez-nous si vous êtes motivé!',
      logo: '🏆',
      tier: 'master',
      rank: 1,
      memberCount: 8,
      maxMembers: 10,
      wins: 45,
      losses: 12,
      draws: 3,
      winStreak: 5,
      totalGames: 60,
      trophies: 12,
      createdAt: '2023-06-15',
      isMember: true,
      isPending: false,
      isPublic: true
    });

    setMembers([
      {
        id: '1',
        username: 'GrandMaster99',
        avatar: '👑',
        role: 'captain',
        elo: 2450,
        wins: 120,
        losses: 25,
        joinedAt: '2023-06-15',
        isOnline: true,
        contribution: 35
      },
      {
        id: '2',
        username: 'TacticalKing',
        avatar: '♟️',
        role: 'officer',
        elo: 2280,
        wins: 95,
        losses: 30,
        joinedAt: '2023-07-01',
        isOnline: true,
        contribution: 25
      },
      {
        id: '3',
        username: 'ProPlayer42',
        avatar: '🎯',
        role: 'officer',
        elo: 2150,
        wins: 78,
        losses: 28,
        joinedAt: '2023-07-15',
        isOnline: false,
        contribution: 20
      },
      {
        id: user?.id || '4',
        username: user?.username || 'You',
        avatar: '⭐',
        role: 'member',
        elo: 1850,
        wins: 45,
        losses: 22,
        joinedAt: '2023-10-01',
        isOnline: true,
        contribution: 10
      },
      {
        id: '5',
        username: 'StrategyMaster',
        avatar: '🏆',
        role: 'member',
        elo: 1920,
        wins: 52,
        losses: 25,
        joinedAt: '2023-09-15',
        isOnline: false,
        contribution: 8
      },
      {
        id: '6',
        username: 'RookieRiser',
        avatar: '🚀',
        role: 'member',
        elo: 1650,
        wins: 30,
        losses: 20,
        joinedAt: '2024-01-01',
        isOnline: true,
        contribution: 2
      }
    ]);

    setMatches([
      {
        id: '1',
        opponent: { id: '2', name: 'Elite Gaming', logo: '⚡' },
        result: 'win',
        score: '5-2',
        type: 'league',
        playedAt: '2024-01-10',
        mvp: { id: '1', username: 'GrandMaster99', avatar: '👑' }
      },
      {
        id: '2',
        opponent: { id: '3', name: 'Stratèges Unis', logo: '🎯' },
        result: 'win',
        score: '4-3',
        type: 'tournament',
        playedAt: '2024-01-08',
        mvp: { id: '2', username: 'TacticalKing', avatar: '♟️' }
      },
      {
        id: '3',
        opponent: { id: '4', name: 'Casual Champions', logo: '🎮' },
        result: 'win',
        score: '6-1',
        type: 'league',
        playedAt: '2024-01-05',
        mvp: { id: '3', username: 'ProPlayer42', avatar: '🎯' }
      },
      {
        id: '4',
        opponent: { id: '5', name: 'Les Rookies', logo: '🌟' },
        result: 'loss',
        score: '3-4',
        type: 'friendly',
        playedAt: '2024-01-03',
        mvp: { id: '4', username: 'You', avatar: '⭐' }
      },
      {
        id: '5',
        opponent: { id: '6', name: 'Phoenix Rising', logo: '🔥' },
        result: 'win',
        score: '5-3',
        type: 'league',
        playedAt: '2024-01-01',
        mvp: { id: '1', username: 'GrandMaster99', avatar: '👑' }
      }
    ]);
  }, [teamId, user]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'captain': return Crown;
      case 'officer': return Shield;
      default: return Star;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'captain': return '#f59e0b';
      case 'officer': return '#3b82f6';
      default: return themeColors.textMuted;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-500';
      case 'loss': return 'text-red-500';
      case 'draw': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'league': return 'Ligue';
      case 'tournament': return 'Tournoi';
      case 'friendly': return 'Amical';
      default: return type;
    }
  };

  const handleLeaveTeam = () => {
    showToast('Vous avez quitté l\'équipe', 'info');
  };

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeColors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColors.accent }}></div>
      </div>
    );
  }

  const winRate = Math.round((team.wins / team.totalGames) * 100);

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ backgroundColor: `${themeColors.background}ee` }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/teams"
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <ChevronLeft className="w-6 h-6" style={{ color: themeColors.text }} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold" style={{ color: themeColors.text }}>
                {team.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}
                >
                  #{team.rank} Global
                </span>
                <span className="text-sm" style={{ color: themeColors.textMuted }}>
                  {team.memberCount}/{team.maxMembers} membres
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 rounded-xl transition-colors"
                style={{ backgroundColor: themeColors.card }}
              >
                <Share2 className="w-5 h-5" style={{ color: themeColors.text }} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-2 rounded-xl transition-colors"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <MoreVertical className="w-5 h-5" style={{ color: themeColors.text }} />
                </button>

                <AnimatePresence>
                  {showOptionsMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden shadow-xl z-20"
                      style={{ backgroundColor: themeColors.card }}
                    >
                      {team.isMember && (
                        <>
                          <button
                            className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
                            style={{ color: themeColors.text }}
                            onClick={() => setShowOptionsMenu(false)}
                          >
                            <Settings className="w-4 h-4" style={{ color: themeColors.textMuted }} />
                            <span className="text-sm">Paramètres</span>
                          </button>
                          <button
                            className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
                            onClick={() => {
                              handleLeaveTeam();
                              setShowOptionsMenu(false);
                            }}
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-500">Quitter l'équipe</span>
                          </button>
                        </>
                      )}
                      <button
                        className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors"
                        style={{ color: themeColors.text }}
                        onClick={() => setShowOptionsMenu(false)}
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500">Signaler</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {/* Team Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ backgroundColor: themeColors.card }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${themeColors.accent}20` }}
            >
              {team.logo}
            </div>
            <div className="flex-1">
              <p className="text-sm" style={{ color: themeColors.textMuted }}>
                {team.description}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" style={{ color: themeColors.accent }} />
                  <span style={{ color: themeColors.textMuted }}>
                    Créée le {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" style={{ color: themeColors.accent }} />
                  <span style={{ color: themeColors.textMuted }}>
                    {team.trophies} trophées
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>
                {team.wins}
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Victoires</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
                {team.losses}
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Défaites</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
              <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>
                {winRate}%
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Win Rate</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: themeColors.background }}>
              <p className="text-2xl font-bold text-green-500">
                {team.winStreak}
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>Série</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {team.isMember ? (
              <>
                <button
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat d'équipe
                </button>
                <button
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColors.background, color: themeColors.text }}
                >
                  <UserPlus className="w-5 h-5" />
                  Inviter
                </button>
              </>
            ) : team.isPending ? (
              <button
                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: themeColors.background, color: themeColors.textMuted }}
                disabled
              >
                <Clock className="w-5 h-5" />
                Demande en attente
              </button>
            ) : (
              <button
                className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: themeColors.accent, color: '#fff' }}
              >
                <UserPlus className="w-5 h-5" />
                Rejoindre l'équipe
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: themeColors.card }}>
          {[
            { id: 'members', label: 'Membres', icon: Users },
            { id: 'matches', label: 'Matchs', icon: Swords },
            { id: 'stats', label: 'Stats', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${activeTab === tab.id ? 'shadow-lg' : ''
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
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {members.map((member, index) => {
                const RoleIcon = getRoleIcon(member.role);
                const isCurrentUser = member.id === user?.id;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl p-4 ${isCurrentUser ? 'ring-2' : ''}`}
                    style={{
                      backgroundColor: themeColors.card
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: themeColors.background }}
                        >
                          {member.avatar}
                        </div>
                        {member.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2" style={{ borderColor: themeColors.card }} />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: themeColors.text }}>
                            {member.username}
                          </span>
                          <RoleIcon className="w-4 h-4" style={{ color: getRoleColor(member.role) }} />
                          {isCurrentUser && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}>
                              Vous
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span style={{ color: themeColors.accent }}>{member.elo} ELO</span>
                          <span style={{ color: themeColors.textMuted }}>
                            {member.wins}W - {member.losses}L
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: themeColors.accent }}>
                          {member.contribution}%
                        </p>
                        <p className="text-xs" style={{ color: themeColors.textMuted }}>Contribution</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: themeColors.background, color: themeColors.textMuted }}
                    >
                      {getMatchTypeLabel(match.type)}
                    </span>
                    <span className="text-xs" style={{ color: themeColors.textMuted }}>
                      {new Date(match.playedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: themeColors.background }}
                      >
                        {team.logo}
                      </div>
                      <span className="font-medium" style={{ color: themeColors.text }}>
                        {team.name}
                      </span>
                    </div>

                    <div className="text-center px-4">
                      <p className={`text-xl font-bold ${getResultColor(match.result)}`}>
                        {match.score}
                      </p>
                      <p className={`text-xs uppercase font-medium ${getResultColor(match.result)}`}>
                        {match.result === 'win' ? 'Victoire' : match.result === 'loss' ? 'Défaite' : 'Nul'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-medium" style={{ color: themeColors.text }}>
                        {match.opponent.name}
                      </span>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: themeColors.background }}
                      >
                        {match.opponent.logo}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: themeColors.border }}>
                    <Award className="w-4 h-4" style={{ color: themeColors.accent }} />
                    <span className="text-xs" style={{ color: themeColors.textMuted }}>MVP:</span>
                    <span className="text-xs">{match.mvp.avatar}</span>
                    <span className="text-xs font-medium" style={{ color: themeColors.text }}>
                      {match.mvp.username}
                    </span>
                  </div>
                </motion.div>
              ))}
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
              {/* Win Rate Chart */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: themeColors.card }}>
                <h3 className="text-lg font-display font-bold mb-4" style={{ color: themeColors.text }}>
                  Performances globales
                </h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke={themeColors.background}
                        strokeWidth="8"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke={themeColors.accent}
                        strokeWidth="8"
                        strokeDasharray={`${winRate * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold" style={{ color: themeColors.accent }}>
                        {winRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <span style={{ color: themeColors.textMuted }}>Victoires</span>
                      <span className="font-bold text-green-500">{team.wins}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: themeColors.textMuted }}>Défaites</span>
                      <span className="font-bold text-red-500">{team.losses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: themeColors.textMuted }}>Nuls</span>
                      <span className="font-bold text-yellow-500">{team.draws}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Contributors */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: themeColors.card }}>
                <h3 className="text-lg font-display font-bold mb-4" style={{ color: themeColors.text }}>
                  Top contributeurs
                </h3>
                <div className="space-y-3">
                  {members.slice(0, 3).map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}
                      >
                        {index + 1}
                      </div>
                      <span className="text-xl">{member.avatar}</span>
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: themeColors.text }}>
                          {member.username}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${member.contribution}%`, backgroundColor: themeColors.accent }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: themeColors.textMuted }}>
                            {member.contribution}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Type Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: themeColors.card }}>
                  <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: themeColors.accent }} />
                  <p className="text-2xl font-bold" style={{ color: themeColors.text }}>28</p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Ligue</p>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: themeColors.card }}>
                  <Award className="w-6 h-6 mx-auto mb-2" style={{ color: themeColors.accent }} />
                  <p className="text-2xl font-bold" style={{ color: themeColors.text }}>22</p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Tournois</p>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: themeColors.card }}>
                  <Swords className="w-6 h-6 mx-auto mb-2" style={{ color: themeColors.accent }} />
                  <p className="text-2xl font-bold" style={{ color: themeColors.text }}>10</p>
                  <p className="text-xs" style={{ color: themeColors.textMuted }}>Amicaux</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamDetail;
