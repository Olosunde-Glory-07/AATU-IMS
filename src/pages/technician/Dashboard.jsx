import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Semantic priority/status chip colors — intentionally kept as literal light
// hex chips in both themes (no dark-mode equivalent token set exists yet for
// these specific badge shades), matching the convention used elsewhere.
const PRIORITY_STYLE = {
  Emergency: 'bg-[#ffdad6] text-[#ba1a1a]',
  High:      'bg-amber-100 text-amber-800',
  Medium:    'bg-[#b8ecbe] text-[#3e6d47]',
  Low:       'bg-[#dce2f3] text-[#554240]',
}

const STATUS_STYLE = {
  'Pending Approval': 'bg-[#FEF3C7] text-[#92400E]',
  Approved:           'bg-[#EEF2FF] text-[#4338CA]',
  'In Progress':      'bg-[#b8ecbe] text-[#3e6d47]',
  Completed:          'bg-[#DCFCE7] text-[#166534]',
}

const QUICK_LINKS = [
  { label: 'My Jobs',       icon: 'assignment',    href: '/technician/my-jobs' },
  { label: 'Job History',   icon: 'history',       href: '/technician/my-jobs' },
  { label: 'Contact Admin', icon: 'support_agent', href: '/technician/notifications' },
]

const NAV_ITEMS = [
  { icon: 'space_dashboard', label: 'Dashboard',     href: '/technician/dashboard' },
  { icon: 'assignment',      label: 'My Jobs',       href: '/technician/my-jobs' },
  { icon: 'notifications',   label: 'Notifications', href: '/technician/notifications' },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-surface-container-lowest border-t border-outline-variant flex h-[60px]">
      {NAV_ITEMS.map(item => (
        <button key={item.label} onClick={() => navigate(item.href)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide text-on-surface-variant">
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

// ── Profile Modal ──────────────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onLogout }) {
  const [editing, setEditing]   = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [toast,   setToast]     = useState(null)
  const [form,    setForm]      = useState({
    full_name: profile?.full_name  ?? '',
    specialty: profile?.specialty  ?? '',
    department: profile?.department ?? '',
    phone:     profile?.phone      ?? '',
  })

  function showToast(msg, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:  form.full_name.trim(),
        specialty:  form.specialty.trim(),
        department: form.department.trim(),
        phone:      form.phone.trim(),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) { showToast('Failed to save changes.', true); return }
    showToast('Profile updated!')
    setEditing(false)
  }

  const inp = 'w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20 bg-surface-container-lowest text-on-surface'
  const initials = (profile?.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="bg-[#4a0404] p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">{profile?.full_name ?? '—'}</h2>
                <p className="text-white/70 text-xs font-mono mt-0.5 capitalize">{profile?.role ?? 'technician'}</p>
                {profile?.specialty && (
                  <p className="text-white/60 text-xs mt-0.5">{profile.specialty}</p>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {!editing ? (
              <>
                {[
                  { label: 'DEPARTMENT', value: profile?.department || '—',   icon: 'domain' },
                  { label: 'SPECIALTY',  value: profile?.specialty  || '—',   icon: 'build' },
                  { label: 'PHONE',      value: profile?.phone      || '—',   icon: 'phone' },
                  { label: 'ROLE',       value: profile?.role       || '—',   icon: 'badge' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px]">{icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-on-surface">{value}</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-mono hover:bg-surface-container-low transition-colors text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit Profile
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error-container text-on-error-container rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {[
                  { label: 'Full Name',   key: 'full_name',  placeholder: 'Your full name' },
                  { label: 'Specialty',   key: 'specialty',  placeholder: 'e.g. Electrical, Plumbing' },
                  { label: 'Department',  key: 'department', placeholder: 'e.g. Engineering' },
                  { label: 'Phone',       key: 'phone',      placeholder: 'e.g. 08012345678' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">{label}</label>
                    <input
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={inp}
                    />
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(false)} className="flex-1 px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-mono hover:bg-surface-container-low transition-colors text-on-surface">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-primary-container text-white rounded-lg text-sm font-mono font-bold hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>

          {toast && (
            <div className={`mx-6 mb-4 px-4 py-2.5 rounded-lg text-sm font-mono flex items-center gap-2 ${toast.err ? 'bg-error-container text-on-error-container' : 'bg-[#b8ecbe] dark:bg-[#264d30] text-[#1a3d25] dark:text-[#b8ecbe]'}`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {toast.err ? 'error' : 'check_circle'}
              </span>
              {toast.msg}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function TechnicianDashboard() {
  const { user, profile } = useAuth()
  const navigate           = useNavigate()
  const isMobile           = useIsMobile()

  const [jobs, setJobs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [search, setSearch]           = useState('')
  const [toast, setToast]             = useState(null)
  const [completedToday, setCompletedToday] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Technician'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const initials  = (profile?.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  // ── Fetch active jobs ──────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('id, title, location, department, priority, status, progress, notes, pdf_url, request_id, created_at')
        .eq('technician_id', user.id)
        .in('status', ['Pending Approval', 'Approved', 'In Progress'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs((data ?? []).map(j => ({
        id:         j.id,
        title:      j.title,
        location:   j.location   || '—',
        department: j.department || '—',
        priority:   j.priority   || 'Medium',
        status:     j.status,
        progress:   j.progress   ?? 0,
        notes:      j.notes,
        pdfUrl:     j.pdf_url,
        requestId:  j.request_id,
      })))
    } catch (err) {
      console.error('Dashboard fetch jobs error:', err)
      showToast('Failed to load jobs.')
    }
  }, [user])

  // ── Fetch completed today count ────────────────────────────────────────────
  const fetchCompletedToday = useCallback(async () => {
    if (!user) return
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('job_orders')
      .select('id', { count: 'exact', head: true })
      .eq('technician_id', user.id)
      .eq('status', 'Completed')
      .gte('updated_at', todayStart.toISOString())

    if (!error) setCompletedToday(count ?? 0)
  }, [user])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchJobs(), fetchCompletedToday()]).finally(() => setLoading(false))
  }, [fetchJobs, fetchCompletedToday])

  // ── Real-time: new job assigned to this technician appears instantly ────────
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('technician-jobs')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'job_orders',
        filter: `technician_id=eq.${user.id}`,
      }, () => { fetchJobs(); fetchCompletedToday() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchJobs, fetchCompletedToday])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalJobs  = jobs.length
  const assigned   = jobs.filter(j => j.status === 'Pending Approval' || j.status === 'Approved').length
  const inProgress = jobs.filter(j => j.status === 'In Progress').length

  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase()
    return jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    )
  }, [jobs, search])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([fetchJobs(), fetchCompletedToday()])
    setRefreshing(false)
    showToast('Jobs refreshed.')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ── Start Job ──────────────────────────────────────────────────────────────
  async function startJob(job) {
    try {
      const { error } = await supabase
        .from('job_orders')
        .update({ status: 'In Progress' })
        .eq('id', job.id)

      if (error) throw error
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'In Progress' } : j))
      showToast('Job started. Head to My Jobs for full controls.')
    } catch (err) {
      console.error('Start job error:', err)
      showToast('Failed to start job. Try again.')
    }
  }

  // ── Complete Job ───────────────────────────────────────────────────────────
  async function completeJob(job) {
    try {
      const { error: joErr } = await supabase
        .from('job_orders')
        .update({ status: 'Completed', progress: 100 })
        .eq('id', job.id)

      if (joErr) throw joErr

      if (job.requestId) {
        await supabase
          .from('requests')
          .update({ status: 'Completed' })
          .eq('id', job.requestId)
      }

      setJobs(prev => prev.filter(j => j.id !== job.id))
      setCompletedToday(c => c + 1)
      showToast('Job marked as completed.')
    } catch (err) {
      console.error('Complete job error:', err)
      showToast('Failed to complete job. Try again.')
    }
  }

  return (
    <main className={`flex-1 min-h-screen bg-background ${isMobile ? 'pb-[60px]' : ''}`}>

      {/* ── Top App Bar ───────────────────────────────────────────────────── */}
      <header className={`flex justify-between items-center h-16 bg-background border-b border-outline-variant sticky top-0 z-40 gap-3 ${isMobile ? 'px-4' : 'px-6'}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-1 max-w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffb4aa] transition-all w-full text-on-surface ${isMobile ? '' : 'max-w-[256px]'}`}
              placeholder="Search jobs..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            title="Refresh"
          >
            <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button
            onClick={() => navigate('/technician/my-jobs')}
            className={`bg-[#210000] text-white rounded-full text-xs font-mono font-bold hover:opacity-90 transition-opacity flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'px-6 py-2'}`}
          >
            {isMobile ? 'Jobs' : 'View All Jobs'}
          </button>
          <button
            onClick={() => navigate('/technician/notifications')}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* ── Profile Avatar Button ──────────────────────────────────── */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-[#4a0404] text-white text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
            title="My Profile"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ── Content Body ──────────────────────────────────────────────────── */}
      <div className={`max-w-[1600px] mx-auto space-y-6 ${isMobile ? 'p-4' : 'p-8'}`}>

        {/* Greeting Hero */}
        <div className={`relative rounded-xl overflow-hidden ${isMobile ? 'h-36' : 'h-48'}`}>
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#210000]/90 to-transparent" />
          <div className={`relative z-10 h-full flex flex-col justify-center ${isMobile ? 'p-5' : 'p-8'}`}>
            <h2 className={`text-white font-bold mb-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>{greeting}, {firstName}</h2>
            <p className={`text-white/80 ${isMobile ? 'text-sm' : 'text-base'}`}>
              {loading
                ? 'Loading your jobs...'
                : totalJobs === 0
                  ? "No pending jobs. You're all caught up!"
                  : `You have ${totalJobs} active job${totalJobs !== 1 ? 's' : ''} today.`}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-3 sm:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          {[
            { label: 'Total Jobs',  value: loading ? '—' : totalJobs,      icon: 'assignment',      hoverBg: 'group-hover:bg-[#ffb4aa]', hoverColor: 'group-hover:text-[#210000]' },
            { label: 'Assigned',    value: loading ? '—' : assigned,        icon: 'person_add',      hoverBg: 'group-hover:bg-[#a0d3a6]', hoverColor: 'group-hover:text-[#396844]' },
            { label: 'In Progress', value: loading ? '—' : inProgress,      icon: 'pending_actions', hoverBg: 'group-hover:bg-[#ffb77d]', hoverColor: 'group-hover:text-[#160700]' },
            { label: 'Done Today',  value: loading ? '—' : completedToday,  icon: 'task_alt',        hoverBg: 'group-hover:bg-[#b8ecbe]', hoverColor: 'group-hover:text-[#3e6d47]' },
          ].map(s => (
            <div key={s.label}
              className={`bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center hover:bg-surface-container-low transition-colors group cursor-pointer ${isMobile ? 'p-4 gap-3' : 'p-6 gap-5'}`}
              onClick={() => navigate('/technician/my-jobs')}
            >
              <div className={`rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors flex-shrink-0 ${s.hoverBg} ${s.hoverColor} ${isMobile ? 'w-11 h-11' : 'w-14 h-14'}`}>
                <span className={`material-symbols-outlined ${isMobile ? 'text-[20px]' : 'text-[28px]'}`}>{s.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono text-on-surface-variant opacity-60 truncate">{s.label}</p>
                <h3 className={`font-bold text-on-surface ${isMobile ? 'text-xl' : 'text-2xl'}`}>{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Main Workspace */}
        <section className="space-y-4">
          <div className={`flex items-center justify-between border-b border-outline-variant pb-4 ${isMobile ? 'flex-col items-stretch gap-3' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#210000] dark:text-[#ffb4aa]">handyman</span>
              <h3 className="text-lg font-semibold text-on-surface uppercase tracking-tight">Active Jobs</h3>
            </div>
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              <button
                onClick={() => navigate('/technician/my-jobs')}
                className={`text-xs font-mono px-4 py-1.5 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors ${isMobile ? 'flex-1' : ''}`}
              >
                View All
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`text-xs font-mono px-4 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 ${isMobile ? 'flex-1' : ''}`}
              >
                <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 sm:gap-6 min-h-[400px]">

            {/* Job List */}
            {loading ? (
              <div className="col-span-12 lg:col-span-8 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[88px] bg-surface-container-lowest border border-outline-variant rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className={`col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col items-center justify-center text-center ${isMobile ? 'p-6' : 'p-12'}`}>
                <div className="relative mb-6">
                  <div className={`rounded-full bg-surface-container flex items-center justify-center ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}`}>
                    <span className={`material-symbols-outlined text-surface-dim ${isMobile ? 'text-[48px]' : 'text-[64px]'}`}>check_circle</span>
                  </div>
                  <div className={`absolute -bottom-2 -right-2 bg-[#b8ecbe] dark:bg-[#264d30] rounded-full flex items-center justify-center border-4 border-surface-container-lowest ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <span className="material-symbols-outlined text-[#396844] dark:text-[#a0d3a6] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-on-surface mb-2">All caught up!</h4>
                <p className="text-on-surface-variant text-base max-w-md mx-auto">
                  {search ? 'No jobs match your search.' : 'No active jobs assigned to you right now. New jobs will appear here automatically.'}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-8 px-8 py-3 bg-[#210000] text-white rounded-full text-xs font-mono flex items-center gap-2 hover:shadow-lg transition-all active:scale-95"
                >
                  <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                  {refreshing ? 'Refreshing...' : 'Refresh Jobs'}
                </button>
              </div>
            ) : (
              <div className="col-span-12 lg:col-span-8 space-y-4">
                {filteredJobs.map(job => (
                  <div key={job.id}
                    className={`bg-surface-container-lowest border border-outline-variant rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow ${isMobile ? 'p-4' : 'p-6'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant">build</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-on-surface-variant">#{String(job.id).slice(0, 8)}</span>
                        <h4 className="text-base font-bold text-on-surface">{job.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {job.location}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${PRIORITY_STYLE[job.priority] || 'bg-surface-container text-on-surface-variant'}`}>
                            {job.priority}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[job.status] || 'bg-surface-container text-on-surface-variant'}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex gap-2 flex-shrink-0 ${isMobile ? 'w-full' : ''}`}>
                      {job.status === 'Approved' && (
                        <button
                          onClick={() => startJob(job)}
                          className={`px-4 py-2 bg-surface-container text-on-surface rounded-lg text-xs font-mono font-bold hover:bg-surface-container-high transition-colors ${isMobile ? 'flex-1' : ''}`}
                        >
                          Start Job
                        </button>
                      )}
                      {job.status === 'In Progress' && (
                        <button
                          onClick={() => completeJob(job)}
                          className={`px-4 py-2 bg-[#396844] text-white rounded-lg text-xs font-mono font-bold hover:opacity-90 transition-opacity ${isMobile ? 'flex-1' : ''}`}
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/technician/my-jobs')}
                        className={`px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg text-xs font-mono hover:bg-surface-container-low transition-colors ${isMobile ? 'flex-1' : ''}`}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Links Panel */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className={`bg-surface-container-low border border-outline-variant rounded-2xl h-full ${isMobile ? 'p-4' : 'p-6'}`}>
                <h5 className="text-lg font-semibold text-on-surface mb-6">Quick Links</h5>
                <div className="space-y-3">
                  {QUICK_LINKS.map(link => (
                    <button key={link.label} onClick={() => navigate(link.href)}
                      className="w-full flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant hover:border-[#210000] dark:hover:border-[#ffb4aa] transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-[#210000] dark:group-hover:text-[#ffb4aa] transition-colors">{link.icon}</span>
                        <span className="text-sm text-on-surface">{link.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                    </button>
                  ))}
                </div>

                {/* Profile quick access */}
                <button
                  onClick={() => setProfileOpen(true)}
                  className="mt-3 w-full flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant hover:border-[#210000] dark:hover:border-[#ffb4aa] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-[#210000] dark:group-hover:text-[#ffb4aa] transition-colors">account_circle</span>
                    <span className="text-sm text-on-surface">My Profile</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>

                <div className="mt-6 p-4 bg-[#ffdad5] dark:bg-[#5c2a26] rounded-xl">
                  <p className="text-[#410001] dark:text-[#ffdad5] text-xs font-mono font-bold mb-1">System Status</p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#396844] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#396844]" />
                    </span>
                    <span className="text-[#396844] dark:text-[#a0d3a6] text-xs font-bold">ALL SYSTEMS OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isMobile && <BottomNav />}

      {/* Profile Modal */}
      {profileOpen && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[60] bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap ${isMobile ? 'bottom-[76px]' : 'bottom-6'}`}>
          <span className="material-symbols-outlined text-[#b8ecbe] text-base">check_circle</span>
          {toast}
        </div>
      )}
    </main>
  )
}