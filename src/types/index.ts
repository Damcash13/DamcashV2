// ===== GAME TYPES =====
export type GameType = 'checkers' | 'chess';
export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished' | 'abandoned';
export type PlayerColor = 'white' | 'black';
export type PieceType = 'pawn' | 'king' | 'queen' | 'rook' | 'bishop' | 'knight';

// Checkers specific
export type CheckerPiece = 'w' | 'W' | 'b' | 'B' | null; // w=white pawn, W=white king, b=black pawn, B=black king
export type CheckerBoard = CheckerPiece[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position[];
  promotion?: boolean;
}

export interface TimeControl {
  initial: number; // seconds
  increment: number; // seconds per move
}

// ===== USER TYPES =====
export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  eloCheckers: number;
  eloChess: number;
  tierCheckers: string;
  tierChess: string;
  coins: number;
  dailyScore: number;
  playedPuzzles: number;
  createdDate: Date;
  isOnline?: boolean;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
}

// ===== GAME TYPES =====
export interface Game {
  id: string;
  gameType: GameType;
  board: string; // JSON serialized board
  currentTurn: PlayerColor;
  status: GameStatus;
  whitePlayerId: string;
  blackPlayerId: string;
  whitePlayer?: User;
  blackPlayer?: User;
  winnerId?: string;
  timeControl: TimeControl;
  whiteTimeRemaining: number;
  blackTimeRemaining: number;
  lastMoveAt: Date;
  movesHistory: string[]; // Array of move notations
  spectators?: number; // Number of people watching
  createdAt: Date;
}

export interface GameInvitation {
  id: string;
  senderId: string;
  sender?: User;
  recipientId: string;
  recipient?: User;
  gameType: GameType;
  timeControl: TimeControl;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

// ===== SOCIAL TYPES =====
export interface ChatMessage {
  id: string;
  gameId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  sender?: User;
  recipientId: string;
  recipient?: User;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants?: User[];
  lastMessage?: DirectMessage;
  lastMessageAt: Date;
  unreadCount: number;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friend?: User;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: 'game_invite' | 'friend_request' | 'tournament' | 'achievement' | 'message' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ===== TOURNAMENT TYPES =====
export type TournamentFormat = 'swiss' | 'arena' | 'knockout';
export type TournamentStatus = 'created' | 'upcoming' | 'registration' | 'ongoing' | 'active' | 'finished' | 'cancelled';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  type?: 'SCHEDULED' | 'SNG';
  gameType: GameType;
  format: TournamentFormat;
  status: TournamentStatus;
  startTime: Date;
  endTime?: Date;
  maxParticipants: number;
  maxPlayers?: number;
  currentParticipants: number;
  players?: any[];
  prizePool: number;
  entryFee: number;
  timeControl: TimeControl;
  rounds: number;
  currentRound: number;
  createdAt: Date;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  user?: User;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  rank: number;
  status: 'registered' | 'active' | 'eliminated' | 'withdrawn';
}

export interface TournamentPairing {
  id: string;
  tournamentId: string;
  round: number;
  whitePlayerId: string;
  blackPlayerId: string;
  gameId?: string;
  result?: '1-0' | '0-1' | '0.5-0.5' | null;
}

// ===== LEAGUE TYPES =====
export interface League {
  id: string;
  name: string;
  gameType: GameType;
  season: number;
  startDate: Date;
  endDate: Date;
  participants: number;
}

export interface LeagueParticipant {
  id: string;
  leagueId: string;
  userId: string;
  user?: User;
  points: number;
  rank: number;
}

// ===== LEARNING TYPES =====
export interface Puzzle {
  id: string;
  gameType: GameType;
  fen: string; // Board position
  solution: string[]; // Sequence of moves
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  theme: string;
  rating: number;
}

export interface Lesson {
  id: string;
  gameType: GameType;
  title: string;
  description: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  duration: number; // minutes
}

export interface GameAnalysis {
  id: string;
  gameId: string;
  moves: AnalyzedMove[];
  summary: {
    accuracy: { white: number; black: number };
    mistakes: { white: number; black: number };
    blunders: { white: number; black: number };
  };
  createdAt: Date;
}

export interface AnalyzedMove {
  move: string;
  evaluation: number;
  bestMove?: string;
  classification: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

// ===== ECONOMY TYPES =====
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'reward' | 'bet_win' | 'bet_loss';
  amount: number;
  description: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'avatar' | 'board_theme' | 'piece_set' | 'premium' | 'coins';
  imageUrl: string;
  available: boolean;
}

export interface UserItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  acquiredAt: Date;
  equipped: boolean;
}

export interface Bet {
  id: string;
  gameId: string;
  userId: string;
  amount: number;
  prediction: PlayerColor;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  payout?: number;
}

// ===== TEAM TYPES =====
export interface Team {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  captainId: string;
  captain?: User;
  memberCount: number;
  eloAverage: number;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user?: User;
  role: 'captain' | 'officer' | 'member';
  joinedAt: Date;
}

// ===== ELO TYPES =====
export interface EloHistory {
  id: string;
  userId: string;
  gameType: GameType;
  elo: number;
  gameId: string;
  change: number;
  createdAt: Date;
}

// ===== WEBSOCKET TYPES =====
export type WebSocketEventType =
  | 'connect'
  | 'disconnect'
  | 'ping'
  | 'pong'
  | 'game_join'
  | 'game_move'
  | 'game_start'
  | 'game_end'
  | 'game_chat'
  | 'game_resign'
  | 'game_draw_offer'
  | 'game_draw_accept'
  | 'game_draw_decline'
  | 'game_invitation'
  | 'wager_challenge'
  | 'invitation_accept'
  | 'invitation_decline'
  | 'invitation_received'
  | 'invitation_accepted'
  | 'invitation_declined'
  | 'notification'
  | 'presence_update'
  | 'user_status'
  | 'status_update'
  | 'direct_message'
  | 'friend_request'
  | 'tournament_update'
  | 'tournament_join'
  | 'tournament_leave'
  | 'tournament_joined'
  | 'tournament_participant_count'
  | 'chat_message'
  | 'spectate_join'
  | 'spectate_leave'
  | 'spectator_count'
  | 'game_state'
  | 'matchmaking_found'
  | 'create_waiting_game'
  | 'join_waiting_game'
  | 'get_waiting_games'
  | 'game_created'
  | 'game_started'
  | 'waiting_games_update'
  | 'quick_match'
  | 'match_found'
  | 'no_match'
  | 'tournament_create'
  | 'tournament_created'
  | 'get_tournaments'
  | 'tournament_list_update'
  | 'tournament_standings_update'
  | 'tournament_score_update'
  | 'game_result'
  | 'game_berserk'
  | 'join_tournament_lobby'
  | 'video_signal';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: Date;
}

// ===== AI TYPES =====
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface AIConfig {
  difficulty: AIDifficulty;
  depth: number;
  maxTime: number;
  randomization: number;
}

export interface AIMove {
  move: Move;
  score: number;
  depth: number;
  timeSpent: number;
}

// ===== LEADERBOARD TYPES =====
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: User;
  elo: number;
  gamesPlayed: number;
  winRate: number;
  change: number; // Position change from previous period
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
