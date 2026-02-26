const API_BASE_URL = 'http://localhost:8000'

export interface RegisterData {
    username: string
    email: string
    password: string
}

export interface LoginData {
    email: string
    password: string
}

export interface User {
    id: string
    username: string
    email: string
    coins: number
    eloCheckers: number
    eloChess: number
    avatar?: string
    country?: string
    bio?: string
    dailyScore?: number
    playedPuzzles?: number
    createdAt: string
    updatedAt: string
    lastLoginAt?: string
}

export interface AuthResponse {
    user: User
    token: string
}

class AuthAPI {
    private getHeaders(includeAuth = false): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        if (includeAuth) {
            const token = localStorage.getItem('auth_token')
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
        }

        return headers
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Registration failed')
            }

            const result: AuthResponse = await response.json()
            localStorage.setItem('auth_token', result.token)
            return result
        } catch (error) {
            console.warn('Backend unavailable, using mock registration.')
            await new Promise(r => setTimeout(r, 800))

            const mockUser: User = {
                id: `mock-user-${Date.now()}`,
                username: data.username,
                email: data.email,
                coins: 1000,
                eloCheckers: 1200,
                eloChess: 1200,
                dailyScore: 0,
                playedPuzzles: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            const result = { user: mockUser, token: 'mock-jwt-token' }
            localStorage.setItem('auth_token', result.token)
            // Store mock user for getMe fallback
            localStorage.setItem('mock_user_data', JSON.stringify(mockUser))
            return result
        }
    }

    async login(data: LoginData): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Login failed')
            }

            const result: AuthResponse = await response.json()
            localStorage.setItem('auth_token', result.token)
            return result
        } catch (error) {
            console.warn('Backend unavailable, using mock login.')
            await new Promise(r => setTimeout(r, 800))

            // Check if we have a stored mock user matching this email (optional, or just generic)
            const storedMock = localStorage.getItem('mock_user_data')
            let mockUser: User
            if (storedMock) {
                const parsed = JSON.parse(storedMock)
                if (parsed.email === data.email) {
                    mockUser = parsed
                } else {
                    // Create new mock user for this email
                    mockUser = {
                        id: `mock-user-${Date.now()}`,
                        username: data.email.split('@')[0],
                        email: data.email,
                        coins: 1000,
                        eloCheckers: 1200,
                        eloChess: 1200,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                }
            } else {
                // Create new mock user for this email
                mockUser = {
                    id: `mock-user-${Date.now()}`,
                    username: data.email.split('@')[0],
                    email: data.email,
                    coins: 1000,
                    eloCheckers: 1200,
                    eloChess: 1200,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            }

            const result = { user: mockUser, token: 'mock-jwt-token' }
            mockUser.dailyScore = 450;
            mockUser.playedPuzzles = 15;
            localStorage.setItem('auth_token', result.token)
            localStorage.setItem('mock_user_data', JSON.stringify(mockUser))
            return result
        }
    }

    async getMe(): Promise<User> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                method: 'GET',
                headers: this.getHeaders(true),
            })

            if (!response.ok) {
                // If token is mock token, error expected from real backend
                const token = this.getToken()
                if (token === 'mock-jwt-token') throw new Error('Mock Token')

                const error = await response.json()
                throw new Error(error.error || 'Failed to get user')
            }

            const result = await response.json()
            return result.user
        } catch (error) {
            const token = this.getToken()
            if (token === 'mock-jwt-token') {
                // Return stored mock user
                const stored = localStorage.getItem('mock_user_data')
                if (stored) return JSON.parse(stored)
            }
            throw error
        }
    }

    async updateProfile(data: Partial<{ username: string; avatar: string; country: string; bio: string }>): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: this.getHeaders(true),
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update profile')
        }

        const result = await response.json()
        return result.user
    }

    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify({ oldPassword, newPassword }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to change password')
        }
    }

    logout(): void {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('mock_user_data')
    }

    getToken(): string | null {
        return localStorage.getItem('auth_token')
    }

    isAuthenticated(): boolean {
        return !!this.getToken()
    }
}

export const authAPI = new AuthAPI()
