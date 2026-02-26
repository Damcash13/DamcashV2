const API_BASE_URL = 'http://localhost:8000'

export interface UserStats {
    totalGames: number
    wins: number
    losses: number
    draws: number
    winRate: number
    checkersElo: number
    chessElo: number
    coins: number
    tournaments: number
}

export interface LeaderboardEntry {
    rank: number
    id: string
    username: string
    avatar?: string
    country?: string
    elo: number
    eloCheckers: number
    eloChess: number
    coins: number
}

export interface Transaction {
    id: string
    userId: string
    type: string
    amount: number
    balance: number
    description?: string
    relatedId?: string
    createdAt: string
}

class UserAPI {
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        const token = localStorage.getItem('auth_token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return headers
    }

    async getUser(userId: string) {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
            method: 'GET',
            headers: this.getHeaders(),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get user')
        }

        const result = await response.json()
        return result.user
    }

    async getUserStats(userId: string): Promise<UserStats> {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/stats`, {
            method: 'GET',
            headers: this.getHeaders(),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get user stats')
        }

        return await response.json()
    }

    async getLeaderboard(gameType: 'checkers' | 'chess', limit: number = 10): Promise<LeaderboardEntry[]> {
        const response = await fetch(`${API_BASE_URL}/api/leaderboard/${gameType}?limit=${limit}`, {
            method: 'GET',
            headers: this.getHeaders(),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get leaderboard')
        }

        const result = await response.json()
        return result.leaderboard
    }

    async getTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
        const response = await fetch(`${API_BASE_URL}/api/transactions/history/${userId}?limit=${limit}`, {
            method: 'GET',
            headers: this.getHeaders(),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get transactions')
        }

        const result = await response.json()
        return result.transactions
    }
}

export const userAPI = new UserAPI()
