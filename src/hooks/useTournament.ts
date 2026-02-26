import { useState, useEffect, useCallback, useRef } from 'react'
import { MOCK_TOURNAMENTS } from '../data/mockTournaments'


export interface TournamentPlayer {
    userId: string
    username: string
    rating: number
    score: number
    games: number
    wins: number
    draws: number
    losses: number
    streak: number
    maxStreak: number
    onFire: boolean
    berserkCount: number
    performance: number
    buchholz: number
    isPlaying: boolean
    currentGameId?: string
    lastPairedWith?: string
    joinedAt: Date
    opponentIds: string[]
}

export interface TournamentStanding {
    rank: number
    userId: string
    username: string
    rating: number
    score: number
    games: number
    wins: number
    streak: number
    onFire: boolean
    performance: number
    buchholz: number
    isPlaying: boolean
}

export interface TournamentPairing {
    whiteId: string
    blackId: string
    gameId: string
    createdAt: Date
}

export interface Tournament {
    id: string
    name: string
    type?: 'SCHEDULED' | 'SNG'
    gameType: 'checkers' | 'chess'
    variant: string
    status: 'upcoming' | 'ongoing' | 'completed' | 'finished'
    startTime: string | Date
    duration: number
    rated: boolean
    minRating?: number
    maxRating?: number
    maxPlayers?: number
    allowBerserk: boolean
    minGames: number
    createdBy: string
    createdAt: string | Date
    players: TournamentPlayer[]
    games: any[]
    pairings: Array<{ playerId: string, opponentId: string }>
    waitingPlayers: string[]
    totalGames: number
    finishedGames: number
}

