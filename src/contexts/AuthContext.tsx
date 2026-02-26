import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, UserStats } from '../types'
import { supabase } from '../lib/supabase'
import { userAPI } from '../api/userAPI'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void> // Updated signature
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  userStats: UserStats | null
  updateWallet: (amount: number, formattedAmount: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch profile from Supabase
  const fetchProfile = async (userId: string, email?: string, userMetadata?: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignore 'No rows found' if valid session

      // Map DB snake_case to App camelCase
      // Prefer profile table data, fallback to metadata
      const appUser: User = {
        id: userId,
        username: profile?.username || userMetadata?.username || email?.split('@')[0] || 'User',
        fullName: profile?.full_name || userMetadata?.full_name || userMetadata?.username || 'User',
        email: email,
        avatarUrl: profile?.avatar_url || userMetadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        bio: profile?.bio || userMetadata?.bio || '',
        country: profile?.country || userMetadata?.country || '',
        eloCheckers: profile?.elo_checkers || 1200,
        eloChess: profile?.elo_chess || 1200,
        tierCheckers: getTier(profile?.elo_checkers || 1200),
        tierChess: getTier(profile?.elo_chess || 1200),
        coins: profile?.coins || 1000,
        dailyScore: 0,
        playedPuzzles: 0,
        createdDate: new Date(profile?.created_at || Date.now()),
      }
      setUser(appUser)

      // Load stats
      setUserStats({
        gamesPlayed: profile?.games_played || 0,
        wins: profile?.wins || 0,
        losses: profile?.losses || 0,
        draws: profile?.draws || 0,
        winRate: (profile?.games_played) ? ((profile?.wins || 0) / profile?.games_played) * 100 : 0,
        currentStreak: 0,
        bestStreak: 0,
      })

    } catch (err) {
      console.error('Error fetching profile:', err)
      // Fallback if profile fetch fails but we have session
      if (userId && email) {
        // Create basic user from metadata
        setUser({
          id: userId,
          username: userMetadata?.username || email?.split('@')[0] || 'User',
          fullName: userMetadata?.full_name || 'User',
          email: email,
          avatarUrl: userMetadata?.avatar_url || '',
          bio: userMetadata?.bio || '',
          country: userMetadata?.country || '',
          eloCheckers: 1200,
          eloChess: 1200,
          tierCheckers: 'Bronze',
          tierChess: 'Bronze',
          coins: 1000,
          dailyScore: 0,
          playedPuzzles: 0,
          createdDate: new Date(),
        })
      }
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata).then(() => setIsLoading(false))
      } else {
        setUser(null)
        setUserStats(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserStats(null)
    setIsLoading(false) // Stop loading on logout
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return

    try {
      // 1. Update Auth Metadata (bio, country, avatar, etc)
      const metadataUpdates: any = {}
      if (updates.bio !== undefined) metadataUpdates.bio = updates.bio
      if (updates.country !== undefined) metadataUpdates.country = updates.country
      if (updates.username) metadataUpdates.username = updates.username
      if (updates.fullName) metadataUpdates.full_name = updates.fullName
      if (updates.avatarUrl) metadataUpdates.avatar_url = updates.avatarUrl

      if (Object.keys(metadataUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: metadataUpdates
        })
        if (authError) throw authError
      }

      // 2. Update Public Profile Table (only fields that exist)
      // We assume profiles table MIGHT NOT have bio/country if schema is old
      // So we only update core fields we know usually exist, or try/catch?
      // For now, let's ONLY update what we know exists to avoid error:
      // username, full_name, avatar_url. 
      // If we need bio/country in profiles table, we'd need to migrate DB.
      // But user_metadata is sufficient for display if we read it correctly.

      const dbUpdates: any = {}
      if (updates.username) dbUpdates.username = updates.username
      if (updates.fullName) dbUpdates.full_name = updates.fullName
      if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio
      if (updates.country !== undefined) dbUpdates.country = updates.country

      // Attempt to update profile table if there are changes
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id)

        if (error) {
          console.warn("Could not update profiles table (might be missing columns or row):", error)
          // Don't throw, as auth update succeeded
        }
      }

      // Update local state
      setUser({ ...user, ...updates })
    } catch (err) {
      console.error('Failed to update profile:', err)
      throw err
    }
  }

  const updateWallet = async (amount: number, _formattedAmount: number) => {
    if (!user) return
    // Optimistic update
    setUser({ ...user, coins: user.coins + amount })

    // DB Update
    await supabase.rpc('increment_coins', { amount_to_add: amount, user_id: user.id })
    // Note: We need to create this RPC function later, or use simple update
    // For now, simple update (unsafe for concurrency but works for MVP)
    const { error } = await supabase
      .from('profiles')
      .update({ coins: user.coins + amount })
      .eq('id', user.id)

    if (error) console.error("Error updating wallet", error)
  }

  const refreshUser = async () => {
    if (user?.id) fetchProfile(user.id, user.email)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateProfile,
      refreshUser,
      userStats,
      updateWallet,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function getTier(elo: number): string {
  if (elo >= 2000) return 'Diamond'
  if (elo >= 1800) return 'Platinum'
  if (elo >= 1600) return 'Gold'
  if (elo >= 1400) return 'Silver'
  return 'Bronze'
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
