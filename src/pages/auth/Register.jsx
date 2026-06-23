import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, UserPlus, Users, Wrench, GraduationCap } from 'lucide-react'

const ROLES = [
  {
    value: 'staff',
    label: 'Staff',
    icon: Users,
    color: 'border-secondary bg-secondary/10',
  },
  {
    value: 'technician',
    label: 'Technician',
    icon: Wrench,
    color: 'border-on-tertiary-container bg-tertiary-fixed/20',
  },
  {
    value: 'student',
    label: 'Student',
    icon: GraduationCap,
    color: 'border-blue-400 bg-blue-50',
  },
]

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '',
    matricNumber: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  function update(field) {
    return (e) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.role) {
      setError('Please select a role.')
      return
    }

    setError('')
    setLoading(true)

    const metadata = {
      full_name: form.fullName,
      role: form.role,
      ...(form.role === 'student' && {
        matric_number: form.matricNumber,
      }),
    }

    const { error } = await signUp(
      form.email,
      form.password,
      metadata
    )

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // ✅ Show email verification modal instead of redirecting
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-container text-4xl">
              account_balance
            </span>
            <span className="text-headline-lg font-bold text-on-surface">
              AATU IMS
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-body-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role selector */}
            <div>
              <label className="block text-label-md font-mono mb-2">
                Select your role
              </label>

              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, role: value }))
                    }
                    className={`flex items-center gap-2 p-3 border-2 rounded-xl transition-all ${
                      form.role === value
                        ? color +
                          ' ring-2 ring-primary-container'
                        : 'border-outline-variant hover:border-primary-container/40'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <input
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={update('fullName')}
              required
              className="w-full px-4 py-2.5 border rounded-lg"
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={update('email')}
              required
              className="w-full px-4 py-2.5 border rounded-lg"
            />

            {/* Matric number */}
            {form.role === 'student' && (
              <input
                type="text"
                placeholder="Matric number"
                value={form.matricNumber}
                onChange={update('matricNumber')}
                required
                className="w-full px-4 py-2.5 border rounded-lg"
              />
            )}

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border rounded-lg pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-2.5"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-container text-white rounded-lg"
            >
              {loading ? 'Creating account...' : (
                <>
                  <UserPlus size={16} />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-container font-bold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ✅ EMAIL VERIFICATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center shadow-lg">

            <h2 className="text-xl font-bold mb-2">
              Verify your email
            </h2>

            <p className="text-gray-600 mb-4">
              A verification link has been sent to your email.
              Please check your inbox and confirm your account
              before logging in.
            </p>

            <button
              onClick={() => {
                setShowModal(false)
                navigate('/login')
              }}
              className="w-full bg-primary-container text-white py-2 rounded-lg"
            >
              Go to Login
            </button>

          </div>
        </div>
      )}
    </div>
  )
}