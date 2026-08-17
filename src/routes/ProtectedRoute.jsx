import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute - wraps any route that requires auth
 * @param {string[]} allowedRoles - if provided, only those roles can access
 */
// ✅ Correct — waits for session to restore before redirecting
export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth()
  
  // Still checking session — show nothing (or a spinner)
  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f9f9ff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <span 
          className="material-symbols-outlined" 
          style={{ fontSize: 40, color: '#4a0404', animation: 'spin 1s linear infinite' }}
        >
          progress_activity
        </span>
        <p style={{ marginTop: 12, fontSize: 13, color: '#554240', fontFamily: 'monospace' }}>
          Loading...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  
  // Session fully loaded — now safe to check auth
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile?.role)) return <Navigate to="/login" replace />
  
  return <Outlet />
}