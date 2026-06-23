import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

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
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-[#dcc0bd] flex h-[60px]">
      {NAV_ITEMS.map(item => (
        <button key={item.label} onClick={() => navigate(item.href)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide text-[#554240]">
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export default function TechnicianDashboard() {
  const { user, profile } = useAuth()
  const navigate           = useNavigate()
  const isMobile           = useIsMobile()

  const [jobs, setJobs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]       = useState('')
  const [toast, setToast]         = useState(null)
  const [completedToday, setCompletedToday] = useState(0)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Technician'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  // ── Fetch active jobs (Pending Approval, Approved, In Progress) ────────────
  const fetchJobs = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('id, title, location, department, priority, status, progress, notes, category, pdf_url, request_id, created_at')
        .eq('technician_id', user.id)
        .in('status', ['Pending Approval', 'Approved', 'In Progress'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs((data ?? []).map(j => ({
        id:         j.id,
        title:      j.title,
        location:   j.location || '—',
        department: j.department || '—',
        priority:   j.priority || 'Medium',
        status:     j.status,
        progress:   j.progress ?? 0,
        notes:      j.notes,
        category:   j.category || 'Other',
        pdfUrl:     j.pdf_url,
        requestId:  j.request_id,
      })))
    } catch (err) {
      console.error('Dashboard fetch jobs error:', err)
      showToast('Failed to load jobs.')
    }
  }, [user])

  // ── Fetch count of jobs completed today ────────────────────────────────────
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

  // ── Start Job → update job_orders status to In Progress ───────────────────
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

  // ── Mark Complete → update job_orders + linked request ────────────────────
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
    <main className={`flex-1 min-h-screen bg-[#f9f9ff] ${isMobile ? 'pb-[60px]' : ''}`}>

      {/* ── Top App Bar ─────────────────────────────────────────────────────── */}
      <header className={`flex justify-between items-center h-16 bg-[#f9f9ff] border-b border-[#dcc0bd] sticky top-0 z-40 gap-3 ${isMobile ? 'px-4' : 'px-6'}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative flex-1 max-w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#554240] text-[20px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`bg-[#f0f3ff] border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffb4aa] transition-all w-full ${isMobile ? '' : 'max-w-[256px]'}`}
              placeholder="Search jobs..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-[#554240] hover:bg-[#dce2f3] rounded-full transition-colors"
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
            className="p-2 text-[#554240] hover:bg-[#dce2f3] rounded-full transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* ── Content Body ────────────────────────────────────────────────────── */}
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
                  ? 'No pending jobs. You\'re all caught up!'
                  : `You have ${totalJobs} active job${totalJobs !== 1 ? 's' : ''} today.`}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid gap-3 sm:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          {[
            { label: 'Total Jobs',    value: loading ? '—' : totalJobs,       icon: 'assignment',      hoverBg: 'group-hover:bg-[#ffb4aa]', hoverColor: 'group-hover:text-[#210000]' },
            { label: 'Assigned',      value: loading ? '—' : assigned,        icon: 'person_add',      hoverBg: 'group-hover:bg-[#a0d3a6]', hoverColor: 'group-hover:text-[#396844]' },
            { label: 'In Progress',   value: loading ? '—' : inProgress,      icon: 'pending_actions', hoverBg: 'group-hover:bg-[#ffb77d]', hoverColor: 'group-hover:text-[#160700]' },
            { label: 'Done Today',    value: loading ? '—' : completedToday,  icon: 'task_alt',        hoverBg: 'group-hover:bg-[#b8ecbe]', hoverColor: 'group-hover:text-[#3e6d47]' },
          ].map(s => (
            <div key={s.label}
              className={`bg-white border border-[#dcc0bd] rounded-xl flex items-center hover:bg-[#f0f3ff] transition-colors group cursor-pointer ${isMobile ? 'p-4 gap-3' : 'p-6 gap-5'}`}
              onClick={() => navigate('/technician/my-jobs')}
            >
              <div className={`rounded-full bg-[#dce2f3] flex items-center justify-center text-[#554240] transition-colors flex-shrink-0 ${s.hoverBg} ${s.hoverColor} ${isMobile ? 'w-11 h-11' : 'w-14 h-14'}`}>
                <span className={`material-symbols-outlined ${isMobile ? 'text-[20px]' : 'text-[28px]'}`}>{s.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono text-[#554240] opacity-60 truncate">{s.label}</p>
                <h3 className={`font-bold text-[#151c27] ${isMobile ? 'text-xl' : 'text-2xl'}`}>{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Main Workspace */}
        <section className="space-y-4">
          <div className={`flex items-center justify-between border-b border-[#dcc0bd] pb-4 ${isMobile ? 'flex-col items-stretch gap-3' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#210000]">handyman</span>
              <h3 className="text-lg font-semibold text-[#151c27] uppercase tracking-tight">Active Jobs</h3>
            </div>
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              <button
                onClick={() => navigate('/technician/my-jobs')}
                className={`text-xs font-mono px-4 py-1.5 rounded bg-[#dce2f3] text-[#554240] hover:bg-[#cfd7ed] transition-colors ${isMobile ? 'flex-1' : ''}`}
              >
                View All
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`text-xs font-mono px-4 py-1.5 rounded border border-[#dcc0bd] text-[#554240] hover:bg-[#e7eefe] transition-colors flex items-center justify-center gap-1.5 ${isMobile ? 'flex-1' : ''}`}
              >
                <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 sm:gap-6 min-h-[400px]">

            {/* ── Left: Job list ──────────────────────────────────────────── */}
            {loading ? (
              <div className="col-span-12 lg:col-span-8 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[88px] bg-white border border-[#dcc0bd] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className={`col-span-12 lg:col-span-8 bg-white border border-[#dcc0bd] rounded-2xl flex flex-col items-center justify-center text-center ${isMobile ? 'p-6' : 'p-12'}`}>
                <div className="relative mb-6">
                  <div className={`rounded-full bg-[#e7eefe] flex items-center justify-center ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}`}>
                    <span className={`material-symbols-outlined text-[#d3daea] ${isMobile ? 'text-[48px]' : 'text-[64px]'}`}>check_circle</span>
                  </div>
                  <div className={`absolute -bottom-2 -right-2 bg-[#b8ecbe] rounded-full flex items-center justify-center border-4 border-white ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <span className="material-symbols-outlined text-[#396844] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-[#151c27] mb-2">All caught up!</h4>
                <p className="text-[#554240] text-base max-w-md mx-auto">
                  {search
                    ? 'No jobs match your search.'
                    : 'No active jobs assigned to you right now. New jobs from the admin will appear here.'}
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
                    className={`bg-white border border-[#dcc0bd] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow ${isMobile ? 'p-4' : 'p-6'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#e7eefe] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#554240]">build</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-[#554240]">#{job.id?.toString().slice(0, 8)}</span>
                        <h4 className="text-base font-bold text-[#151c27]">{job.title}</h4>
                        <p className="text-xs text-[#554240] mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {job.location}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${PRIORITY_STYLE[job.priority] || 'bg-[#dce2f3] text-[#554240]'}`}>
                            {job.priority}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLE[job.status] || 'bg-[#dce2f3] text-[#554240]'}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex gap-2 flex-shrink-0 ${isMobile ? 'w-full' : ''}`}>
                      {job.status === 'Approved' && (
                        <button
                          onClick={() => startJob(job)}
                          className={`px-4 py-2 bg-[#dce2f3] text-[#151c27] rounded-lg text-xs font-mono font-bold hover:bg-[#cfd7ed] transition-colors ${isMobile ? 'flex-1' : ''}`}
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
                        className={`px-4 py-2 border border-[#dcc0bd] text-[#554240] rounded-lg text-xs font-mono hover:bg-[#f0f3ff] transition-colors ${isMobile ? 'flex-1' : ''}`}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Right: Quick Links Panel ─────────────────────────────── */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className={`bg-[#f0f3ff] border border-[#dcc0bd] rounded-2xl h-full ${isMobile ? 'p-4' : 'p-6'}`}>
                <h5 className="text-lg font-semibold text-[#151c27] mb-6">Quick Links</h5>
                <div className="space-y-3">
                  {QUICK_LINKS.map(link => (
                    <button key={link.label} onClick={() => navigate(link.href)}
                      className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-[#dcc0bd] hover:border-[#210000] transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#554240] group-hover:text-[#210000] transition-colors">{link.icon}</span>
                        <span className="text-sm text-[#151c27]">{link.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-[#554240]">chevron_right</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-[#ffdad5] rounded-xl">
                  <p className="text-[#410001] text-xs font-mono font-bold mb-1">System Status</p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#396844] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#396844]" />
                    </span>
                    <span className="text-[#396844] text-xs font-bold">ALL SYSTEMS OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isMobile && <BottomNav />}

      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[60] bg-[#151c27] text-white px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap ${isMobile ? 'bottom-[76px]' : 'bottom-6'}`}>
          <span className="material-symbols-outlined text-[#b8ecbe] text-base">check_circle</span>
          {toast}
        </div>
      )}
    </main>
  )
}