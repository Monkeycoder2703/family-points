import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

export function ProtectedRoute({ role, children }: { role?: Role; children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Lädt…</div>
  }
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <div className="min-h-screen flex items-center justify-center">Profil wird geladen…</div>

  if (profile.role === 'child' && !profile.family_id) {
    return <Navigate to="/onboarding/join-family" replace />
  }
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'parent' ? '/parent/dashboard' : '/child/dashboard'} replace />
  }

  return <>{children}</>
}
