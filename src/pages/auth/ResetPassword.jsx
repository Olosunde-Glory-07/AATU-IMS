import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  // ✅ FIX: Proper session detection
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (data?.session) {
        setReady(true)
      } else {
        // small delay allows Supabase to process token from URL
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession()
          setReady(!!data?.session)
        }, 1000)
      }
    }

    checkSession()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // optional UX delay
    setTimeout(() => {
      navigate('/login')
    }, 1500)
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

          <h2 className="text-headline-sm font-bold text-on-surface mb-1">
            Set a new password
          </h2>

          <p className="text-body-md text-on-surface-variant mb-6">
            Choose a strong password for your account.
          </p>

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-body-md">
              {error}
            </div>
          )}

          {/* LOADING STATE */}
          {!ready && (
            <div className="mb-4 p-3 bg-surface-container text-on-surface-variant rounded-lg text-body-md">
              Verifying reset link...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NEW PASSWORD */}
            <div>
              <label className="block text-label-md font-mono text-on-surface-variant mb-1.5">
                New password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!ready}
                  className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
                  placeholder="Min. 8 characters"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-label-md font-mono text-on-surface-variant mb-1.5">
                Confirm password
              </label>

              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={!ready}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
                placeholder="Repeat new password"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-container text-white rounded-lg font-mono text-label-md hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <KeyRound size={16} />
              )}

              {loading ? 'Updating...' : 'Update password'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}