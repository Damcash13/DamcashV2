// API Service for Wager/Betting System
const API_BASE_URL = 'http://localhost:8000';

export interface Wager {
    id: string;
    gameId: string;
    creatorId: string;
    opponentId?: string;
    amount: number;
    gameType: 'checkers' | 'chess';
    variant: string;
    timeControl?: string; // Optional as per service comments
    status: 'pending' | 'accepted' | 'declined' | 'escrowed' | 'completed' | 'cancelled';
    winnerId?: string;
    createdAt: Date;
    acceptedAt?: Date;
    completedAt?: Date;
    creator?: {
        username: string;
        avatar?: string;
        eloCheckers: number;
        eloChess: number;
    }
}

export interface CoinTransaction {
    id: string;
    userId: string;
    amount: number;
    type: 'wager_lock' | 'wager_win' | 'wager_refund' | 'purchase' | 'reward';
    referenceId?: string;
    balanceAfter: number;
    description: string;
    createdAt: Date;
}

class WagerAPI {
    /**
     * Create a new wager
     */
    async createWager(params: {
        creatorId: string;
        amount: number;
        gameType: 'checkers' | 'chess';
        variant: string;
        timeControl: string;
        color?: 'white' | 'black' | 'random';
    }): Promise<{ wager: Wager; game: any }> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create wager');
        }

        return response.json();
    }

    /**
     * Accept a wager
     */
    async acceptWager(wagerId: string, opponentId: string): Promise<{ wager: Wager; message: string }> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/${wagerId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ opponentId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to accept wager');
        }

        return response.json();
    }

    /**
     * Decline a wager
     */
    async declineWager(wagerId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/${wagerId}/decline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to decline wager');
        }
    }

    /**
     * Cancel a wager (creator only)
     */
    async cancelWager(wagerId: string, userId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/${wagerId}/cancel`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to cancel wager');
        }
    }

    /**
     * Get pending wagers (open challenges)
     */
    async getPendingWagers(): Promise<Wager[]> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/pending`);

        if (!response.ok) {
            throw new Error('Failed to fetch pending wagers');
        }

        const data = await response.json();
        return data.wagers;
    }

    /**
     * Get user's active wagers
     */
    async getUserActiveWagers(userId: string): Promise<Wager[]> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/active/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch active wagers');
        }

        const data = await response.json();
        return data.wagers;
    }

    /**
     * Get user's wager history
     */
    async getUserWagerHistory(userId: string): Promise<Wager[]> {
        const response = await fetch(`${API_BASE_URL}/api/wagers/history/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch wager history');
        }

        const data = await response.json();
        return data.wagers;
    }

    /**
     * Complete a game (triggers payout if wager exists)
     */
    async completeGame(gameId: string, winnerId: string | null): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/games/${gameId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ winnerId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to complete game');
        }
    }

    /**
     * Get transaction history
     */
    async getTransactionHistory(userId: string, limit: number = 50): Promise<CoinTransaction[]> {
        const response = await fetch(`${API_BASE_URL}/api/transactions/history/${userId}?limit=${limit}`);

        if (!response.ok) {
            throw new Error('Failed to fetch transaction history');
        }

        const data = await response.json();
        return data.transactions;
    }
}

export const wagerAPI = new WagerAPI();
