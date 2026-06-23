import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute - wraps any route that requires auth
 * @param {string[]} allowedRoles - if provided, only those roles can access
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary-container border-t-transparent animate-spin" />
          <p className="text-label-md text-on-surface-variant font-mono">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their correct dashboard
    const roleHome = {
      admin: '/admin/dashboard',
      staff: '/staff/dashboard',
      technician: '/technician/dashboard',
      student: '/student/dashboard',
    }
    return <Navigate to={roleHome[profile.role] ?? '/login'} replace />
  }

  return <Outlet />
}
