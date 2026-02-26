import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Trophy,
  Star,
  Shield,
  Crown,
  ChevronRight,
  Filter,
  X,
  UserPlus,
  Globe,
  Lock,
  Check,
  Upload,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Username from '../components/Username';

interface Team {
  id: string;
  name: string;
  description: string;
  logo: string;
  memberCount: number;
  maxMembers: number;
  wins: number;
  losses: number;
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  isPublic: boolean;
  captain: {
    id: string;
    username: string;
    avatar: string;
  };
  topMembers: {
    id: string;
    avatar: string;
  }[];
  isMember: boolean;
  isPending: boolean;
  createdAt: string;
}

const Teams: React.FC = () => {
  const { themeColors, gameType } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-teams'>('discover');

  // Create team form
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    isPublic: true,
    maxMembers: 10
  });

  // Mock data
  const teams: Team[] = [
    {
      id: '1',
      name: 'Les Maîtres du Damier',
      description: 'Équipe compétitive pour les joueurs sérieux de dames',
      logo: '🏆',
      memberCount: 8,
      maxMembers: 10,
      wins: 45,
      losses: 12,
      rank: 1,
      tier: 'master',
      isPublic: true,
      captain: { id: '1', username: 'GrandMaster99', avatar: '👑' },
      topMembers: [
        { id: '2', avatar: '🎯' },
        { id: '3', avatar: '♟️' },
        { id: '4', avatar: '🏆' }
      ],
      isMember: false,
      isPending: false,
      createdAt: '2023-06-15'
    },
    {
      id: '2',
      name: 'Stratèges Unis',
      description: 'Pour tous les amateurs de stratégie et de bons moments',
      logo: '🎯',
      memberCount: 15,
      maxMembers: 20,
      wins: 32,
      losses: 18,
      rank: 3,
      tier: 'diamond',
      isPublic: true,
      captain: { id: '5', username: 'TacticalKing', avatar: '♟️' },
      topMembers: [
        { id: '6', avatar: '🚀' },
        { id: '7', avatar: '⭐' },
        { id: '8', avatar: '🔥' }
      ],
      isMember: true,
      isPending: false,
      createdAt: '2023-08-20'
    },
    {
      id: '3',
      name: 'Les Rookies',
      description: 'Équipe pour débutants motivés qui veulent progresser ensemble',
      logo: '🌟',
      memberCount: 12,
      maxMembers: 15,
      wins: 18,
      losses: 22,
      rank: 8,
      tier: 'silver',
      isPublic: true,
      captain: { id: '9', username: 'NewPlayer', avatar: '🌟' },
      topMembers: [
        { id: '10', avatar: '💪' },
        { id: '11', avatar: '🎮' }
      ],
      isMember: false,
      isPending: true,
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      name: 'Elite Gaming',
      description: 'Équipe fermée pour joueurs de haut niveau uniquement',
      logo: '⚡',
      memberCount: 5,
      maxMembers: 8,
      wins: 52,
      losses: 8,
      rank: 2,
      tier: 'master',
      isPublic: false,
      captain: { id: '12', username: 'ProPlayer', avatar: '⚡' },
      topMembers: [
        { id: '13', avatar: '🎯' },
        { id: '14', avatar: '👑' }
      ],
      isMember: false,
      isPending: false,
      createdAt: '2023-03-10'
    },
    {
      id: '5',
      name: 'Casual Champions',
      description: 'Jouer pour le fun, gagner pour le style',
      logo: '🎮',
      memberCount: 18,
      maxMembers: 25,
      wins: 28,
      losses: 24,
      rank: 5,
      tier: 'gold',
      isPublic: true,
      captain: { id: '15', username: 'FunGamer', avatar: '🎮' },
      topMembers: [
        { id: '16', avatar: '😎' },
        { id: '17', avatar: '🌈' },
        { id: '18', avatar: '🎉' }
      ],
      isMember: false,
      isPending: false,
      createdAt: '2023-11-05'
    }
  ];

  const tiers = [
    { id: 'all', label: 'Tous', color: themeColors.textMuted },
    { id: 'master', label: 'Master', color: '#9333ea' },
    { id: 'diamond', label: 'Diamond', color: '#06b6d4' },
    { id: 'platinum', label: 'Platinum', color: '#64748b' },
    { id: 'gold', label: 'Gold', color: '#eab308' },
    { id: 'silver', label: 'Silver', color: '#9ca3af' },
    { id: 'bronze', label: 'Bronze', color: '#f97316' }
  ];

  const getTierColor = (tier: string) => {
    const t = tiers.find((t) => t.id === tier);
    return t?.color || themeColors.textMuted;
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || team.tier === selectedTier;
    const matchesTab = activeTab === 'discover' ? !team.isMember : team.isMember || team.isPending;
    return matchesSearch && matchesTier && matchesTab;
  });

  const handleJoinTeam = (team: Team) => {
    if (team.isPublic) {
      showToast(`Vous avez rejoint ${team.name}!`, 'success');
    } else {
      showToast(`Demande envoyée à ${team.name}`, 'info');
    }
  };

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      showToast('Veuillez entrer un nom d\'équipe', 'error');
      return;
    }
    showToast(`Équipe "${newTeam.name}" créée avec succès!`, 'success');
    setShowCreateModal(false);
    setNewTeam({ name: '', description: '', isPublic: true, maxMembers: 10 });
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ backgroundColor: `${themeColors.background}ee` }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                <Users style={{ color: themeColors.accent }} />
                Équipes
              </h1>
              <p className="text-sm" style={{ color: themeColors.textMuted }}>
                Rejoignez ou créez une équipe pour jouer ensemble
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-transform hover:scale-105"
              style={{ backgroundColor: themeColors.accent, color: '#fff' }}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Créer</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'discover' ? 'shadow-lg' : ''
                }`}
              style={{
                backgroundColor: activeTab === 'discover' ? themeColors.accent : themeColors.card,
                color: activeTab === 'discover' ? '#fff' : themeColors.textMuted
              }}
            >
              Découvrir
            </button>
            <button
              onClick={() => setActiveTab('my-teams')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'my-teams' ? 'shadow-lg' : ''
                }`}
              style={{
                backgroundColor: activeTab === 'my-teams' ? themeColors.accent : themeColors.card,
                color: activeTab === 'my-teams' ? '#fff' : themeColors.textMuted
              }}
            >
              Mes Équipes
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder="Rechercher une équipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: themeColors.card,
                  color: themeColors.text,
                  borderColor: themeColors.border
                }}
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-3 rounded-xl transition-colors ${filterOpen ? 'ring-2' : ''}`}
              style={{
                backgroundColor: themeColors.card
              }}
            >
              <Filter className="w-5 h-5" style={{ color: filterOpen ? themeColors.accent : themeColors.textMuted }} />
            </button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTier === tier.id ? 'ring-2' : ''
                        }`}
                      style={{
                        backgroundColor: selectedTier === tier.id ? `${tier.color}30` : themeColors.card,
                        color: selectedTier === tier.id ? tier.color : themeColors.textMuted
                      }}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: themeColors.card }}
          >
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: themeColors.accent }} />
            <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
              {teams.length}
            </p>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Équipes</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: themeColors.card }}
          >
            <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: themeColors.accent }} />
            <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
              {teams.reduce((acc, t) => acc + t.wins, 0)}
            </p>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Victoires</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: themeColors.card }}
          >
            <Star className="w-6 h-6 mx-auto mb-2" style={{ color: themeColors.accent }} />
            <p className="text-2xl font-bold" style={{ color: themeColors.text }}>
              {teams.reduce((acc, t) => acc + t.memberCount, 0)}
            </p>
            <p className="text-xs" style={{ color: themeColors.textMuted }}>Joueurs</p>
          </motion.div>
        </div>

        {/* Teams List */}
        <div className="space-y-4">
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: themeColors.textMuted }} />
              <p className="font-medium" style={{ color: themeColors.text }}>
                {activeTab === 'my-teams' ? 'Vous n\'avez pas encore d\'équipe' : 'Aucune équipe trouvée'}
              </p>
              <p className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
                {activeTab === 'my-teams' ? 'Rejoignez ou créez une équipe' : 'Essayez d\'autres filtres'}
              </p>
            </div>
          ) : (
            filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/teams/${team.id}`}
                  className="block rounded-2xl p-4 transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: themeColors.card }}
                >
                  <div className="flex items-start gap-4">
                    {/* Team Logo */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ backgroundColor: `${getTierColor(team.tier)}20` }}
                    >
                      {team.logo}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold truncate" style={{ color: themeColors.text }}>
                          {team.name}
                        </h3>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${getTierColor(team.tier)}30`, color: getTierColor(team.tier) }}
                        >
                          {team.tier.charAt(0).toUpperCase() + team.tier.slice(1)}
                        </span>
                        {!team.isPublic && (
                          <Lock className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} />
                        )}
                      </div>
                      <p className="text-sm mt-1 line-clamp-1" style={{ color: themeColors.textMuted }}>
                        {team.description}
                      </p>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" style={{ color: themeColors.accent }} />
                          <span style={{ color: themeColors.textMuted }}>
                            {team.memberCount}/{team.maxMembers}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" style={{ color: themeColors.accent }} />
                          <span style={{ color: themeColors.textMuted }}>
                            {team.wins}W - {team.losses}L
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4" style={{ color: themeColors.accent }} />
                          <span style={{ color: themeColors.textMuted }}>
                            #{team.rank}
                          </span>
                        </div>
                      </div>

                      {/* Members Preview */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center -space-x-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2"
                            style={{ backgroundColor: themeColors.background, borderColor: themeColors.card }}>
                            {team.captain.avatar}
                          </div>
                          {team.topMembers.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2"
                              style={{ backgroundColor: themeColors.background, borderColor: themeColors.card }}
                            >
                              {member.avatar}
                            </div>
                          ))}
                          {team.memberCount > 4 && (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2"
                              style={{ backgroundColor: themeColors.accent, borderColor: themeColors.card, color: '#fff' }}
                            >
                              +{team.memberCount - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs" style={{ color: themeColors.textMuted }}>
                          Capitaine: <Username
                            userId={team.captain.id}
                            username={team.captain.username}
                            className="inline"
                          />
                        </span>
                      </div>
                    </div>

                    {/* Action / Arrow */}
                    <div className="flex flex-col items-end gap-2">
                      {team.isMember ? (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                          style={{ backgroundColor: `${themeColors.accent}20`, color: themeColors.accent }}
                        >
                          <Check className="w-3 h-3" />
                          Membre
                        </span>
                      ) : team.isPending ? (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}
                        >
                          En attente
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleJoinTeam(team);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors"
                          style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                        >
                          <UserPlus className="w-3 h-3" />
                          Rejoindre
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: themeColors.card }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold" style={{ color: themeColors.text }}>
                  Créer une équipe
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl transition-colors"
                  style={{ backgroundColor: themeColors.background }}
                >
                  <X className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Team Logo */}
                <div className="flex justify-center">
                  <button
                    className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors"
                    style={{ borderColor: themeColors.border, color: themeColors.textMuted }}
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-xs">Logo</span>
                  </button>
                </div>

                {/* Team Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: themeColors.text }}>
                    Nom de l'équipe
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Entrez le nom..."
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: themeColors.text }}>
                    Description
                  </label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Décrivez votre équipe..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2 resize-none"
                    style={{
                      backgroundColor: themeColors.background,
                      color: themeColors.text
                    }}
                  />
                </div>

                {/* Privacy */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: themeColors.background }}>
                  <div className="flex items-center gap-3">
                    {newTeam.isPublic ? (
                      <Globe className="w-5 h-5" style={{ color: themeColors.accent }} />
                    ) : (
                      <Lock className="w-5 h-5" style={{ color: themeColors.accent }} />
                    )}
                    <div>
                      <p className="font-medium" style={{ color: themeColors.text }}>
                        {newTeam.isPublic ? 'Équipe publique' : 'Équipe privée'}
                      </p>
                      <p className="text-xs" style={{ color: themeColors.textMuted }}>
                        {newTeam.isPublic ? 'Tout le monde peut rejoindre' : 'Sur invitation uniquement'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNewTeam({ ...newTeam, isPublic: !newTeam.isPublic })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${newTeam.isPublic ? '' : ''
                      }`}
                    style={{ backgroundColor: newTeam.isPublic ? themeColors.accent : themeColors.border }}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${newTeam.isPublic ? 'translate-x-7' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Max Members */}
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: themeColors.text }}>
                    Nombre maximum de membres
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 25].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNewTeam({ ...newTeam, maxMembers: num })}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${newTeam.maxMembers === num ? 'ring-2' : ''
                          }`}
                        style={{
                          backgroundColor: newTeam.maxMembers === num ? themeColors.accent : themeColors.background,
                          color: newTeam.maxMembers === num ? '#fff' : themeColors.textMuted
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateTeam}
                  className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: themeColors.accent, color: '#fff' }}
                >
                  <Sparkles className="w-5 h-5" />
                  Créer l'équipe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teams;
