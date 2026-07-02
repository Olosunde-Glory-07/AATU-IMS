import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
    setLoading(false)
  }

  // ── Sign in with email + password ─────────────────────────────────────────
  // Returns { error, mustChangePassword } so Login.jsx can handle each case
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { data: null, error, mustChangePassword: false }

    // Check if this user must change their password on first login
    // (set by admin when creating staff/technician accounts)
    let mustChangePassword = false
    if (data?.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', data.user.id)
        .single()

      mustChangePassword = prof?.must_change_password === true
    }

    return { data, error: null, mustChangePassword }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` }
    })
    return { data, error }
  }

  // ── Sign up new user (students only) ──────────────────────────────────────
  async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { data, error }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut()
  }

  // ── Reset password — sends OTP to email ───────────────────────────────────
  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }

  // ── Resend OTP for signup or recovery ─────────────────────────────────────
  async function resendOtp(email, type = 'signup') {
    const { data, error } = await supabase.auth.resend({ type, email })
    return { data, error }
  }

  // ── Verify OTP code entered by user ───────────────────────────────────────
  async function verifyOtp(email, token, type = 'signup') {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type })
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
    resendOtp,
    verifyOtp,
    fetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}