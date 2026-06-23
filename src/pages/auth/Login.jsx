import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    // AppRoutes will redirect based on role via "/"
    navigate('/')
  }

  async function handleGoogle() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            <span className="text-headline-lg font-bold text-on-surface">AATU IMS</span>
          </div>
          <p className="text-body-md text-on-surface-variant">Infrastructure Management System</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-outline-variant rounded-xl p-8 shadow-sm">
          <h2 className="text-headline-sm font-bold text-on-surface mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-body-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md font-mono text-on-surface-variant mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="you@aatu.edu.ng"
              />
            </div>

            <div>
              <label className="block text-label-md font-mono text-on-surface-variant mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-label-md text-primary-container hover:underline font-mono">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-container text-white rounded-lg font-mono text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-label-md text-on-surface-variant font-mono">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          <p className="mt-6 text-center text-label-md text-on-surface-variant font-mono">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-container hover:underline font-bold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}