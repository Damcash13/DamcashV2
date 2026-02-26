export interface WaitingGame {
    id: string
    creatorId: string
    creatorName: string
    creatorElo: number
    creatorTier: string
    timeControl: string      // "5+3", "10+0", etc.
    variant: string          // "Standard", "International"
    mode: 'casual' | 'rated' | 'wager'
    wagerAmount?: number     // Si mode === 'wager'
    color?: 'white' | 'black' | 'random'
    createdAt: Date
    gameType: 'checkers' | 'chess'
}

export interface LobbyPlayer {
    id: string
    username: string
    elo: number
    tier: string
    status: 'available' | 'playing' | 'away'
    lastSeen: Date
    gamesPlayed: number
    winRate: number
}
