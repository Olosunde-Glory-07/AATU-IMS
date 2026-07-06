import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Mail, ArrowLeft } from 'lucide-react'

// ─── Inline OTP Modal (Forgot Password specific) ───────────────────────────
function ResetOtpModal({ email, onClose }) {
  const navigate = useNavigate()
  const [otp,       setOtp]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)
  const { resetPassword } = useAuth()

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
        type: 'recovery',
      })

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code. Please try again.')
        return
      }

      // verifyOtp establishes a real session immediately — ResetPassword.jsx
      // will detect it right away, no URL-token handling needed.
      onClose()
      navigate('/reset-password', { replace: true })
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
      const { error: resendError } = await resetPassword(email)
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
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>Enter reset code</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5 }}>
            We sent a 6-digit code to<br />
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
              Reset code resent successfully.
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
                  Verify Code
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
              ← Use a different email
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

// ─── Forgot Password Page ──────────────────────────────────────────────────
export default function ForgotPassword() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [showOtp, setShowOtp] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError('Please enter your email address.')
      return
    }

    setError('')
    setLoading(true)

    const { error } = await resetPassword(cleanEmail)

    setLoading(false)

    if (error) {
      setError(error.message || 'Something went wrong. Try again.')
      return
    }

    setSent(true)
    setShowOtp(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-primary-container text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
            <span className="text-headline-lg font-bold text-on-surface">
              AATU IMS
            </span>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">

          {/* SUCCESS STATE */}
          {sent ? (
            <div className="text-center space-y-4">

              <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
                <Mail className="text-on-secondary-container" size={24} />
              </div>

              <h2 className="text-headline-sm font-bold text-on-surface">
                Check your email
              </h2>

              <p className="text-body-md text-on-surface-variant">
                If an account exists for <strong>{email}</strong>, we've sent a 6-digit reset code.
              </p>

              <button
                type="button"
                onClick={() => setShowOtp(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-container text-white rounded-lg font-mono text-label-md hover:opacity-90 transition-opacity"
              >
                Enter code
              </button>

              <p className="text-xs text-on-surface-variant">
                Didn't see it? Check spam or try again.
              </p>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-label-md font-mono text-primary-container hover:underline mt-4"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>

          ) : (
            <>
              {/* FORM TITLE */}
              <h2 className="text-headline-sm font-bold text-on-surface mb-1">
                Reset your password
              </h2>

              <p className="text-body-md text-on-surface-variant mb-6">
                Enter your email and we'll send you a 6-digit reset code.
              </p>

              {/* ERROR */}
              {error && (
                <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-body-md">
                  {error}
                </div>
              )}

              {/* FORM */}
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
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                    placeholder="you@aatu.edu.ng"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-container text-white rounded-lg font-mono text-label-md hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}

                  {loading ? 'Sending...' : 'Send reset code'}
                </button>
              </form>

              {/* BACK LINK */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-label-md font-mono text-on-surface-variant hover:text-primary-container transition-colors"
                >
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtp && (
        <ResetOtpModal
          email={email.trim()}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  )
}