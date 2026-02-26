import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Gamepad2,
  Trophy,
  Users,
  User,
  MessageCircle,
  Bell,
  Settings,
  ShoppingBag,
  Shield,
  Swords,
  Crown,
  Eye,
  Menu,
  X,
  LogOut,
  LogIn
} from 'lucide-react'
import { isAdmin } from '../../lib/admin'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useRealTime } from '../../contexts/RealTimeContext'
import { useState } from 'react'
import InvitationNotifications from '../InvitationNotifications'
import BalanceDisplay from '../BalanceDisplay'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { gameType, toggleGameType } = useTheme()
  const { user, logout } = useAuth()
  const { notifications, isConnected } = useRealTime()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/lobby', icon: Users, label: 'Lobby' },
    { path: '/tournaments', icon: Trophy, label: 'Tournois' },
    { path: '/leaderboard', icon: Crown, label: 'Classement' },

    { path: '/spectate', icon: Eye, label: 'Spectateur' },
  ]

  const secondaryNavItems = [
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/shop', icon: ShoppingBag, label: 'Boutique' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-screen"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo_damcash.png" alt="DamCash Logo" className="h-16 w-auto object-contain" />

          </Link>
        </div>

        {/* Game Type Switcher */}
        <div className="p-4 border-b border-white/10">
          <button
            onClick={toggleGameType}
            className="w-full p-3 rounded-lg flex items-center justify-between transition-all hover:opacity-80"
            style={{ background: 'var(--bg-card)' }}
          >
            <span className="flex items-center gap-2">
              {gameType === 'checkers' ? (
                <>
                  <Swords className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold">Dames</span>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold">Échecs</span>
                </>
              )}
            </span>
            <span className="text-xs opacity-60">Changer</span>
          </button>
        </div>

        {/* Balance Display */}
        <div className="px-4 py-3 border-b border-white/10">
          <BalanceDisplay size="md" showLabel={true} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'text-black font-semibold'
                    : 'hover:bg-white/5'
                  }
                `}
                style={isActive ? { background: 'var(--accent)' } : {}}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-white/10">
            {secondaryNavItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'text-black font-semibold'
                      : 'hover:bg-white/5'
                    }
                  `}
                  style={isActive ? { background: 'var(--accent)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Admin Button — only visible to admin */}
            {isAdmin(user) && (
              <Link
                to="/admin"
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all mt-1
                  ${location.pathname.startsWith('/admin')
                    ? 'bg-red-600 text-white font-semibold'
                    : 'hover:bg-red-500/15 text-red-400 hover:text-red-300'
                  }
                `}
              >
                <Shield className="w-5 h-5" />
                <span>Administration</span>
              </Link>
            )}

            {/* Auth Button */}
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-500/10 text-red-400 hover:text-red-300 mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-green-500/10 text-green-400 hover:text-green-300 mt-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Se connecter</span>
              </Link>
            )}
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <Link
            to={`/profile/${user.id}`}
            className="p-4 border-t border-white/10 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="avatar w-10 h-10">
                <img src={user.avatarUrl} alt={user.username} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.username}</p>
                <p className="text-xs opacity-60">
                  {gameType === 'checkers' ? user.eloCheckers : user.eloChess} ELO
                </p>
              </div>
              <div className={`status-dot ${isConnected ? 'status-online' : 'status-offline'}`} />
            </div>
          </Link>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_damcash.png" alt="DamCash" className="h-14 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          {/* Balance Display (Mobile) */}
          <div className="hidden sm:block">
            <BalanceDisplay size="sm" showLabel={false} />
          </div>

          {/* Game Switcher */}
          <button
            onClick={toggleGameType}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
          >
            {gameType === 'checkers' ? (
              <Swords className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            ) : (
              <Crown className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            )}
          </button>

          {/* Notifications */}
          <Link to="/messages" className="p-2 rounded-lg relative hover:bg-white/10">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Link>

          {/* Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-64 p-4"
            style={{ background: 'var(--bg-secondary)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="pt-16 space-y-1">
              {[...navItems, ...secondaryNavItems].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${location.pathname === item.path
                      ? 'text-black font-semibold'
                      : 'hover:bg-white/5'
                    }
                  `}
                  style={location.pathname === item.path ? { background: 'var(--accent)' } : {}}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Mobile Admin Button */}
              {isAdmin(user) && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-500/15 text-red-400 hover:text-red-300"
                >
                  <Shield className="w-5 h-5" />
                  <span>Administration</span>
                </Link>
              )}

              {/* Mobile Auth */}
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-500/10 text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-green-500/10 text-green-400 hover:text-green-300"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-[100dvh] overflow-auto"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Real-time Invitation Notifications */}
      <InvitationNotifications />

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 px-4"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {[
          { path: '/', icon: Home, label: 'Accueil' },
          { path: '/lobby', icon: Gamepad2, label: 'Jouer' },
          { path: '/tournaments', icon: Trophy, label: 'Tournois' },
          { path: '/leaderboard', icon: Crown, label: 'Classement' },
          { path: `/profile/${user?.id}`, icon: User, label: 'Profil' },
        ].map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
