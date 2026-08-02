import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  registerPushNotifications,
  sendPushNotification
} from '../lib/PushNotification'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const initialSessionHandled = useRef(false)

  // Fetch profile
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

  // Redirect by role
  const redirectByRole = useCallback((freshProfile) => {
    if (!freshProfile) {
      navigate('/login', { replace: true })
      return
    }

    if (freshProfile.must_change_password) {
      navigate('/auth/change-password', { replace: true })
      return
    }

    switch (freshProfile.role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true })
        break

      case 'staff':
        navigate('/staff/dashboard', { replace: true })
        break

      case 'technician':
        navigate('/technician/dashboard', { replace: true })
        break

      default:
        navigate('/student/dashboard', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      if (event === 'INITIAL_SESSION') {

        if (session?.user) {
          setUser(session.user)

          const p = await fetchProfile(session.user.id)

          setLoading(false)

          if (
            p?.must_change_password &&
            window.location.pathname !== '/auth/change-password'
          ) {
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

        const freshProfile = await fetchProfile(session.user.id)

        setLoading(false)

        if (!freshProfile) {

          await new Promise(resolve => setTimeout(resolve, 1500))

          const retry = await fetchProfile(session.user.id)

          if (retry) {
            redirectByRole(retry)
          } else {
            console.error('Profile not found')
            navigate('/login', { replace: true })
          }

          return
        }

        // Register browser for push notifications
        await registerPushNotifications()

        // Send login notification
        await sendPushNotification(
          "Login Successful",
          `Welcome back, ${freshProfile.full_name}!`,
          session.user.id
        )
        // Redirect user
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

        if (!session?.user) return

        const p = await fetchProfile(session.user.id)

        setLoading(false)

        if (p && !p.must_change_password) {
          redirectByRole(p)
        }

        return
      }

    })

    return () => subscription.unsubscribe()

  }, [
    fetchProfile,
    redirectByRole,
    navigate
  ])

  // Sign in
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { data, error }
  }

  // Google Sign In
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`
      }
    })

    return { data, error }
  }

  // Register
  async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      return { data, error };
    }

    if (data.user) {
      // Register browser for notifications
      await registerPushNotifications();

      // Send welcome notification
      await sendPushNotification(
        "Welcome to AATU IMS",
        "Your account has been created successfully.",
        data.user.id
      );
    }

    return { data, error };
  }
  // Logout
  async function signOut() {

    setUser(null)
    setProfile(null)

    await supabase.auth.signOut()

    navigate('/login', { replace: true })
  }

  // Reset password
  async function resetPassword(email) {

    const { data, error } =
      await supabase.auth.resetPasswordForEmail(email, {
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

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}