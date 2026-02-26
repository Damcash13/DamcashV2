import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../api/adminAPI';
import {
  LayoutDashboard,
  Users,
  Trophy,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  Shield,
  Ban,
  Eye,
  Search,
  ChevronRight,
  MoreVertical,
  X,
  Check,
  Settings,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Gamepad2,
  Crown,
  Flag,
  Trash2,
  Edit,
  Mail,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  PlusCircle,
  Coins,
  Brain
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  elo_checkers: number;
  elo_chess: number;
  coins: number;
  status: 'active' | 'banned' | 'suspended' | 'pending';
  created_date: string;
  last_active: string;
  reports_count: number;
  games_played: number;
}

interface Report {
  id: string;
  reporter: { id: string; username: string; avatar: string };
  reported: { id: string; username: string; avatar: string };
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_date: string;
  game_id?: string;
}

interface SystemStats {
  activeUsers: number;
  activeGames: number;
  serverLoad: number;
  dbConnections: number;
  wsConnections: number;
  memoryUsage: number;
  uptime: number;
}

interface DailyStats {
  date: string;
  newUsers: number;
  gamesPlayed: number;
  revenue: number;
  activeUsers: number;
}

interface Transaction {
  id: string;
  user: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'reward' | 'tournament_fee' | 'tournament_prize';
  amount: number;
  description: string;
  date: string;
}

interface AdminPuzzle {
  id: string;
  gameType: 'checkers' | 'chess';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  theme: string;
  rating: number;
  plays: number;
  successRate: number;
}

