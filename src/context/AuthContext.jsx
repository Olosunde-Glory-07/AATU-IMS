/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

// Path prefix each role is allowed to be restored into. Guards against
// restoring a stale path that no longer matches the signed-in user's role
// (e.g. their role changed, or the saved path belonged to a different account).
const ROLE_PREFIX = {
  admin:      '/admin',
  staff:      '/staff',
  technician: '/technician',
  hod:        '/requester',
  dean:       '/requester',
}

// Pages that should never be "restored to" — auth flows and the root redirect.
const SKIP_PERSIST = new Set([
  '/', '/login', '/forgot-password', '/reset-password', '/callback', '/auth/change-password',
])

const LAST_PATH_KEY = 'aatu:lastPath'

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Only restore the saved path once, on the very first load — not on every
  // token refresh or profile refetch that happens afterward.
  const hasRestoredPath = useRef(false)

  // ── Remember the current page so we can return to it after the browser
  //    is closed and reopened (session persists via Supabase's own storage) ──
  useEffect(() => {
    if (!SKIP_PERSIST.has(location.pathname)) {
      localStorage.setItem(LAST_PATH_KEY, location.pathname)
    }
  }, [location.pathname])

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

  // ── Same as redirectByRole, but sends the user back to the last page they
  //    were on (if any, and if it's valid for their role) instead of always
  //    landing on the role's default dashboard. Used only for restoring an
  //    existing session on app load — not after an explicit fresh login. ────
  const restoreOrRedirect = useCallback((profileRow) => {
    if (!profileRow) return

    if (profileRow.must_change_password) {
      navigate('/auth/change-password', { replace: true })
      return
    }

    const prefix   = ROLE_PREFIX[profileRow.role]
    const lastPath = localStorage.getItem(LAST_PATH_KEY)

    if (prefix && lastPath && lastPath.startsWith(prefix)) {
      navigate(lastPath, { replace: true })
    } else {
      const home = ROLE_HOME[profileRow.role] ?? '/login'
      navigate(home, { replace: true })
    }
  }, [navigate])

  // ── Initial session check + auth state listener ───────────────────────────
  useEffect(() => {
    // Get existing session on mount
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        // Stale/invalid refresh token (e.g. the browser was closed long enough
        // that it expired) — this is the source of the 400 on reopen. Clear
        // the broken session instead of leaving the app stuck loading.
        console.error('getSession error:', error.message)
        await supabase.auth.signOut().catch(() => {})
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        const profileRow = await fetchProfile(session.user.id)
        setLoading(false)
        if (profileRow && !hasRestoredPath.current) {
          hasRestoredPath.current = true
          // Only restore if we're currently sitting on a page that isn't
          // meant to be landed on directly (i.e. app just booted on "/").
          if (location.pathname === '/' || SKIP_PERSIST.has(location.pathname)) {
            restoreOrRedirect(profileRow)
          }
        }
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile])

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
    // Clear the saved path so the next person to log in on this browser
    // doesn't get dropped into wherever this account last was.
    localStorage.removeItem(LAST_PATH_KEY)
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