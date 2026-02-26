import { API_BASE_URL } from '../config'
import type { Tournament } from '../types'

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
}

export const tournamentAPI = {
    // Get all tournaments
    getTournaments: async (): Promise<Tournament[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournaments`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch tournaments')
            const data = await response.json()
            return data.tournaments || []
        } catch (error) {
            console.error('Error fetching tournaments:', error)
            return []
        }
    },

    // Get tournament by ID
    getTournament: async (tournamentId: string): Promise<Tournament | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournament/${tournamentId}`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch tournament')
            return await response.json()
        } catch (error) {
            console.error('Error fetching tournament:', error)
            return null
        }
    },

    // Join a tournament
    joinTournament: async (tournamentId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournament/${tournamentId}/join`, {
                method: 'POST',
                headers: getAuthHeaders()
            })
            return response.ok
        } catch (error) {
            console.error('Error joining tournament:', error)
            return false
        }
    },

    // Withdraw from tournament
    withdrawFromTournament: async (tournamentId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournament/${tournamentId}/withdraw`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            return response.ok
        } catch (error) {
            console.error('Error withdrawing from tournament:', error)
            return false
        }
    },

    // Create tournament (admin only)
    createTournament: async (tournamentData: Partial<Tournament>): Promise<Tournament | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournament/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(tournamentData)
            })
            if (!response.ok) throw new Error('Failed to create tournament')
            return await response.json()
        } catch (error) {
            console.error('Error creating tournament:', error)
            return null
        }
    }
}
