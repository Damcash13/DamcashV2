import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdmin } from '../lib/admin'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

/**
 * Renders children only for the admin user.
 * Everyone else is silently redirected to the home page.
 */
export default function AdminRoute({ children }: Props) {
    const { user, isLoading } = useAuth()

    // Wait for auth to resolve before deciding
    if (isLoading) return null

    if (!isAdmin(user)) return <Navigate to="/" replace />

    return <>{children}</>
}
