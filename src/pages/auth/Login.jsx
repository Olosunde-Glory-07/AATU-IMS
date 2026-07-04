import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, LogIn } from 'lucide-react'

// ─── Inline OTP Modal (Login-specific) ─────────────────────────────────────
function LoginVerifyOtpModal({ email, onClose }) {
  const [otp,       setOtp]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)

  async function handleVerify(e) {
    e.preventDefault()
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: 'signup',
      })
      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code. Please try again.')
        return
      }
      // Success — don't navigate manually here.
      // AuthContext's SIGNED_IN listener will fetch the fresh profile
      // and redirect by role automatically.
      onClose()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setResent(false)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (resendError) {
        setError(resendError.message || 'Failed to resend code.')
      } else {
        setResent(true)
        setTimeout(() => setResent(false), 4000)
      }
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.40)', zIndex: 200 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 'min(440px, 95vw)',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        zIndex: 201, overflow: 'hidden',
        fontFamily: "'Hanken Grotesk', sans-serif",
      }}>
        {/* Header */}
        <div style={{ background: '#4a0404', padding: '24px 28px 20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>Verify your email</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5 }}>
            We sent a 6-digit verification code to<br />
            <strong style={{ color: '#ffb4aa' }}>{email}</strong>
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#ffdad6', border: '1px solid #ffdad6', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#93000a' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>error</span>
              {error}
            </div>
          )}

          {resent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#b8ecbe', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#166534' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Verification code resent successfully.
            </div>
          )}

          <form onSubmit={handleVerify}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#554240', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Verification Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoFocus
              style={{
                width: '100%', padding: '14px 16px',
                fontSize: 28, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700, letterSpacing: '0.35em',
                textAlign: 'center', color: '#151c27',
                border: '2px solid #dcc0bd', borderRadius: 10,
                outline: 'none', boxSizing: 'border-box',
                background: '#f9f9ff', marginBottom: 8,
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a0404'}
              onBlur={(e) => e.target.style.borderColor = '#dcc0bd'}
            />

            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#89726f', textAlign: 'center' }}>
              Enter the 6-digit code from your email
            </p>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                width: '100%', padding: '13px 0',
                background: otp.length === 6 && !loading ? '#4a0404' : '#dcc0bd',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700, cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }}>progress_activity</span>
                  Verifying…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  Verify & Continue
                </>
              )}
            </button>
          </form>

          {/* Resend + back */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#554240', textAlign: 'center' }}>
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ background: 'none', border: 'none', cursor: resending ? 'wait' : 'pointer', color: '#4a0404', fontWeight: 700, fontSize: 13, padding: 0, textDecoration: 'underline' }}
              >
                {resending ? 'Resending…' : 'Resend code'}
              </button>
            </p>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#89726f', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textDecoration: 'underline' }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

// ─── Login Page ─────────────────────────────────────────────────────────────
export default function Login() {
  const { signIn } = useAuth()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  // OTP modal state
  const [showOtp,      setShowOtp]      = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      const msg = signInError.message?.toLowerCase() ?? ''

      if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('email not confirmed')) {
        // Show the OTP modal instead of just an error string
        setPendingEmail(email)
        setShowOtp(true)
      } else if (msg.includes('too many requests')) {
        setError('Too many login attempts. Please wait a few minutes before trying again.')
      } else {
        setError(signInError.message)
      }

      setLoading(false)
      return
    }

    // ── Do NOT navigate here ───────────────────────────────────────────────
    // AuthContext.onAuthStateChange handles the redirect after SIGNED_IN fires.
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-primary-container text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >account_balance</span>
            <span className="text-headline-lg font-bold text-on-surface">AATU IMS</span>
          </div>
          <p className="text-body-md text-on-surface-variant">Infrastructure Management System</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">
          <h2 className="text-headline-sm font-bold text-on-surface mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-body-md flex items-start gap-2">
              <span
                className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md font-mono text-on-surface-variant mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-60"
                placeholder="you@aatu.edu.ng"
              />
            </div>

            <div>
              <label className="block text-label-md font-mono text-on-surface-variant mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-60"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-label-md text-primary-container hover:underline font-mono"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-container text-white rounded-lg font-mono text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-label-md text-on-surface-variant font-mono">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          <p className="mt-6 text-center text-label-md text-on-surface-variant font-mono">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-container hover:underline font-bold">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtp && (
        <LoginVerifyOtpModal
          email={pendingEmail}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  )
}