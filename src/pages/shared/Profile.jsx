// src/pages/shared/Profile.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Camera, Eye, EyeOff, X } from 'lucide-react'

const ROLE_THEME = {
  admin:      { accent: '#4a0404', accentText: '#fff', light: '#ffdad5', label: 'Administrator' },
  staff:      { accent: '#4a0404', accentText: '#fff', light: '#ffdad5', label: 'Staff Member'  },
  technician: { accent: '#210000', accentText: '#fff', light: '#dce2f3', label: 'Technician'    },
  student:    { accent: '#1a3a5c', accentText: '#fff', light: '#dbe9fb', label: 'Student'       },
}

const ROLE_BACK_PATH = {
  admin:      '/admin/dashboard',
  staff:      '/staff/dashboard',
  technician: '/technician/dashboard',
  student:    '/student/dashboard',
}

// Notification toggles — keys match profiles.notification_prefs JSON
const NOTIF_TOGGLES = [
  { key: 'job_assigned',     label: 'Job Assignments',    desc: 'When a new job is assigned to you'              },
  { key: 'job_completed',    label: 'Job Completions',    desc: 'When a job you submitted is marked complete'    },
  { key: 'status_updates',   label: 'Status Updates',     desc: 'When the status of your request changes'        },
  { key: 'emergency_alerts', label: 'Emergency Alerts',   desc: 'High-priority and emergency notifications'      },
  { key: 'admin_messages',   label: 'Admin Messages',     desc: 'Direct messages and memos from the admin team'  },
]

