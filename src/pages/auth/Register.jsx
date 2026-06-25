import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, UserPlus, GraduationCap } from 'lucide-react'

// Only students can self-register.
// Staff and technicians are created by admin via the Users page.

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
  const [showModal,    setShowModal]    = useState(false)

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim())     { setError('Full name is required.');         return }
    if (!form.matricNumber.trim()) { setError('Matric number is required.');     return }
    if (!form.program.trim())      { setError('Programme of study is required.'); return }
    if (form.password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)

    const metadata = {
      full_name:    form.fullName.trim(),
      role:         'student',
      matric_number:form.matricNumber.trim(),
      program:      form.program.trim(),
      department:   form.department.trim() || null,
    }

    const { error: signUpError } = await signUp(form.email, form.password, metadata)
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setShowModal(true)
  }

  const inp = 'w-full px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 bg-white text-[#151c27] placeholder:text-[#89726f]'
  const lbl = 'block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#4a0404] text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
            <span className="text-2xl font-bold text-[#151c27]">AATU IMS</span>
          </div>
          <p className="text-sm text-[#554240]">Student Registration Portal</p>
        </div>

        {/* ── Card ────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#dcc0bd] rounded-xl shadow-sm overflow-hidden">

          {/* Role banner — students only */}
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
            {error && (
              <div className="flex items-center gap-2 text-xs text-[#ba1a1a] bg-[#ffdad6]/40 border border-[#ffdad6] rounded-lg px-3 py-2.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
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

              {/* Programme of Study */}
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
                <p className="text-[11px] text-[#554240]/60 mt-1">Optional — helps route your requests to the right team.</p>
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
                  After registering, check your email for a verification link before you can log in.
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

            {/* Staff/technician note */}
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

      {/* ── Email Verification Modal ───────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#4a0404] px-6 py-5 text-center">
              <span className="material-symbols-outlined text-white text-5xl block mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                mark_email_read
              </span>
              <h2 className="text-white font-bold text-lg">Check your email</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-[#554240] text-sm leading-relaxed mb-2">
                A verification link has been sent to
              </p>
              <p className="font-bold text-[#151c27] text-sm font-mono mb-4 break-all">{form.email}</p>
              <p className="text-[#554240] text-xs leading-relaxed mb-6">
                Please check your inbox (and spam folder) and click the link to confirm your account before logging in.
              </p>
              <button
                onClick={() => { setShowModal(false); navigate('/login') }}
                className="w-full bg-[#4a0404] text-white py-2.5 rounded-lg text-sm font-mono font-bold hover:opacity-90 transition-opacity"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}