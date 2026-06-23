import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

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
                If an account exists for <strong>{email}</strong>, we’ve sent a password reset link.
              </p>

              <p className="text-xs text-on-surface-variant">
                Didn’t see it? Check spam or try again.
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
                Enter your email and we’ll send you a reset link.
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

                  {loading ? 'Sending...' : 'Send reset link'}
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
    </div>
  )
}