const DEFAULT_PREFS = {
  job_assigned:     true,
  job_completed:    true,
  status_updates:   true,
  emergency_alerts: true,
  admin_messages:   true,
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#dcc0bd' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
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

export default function Profile({ role: roleProp }) {
  const { user, profile, fetchProfile } = useAuth()
  const navigate     = useNavigate()
  const fileInputRef = useRef(null)

  const role  = roleProp ?? profile?.role ?? 'student'
  const theme = ROLE_THEME[role] ?? ROLE_THEME.student

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarUrl,  setAvatarUrl]  = useState(profile?.avatar_url ?? null)
  const [uploading,  setUploading]  = useState(false)

  // ── Personal details ──────────────────────────────────────────────────────
  const [fullName,      setFullName]      = useState(profile?.full_name ?? '')
  const [phone,         setPhone]         = useState(profile?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPw,  setChangingPw]  = useState(false)
  const [pwError,     setPwError]     = useState('')

  // ── Notification preferences — synced with profiles.notification_prefs ───
  const [prefs,        setPrefs]        = useState(DEFAULT_PREFS)
  const [savingPrefs,  setSavingPrefs]  = useState(false)

  // ── Misc ──────────────────────────────────────────────────────────────────
  const [toast,             setToast]             = useState(null)
  const [confirmLogoutAll,  setConfirmLogoutAll]  = useState(false)

  // ── Sync state when profile loads / changes ───────────────────────────────
  useEffect(() => {
    setAvatarUrl(profile?.avatar_url ?? null)
    setFullName(profile?.full_name   ?? '')
    setPhone(profile?.phone          ?? '')

    // Merge saved prefs with defaults (in case new keys were added later)
    if (profile?.notification_prefs) {
      setPrefs(p => ({ ...p, ...profile.notification_prefs }))
    }
  }, [profile])

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Toggle one notification pref and save immediately ─────────────────────
  async function handlePrefToggle(key) {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)           // optimistic UI update
    setSavingPrefs(true)

    const { error } = await supabase
      .from('profiles')
      .update({ notification_prefs: updated })
      .eq('id', user.id)

    setSavingPrefs(false)

    if (error) {
      // Roll back on failure
      setPrefs(prefs)
      showToast('Could not save preference. Try again.', true)
    } else {
      const toggle = NOTIF_TOGGLES.find(t => t.key === key)
      showToast(`${toggle?.label ?? key}: ${updated[key] ? 'enabled' : 'disabled'}.`)
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', true); return }
    if (file.size > 5 * 1024 * 1024)    { showToast('Image must be smaller than 5MB.', true); return }

    setUploading(true)
    try {
      const ext      = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}` // bust cache

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', user.id)
      if (updateError) throw updateError

      setAvatarUrl(newUrl)
      await fetchProfile(user.id)
      showToast('Profile picture updated.')
    } catch (err) {
      console.error('Avatar upload error:', err)
      showToast(err.message || 'Could not upload image. Try again.', true)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    if (!user) return
    setUploading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
      if (error) throw error
      setAvatarUrl(null)
      await fetchProfile(user.id)
      showToast('Profile picture removed.')
    } catch (err) {
      showToast(err.message || 'Could not remove image.', true)
    } finally {
      setUploading(false)
    }
  }

  // ── Save profile details ──────────────────────────────────────────────────
  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!user || !fullName.trim()) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq('id', user.id)
      if (error) throw error
      await fetchProfile(user.id)
      showToast('Profile details saved.')
    } catch (err) {
      showToast(err.message || 'Could not save changes.', true)
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    if (!currentPw || !newPw || !confirmPw) { setPwError('Please fill in all password fields.'); return }
    if (newPw.length < 8)                   { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw)                { setPwError('New password and confirmation do not match.'); return }
    if (newPw === currentPw)                { setPwError('New password must be different from your current password.'); return }

    setChangingPw(true)
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw })
      if (reauthError) { setPwError('Current password is incorrect.'); setChangingPw(false); return }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
      if (updateError) throw updateError

      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      showToast('Password updated successfully.')
    } catch (err) {
      setPwError(err.message || 'Could not update password. Try again.')
    } finally {
      setChangingPw(false)
    }
  }

  async function handleLogoutAllDevices() {
    try {
      await supabase.auth.signOut({ scope: 'global' })
      navigate('/login')
    } catch (err) {
      showToast(err.message || 'Could not sign out of all devices.', true)
    }
  }

  const strength  = passwordStrength(newPw)
  const backPath  = ROLE_BACK_PATH[role] ?? '/login'
  const inputStyle = "w-full px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm focus:outline-none focus:ring-2 transition-shadow bg-white"

  return (
    <main className="flex-1 min-h-screen bg-[#f9f9ff]">

      {/* ── Top App Bar ───────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center h-16 px-4 sm:px-6 bg-[#f9f9ff] border-b border-[#dcc0bd] sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(backPath)} className="p-2 -ml-2 text-[#554240] hover:bg-[#f0f3ff] rounded-full transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-lg font-semibold text-[#151c27] truncate">Account Settings</h2>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full font-bold flex-shrink-0" style={{ background: theme.light, color: theme.accent }}>
          {theme.label}
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">

        {/* ── Profile Picture ───────────────────────────────────────────── */}
        <section className="bg-white border border-[#dcc0bd] rounded-xl p-6">
          <h3 className="text-base font-bold text-[#151c27] mb-4">Profile Picture</h3>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2" style={{ borderColor: theme.light, background: theme.light }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: theme.accent }}>{initials(profile?.full_name)}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-md disabled:opacity-60 transition-opacity"
                style={{ background: theme.accent }}
              >
                {uploading
                  ? <span className="material-symbols-outlined text-white text-[18px] animate-spin">progress_activity</span>
                  : <Camera size={16} color={theme.accentText} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-bold text-[#151c27]">{profile?.full_name ?? 'Your name'}</p>
              <p className="text-xs text-[#554240] font-mono">{user?.email}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-xs font-mono border border-[#dcc0bd] rounded-lg hover:bg-[#f0f3ff] transition-colors disabled:opacity-50">
                  Upload new photo
                </button>
                {avatarUrl && (
                  <button onClick={handleRemoveAvatar} disabled={uploading} className="px-3 py-1.5 text-xs font-mono text-[#ba1a1a] border border-[#ffdad6] bg-[#ffdad6]/30 rounded-lg hover:bg-[#ffdad6] transition-colors disabled:opacity-50">
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#554240]/60 mt-2">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>
        </section>

        {/* ── Personal Details ──────────────────────────────────────────── */}
        <section className="bg-white border border-[#dcc0bd] rounded-xl p-6">
          <h3 className="text-base font-bold text-[#151c27] mb-4">Personal Details</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#554240] mb-1.5">FULL NAME</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputStyle} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">EMAIL</label>
                <input type="email" value={user?.email ?? ''} disabled className={`${inputStyle} bg-[#f0f3ff] text-[#554240] cursor-not-allowed`} />
                <p className="text-[11px] text-[#554240]/60 mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 080XXXXXXXX" className={inputStyle} />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={savingProfile || !fullName.trim()} className="px-5 py-2.5 rounded-lg text-sm font-mono font-bold disabled:opacity-50 transition-opacity" style={{ background: theme.accent, color: theme.accentText }}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Change Password ───────────────────────────────────────────── */}
        <section className="bg-white border border-[#dcc0bd] rounded-xl p-6">
          <h3 className="text-base font-bold text-[#151c27] mb-1">Change Password</h3>
          <p className="text-xs text-[#554240] mb-4">Use a strong password you don't use anywhere else.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: 'CURRENT PASSWORD',     value: currentPw, set: setCurrentPw, show: showCurrent, setShow: setShowCurrent },
              { label: 'NEW PASSWORD',          value: newPw,     set: setNewPw,     show: showNew,     setShow: setShowNew     },
              { label: 'CONFIRM NEW PASSWORD',  value: confirmPw, set: setConfirmPw, show: showConfirm, setShow: setShowConfirm },
            ].map(({ label, value, set, show, setShow }) => (
              <div key={label}>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={value} onChange={e => set(e.target.value)}
                    className={`${inputStyle} pr-11`}
                    autoComplete={label === 'CURRENT PASSWORD' ? 'current-password' : 'new-password'} />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#554240]/60 hover:text-[#554240]" tabIndex={-1}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {label === 'NEW PASSWORD' && newPw && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#e7eefe] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }} />
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>
            ))}

            {pwError && (
              <div className="flex items-center gap-2 text-xs text-[#ba1a1a] bg-[#ffdad6]/40 border border-[#ffdad6] rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {pwError}
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button type="submit" disabled={changingPw} className="px-5 py-2.5 rounded-lg text-sm font-mono font-bold disabled:opacity-50 transition-opacity" style={{ background: theme.accent, color: theme.accentText }}>
                {changingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Notification Preferences ──────────────────────────────────── */}
        <section className="bg-white border border-[#dcc0bd] rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-[#151c27]">Notification Preferences</h3>
            {savingPrefs && (
              <span className="text-xs font-mono text-[#554240]/60 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                Saving...
              </span>
            )}
          </div>
          <p className="text-xs text-[#554240] mb-4">
            Choose which notifications you receive. Changes save instantly and apply across all your devices.
          </p>

          <div className="space-y-3">
            {NOTIF_TOGGLES.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 p-4 bg-[#f9f9ff] border border-[#dcc0bd] rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#151c27]">{label}</p>
                  <p className="text-xs text-[#554240] mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => handlePrefToggle(key)}
                  disabled={savingPrefs}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60"
                  style={{ background: prefs[key] ? theme.accent : '#dcc0bd' }}
                  aria-label={`${prefs[key] ? 'Disable' : 'Enable'} ${label}`}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: prefs[key] ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Live preview of what's enabled */}
          <div className="mt-4 p-3 bg-[#f0f3ff] rounded-lg border border-[#dcc0bd]">
            <p className="text-[11px] font-mono text-[#554240]/70 mb-1.5 uppercase tracking-wider">Currently enabled</p>
            <div className="flex flex-wrap gap-1.5">
              {NOTIF_TOGGLES.filter(t => prefs[t.key]).map(t => (
                <span key={t.key} className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold" style={{ background: theme.light, color: theme.accent }}>
                  {t.label}
                </span>
              ))}
              {NOTIF_TOGGLES.every(t => !prefs[t.key]) && (
                <span className="text-[11px] text-[#554240]/60 font-mono">All notifications disabled</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Security / Danger Zone ─────────────────────────────────────── */}
        <section className="bg-white border border-[#ffdad6] rounded-xl p-6">
          <h3 className="text-base font-bold text-[#93000a] mb-1">Security</h3>
          <p className="text-xs text-[#554240] mb-4">Sign out of every device where you're currently logged in.</p>
          <button
            onClick={() => setConfirmLogoutAll(true)}
            className="px-4 py-2.5 text-sm font-mono font-bold text-[#93000a] border border-[#ffdad6] bg-[#ffdad6]/30 rounded-lg hover:bg-[#ffdad6] transition-colors"
          >
            Log out of all devices
          </button>
        </section>
      </div>

      {/* ── Confirm Logout Modal ───────────────────────────────────────────── */}
      {confirmLogoutAll && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmLogoutAll(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-[#151c27]">Log out everywhere?</h3>
              <button onClick={() => setConfirmLogoutAll(false)} className="p-1 hover:bg-[#f0f3ff] rounded-full transition-colors"><X size={18} /></button>
            </div>
            <p className="text-sm text-[#554240] mb-5">You'll be signed out on this device and any other device currently logged in to your account.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogoutAll(false)} className="flex-1 px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm font-mono hover:bg-[#f0f3ff] transition-colors">Cancel</button>
              <button onClick={handleLogoutAllDevices} className="flex-1 px-4 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-mono font-bold hover:opacity-90 transition-opacity">Log Out Everywhere</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap ${toast.isError ? 'bg-[#ba1a1a] text-white' : 'bg-[#151c27] text-white'}`}>
          <span className="material-symbols-outlined text-[16px]" style={{ color: toast.isError ? '#fff' : '#b8ecbe' }}>
            {toast.isError ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}
    </main>
  )
}