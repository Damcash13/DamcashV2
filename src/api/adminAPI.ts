import { API_BASE_URL } from '../config'
import { supabase } from '../lib/supabase'

// The admin secret must match the backend ADMIN_SECRET env var
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'damcash-admin-secret-2024'

async function adminFetch(path: string, options: RequestInit = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3s timeout

    try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': ADMIN_SECRET,
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                ...(options.headers || {}),
            },
        })
        clearTimeout(timeout)
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }))
            throw new Error(err.error || `HTTP ${res.status}`)
        }
        return res.json()
    } catch (err) {
        clearTimeout(timeout)
        throw err
    }
}

export const adminAPI = {
    // ── Overview ────────────────────────────────────────────────────────
    async getStats() {
        return adminFetch('/api/admin/stats')
    },

    // ── Users ────────────────────────────────────────────────────────────
    async getUsers(search = '', status = 'all') {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (status !== 'all') params.set('status', status)
        const qs = params.toString()
        return adminFetch(`/api/admin/users${qs ? `?${qs}` : ''}`)
    },

    async banUser(userId: string) {
        return adminFetch(`/api/admin/users/${userId}/ban`, { method: 'PUT' })
    },

    async unbanUser(userId: string) {
        return adminFetch(`/api/admin/users/${userId}/unban`, { method: 'PUT' })
    },

    async suspendUser(userId: string) {
        return adminFetch(`/api/admin/users/${userId}/suspend`, { method: 'PUT' })
    },

    async adjustCoins(userId: string, amount: number, reason: string) {
        return adminFetch(`/api/admin/users/${userId}/coins`, {
            method: 'PUT',
            body: JSON.stringify({ amount, reason }),
        })
    },

    // ── Reports ──────────────────────────────────────────────────────────
    async getReports(status = 'all') {
        return adminFetch(`/api/admin/reports${status !== 'all' ? `?status=${status}` : ''}`)
    },

    async resolveReport(reportId: string) {
        return adminFetch(`/api/admin/reports/${reportId}/resolve`, { method: 'POST' })
    },

    async dismissReport(reportId: string) {
        return adminFetch(`/api/admin/reports/${reportId}/dismiss`, { method: 'POST' })
    },

    // ── Finance ──────────────────────────────────────────────────────────
    async getTransactions(limit = 50) {
        return adminFetch(`/api/admin/transactions?limit=${limit}`)
    },

    // ── Puzzles ──────────────────────────────────────────────────────────
    async getPuzzles() {
        return adminFetch('/api/admin/puzzles')
    },

    async deletePuzzle(puzzleId: string) {
        return adminFetch(`/api/admin/puzzles/${puzzleId}`, { method: 'DELETE' })
    },

    // ── System ───────────────────────────────────────────────────────────
    async getSystemStats() {
        return adminFetch('/api/admin/system')
    },
}
