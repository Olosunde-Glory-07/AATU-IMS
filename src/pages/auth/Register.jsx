import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, UserPlus, GraduationCap } from 'lucide-react'

// ─── Inline OTP Modal ─────────────────────────────────────────────────────────
function VerifyOtpModal({ email, role, onClose }) {
  const navigate = useNavigate()
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
      // Redirect based on role
      if (role === 'staff')           navigate('/staff/dashboard')
      else if (role === 'technician') navigate('/technician/dashboard')
      else                            navigate('/student/dashboard')
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>Check your email</h2>
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

            {/* OTP input */}
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
                  Verify & Activate Account
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
              ← Go back and change email
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

// ─── Register Page ─────────────────────────────────────────────────────────────
export default function Register() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    fullName:     '',
    email:        '',
    password:     '',
    matricNumber: '',
    program:      '',
    department:   '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  // OTP modal state
  const [showOtp,      setShowOtp]      = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingRole,  setPendingRole]  = useState('')

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim())     { setError('Full name is required.');                    return }
    if (!form.matricNumber.trim()) { setError('Matric number is required.');                return }
    if (!form.program.trim())      { setError('Programme of study is required.');           return }
    if (form.password.length < 8)  { setError('Password must be at least 8 characters.');  return }

    setLoading(true)

    const metadata = {
      full_name:     form.fullName.trim(),
      role:          'student',
      matric_number: form.matricNumber.trim(),
      program:       form.program.trim(),
      department:    form.department.trim() || null,
    }

    const { data, error: signUpError } = await signUp(
      form.email.trim(),
      form.password,
      metadata
    )

    setLoading(false)

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() ?? ''

      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('user already registered')
      ) {
        setError('already_exists')
        return
      }

      if (
        msg.includes('error sending') ||
        msg.includes('could not send') ||
        msg.includes('email provider') ||
        msg.includes('smtp') ||
        msg.includes('timeout') ||
        msg.includes('context deadline')
      ) {
        setError('email_failed')
        return
      }

      if (msg.includes('email signups are disabled') || msg.includes('provider disabled')) {
        setError('Email sign-ups are currently disabled. Please contact the administrator.')
        return
      }

      setError(signUpError.message)
      return
    }

    // Supabase returns empty identities for already-existing emails
    if (data?.user?.identities && data.user.identities.length === 0) {
      setError('already_exists')
      return
    }

    // ── Success — show OTP modal instead of navigating away ──────────────
    setPendingEmail(form.email.trim())
    setPendingRole('student')
    setShowOtp(true)
  }

  const inp = 'w-full px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 bg-white text-[#151c27] placeholder:text-[#89726f]'
  const lbl = 'block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="material-symbols-outlined text-[#4a0404] text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
            <span className="text-2xl font-bold text-[#151c27]">AATU IMS</span>
          </div>
          <p className="text-sm text-[#554240]">Student Registration Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#dcc0bd] rounded-xl shadow-sm overflow-hidden">

          {/* Role banner */}
          <div className="bg-[#4a0404] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Student Account</p>
              <p className="text-white/60 text-xs font-mono">
                Staff & technician accounts are created by the administrator
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">

            {/* Error banners */}
            {error === 'already_exists' && (
              <div className="flex items-start gap-2 text-xs text-[#ba1a1a] bg-[#ffdad6]/40 border border-[#ffdad6] rounded-lg px-3 py-3">
                <span
                  className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >error</span>
                <div>
                  <p className="font-bold mb-0.5">This email is already registered.</p>
                  <p className="text-[#93000a]">Please sign in instead, or reset your password if you've forgotten it.</p>
                  <div className="flex gap-3 mt-2">
                    <Link to="/login" className="font-bold underline">Sign In →</Link>
                    <Link to="/forgot-password" className="font-bold underline">Forgot Password →</Link>
                  </div>
                </div>
              </div>
            )}

            {error === 'email_failed' && (
              <div className="flex items-start gap-2 text-xs text-[#92400E] bg-[#FEF3C7] border border-[#fde68a] rounded-lg px-3 py-3">
                <span
                  className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >warning</span>
                <div>
                  <p className="font-bold mb-0.5">Could not send verification email.</p>
                  <p>Your account was created but we failed to send the OTP code. Please try again in a moment.</p>
                </div>
              </div>
            )}

            {error && error !== 'already_exists' && error !== 'email_failed' && (
              <div className="flex items-start gap-2 text-xs text-[#ba1a1a] bg-[#ffdad6]/40 border border-[#ffdad6] rounded-lg px-3 py-2.5">
                <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className={lbl}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Olosunde Samuel"
                  value={form.fullName}
                  onChange={update('fullName')}
                  required
                  className={inp}
                />
              </div>

              {/* Email */}
              <div>
                <label className={lbl}>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. samuel@aatu.edu.ng"
                  value={form.email}
                  onChange={update('email')}
                  required
                  className={inp}
                />
              </div>

              {/* Matric Number */}
              <div>
                <label className={lbl}>Matric Number *</label>
                <input
                  type="text"
                  placeholder="e.g. CSC/2021/001"
                  value={form.matricNumber}
                  onChange={update('matricNumber')}
                  required
                  className={inp}
                />
              </div>

              {/* Programme */}
              <div>
                <label className={lbl}>Programme of Study *</label>
                <input
                  type="text"
                  placeholder="e.g. B.Sc. Computer Science"
                  value={form.program}
                  onChange={update('program')}
                  required
                  className={inp}
                />
              </div>

              {/* Department */}
              <div>
                <label className={lbl}>Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={update('department')}
                  className={inp}
                />
                <p className="text-[11px] text-[#554240]/60 mt-1">
                  Optional — helps route your requests to the right team.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className={lbl}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={update('password')}
                    required
                    minLength={8}
                    className={`${inp} pr-11`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#554240]/60 hover:text-[#554240]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div className="flex gap-2 p-3 bg-[#f0f3ff] border border-[#dcc0bd] rounded-lg">
                <span className="material-symbols-outlined text-[#554240] text-[16px] flex-shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-[#554240] leading-relaxed">
                  After registering, a <strong>6-digit verification code</strong> will be sent to your email.
                  Enter it in the popup to activate your account.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono font-bold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Create Student Account
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#554240]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#4a0404] font-bold hover:underline">
                Sign in
              </Link>
            </p>

            <div className="border-t border-[#dcc0bd] pt-4">
              <p className="text-center text-xs text-[#554240]/70">
                Are you a staff member or technician?{' '}
                <span className="font-mono font-bold text-[#554240]">
                  Contact the administrator to get your account set up.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtp && (
        <VerifyOtpModal
          email={pendingEmail}
          role={pendingRole}
          onClose={() => setShowOtp(false)}
        />
      )}
    </div>
  )
}