import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate  = useNavigate()

  // Track whether we've already handled the initial session
  // so we don't redirect twice on page load
  const initialSessionHandled = useRef(false)

  // ── Fetch profile — always reads fresh from DB ────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('fetchProfile error:', error.message)
        return null
      }

      setProfile(data)
      return data
    } catch (err) {
      console.error('fetchProfile unexpected error:', err)
      return null
    }
  }, [])

  // ── Route by role ─────────────────────────────────────────────────────────
  // Always reads from the freshly-fetched profile object passed in,
  // never from the profile state (which may be stale from a previous session)
  const redirectByRole = useCallback((freshProfile) => {
    if (!freshProfile) {
      // Profile missing — send to login so they can re-authenticate
      navigate('/login', { replace: true })
      return
    }

    // Force password change before anything else
    if (freshProfile.must_change_password) {
      navigate('/auth/change-password', { replace: true })
      return
    }

    const role = freshProfile.role
    if      (role === 'admin')      navigate('/admin/dashboard',      { replace: true })
    else if (role === 'staff')      navigate('/staff/dashboard',      { replace: true })
    else if (role === 'technician') navigate('/technician/dashboard', { replace: true })
    else                            navigate('/student/dashboard',    { replace: true })
  }, [navigate])

  useEffect(() => {
    // ── Auth state listener ───────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        if (event === 'INITIAL_SESSION') {
          // Fires once on load with the existing session (or null if logged out)
          if (session?.user) {
            setUser(session.user)
            const p = await fetchProfile(session.user.id)
            setLoading(false)

            // Only redirect on initial session if the user MUST change password
            // — don't redirect on every page refresh or they'd always go to dashboard
            if (p?.must_change_password && window.location.pathname !== '/auth/change-password') {
              navigate('/auth/change-password', { replace: true })
            }
          } else {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          initialSessionHandled.current = true
          return
        }

        if (event === 'SIGNED_IN') {
          if (!session?.user) return
          setUser(session.user)

          // Always fetch a fresh profile for the user who just signed in.
          // This is critical — do NOT use the profile state here as it may
          // still hold data from a previously logged-in user (e.g. admin
          // logs in on a shared device, then staff logs in after them).
          const freshProfile = await fetchProfile(session.user.id)
          setLoading(false)

          if (!freshProfile) {
            // Profile row doesn't exist yet — wait briefly and retry once
            // (can happen if the trigger/upsert in the Edge Function is slow)
            await new Promise(r => setTimeout(r, 1500))
            const retried = await fetchProfile(session.user.id)
            if (retried) {
              redirectByRole(retried)
            } else {
              console.error('Profile not found after retry for user:', session.user.id)
              navigate('/login', { replace: true })
            }
            return
          }

          redirectByRole(freshProfile)
          return
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          navigate('/login', { replace: true })
          return
        }

        if (event === 'USER_UPDATED') {
          // Fires after supabase.auth.updateUser({ password }) on ChangePassword page
          if (!session?.user) return
          const p = await fetchProfile(session.user.id)
          setLoading(false)
          if (p && !p.must_change_password) {
            redirectByRole(p)
          }
          return
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, redirectByRole, navigate])

  // ── Auth functions ────────────────────────────────────────────────────────
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` }
    })
    return { data, error }
  }

  async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { data, error }
  }

  async function signOut() {
    setUser(null)
    setProfile(null)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    role: profile?.role ?? null,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    fetchProfile,
    redirectByRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}