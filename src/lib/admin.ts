import type { User } from '../types'

// ─────────────────────────────────────────────
// Admin identity: set VITE_ADMIN_EMAIL in .env
// ─────────────────────────────────────────────
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string

export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) return false
  return user.email.toLowerCase().trim() === ADMIN_EMAIL?.toLowerCase().trim()
}
