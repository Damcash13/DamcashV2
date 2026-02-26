import { API_BASE_URL } from '../config'

export interface LiveGame {
    id: string
    gameType: 'chess' | 'checkers'
    whitePlayer: {
        id: string
        username: string
        avatarUrl?: string
        eloCheckers?: number
        eloChess?: number
        tierCheckers?: string
        tierChess?: string
    }
    blackPlayer: {
        id: string
        username: string
        avatarUrl?: string
        eloCheckers?: number
        eloChess?: number
        tierCheckers?: string
        tierChess?: string
    }
    spectators: number
    timeControl: {
        initial: number
        increment: number
    }
    moveNumber: number
    status: 'active' | 'completed'
    startedAt: Date
    featured?: boolean
    tournament?: string
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
}

export const gamesAPI = {
    // Get all live games
    getLiveGames: async (): Promise<LiveGame[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/games/live`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch live games')
            const data = await response.json()
            return data.games || []
        } catch (error) {
            console.error('Error fetching live games:', error)
            return []
        }
    },

    // Get a specific game by ID
    getGameById: async (gameId: string): Promise<LiveGame | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch game')
            return await response.json()
        } catch (error) {
            console.error('Error fetching game:', error)
            return null
        }
    },

    // Get user's game history
    getGameHistory: async (userId: string): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/games/history/${userId}`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch game history')
            const data = await response.json()
            return data.games || []
        } catch (error) {
            console.error('Error fetching game history:', error)
            return []
        }
    }
}
