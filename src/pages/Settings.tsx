import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Lock,
  Volume2,
  VolumeX,
  Check,
  ChevronRight,
  LogOut,
  Trash2,
  AlertTriangle,
  HelpCircle,
  FileText,
  ArrowLeft,
  Mail,
  Zap,
  MessageSquare,
  Users,
  Info,
  Trophy,
  Settings as SettingsIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EditProfileModal from '../components/user/EditProfileModal';

type SettingsSection = 'account' | 'preferences' | 'notifications' | 'privacy' | 'about';

const Settings: React.FC = () => {
  const { themeColors, currentTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('damcash_settings');
    return saved ? JSON.parse(saved) : {
      // Preferences
      soundEnabled: true,
      musicEnabled: false,
      soundVolume: 80,
      language: 'fr',
      autoQueen: true,
      showCoordinates: true,
      highlightMoves: true,
      animationSpeed: 'normal',

      // Notifications
      gameInvites: true,
      friendRequests: true,
      tournamentUpdates: true,
      messagesNotif: true,
      marketingEmails: false,
      pushNotifications: true,

      // Privacy
      showOnlineStatus: true,
      allowChallenges: true,
      profileVisible: true,
      showEloHistory: true,
    };
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('damcash_settings', JSON.stringify(settings));
  }, [settings]);

  const sections = [
    { id: 'account', label: 'Compte', icon: <User size={20} /> },
    { id: 'preferences', label: 'Préférences', icon: <SettingsIcon size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'privacy', label: 'Confidentialité', icon: <Shield size={20} /> },
    { id: 'about', label: 'À propos', icon: <Info size={20} /> },
  ];

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
  ];

  const animationSpeeds = [
    { value: 'slow', label: 'Lent' },
    { value: 'normal', label: 'Normal' },
    { value: 'fast', label: 'Rapide' },
    { value: 'instant', label: 'Instantané' },
  ];

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    showToast('Paramètres mis à jour', 'success');
  };

  const handleLogout = () => {
    logout();
    showToast('Vous avez été déconnecté', 'info');
  };

  const handleDeleteAccount = () => {
    showToast('Demande de suppression envoyée', 'info');
    setShowDeleteModal(false);
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
      style={{
        backgroundColor: enabled ? '#22c55e' : `${themeColors.text}40`,
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ left: enabled ? '1.75rem' : '0.25rem' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );

  const renderAccountSection = () => (
    <div className="space-y-4">
      {/* Profile Info */}
      <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold opacity-20" style={{ color: themeColors.text }}>
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold" style={{ color: themeColors.text }}>
              {user?.username || 'Joueur'}
            </h3>
            <p className="text-sm" style={{ color: themeColors.textMuted }}>
              {user?.email || 'joueur@example.com'}
            </p>
          </div>
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-95"
            style={{ backgroundColor: themeColors.accent, color: '#fff' }}
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Account Options */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
        <button
          onClick={() => setShowEditProfileModal(true)}
          className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 text-left border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <User size={20} style={{ color: themeColors.textMuted }} />
            <span style={{ color: themeColors.text }}>Modifier le profil</span>
          </div>
          <ChevronRight size={20} style={{ color: themeColors.textMuted }} />
        </button>

        <button
          onClick={() => showToast('Bientôt disponible', 'info')}
          className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 text-left border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <Mail size={20} style={{ color: themeColors.textMuted }} />
            <span style={{ color: themeColors.text }}>Changer d'email</span>
          </div>
          <ChevronRight size={20} style={{ color: themeColors.textMuted }} />
        </button>

        <button
          onClick={() => showToast('Bientôt disponible', 'info')}
          className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 text-left border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <Lock size={20} style={{ color: themeColors.textMuted }} />
            <span style={{ color: themeColors.text }}>Changer le mot de passe</span>
          </div>
          <ChevronRight size={20} style={{ color: themeColors.textMuted }} />
        </button>

        <button
          onClick={() => showToast('Bientôt disponible', 'info')}
          className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 text-left"
        >
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: themeColors.textMuted }} />
            <span style={{ color: themeColors.text }}>Comptes connectés</span>
          </div>
          <ChevronRight size={20} style={{ color: themeColors.textMuted }} />
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: themeColors.card }}>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 text-left border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <LogOut size={20} className="text-orange-500" />
            <span className="text-orange-500">Déconnexion</span>
          </div>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 text-left"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={20} className="text-red-500" />
            <span className="text-red-500">Supprimer le compte</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-4">
      {/* Theme */}
      <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>Thème</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('checkers')}
            className={`p-4 rounded-xl border-2 transition-all ${currentTheme === 'checkers' ? 'border-[#c9b037] ring-2 ring-[#c9b037]/50' : 'border-transparent'
              }`}
            style={{ backgroundColor: '#2d1b0f' }}
          >
            <div className="text-center">
              <div className="w-8 h-8 mx-auto rounded-full bg-[#c9b037] mb-2 shadow-lg" />
              <span className="text-sm text-[#ede0c8] font-medium">Dames</span>
            </div>
          </button>
          <button
            onClick={() => setTheme('chess')}
            className={`p-4 rounded-xl border-2 transition-all ${currentTheme === 'chess' ? 'border-[#3d7ddb] ring-2 ring-[#3d7ddb]/50' : 'border-transparent'
              }`}
            style={{ backgroundColor: '#0c1e3f' }}
          >
            <div className="text-center">
              <div className="w-8 h-8 mx-auto rounded-full bg-[#3d7ddb] mb-2 shadow-lg" />
              <span className="text-sm text-[#e0ecff] font-medium">Échecs</span>
            </div>
          </button>
        </div>
      </div>

      {/* Sound */}
      <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>Son</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span style={{ color: themeColors.text }}>Effets sonores</span>
            </div>
            <ToggleSwitch
              enabled={settings.soundEnabled}
              onChange={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            />
          </div>

          {settings.soundEnabled && (
            <div className="pl-8">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.soundVolume}
                onChange={(e) => updateSetting('soundVolume', parseInt(e.target.value))}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-xs" style={{ color: themeColors.textMuted }}>
                <span>0%</span>
                <span>{settings.soundVolume}%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={20} />
              <span style={{ color: themeColors.text }}>Musique d'ambiance</span>
            </div>
            <ToggleSwitch
              enabled={settings.musicEnabled}
              onChange={() => updateSetting('musicEnabled', !settings.musicEnabled)}
            />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>Langue</h3>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => updateSetting('language', lang.code)}
              className="flex items-center justify-between p-3 rounded-xl transition-colors border-2"
              style={{
                backgroundColor: settings.language === lang.code ? `${themeColors.accent}10` : 'transparent',
                borderColor: settings.language === lang.code ? themeColors.accent : 'transparent',
              }}
            >
              <span style={{ color: themeColors.text }}>{lang.name}</span>
              {settings.language === lang.code && (
                <Check size={16} style={{ color: themeColors.accent }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>Types de notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={20} style={{ color: themeColors.textMuted }} />
              <span style={{ color: themeColors.text }}>Invitations de jeu</span>
            </div>
            <ToggleSwitch
              enabled={settings.gameInvites}
              onChange={() => updateSetting('gameInvites', !settings.gameInvites)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={20} style={{ color: themeColors.textMuted }} />
              <span style={{ color: themeColors.text }}>Demandes d'amis</span>
            </div>
            <ToggleSwitch
              enabled={settings.friendRequests}
              onChange={() => updateSetting('friendRequests', !settings.friendRequests)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy size={20} style={{ color: themeColors.textMuted }} />
              <span style={{ color: themeColors.text }}>Mises à jour des tournois</span>
            </div>
            <ToggleSwitch
              enabled={settings.tournamentUpdates}
              onChange={() => updateSetting('tournamentUpdates', !settings.tournamentUpdates)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} style={{ color: themeColors.textMuted }} />
              <span style={{ color: themeColors.text }}>Messages</span>
            </div>
            <ToggleSwitch
              enabled={settings.messagesNotif}
              onChange={() => updateSetting('messagesNotif', !settings.messagesNotif)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <h3 className="font-bold mb-4" style={{ color: themeColors.text }}>Confidentialité du profil</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span style={{ color: themeColors.text }}>Statut en ligne</span>
              <p className="text-xs text-gray-500">Permettre aux autres de voir quand vous êtes connecté</p>
            </div>
            <ToggleSwitch
              enabled={settings.showOnlineStatus}
              onChange={() => updateSetting('showOnlineStatus', !settings.showOnlineStatus)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ color: themeColors.text }}>Défis directs</span>
              <p className="text-xs text-gray-500">Recevoir des défis des autres joueurs</p>
            </div>
            <ToggleSwitch
              enabled={settings.allowChallenges}
              onChange={() => updateSetting('allowChallenges', !settings.allowChallenges)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAboutSection = () => (
    <div className="space-y-4 text-center">
      <div className="p-8 rounded-2xl" style={{ backgroundColor: themeColors.card }}>
        <div className="w-20 h-20 mx-auto rounded-3xl bg-yellow-500/10 flex items-center justify-center mb-4">
          <span className="text-4xl">👑</span>
        </div>
        <h2 className="text-2xl font-bold" style={{ color: themeColors.text }}>Damcash</h2>
        <p className="text-sm opacity-50" style={{ color: themeColors.textMuted }}>Version 2.1.0</p>
        <p className="mt-4 text-sm" style={{ color: themeColors.text }}>La plateforme ultime pour les amateurs de dames et d'échecs.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-8 border-b border-white/5" style={{ backgroundColor: themeColors.background }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="p-3 rounded-2xl hover:bg-white/5 transition-colors" style={{ backgroundColor: themeColors.card }}>
            <ArrowLeft size={20} style={{ color: themeColors.text }} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: themeColors.text }}>Paramètres</h1>
            <p className="text-sm opacity-50" style={{ color: themeColors.textMuted }}>Gérez votre compte et vos préférences</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation */}
          <div className="md:w-64 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as SettingsSection)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all"
                style={{
                  backgroundColor: activeSection === section.id ? themeColors.card : 'transparent',
                  color: activeSection === section.id ? themeColors.accent : themeColors.textMuted,
                  border: activeSection === section.id ? `1px solid ${themeColors.accent}20` : '1px solid transparent'
                }}
              >
                <div className={`${activeSection === section.id ? 'opacity-100' : 'opacity-50'}`}>
                  {section.icon}
                </div>
                <span className="font-bold">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'account' && renderAccountSection()}
                {activeSection === 'preferences' && renderPreferencesSection()}
                {activeSection === 'notifications' && renderNotificationsSection()}
                {activeSection === 'privacy' && renderPrivacySection()}
                {activeSection === 'about' && renderAboutSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-8 border border-white/10"
              style={{ backgroundColor: themeColors.card }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                  <LogOut size={32} className="text-orange-500" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Déconnexion ?</h2>
                <p className="mt-2 text-sm opacity-70" style={{ color: themeColors.textMuted }}>
                  Êtes-vous sûr de vouloir vous déconnecter ?
                </p>
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-4 rounded-2xl font-bold transition-colors"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-orange-500 shadow-lg shadow-orange-500/20"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-8 border border-white/10"
              style={{ backgroundColor: themeColors.card }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>Supprimer le compte ?</h2>
                <p className="mt-2 text-sm opacity-70" style={{ color: themeColors.textMuted }}>
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-4 rounded-2xl font-bold transition-colors"
                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/20"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </div>
  );
};

export default Settings;
