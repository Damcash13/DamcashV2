import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { GameType } from '../types'

interface ThemeContextType {
  gameType: GameType
  setGameType: (type: GameType) => void
  toggleGameType: () => void
  currentTheme: GameType
  setTheme: (type: GameType) => void
  themeColors: {
    bg: string
    surface: string
    card: string
    element: string
    accent: string
    text: string
    textMuted: string
    border: string
    hover: string
    input: string
    buttonPrimary: string
    buttonSecondary: string
    ring: string
    background: string
    cardHover: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const CHECKERS_COLORS = {
  // Premium Dark Brown Theme (Logo Match) - RESTORED
  bg: '#2C1810',                // Deep dark brown
  surface: '#3E2723',           // Lighter brown for sidebars
  card: '#3E2723',              // Matching cards
  element: '#4E342E',           // Interactive elements
  accent: '#FFD700',            // Gold accent from logo
  text: '#EFEBE9',              // Light cream text
  textMuted: '#BCAAA4',         // Muted brown text
  border: '#5D4037',            // Brown borders
  hover: '#4E342E',             // Hover state
  input: '#2C1810',             // Dark input
  buttonPrimary: 'bg-[#FFD700] hover:bg-[#FFC107] text-[#2C1810]',
  buttonSecondary: 'bg-transparent border border-[#5D4037] text-[#EFEBE9] hover:bg-[#4E342E]',
  ring: 'ring-[#FFD700]',
  background: '#2C1810',
  cardHover: 'hover:bg-[#4E342E]'
}

const CHESS_COLORS = {
  // Professional Dark Theme (lidraughts inspired)
  bg: '#161512',                // Dark background
  surface: '#252320',           // Dark UI elements
  card: '#252320',              // Cards same as surface
  element: '#2e2a24',           // Slightly lighter elements
  accent: '#7fa3b8',            // Subtle blue accent
  text: '#e8e6e3',              // Light gray text
  textMuted: '#a8a5a0',         // Muted gray
  border: '#3d3933',            // Subtle borders
  hover: '#3d3933',             // Subtle hover
  input: '#1a1815',             // Dark input
  buttonPrimary: 'bg-[#7fa3b8] hover:bg-[#8fb3c8] text-[#161512]',
  buttonSecondary: 'bg-[#2e2a24] text-[#e8e6e3] hover:bg-[#3d3933]',
  ring: 'ring-[#7fa3b8]',
  background: '#161512',
  cardHover: 'hover:brightness-110'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [gameType, setGameType] = useState<GameType>(() => {
    const saved = localStorage.getItem('damcash-game-type')
    return (saved as GameType) || 'checkers'
  })

  useEffect(() => {
    localStorage.setItem('damcash-game-type', gameType)
    document.documentElement.setAttribute('data-theme', gameType)

    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', gameType === 'checkers' ? CHECKERS_COLORS.bg : CHESS_COLORS.bg)
    }
  }, [gameType])

  const toggleGameType = () => {
    setGameType(prev => prev === 'checkers' ? 'chess' : 'checkers')
  }

  const themeColors = gameType === 'checkers' ? CHECKERS_COLORS : CHESS_COLORS

  return (
    <ThemeContext.Provider value={{
      gameType,
      setGameType,
      toggleGameType,
      currentTheme: gameType,
      setTheme: setGameType,
      themeColors
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
