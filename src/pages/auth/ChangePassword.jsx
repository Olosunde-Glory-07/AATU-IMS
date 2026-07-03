import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function ChangePassword() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      // 1. Update the password
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // 2. Clear the must_change_password flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id)
      if (profileError) throw profileError

      // 3. Redirect to their portal
      const role = profile?.role
      if (role === 'staff')           navigate('/staff/dashboard')
      else if (role === 'technician') navigate('/technician/dashboard')
      else if (role === 'admin')      navigate('/admin/dashboard')
      else                            navigate('/student/dashboard')

    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '12px 14px',
    border: '1px solid #dcc0bd', borderRadius: 10,
    fontSize: 15, color: '#151c27',
    background: '#fff', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Hanken Grotesk', sans-serif",
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#4a0404', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 28, fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#151c27' }}>
            Set your new password
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#554240', lineHeight: 1.6 }}>
            Welcome, <strong>{profile?.full_name?.split(' ')[0] ?? 'there'}</strong>. 
            Your account is ready — please set a secure password to continue.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #dcc0bd', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

          {/* Role banner */}
          <div style={{ background: '#4a0404', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ color: '#ffb4aa', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
              {profile?.role === 'technician' ? 'engineering' : 'badge'}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                {profile?.role ?? 'User'} Account
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'JetBrains Mono', monospace" }}>
                First login — password change required
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#ffdad6', borderRadius: 8, fontSize: 13, color: '#93000a' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>error</span>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#554240', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                New Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                style={inp}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#554240', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
                style={inp}
              />
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 99,
                    background: password.length >= (i + 1) * 3
                      ? i === 0 ? '#ba1a1a' : i === 1 ? '#f59e0b' : i === 2 ? '#3b82f6' : '#22c55e'
                      : '#dcc0bd',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#f0f3ff', border: '1px solid #dcc0bd', borderRadius: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#554240', flexShrink: 0, marginTop: 1 }}>info</span>
              <p style={{ margin: 0, fontSize: 12, color: '#554240', lineHeight: 1.5 }}>
                Choose a strong password you haven't used before. You won't be asked to change it again unless requested by the admin.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirm}
              style={{
                marginTop: 4,
                padding: '13px 0',
                background: (!loading && password.length >= 8 && password === confirm) ? '#4a0404' : '#dcc0bd',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: (!loading && password.length >= 8 && password === confirm) ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }}>progress_activity</span>
                  Saving password…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>lock</span>
                  Set Password & Enter App
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}