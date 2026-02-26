import { Game, User } from '../types';

export interface ExtendedLiveGame extends Partial<Game> {
    moveNumber?: number;
    featured?: boolean;
    tournament?: string;
    startedAt?: Date;
}

const mockUsers: Record<string, Partial<User>> = {
    gm1: { id: 'u1', username: 'GrandMaster_X', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gm1', eloCheckers: 2450, eloChess: 2380, tierCheckers: 'grandmaster', tierChess: 'master' },
    ck2: { id: 'u2', username: 'ChampionKing', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ck2', eloCheckers: 2380, eloChess: 2420, tierCheckers: 'master', tierChess: 'master' },
    qs3: { id: 'u3', username: 'QueenSlayer', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qs3', eloCheckers: 2100, eloChess: 2580, tierCheckers: 'diamond', tierChess: 'expert' },
    tg4: { id: 'u4', username: 'TacticalGenius', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tg4', eloCheckers: 1950, eloChess: 2510, tierCheckers: 'platinum', tierChess: 'expert' },
    rp5: { id: 'u5', username: 'RisingPhoenix', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rp5', eloCheckers: 2250, eloChess: 1850, tierCheckers: 'diamond', tierChess: 'gold' },
    sa6: { id: 'u6', username: 'SilentAssassin', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sa6', eloCheckers: 2310, eloChess: 1920, tierCheckers: 'diamond', tierChess: 'gold' },
    bm7: { id: 'u7', username: 'BishopMaster', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bm7', eloCheckers: 1800, eloChess: 2150, tierCheckers: 'platinum', tierChess: 'platinum' },
    kr8: { id: 'u8', username: 'KnightRider', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kr8', eloCheckers: 1750, eloChess: 2080, tierCheckers: 'gold', tierChess: 'platinum' },
};

export const MOCK_LIVE_GAMES: ExtendedLiveGame[] = [
    {
        id: 'lg6',
        gameType: 'chess',
        whitePlayer: { id: 'u11', username: 'CarlsenClone', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cc11', eloChess: 2750, tierChess: 'grandmaster' } as User,
        blackPlayer: { id: 'u12', username: 'NepoFan', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nf12', eloChess: 2710, tierChess: 'grandmaster' } as User,
        spectators: 512,
        status: 'active',
        moveNumber: 12,
        featured: true,
        timeControl: { initial: 180, increment: 2 },
        startedAt: new Date(Date.now() - 5 * 60000),
        createdAt: new Date(),
    },
    {
        id: 'lg1',
        gameType: 'checkers',
        whitePlayer: mockUsers.gm1 as User,
        blackPlayer: mockUsers.ck2 as User,
        spectators: 342,
        status: 'active',
        moveNumber: 32,
        featured: true,
        tournament: 'World Championship Quarter-Finals',
        timeControl: { initial: 600, increment: 5 },
        startedAt: new Date(Date.now() - 45 * 60000),
        createdAt: new Date(),
    },
    {
        id: 'lg2',
        gameType: 'chess',
        whitePlayer: mockUsers.qs3 as User,
        blackPlayer: mockUsers.tg4 as User,
        spectators: 289,
        status: 'active',
        moveNumber: 18,
        featured: true,
        timeControl: { initial: 300, increment: 3 },
        startedAt: new Date(Date.now() - 12 * 60000),
        createdAt: new Date(),
    },
    {
        id: 'lg3',
        gameType: 'checkers',
        whitePlayer: mockUsers.rp5 as User,
        blackPlayer: mockUsers.sa6 as User,
        spectators: 156,
        status: 'active',
        moveNumber: 45,
        tournament: 'Diamond League Match',
        timeControl: { initial: 900, increment: 10 },
        startedAt: new Date(Date.now() - 78 * 60000),
        createdAt: new Date(),
    },
    {
        id: 'lg5',
        gameType: 'checkers',
        whitePlayer: { id: 'u9', username: 'ProDraughts', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pd9', eloCheckers: 2100, tierCheckers: 'master' } as User,
        blackPlayer: { id: 'u10', username: 'LichessFan', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lf10', eloCheckers: 2050, tierCheckers: 'master' } as User,
        spectators: 67,
        status: 'active',
        moveNumber: 28,
        tournament: 'Masters Cup Semi-Finals',
        timeControl: { initial: 600, increment: 5 },
        startedAt: new Date(Date.now() - 35 * 60000),
        createdAt: new Date(),
    },
    {
        id: 'lg4',
        gameType: 'chess',
        whitePlayer: mockUsers.bm7 as User,
        blackPlayer: mockUsers.kr8 as User,
        spectators: 42,
        status: 'active',
        moveNumber: 24,
        timeControl: { initial: 180, increment: 2 },
        startedAt: new Date(Date.now() - 8 * 60000),
        createdAt: new Date(),
    },
    {
        id: 'lg7',
        gameType: 'checkers',
        whitePlayer: { id: 'u13', username: 'CasualGuy', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cg13', eloCheckers: 1200, tierCheckers: 'silver' } as User,
        blackPlayer: { id: 'u14', username: 'BeginnerBot', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bb14', eloCheckers: 1150, tierCheckers: 'bronze' } as User,
        spectators: 12,
        status: 'active',
        moveNumber: 5,
        timeControl: { initial: 300, increment: 0 },
        startedAt: new Date(Date.now() - 2 * 60000),
        createdAt: new Date(),
    }
];

export const formatTimeControl = (tc?: Partial<Game['timeControl']>) => {
    if (!tc) return '10+5';
    const mins = Math.floor((tc.initial || 0) / 60);
    return `${mins}+${tc.increment || 0}`;
};
