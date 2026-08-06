import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Where each role lands after login (and after email/OTP verification).
// hod and dean intentionally share the same requester portal.
const ROLE_HOME = {
  admin:      '/admin/dashboard',
  staff:      '/staff/dashboard',
  technician: '/technician/dashboard',
  hod:        '/requester/dashboard',
  dean:       '/requester/dashboard',
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Fetch (or refetch) the profile row for a given user id ────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return null }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('fetchProfile error:', error.message)
      setProfile(null)
      return null
    }

    setProfile(data)
    return data
  }, [])

  // ── Redirect to the correct home for a role, respecting must_change_password ──
  const redirectByRole = useCallback((profileRow) => {
    if (!profileRow) return

    if (profileRow.must_change_password) {
      navigate('/auth/change-password', { replace: true })
      return
    }

    const home = ROLE_HOME[profileRow.role] ?? '/login'
    navigate(home, { replace: true })
  }, [navigate])

  // ── Initial session check + auth state listener ───────────────────────────
  useEffect(() => {
    let isMounted = true

    async function init() {
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      if (!isMounted) return

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id)
      }

      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          return
        }

        if (newSession?.user) {
          // Always fetch a FRESH profile here rather than trusting stale
          // local state — important on shared devices / after role changes.
          const freshProfile = await fetchProfile(newSession.user.id)

          if (event === 'SIGNED_IN') {
            redirectByRole(freshProfile)
          }

          if (event === 'USER_UPDATED') {
            // e.g. after a password change — re-route in case
            // must_change_password just flipped to false.
            redirectByRole(freshProfile)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, redirectByRole])

  // ── Sign in with email + password ──────────────────────────────────────────
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  // ── Sign up (kept for completeness — HOD/Dean/Staff/Technician are created
  //    by an admin via the create-user Edge Function, not self-registration,
  //    but this remains available if you ever need it) ──────────────────────
  async function signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    return { data, error }
  }

  // ── Sign out ────────────────────────────────────────────────────────────
  async function signOut(options = {}) {
    const { error } = await supabase.auth.signOut(options)
    setUser(null)
    setSession(null)
    setProfile(null)
    return { error }
  }

  // ── Request a password reset email ─────────────────────────────────────
  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    fetchProfile,
    redirectByRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}