export function useTournament(tournamentId: string, userId?: string) {
    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [standings, setStandings] = useState<TournamentStanding[]>([])
    const [myPairing, setMyPairing] = useState<TournamentPairing | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<number>()

    // Fetch tournament data
    const fetchTournament = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/tournament/${tournamentId}`)
            if (!response.ok) throw new Error('Failed to fetch tournament')

            const data = await response.json()
            setTournament(data.tournament)
            setStandings(data.standings)
            setIsLoading(false)
        } catch (err) {
            console.warn('[Tournament] API fetch failed, trying mock data...', err)
            // Fallback to mock data if API fails
            const mockTour = MOCK_TOURNAMENTS[tournamentId]
            if (mockTour) {
                setTournament(mockTour)
                // Generate mock standings from players if needed, or use empty
                const mockStandings: TournamentStanding[] = mockTour.players.map((p, i) => ({
                    rank: i + 1,
                    userId: p.userId,
                    username: p.username,
                    rating: p.rating,
                    score: p.score,
                    games: p.games,
                    wins: p.wins,
                    streak: p.streak,
                    onFire: p.onFire,
                    performance: p.performance,
                    buchholz: p.buchholz,
                    isPlaying: p.isPlaying
                }))
                setStandings(mockStandings)
                setIsLoading(false)
                setError(null) // Clear error since we found mock data
            } else {
                setError(err instanceof Error ? err.message : 'Unknown error')
                setIsLoading(false)
            }
        }
    }, [tournamentId])

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        if (!userId) return

        const ws = new WebSocket(`ws://localhost:8000/ws`)

        ws.onopen = () => {
            console.log('[Tournament WS] Connected')
            setIsConnected(true)
            ws.send(JSON.stringify({
                type: 'tournament_join',
                payload: { tournamentId, userId }
            }))
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                handleWebSocketMessage(message)
            } catch (err) {
                console.error('[Tournament WS] Error parsing message:', err)
            }
        }

        ws.onerror = (error) => {
            console.error('[Tournament WS] Error:', error)
            setIsConnected(false)
        }

        ws.onclose = () => {
            console.log('[Tournament WS] Disconnected')
            setIsConnected(false)

            // Reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('[Tournament WS] Reconnecting...')
                connectWebSocket()
            }, 3000)
        }

        wsRef.current = ws
    }, [tournamentId, userId])

    const handleWebSocketMessage = (message: any) => {
        switch (message.type) {
            case 'tournament:state':
                setTournament(message.data.tournament)
                setStandings(message.data.standings)
                break

            case 'tournament:standings':
                setStandings(message.data)
                break

            case 'tournament:pairing':
                const pairing = message.data
                if (userId && (pairing.whiteId === userId || pairing.blackId === userId)) {
                    setMyPairing(pairing)
                }
                // Refresh tournament data
                fetchTournament()
                break

            case 'tournament:game_finished':
                // Refresh standings
                fetchTournament()
                setMyPairing(null)
                break

            case 'tournament:player_joined':
            case 'tournament:player_left':
                // Refresh tournament data
                fetchTournament()
                break

            case 'tournament:started':
                // Refresh tournament data
                fetchTournament()
                break

            case 'tournament:finished':
                // Refresh tournament data
                fetchTournament()
                break

            case 'tournament:berserk':
                // Refresh tournament data
                fetchTournament()
                break
        }
    }

    // Get time remaining
    const getTimeRemaining = useCallback(() => {
        if (!tournament) return 0

        if (tournament.status === 'upcoming') {
            const startTime = new Date(tournament.startTime).getTime()
            const now = Date.now()
            return Math.max(0, Math.floor((startTime - now) / 1000))
        } else if (tournament.status === 'ongoing') {
            const startTime = new Date(tournament.startTime).getTime()
            const endTime = startTime + tournament.duration * 60000
            const now = Date.now()
            return Math.max(0, Math.floor((endTime - now) / 1000))
        }

        return 0
    }, [tournament])

    // Join tournament
    const joinTournament = useCallback(async (username: string, rating: number) => {
        if (!userId) return false

        // Rule: Cannot join in last 2 minutes
        const remaining = getTimeRemaining()
        if (tournament?.status === 'ongoing' && remaining < 120) {
            console.warn('[Tournament] Cannot join in last 2 minutes')
            return false
        }

        try {
            const response = await fetch(`http://localhost:8000/api/tournament/${tournamentId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username, rating })
            })

            if (!response.ok) throw new Error('Failed to join')

            const data = await response.json()
            if (data.success) {
                setTournament(data.tournament)
                return true
            }
            return false
        } catch (err) {
            console.warn('[Tournament] Join failed, trying mock...', err)
            // Mock join
            const mockTour = MOCK_TOURNAMENTS[tournamentId]
            if (mockTour) {
                const newPlayer: TournamentPlayer = {
                    userId,
                    username,
                    rating,
                    score: 0,
                    games: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    streak: 0,
                    maxStreak: 0,
                    onFire: false,
                    berserkCount: 0,
                    performance: rating,
                    buchholz: 0,
                    isPlaying: true,
                    joinedAt: new Date(),
                    opponentIds: []
                }

                // Update local state - create a deep copy to avoid mutating the original mock directly if needed, 
                // but for now simple push is fine for the session
                const updatedTour = { ...mockTour, players: [...mockTour.players, newPlayer] }
                setTournament(updatedTour)

                // Update standings
                const newStanding: TournamentStanding = {
                    rank: updatedTour.players.length,
                    userId,
                    username,
                    rating,
                    score: 0,
                    games: 0,
                    wins: 0,
                    streak: 0,
                    onFire: false,
                    performance: rating,
                    buchholz: 0,
                    isPlaying: true
                }
                setStandings(prev => [...prev, newStanding])
                return true
            }
            return false
        }
    }, [tournamentId, userId, tournament, getTimeRemaining])

    // Leave tournament
    const leaveTournament = useCallback(async () => {
        if (!userId) return false

        try {
            const response = await fetch(`http://localhost:8000/api/tournament/${tournamentId}/withdraw`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })

            if (!response.ok) throw new Error('Failed to leave')

            const data = await response.json()
            if (data.success) {
                fetchTournament()
                return true
            }
            return false
        } catch (err) {
            console.warn('[Tournament] Leave failed, trying mock...', err)
            const mockTour = MOCK_TOURNAMENTS[tournamentId]
            if (mockTour) {
                const updatedTour = { ...mockTour, players: mockTour.players.filter(p => p.userId !== userId) }
                setTournament(updatedTour)
                setStandings(prev => prev.filter(s => s.userId !== userId))
                return true
            }
            return false
        }
    }, [tournamentId, userId, fetchTournament])

    // Mark ready for pairing
    const markReady = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'tournament:ready'
            }))
        }
    }, [])

    // Set berserk
    const setBerserk = useCallback((gameId: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'tournament:berserk',
                gameId
            }))
        }
    }, [])

    // Report game result
    const reportGameResult = useCallback((gameId: string, result: 'white' | 'black' | 'draw', moves: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'tournament:game_result',
                gameId,
                data: { result, moves }
            }))
        }
    }, [])

    // Get my player data
    const myPlayer = tournament?.players.find(p => p.userId === userId)



    // Initialize
    useEffect(() => {
        fetchTournament()
    }, [fetchTournament])

    // Connect WebSocket
    useEffect(() => {
        if (userId) {
            connectWebSocket()
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [connectWebSocket, userId])

    return {
        tournament,
        standings,
        myPlayer,
        myPairing,
        isConnected,
        isLoading,
        error,
        joinTournament,
        leaveTournament,
        markReady,
        setBerserk,
        reportGameResult,
        getTimeRemaining,
        isPairingLocked: (tournament?.status === 'ongoing' && getTimeRemaining() < 120)
    }
}
