import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { RealTimeProvider } from './contexts/RealTimeContext'

import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'


// Eagerly loaded pages (small, frequently accessed)
import Home from './pages/Home'
import Game from './pages/Game'
import Lobby from './pages/Lobby'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'
import Wallet from './pages/Wallet'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import DailyPuzzle from './pages/DailyPuzzle'

// Lazy loaded pages (large, less frequently accessed)
const Training = lazy(() => import('./pages/Training'))
const ReplayCenter = lazy(() => import('./pages/ReplayCenter'))
const Spectate = lazy(() => import('./pages/Spectate'))
const GameHistory = lazy(() => import('./pages/GameHistory'))
const Teams = lazy(() => import('./pages/Teams'))
const TeamDetail = lazy(() => import('./pages/TeamDetail'))
const Tournaments = lazy(() => import('./pages/Tournaments'))
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'))
const TournamentLobby = lazy(() => import('./pages/TournamentLobby'))
const TournamentActive = lazy(() => import('./pages/TournamentActive'))

const Messages = lazy(() => import('./pages/Messages'))
const Shop = lazy(() => import('./pages/Shop'))
const Leagues = lazy(() => import('./pages/Leagues'))
const LeagueDetail = lazy(() => import('./pages/LeagueDetail'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const PuzzleEditor = lazy(() => import('./pages/PuzzleEditor').then(m => ({ default: m.PuzzleEditor })))

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f1e] to-[#1a1f2e]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#c9b037] mx-auto mb-4"></div>
      <p className="text-[#ede0c8] text-sm">Chargement...</p>
    </div>
  </div>
)

import { LanguageProvider } from './contexts/LanguageContext'

import { SeriesProvider } from './contexts/SeriesContext'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <RealTimeProvider>
              <SeriesProvider>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/game/:gameId?" element={
                        <ProtectedRoute>
                          <Game />
                        </ProtectedRoute>
                      } />
                      <Route path="/lobby" element={
                        <ProtectedRoute>
                          <Lobby />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile/:userId?" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/tournaments" element={<Tournaments />} />
                      <Route path="/tournament/:tournamentId/lobby" element={<TournamentLobby />} />
                      <Route path="/tournament/:tournamentId" element={<TournamentActive />} />
                      <Route path="/tournament-detail/:tournamentId" element={<TournamentDetail />} />

                      <Route path="/puzzle" element={<DailyPuzzle />} />
                      <Route path="/admin/puzzle-editor" element={
                        <AdminRoute>
                          <Suspense fallback={<PageLoader />}>
                            <PuzzleEditor />
                          </Suspense>
                        </AdminRoute>
                      } />
                      <Route path="/training" element={<Training />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/shop" element={
                        <ProtectedRoute>
                          <Shop />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } />
                      <Route path="/spectate/:gameId?" element={<Spectate />} />
                      <Route path="/leagues" element={<Leagues />} />
                      <Route path="/league/:leagueId" element={<LeagueDetail />} />
                      <Route path="/teams" element={<Teams />} />
                      <Route path="/team/:teamId" element={<TeamDetail />} />

                      <Route path="/replay/:gameId?" element={<ReplayCenter />} />
                      <Route path="/history" element={<GameHistory />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    </Routes>
                  </Suspense>
                </Layout>
              </SeriesProvider>
            </RealTimeProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
