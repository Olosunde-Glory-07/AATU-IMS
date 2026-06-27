// src/pages/shared/ChangePassword.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#dcc0bd' }
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: 'Very weak', color: '#ba1a1a' },
    { label: 'Weak',      color: '#ba1a1a' },
    { label: 'Fair',      color: '#92400E' },
    { label: 'Good',      color: '#396844' },
    { label: 'Strong',    color: '#166534' },
  ]
  return { score, ...levels[score] }
}

export default function ChangePassword() {
  const { user, profile } = useAuth()
  const navigate           = useNavigate()

  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [showNew,    setShowNew]    = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const strength = passwordStrength(newPw)

  const ROLE_DASHBOARD = {
    admin:      '/admin/dashboard',
    staff:      '/staff/dashboard',
    technician: '/technician/dashboard',
    student:    '/student/dashboard',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPw.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    if (newPw !== confirmPw) {
      setError('Passwords do not match.'); return
    }

    setLoading(true)
    try {
      // 1. Update the password in Supabase Auth
      const { error: pwError } = await supabase.auth.updateUser({ password: newPw })
      if (pwError) throw pwError

      // 2. Clear the must_change_password flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id)
      if (profileError) throw profileError

      // 3. Redirect to their dashboard
      const dest = ROLE_DASHBOARD[profile?.role] ?? '/login'
      navigate(dest, { replace: true })

    } catch (err) {
      console.error('Change password error:', err)
      setError(err.message || 'Failed to update password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 bg-white text-[#151c27]'

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#4a0404] text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
            <span className="text-2xl font-bold text-[#151c27]">AATU IMS</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#dcc0bd] rounded-xl shadow-sm overflow-hidden">

          {/* Banner */}
          <div className="bg-[#4a0404] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock_reset
                </span>
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Set Your New Password</h2>
                <p className="text-white/60 text-xs font-mono mt-0.5">
                  Welcome, {profile?.full_name?.split(' ')[0] ?? 'there'}! You must set a new password before continuing.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">

            {/* Info note */}
            <div className="flex gap-2 p-3 bg-[#f0f3ff] border border-[#dcc0bd] rounded-lg">
              <span className="material-symbols-outlined text-[#554240] text-[16px] flex-shrink-0 mt-0.5">info</span>
              <p className="text-[11px] text-[#554240] leading-relaxed">
                Your account was created by the administrator with a temporary password.
                Please choose a strong personal password to secure your account.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-[#ba1a1a] bg-[#ffdad6]/40 border border-[#ffdad6] rounded-lg px-3 py-2.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* New Password */}
              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`${inp} pr-11`}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#554240]/60 hover:text-[#554240]"
                    tabIndex={-1}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPw && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#e7eefe] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }} />
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`${inp} pr-11`}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConf(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#554240]/60 hover:text-[#554240]"
                    tabIndex={-1}>
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPw && (
                  <p className={`text-[11px] font-mono mt-1.5 flex items-center gap-1 ${newPw === confirmPw ? 'text-[#396844]' : 'text-[#ba1a1a]'}`}>
                    <span className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {newPw === confirmPw ? 'check_circle' : 'cancel'}
                    </span>
                    {newPw === confirmPw ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPw.length < 8 || newPw !== confirmPw}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    Set New Password & Continue
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}