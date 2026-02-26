import { Tournament } from '../hooks/useTournament';

// Enriched Mock Data matching the full Tournament interface
export const MOCK_TOURNAMENTS: Record<string, Tournament> = {
    // HOURLY (60 mins)
    'hourly_checkers': {
        id: 'hourly_checkers',
        name: 'Hourly Bullet Arena',
        gameType: 'checkers',
        variant: 'Standard',
        status: 'ongoing',
        startTime: new Date(), // Started just now
        duration: 60,
        rated: true,
        minRating: 1000,
        maxPlayers: 100,
        allowBerserk: true,
        minGames: 0,
        createdBy: 'system',
        createdAt: new Date(),
        players: [
            { userId: 'p1', username: 'DamierKing', rating: 2100, score: 12, games: 6, wins: 6, draws: 0, losses: 0, streak: 6, maxStreak: 6, onFire: true, berserkCount: 2, performance: 2200, buchholz: 40, isPlaying: true, joinedAt: new Date(), opponentIds: [] },
            { userId: 'p2', username: 'CheckMate', rating: 1950, score: 8, games: 6, wins: 4, draws: 0, losses: 2, streak: 0, maxStreak: 3, onFire: false, berserkCount: 0, performance: 1900, buchholz: 38, isPlaying: true, joinedAt: new Date(), opponentIds: [] },
        ],
        games: [],
        pairings: [],
        waitingPlayers: [],
        totalGames: 45,
        finishedGames: 42
    },
    // FRIDAY NIGHT (2 hours / 120 mins)
    'friday_night': {
        id: 'friday_night',
        name: 'Friday Night Special',
        gameType: 'checkers',
        variant: 'International',
        status: 'upcoming',
        startTime: new Date(Date.now() + 3600000), // Starts in 1 hour
        duration: 120,
        rated: true,
        minRating: 0,
        allowBerserk: true,
        minGames: 0,
        createdBy: 'system',
        createdAt: new Date(),
        players: [],
        games: [],
        pairings: [],
        waitingPlayers: [],
        totalGames: 0,
        finishedGames: 0
    },
    // WEEKLY (3 hours / 180 mins)
    'weekly_major': {
        id: 'weekly_major',
        name: 'Weekly Championship',
        gameType: 'checkers',
        variant: 'International',
        status: 'upcoming',
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        duration: 180,
        rated: true,
        minRating: 1200,
        allowBerserk: true,
        minGames: 0,
        createdBy: 'system',
        createdAt: new Date(),
        players: [],
        games: [],
        pairings: [],
        waitingPlayers: [],
        totalGames: 0,
        finishedGames: 0
    },
    // MONTHLY (4 hours / 240 mins)
    'monthly_grand': {
        id: 'monthly_grand',
        name: 'Monthly Grand Prix',
        gameType: 'checkers',
        variant: 'International',
        status: 'upcoming',
        startTime: new Date(Date.now() + 604800000), // Next week
        duration: 240,
        rated: true,
        minRating: 1500,
        allowBerserk: true,
        minGames: 0,
        createdBy: 'system',
        createdAt: new Date(),
        players: [],
        games: [],
        pairings: [],
        waitingPlayers: [],
        totalGames: 0,
        finishedGames: 0
    }
};