const AdminDashboard: React.FC = () => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'finance' | 'puzzles' | 'system'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [puzzles, setPuzzles] = useState<AdminPuzzle[]>([]);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned' | 'suspended'>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  // Selected items
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Coin adjustment
  const [coinAdjustAmount, setCoinAdjustAmount] = useState('');
  const [coinAdjustReason, setCoinAdjustReason] = useState('');

  // Delete puzzle confirmation
  const [puzzleToDelete, setPuzzleToDelete] = useState<string | null>(null);

  // Quick stats
  const [quickStats, setQuickStats] = useState({
    totalUsers: 15847,
    newUsersToday: 127,
    activeGames: 342,
    tournamentsPending: 8,
    revenueToday: 1245.50,
    reportsPending: 12
  });

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, reportsData, txData, puzzlesData, systemData] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getReports(),
        adminAPI.getTransactions(),
        adminAPI.getPuzzles(),
        adminAPI.getSystemStats(),
      ]);

      // Stats
      if (statsData.status === 'fulfilled') {
        const s = statsData.value;
        setQuickStats({
          totalUsers: s.totalUsers ?? 0,
          newUsersToday: s.newUsersToday ?? 0,
          activeGames: s.activeGames ?? 0,
          tournamentsPending: s.tournamentsPending ?? 0,
          revenueToday: s.revenueToday ?? 0,
          reportsPending: s.reportsPending ?? 0,
        });
        if (s.dailyStats) setDailyStats(s.dailyStats);
      }

      // Users — augment with avatar fallback
      if (usersData.status === 'fulfilled') {
        const mapped = (usersData.value.users || []).map((u: any) => ({
          ...u,
          avatar: u.avatar || '👤',
        }));
        setUsers(mapped);
      } else {
        // Offline fallback
        setUsers([
          { id: '1', username: 'DemoPlayer1', email: 'demo1@damcash.com', avatar: '🎯', elo_checkers: 1500, elo_chess: 1500, coins: 10000, status: 'active', created_date: new Date().toISOString(), last_active: new Date().toISOString(), reports_count: 0, games_played: 0 },
          { id: '2', username: 'DemoPlayer2', email: 'demo2@damcash.com', avatar: '👑', elo_checkers: 1600, elo_chess: 1400, coins: 5000, status: 'active', created_date: new Date().toISOString(), last_active: new Date().toISOString(), reports_count: 0, games_played: 0 },
        ]);
      }

      // Reports — keep static fallback (not tracked in DB yet)
      if (reportsData.status === 'fulfilled') {
        setReports(reportsData.value.reports || []);
      }

      // Transactions
      if (txData.status === 'fulfilled') {
        const mapped = (txData.value.transactions || []).map((t: any) => ({
          id: t.id,
          user: t.user || t.userId || '—',
          type: t.type || 'reward',
          amount: t.amount ?? 0,
          description: t.description || '—',
          date: t.createdAt || t.date || new Date().toISOString(),
        }));
        setTransactions(mapped);
      }

      // Puzzles
      if (puzzlesData.status === 'fulfilled') {
        const raw = puzzlesData.value.puzzles || [];
        const mapped = raw.map((p: any) => ({
          id: String(p.id),
          gameType: p.gameType || 'checkers',
          difficulty: p.difficulty || 'medium',
          theme: p.theme || p.title || 'Puzzle',
          rating: p.rating || 1200,
          plays: p.plays ?? 0,
          successRate: p.successRate ?? 50,
        }));
        setPuzzles(mapped);
      } else {
        // Static fallback
        setPuzzles([
          { id: 'p1', gameType: 'checkers', difficulty: 'easy', theme: 'Capture multiple', rating: 1200, plays: 0, successRate: 78 },
          { id: 'p2', gameType: 'checkers', difficulty: 'medium', theme: 'Roi en danger', rating: 1450, plays: 0, successRate: 54 },
        ]);
      }

      // System
      if (systemData.status === 'fulfilled') {
        const sys = systemData.value;
        setSystemStats({
          activeUsers: sys.activeUsers ?? 0,
          activeGames: sys.activeGames ?? 0,
          serverLoad: sys.serverLoad ?? 0,
          dbConnections: sys.dbConnections ?? 1,
          wsConnections: sys.wsConnections ?? 0,
          memoryUsage: sys.memoryUsage ?? 0,
          uptime: sys.uptime ?? 0,
        });
      }
    } catch (err) {
      console.warn('[Admin] Backend unreachable, using fallback data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);




  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-500';
      case 'banned': return 'bg-red-500/20 text-red-500';
      case 'suspended': return 'bg-yellow-500/20 text-yellow-500';
      case 'pending': return 'bg-blue-500/20 text-blue-500';
      case 'resolved': return 'bg-green-500/20 text-green-500';
      case 'dismissed': return 'bg-gray-500/20 text-gray-400';
      default: return '';
    }
  };

  const handleBanUser = async (userId: string) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' as const } : u));
    setSelectedUser(null);
    try {
      await adminAPI.banUser(userId);
      showToast('Utilisateur banni', 'success');
    } catch {
      showToast('Utilisateur banni (mode hors ligne)', 'success');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' as const } : u));
    setSelectedUser(null);
    try {
      await adminAPI.unbanUser(userId);
      showToast('Utilisateur débanni', 'success');
    } catch {
      showToast('Utilisateur débanni (mode hors ligne)', 'success');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' as const } : u));
    setSelectedUser(null);
    try {
      await adminAPI.suspendUser(userId);
      showToast('Utilisateur suspendu', 'success');
    } catch {
      showToast('Utilisateur suspendu (mode hors ligne)', 'success');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' as const } : r));
    setQuickStats(prev => ({ ...prev, reportsPending: Math.max(0, prev.reportsPending - 1) }));
    setSelectedReport(null);
    try {
      await adminAPI.resolveReport(reportId);
      showToast('Signalement résolu', 'success');
    } catch {
      showToast('Signalement résolu (mode hors ligne)', 'success');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' as const } : r));
    setQuickStats(prev => ({ ...prev, reportsPending: Math.max(0, prev.reportsPending - 1) }));
    setSelectedReport(null);
    try {
      await adminAPI.dismissReport(reportId);
      showToast('Signalement rejeté', 'info');
    } catch {
      showToast('Signalement rejeté (mode hors ligne)', 'info');
    }
  };

  // Filtered data
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReports = reports.filter(r => {
    return reportStatusFilter === 'all' || r.status === reportStatusFilter;
  });

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'reports', label: 'Signalements', icon: Flag, badge: quickStats.reportsPending },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'puzzles', label: 'Puzzles', icon: Brain },
    { id: 'system', label: 'Système', icon: Server }
  ];

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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold" style={{ color: themeColors.text }}>
                  Administration
                </h1>
                <p style={{ color: themeColors.textMuted }}>
                  Tableau de bord administrateur
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
              className="p-2 rounded-xl transition-colors"
              style={{ backgroundColor: themeColors.card }}
            >
              <RefreshCw className="w-5 h-5" style={{ color: themeColors.textMuted }} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'scale-105' : ''
                  }`}
                style={{
                  backgroundColor: activeTab === tab.id ? themeColors.accent : themeColors.card,
                  color: activeTab === tab.id ? '#fff' : themeColors.textMuted
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Total utilisateurs</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                    {quickStats.totalUsers.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Nouveaux aujourd'hui</span>
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    +{quickStats.newUsersToday}
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 className="w-5 h-5 text-purple-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Parties en cours</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                    {quickStats.activeGames}
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Tournois en attente</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                    {quickStats.tournamentsPending}
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Revenus du jour</span>
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    {quickStats.revenueToday.toFixed(2)}€
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Signalements</span>
                  </div>
                  <div className="text-2xl font-bold text-red-500">
                    {quickStats.reportsPending}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                    <Activity className="w-5 h-5" style={{ color: themeColors.accent }} />
                    Activité (7 derniers jours)
                  </h3>
                  <div className="space-y-3">
                    {dailyStats.map((day, index) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <span className="w-16 text-sm" style={{ color: themeColors.textMuted }}>
                          {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                        <div className="flex-1">
                          <div className="h-6 rounded-lg overflow-hidden" style={{ backgroundColor: themeColors.hover }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(day.gamesPlayed / 4000) * 100}%` }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                              className="h-full rounded-lg"
                              style={{ backgroundColor: themeColors.accent }}
                            />
                          </div>
                        </div>
                        <span className="w-16 text-right text-sm" style={{ color: themeColors.text }}>
                          {day.gamesPlayed}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Chart */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Revenus (7 derniers jours)
                  </h3>
                  <div className="space-y-3">
                    {dailyStats.map((day, index) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <span className="w-16 text-sm" style={{ color: themeColors.textMuted }}>
                          {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                        <div className="flex-1">
                          <div className="h-6 rounded-lg overflow-hidden" style={{ backgroundColor: themeColors.hover }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(day.revenue / 2500) * 100}%` }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                              className="h-full rounded-lg bg-green-500"
                            />
                          </div>
                        </div>
                        <span className="w-20 text-right text-sm text-green-500">
                          {day.revenue.toFixed(0)}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    <span className="font-bold" style={{ color: themeColors.text }}>Signalements récents</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-sm flex items-center gap-1"
                    style={{ color: themeColors.accent }}
                  >
                    Voir tout
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y" style={{ borderColor: themeColors.border }}>
                  {reports.filter(r => r.status === 'pending').slice(0, 3).map((report) => (
                    <div key={report.id} className="p-4 flex items-center gap-4">
                      <div className="text-2xl">{report.reported.avatar}</div>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: themeColors.text }}>
                          {report.reported.username}
                        </div>
                        <div className="text-sm" style={{ color: themeColors.textMuted }}>
                          {report.reason}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs ${getStatusColor(report.status)}`}>
                        En attente
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: themeColors.textMuted }} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: themeColors.card,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.border}`
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'active', 'suspended', 'banned'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setUserStatusFilter(status as typeof userStatusFilter)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors ${userStatusFilter === status ? 'font-medium' : ''
                        }`}
                      style={{
                        backgroundColor: userStatusFilter === status ? themeColors.accent : themeColors.card,
                        color: userStatusFilter === status ? '#fff' : themeColors.text
                      }}
                    >
                      {status === 'all' ? 'Tous' : status === 'active' ? 'Actif' : status === 'suspended' ? 'Suspendu' : 'Banni'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users List */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: themeColors.border }}>
                        <th className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>Utilisateur</th>
                        <th className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>ELO</th>
                        <th className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>Coins</th>
                        <th className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>Parties</th>
                        <th className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>Statut</th>
                        <th className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-black/5" style={{ borderColor: themeColors.border }}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{u.avatar}</div>
                              <div>
                                <div className="font-medium" style={{ color: themeColors.text }}>{u.username}</div>
                                <div className="text-sm" style={{ color: themeColors.textMuted }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div style={{ color: themeColors.text }}>D: {u.elo_checkers}</div>
                              <div style={{ color: themeColors.textMuted }}>E: {u.elo_chess}</div>
                            </div>
                          </td>
                          <td className="p-4" style={{ color: themeColors.text }}>{u.coins.toLocaleString()}</td>
                          <td className="p-4" style={{ color: themeColors.text }}>{u.games_played}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-xs ${getStatusColor(u.status)}`}>
                              {u.status === 'active' ? 'Actif' : u.status === 'suspended' ? 'Suspendu' : u.status === 'banned' ? 'Banni' : 'En attente'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ backgroundColor: themeColors.hover }}
                            >
                              <MoreVertical className="w-4 h-4" style={{ color: themeColors.textMuted }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'pending', 'resolved', 'dismissed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setReportStatusFilter(status as typeof reportStatusFilter)}
                    className={`px-4 py-2 rounded-xl text-sm transition-colors whitespace-nowrap ${reportStatusFilter === status ? 'font-medium' : ''
                      }`}
                    style={{
                      backgroundColor: reportStatusFilter === status ? themeColors.accent : themeColors.card,
                      color: reportStatusFilter === status ? '#fff' : themeColors.text
                    }}
                  >
                    {status === 'all' ? 'Tous' : status === 'pending' ? 'En attente' : status === 'resolved' ? 'Résolus' : 'Rejetés'}
                    {status === 'pending' && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500 text-white text-xs">
                        {reports.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {filteredReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: themeColors.card }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-xl ${report.status === 'pending' ? 'bg-yellow-500/20' : report.status === 'resolved' ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                          {report.status === 'pending' ? (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          ) : report.status === 'resolved' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{report.reported.avatar}</span>
                          <span className="font-bold" style={{ color: themeColors.text }}>
                            {report.reported.username}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(report.status)}`}>
                            {report.status === 'pending' ? 'En attente' : report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                          </span>
                        </div>

                        <div className="mb-2">
                          <span className="font-medium" style={{ color: themeColors.accent }}>{report.reason}</span>
                        </div>

                        <p className="text-sm mb-3" style={{ color: themeColors.textMuted }}>
                          {report.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm" style={{ color: themeColors.textMuted }}>
                          <span>Signalé par: {report.reporter.username}</span>
                          <span>{formatDate(report.created_date)}</span>
                          {report.game_id && (
                            <button className="flex items-center gap-1 text-blue-500">
                              <Eye className="w-4 h-4" />
                              Voir la partie
                            </button>
                          )}
                        </div>
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            className="p-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: themeColors.hover }}
                          >
                            <MoreVertical className="w-5 h-5" style={{ color: themeColors.textMuted }} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Revenue Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Revenus du jour', value: `${quickStats.revenueToday.toFixed(2)}€`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/20' },
                  { label: 'Revenus (7j)', value: `${dailyStats.reduce((s, d) => s + d.revenue, 0).toFixed(0)}€`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/20' },
                  { label: 'Transactions', value: transactions.length.toString(), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/20' },
                  { label: 'Revenus totaux', value: '28 540€', icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
                ].map((card) => (
                  <div key={card.label} className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                    <div className={`p-2 rounded-lg ${card.bg} w-fit mb-3`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-sm mt-1" style={{ color: themeColors.textMuted }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Grant Coins */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                  <PlusCircle className="w-5 h-5 text-yellow-500" />
                  Attribuer des coins à un utilisateur
                </h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    className="flex-1 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text, border: `1px solid ${themeColors.border}` }}
                  />
                  <input
                    value={coinAdjustAmount}
                    onChange={e => setCoinAdjustAmount(e.target.value)}
                    type="number"
                    placeholder="Montant (+ ou -)"
                    className="w-40 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text, border: `1px solid ${themeColors.border}` }}
                  />
                  <input
                    value={coinAdjustReason}
                    onChange={e => setCoinAdjustReason(e.target.value)}
                    type="text"
                    placeholder="Raison"
                    className="flex-1 px-4 py-2 rounded-xl"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text, border: `1px solid ${themeColors.border}` }}
                  />
                  <button
                    onClick={() => { showToast('Coins attribués !', 'success'); setCoinAdjustAmount(''); setCoinAdjustReason(''); }}
                    className="px-6 py-2 rounded-xl font-semibold text-white"
                    style={{ backgroundColor: themeColors.accent }}
                  >
                    Confirmer
                  </button>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: themeColors.border }}>
                  <Activity className="w-5 h-5" style={{ color: themeColors.accent }} />
                  <span className="font-bold" style={{ color: themeColors.text }}>Transactions récentes</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: themeColors.border }}>
                        {['Utilisateur', 'Type', 'Montant', 'Description', 'Date'].map(h => (
                          <th key={h} className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-b hover:bg-black/5" style={{ borderColor: themeColors.border }}>
                          <td className="p-4 font-medium" style={{ color: themeColors.text }}>{tx.user}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                              tx.type === 'purchase' ? 'bg-blue-500/20 text-blue-400' :
                                tx.type === 'tournament_prize' ? 'bg-yellow-500/20 text-yellow-400' :
                                  tx.type === 'tournament_fee' ? 'bg-purple-500/20 text-purple-400' :
                                    tx.type === 'reward' ? 'bg-teal-500/20 text-teal-400' :
                                      'bg-gray-500/20 text-gray-400'
                              }`}>
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`p-4 font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}€
                          </td>
                          <td className="p-4" style={{ color: themeColors.textMuted }}>{tx.description}</td>
                          <td className="p-4 text-sm" style={{ color: themeColors.textMuted }}>{formatDate(tx.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Puzzles Tab */}
          {activeTab === 'puzzles' && (
            <motion.div
              key="puzzles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ color: themeColors.text }}>
                  Gestion des puzzles ({puzzles.length})
                </h3>
                <a
                  href="/admin/puzzle-editor"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: themeColors.accent }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Nouveau puzzle
                </a>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: themeColors.border }}>
                        {['Jeu', 'Thème', 'Difficulté', 'Rating', 'Parties', 'Réussite', 'Actions'].map(h => (
                          <th key={h} className="text-left p-4 font-medium" style={{ color: themeColors.textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {puzzles.map((p, idx) => (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b hover:bg-black/5"
                          style={{ borderColor: themeColors.border }}
                        >
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${p.gameType === 'checkers' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                              {p.gameType === 'checkers' ? '🔴 Dames' : '♟ Échecs'}
                            </span>
                          </td>
                          <td className="p-4 font-medium" style={{ color: themeColors.text }}>{p.theme}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${p.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                              p.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                p.difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-red-500/20 text-red-400'
                              }`}>
                              {p.difficulty}
                            </span>
                          </td>
                          <td className="p-4" style={{ color: themeColors.text }}>{p.rating}</td>
                          <td className="p-4" style={{ color: themeColors.textMuted }}>{p.plays.toLocaleString()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.hover, minWidth: 50 }}>
                                <div className="h-full rounded-full bg-green-500" style={{ width: `${p.successRate}%` }} />
                              </div>
                              <span className="text-sm" style={{ color: themeColors.textMuted }}>{p.successRate}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <a
                                href="/admin/puzzle-editor"
                                className="p-2 rounded-lg transition-colors"
                                style={{ backgroundColor: themeColors.hover }}
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" style={{ color: themeColors.accent }} />
                              </a>
                              {puzzleToDelete === p.id ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setPuzzles(prev => prev.filter(x => x.id !== p.id)); setPuzzleToDelete(null); showToast('Puzzle supprimé', 'success'); }}
                                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setPuzzleToDelete(null)} className="p-2 rounded-lg" style={{ backgroundColor: themeColors.hover }}>
                                    <X className="w-4 h-4" style={{ color: themeColors.textMuted }} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setPuzzleToDelete(p.id)}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && systemStats && (

            <motion.div
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* System Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Charge serveur</span>
                  </div>
                  <div className="text-3xl font-bold mb-2" style={{ color: themeColors.text }}>
                    {systemStats.serverLoad}%
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.hover }}>
                    <div
                      className={`h-full rounded-full transition-all ${systemStats.serverLoad > 80 ? 'bg-red-500' :
                        systemStats.serverLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      style={{ width: `${systemStats.serverLoad}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <HardDrive className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Mémoire</span>
                  </div>
                  <div className="text-3xl font-bold mb-2" style={{ color: themeColors.text }}>
                    {systemStats.memoryUsage}%
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.hover }}>
                    <div
                      className={`h-full rounded-full transition-all ${systemStats.memoryUsage > 80 ? 'bg-red-500' :
                        systemStats.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      style={{ width: `${systemStats.memoryUsage}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>Connexions DB</span>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: themeColors.text }}>
                    {systemStats.dbConnections}
                  </div>
                  <div className="text-sm" style={{ color: themeColors.textMuted }}>actives</div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="w-5 h-5" style={{ color: themeColors.accent }} />
                    <span className="text-sm" style={{ color: themeColors.textMuted }}>WebSockets</span>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: themeColors.text }}>
                    {systemStats.wsConnections.toLocaleString()}
                  </div>
                  <div className="text-sm" style={{ color: themeColors.textMuted }}>connexions</div>
                </div>
              </div>

              {/* Server Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                    <Server className="w-5 h-5" style={{ color: themeColors.accent }} />
                    Informations serveur
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textMuted }}>Uptime</span>
                      <span style={{ color: themeColors.text }}>{formatUptime(systemStats.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textMuted }}>Utilisateurs actifs</span>
                      <span style={{ color: themeColors.text }}>{systemStats.activeUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textMuted }}>Parties en cours</span>
                      <span style={{ color: themeColors.text }}>{systemStats.activeGames}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textMuted }}>Version</span>
                      <span style={{ color: themeColors.text }}>v2.0.0</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                  <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                    <Settings className="w-5 h-5" style={{ color: themeColors.accent }} />
                    Actions rapides
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => showToast('Cache vidé', 'success')}
                      className="p-3 rounded-xl flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: themeColors.hover }}
                    >
                      <Trash2 className="w-5 h-5" style={{ color: themeColors.accent }} />
                      <span style={{ color: themeColors.text }}>Vider le cache</span>
                    </button>
                    <button
                      onClick={() => showToast('Maintenance planifiée', 'info')}
                      className="p-3 rounded-xl flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: themeColors.hover }}
                    >
                      <Clock className="w-5 h-5" style={{ color: themeColors.accent }} />
                      <span style={{ color: themeColors.text }}>Maintenance</span>
                    </button>
                    <button
                      onClick={() => showToast('Statistiques exportées', 'success')}
                      className="p-3 rounded-xl flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: themeColors.hover }}
                    >
                      <Download className="w-5 h-5" style={{ color: themeColors.accent }} />
                      <span style={{ color: themeColors.text }}>Exporter stats</span>
                    </button>
                    <button
                      onClick={() => showToast('Broadcast envoyé', 'success')}
                      className="p-3 rounded-xl flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: themeColors.hover }}
                    >
                      <Mail className="w-5 h-5" style={{ color: themeColors.accent }} />
                      <span style={{ color: themeColors.text }}>Broadcast</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: themeColors.card }}>
                <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>
                  État des services
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'API', status: 'operational' },
                    { name: 'WebSocket', status: 'operational' },
                    { name: 'Base de données', status: 'operational' },
                    { name: 'Stockfish', status: 'operational' },
                    { name: 'Stripe', status: 'operational' },
                    { name: 'Redis', status: 'operational' },
                    { name: 'CDN', status: 'operational' },
                    { name: 'Email', status: 'degraded' }
                  ].map((service) => (
                    <div key={service.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: themeColors.hover }}>
                      <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-green-500' :
                        service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      <span style={{ color: themeColors.text }}>{service.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Actions Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ backgroundColor: themeColors.card }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">{selectedUser.avatar}</div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: themeColors.text }}>
                    {selectedUser.username}
                  </h3>
                  <p style={{ color: themeColors.textMuted }}>{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: themeColors.hover }}>
                  <span style={{ color: themeColors.textMuted }}>Statut</span>
                  <span className={`px-2 py-0.5 rounded ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: themeColors.hover }}>
                  <span style={{ color: themeColors.textMuted }}>Signalements</span>
                  <span style={{ color: selectedUser.reports_count > 0 ? '#ef4444' : themeColors.text }}>
                    {selectedUser.reports_count}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: themeColors.hover }}>
                  <span style={{ color: themeColors.textMuted }}>Dernière activité</span>
                  <span style={{ color: themeColors.text }}>
                    {formatDate(selectedUser.last_active)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    showToast('Profil ouvert', 'info');
                  }}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium"
                  style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                >
                  <Eye className="w-5 h-5" />
                  Voir le profil
                </button>

                {selectedUser.status !== 'suspended' && selectedUser.status !== 'banned' && (
                  <button
                    onClick={() => handleSuspendUser(selectedUser.id)}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium bg-yellow-500/20 text-yellow-500"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Suspendre (7 jours)
                  </button>
                )}

                {selectedUser.status !== 'banned' ? (
                  <button
                    onClick={() => handleBanUser(selectedUser.id)}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium bg-red-500/20 text-red-500"
                  >
                    <Ban className="w-5 h-5" />
                    Bannir définitivement
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnbanUser(selectedUser.id)}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium bg-green-500/20 text-green-500"
                  >
                    <UserCheck className="w-5 h-5" />
                    Débannir
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
