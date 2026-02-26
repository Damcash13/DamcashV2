import { User } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class Base44Service {
    private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    // Auth Methods
    static async login(email: string): Promise<{ user: User; token: string }> {
        // Mock implementation for now as per plan
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    user: {
                        id: 'u_' + Date.now(),
                        username: email.split('@')[0],
                        fullName: 'User ' + email.split('@')[0],
                        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
                        eloCheckers: 1200,
                        eloChess: 1200,
                        tierCheckers: 'Bronze',
                        tierChess: 'Bronze',
                        coins: 100,
                        createdDate: new Date(),
                        dailyScore: 0,
                        playedPuzzles: 0
                    },
                    token: 'mock_jwt_token_' + Date.now(),
                });
            }, 500);
        });
    }

    static async getUser(userId: string): Promise<User> {
        return this.request<User>(`/api/users/${userId}`);
    }

    // Game Methods
    static async getActiveGames(): Promise<any[]> {
        return this.request('/api/games/active');
    }
}
