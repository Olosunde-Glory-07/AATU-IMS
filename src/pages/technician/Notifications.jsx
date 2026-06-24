import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Emergency:    { iconBg: 'bg-[#ffdad6]', iconColor: 'text-[#ba1a1a]', icon: 'emergency',    border: 'bg-[#ba1a1a]', badge: 'bg-[#ffdad6] text-[#ba1a1a]' },
  Assigned:     { iconBg: 'bg-[#b8ecbe]', iconColor: 'text-[#3e6d47]', icon: 'assignment',   border: 'bg-[#396844]', badge: 'bg-[#b8ecbe] text-[#3e6d47]' },
  StatusUpdate: { iconBg: 'bg-[#e2e8f8]', iconColor: 'text-[#4338ca]', icon: 'update',       border: 'bg-[#6366f1]', badge: 'bg-[#EEF2FF] text-[#4338ca]' },
  Completed:    { iconBg: 'bg-[#b8ecbe]', iconColor: 'text-[#396844]', icon: 'check_circle', border: 'bg-[#a0d3a6]', badge: 'bg-[#b8ecbe] text-[#3e6d47]' },
  NewRequest:   { iconBg: 'bg-[#ffdcc3]', iconColor: 'text-[#6e3900]', icon: 'inbox',        border: 'bg-[#ffb77d]', badge: 'bg-[#ffdcc3] text-[#6e3900]' },
  Message:      { iconBg: 'bg-white border border-[#dcc0bd]', iconColor: 'text-[#d26a5f]', icon: 'mail', border: null, badge: 'bg-[#e2e8f8] text-[#554240]' },
  Memo:         { iconBg: 'bg-[#e2e8f8]', iconColor: 'text-[#554240]', icon: 'info',         border: null, badge: 'bg-[#e2e8f8] text-[#554240]' },
}

const FILTER_TABS = ['All', 'Assigned', 'Completed', 'StatusUpdate', 'Emergency']

const NAV_ITEMS = [
  { icon: 'space_dashboard', label: 'Dashboard',     href: '/technician/dashboard'     },
  { icon: 'assignment',      label: 'My Jobs',       href: '/technician/my-jobs'       },
  { icon: 'notifications',   label: 'Notifications', href: '/technician/notifications' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isRecent(iso) {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() < 86400000 * 2 // within 2 days
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
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

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ prefs, onChange, onClose }) {
  const TOGGLES = [
    { key: 'job_assigned',    label: 'Job Assignments',     desc: 'When admin assigns a new job to you'         },
    { key: 'job_completed',   label: 'Job Completions',     desc: 'When a job you worked on is marked complete'  },
    { key: 'status_updates',  label: 'Status Updates',      desc: 'When the status of a job order changes'      },
    { key: 'emergency_alerts',label: 'Emergency Alerts',    desc: 'High-priority and emergency job assignments'  },
    { key: 'admin_messages',  label: 'Admin Messages',      desc: 'Direct messages and memos from admin'         },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[110]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-[111] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#dcc0bd]">
          <div>
            <h3 className="font-bold text-[#151c27] text-lg">Notification Settings</h3>
            <p className="text-xs text-[#554240] mt-0.5">Choose what alerts you receive</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f0f3ff] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px] text-[#554240]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {TOGGLES.map(t => (
            <div key={t.key} className="flex items-center justify-between p-4 bg-[#f9f9ff] border border-[#dcc0bd] rounded-xl gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#151c27]">{t.label}</p>
                <p className="text-xs text-[#554240] mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => onChange(t.key, !prefs[t.key])}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${prefs[t.key] ? 'bg-[#4a0404]' : 'bg-[#dcc0bd]'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${prefs[t.key] ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-[#dcc0bd]">
          <p className="text-xs text-[#554240] text-center">
            Settings are saved automatically to your profile.
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TechnicianNotifications() {
  const navigate    = useNavigate()
  const isMobile    = useIsMobile()
  const { user }    = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState('All')
  const [search,        setSearch]        = useState('')
  const [toast,         setToast]         = useState(null)
  const [settingsOpen,  setSettingsOpen]  = useState(false)

  // Notification preferences — loaded from profiles.notification_prefs
  const [prefs, setPrefs] = useState({
    job_assigned:     true,
    job_completed:    true,
    status_updates:   true,
    emergency_alerts: true,
    admin_messages:   true,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  // ── Load notification prefs from profiles ────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('notification_prefs')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_prefs) {
          setPrefs(p => ({ ...p, ...data.notification_prefs }))
        }
      })
  }, [user])

  // ── Save pref toggle to Supabase ─────────────────────────────────────────
  async function handlePrefChange(key, value) {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    await supabase
      .from('profiles')
      .update({ notification_prefs: updated })
      .eq('id', user.id)
    showToast(`${value ? 'Enabled' : 'Disabled'}: ${key.replace(/_/g, ' ')}`)
  }

  // ── Fetch notifications from Supabase ────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data ?? [])
    } catch (err) {
      console.error('Fetch notifications error:', err)
      showToast('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // ── Real-time: new notifications appear instantly ────────────────────────
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('technician-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
        showToast(payload.new.title)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  async function markAllRead() {
    if (unreadCount === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    showToast('All notifications marked as read.')
  }

  async function dismiss(id) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
    showToast('Notification dismissed.')
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notifications.filter(n =>
      (tab === 'All' || n.type === tab) &&
      (n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q))
    )
  }, [notifications, tab, search])

  const recent  = filtered.filter(n =>  isRecent(n.created_at))
  const earlier = filtered.filter(n => !isRecent(n.created_at))

  // ── Notification Card ─────────────────────────────────────────────────────
  function NotifCard({ n }) {
    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.Memo

    // Derive action buttons from notification type
    const actions = []
    if (n.type === 'Assigned') {
      actions.push({ label: 'View Job', primary: true, href: '/technician/my-jobs' })
    } else if (n.type === 'Emergency') {
      actions.push({ label: 'Acknowledge', primary: true, type: 'ack' })
      actions.push({ label: 'View Job',    primary: false, href: '/technician/my-jobs' })
    } else if (n.type === 'StatusUpdate' || n.type === 'Completed') {
      actions.push({ label: 'View Details', primary: true, href: '/technician/my-jobs' })
    }

    function handleAction(action) {
      markRead(n.id)
      if (action.href) { navigate(action.href); return }
      if (action.type === 'ack') showToast('Emergency acknowledged.')
    }

    return (
      <div
        onClick={() => markRead(n.id)}
        className={`bg-white border border-[#dcc0bd] rounded-lg flex gap-4 items-start hover:border-[#4a0404]/40 transition-all group relative overflow-hidden cursor-pointer
          ${isMobile ? 'p-3.5 flex-col' : 'p-4'} ${n.read ? 'opacity-70' : ''}`}
      >
        {cfg.border && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.border}`} />}

        <div className={`flex gap-4 w-full`}>
          {/* Icon */}
          <div className={`flex-shrink-0 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ${cfg.iconBg} rounded-full flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${cfg.iconColor} ${isMobile ? 'text-[20px]' : ''}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className={`flex justify-between items-start mb-1 gap-3 ${isMobile ? 'flex-col gap-1' : ''}`}>
              <div className="flex items-center gap-2">
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#4a0404] flex-shrink-0" />}
                <h4 className={`font-bold text-[#151c27] ${isMobile ? 'text-sm' : 'text-base'}`}>{n.title}</h4>
              </div>
              <span className="text-xs text-[#554240] font-medium flex-shrink-0">{timeAgo(n.created_at)}</span>
            </div>
            <p className={`text-[#554240] max-w-3xl ${isMobile ? 'text-xs mb-3' : 'text-sm mb-4'}`}>{n.body}</p>

            {actions.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
                {actions.map(a => (
                  <button key={a.label} onClick={() => handleAction(a)}
                    className={`text-xs font-bold rounded uppercase tracking-wide transition-all ${isMobile ? 'px-4 py-1.5 flex-1' : 'px-6 py-2'} ${
                      a.primary
                        ? n.type === 'Emergency'
                          ? 'bg-[#ba1a1a] text-white hover:brightness-110'
                          : 'bg-[#4a0404] text-white hover:opacity-90'
                        : 'border border-[#89726f] text-[#554240] hover:bg-[#e2e8f8]'
                    }`}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: badge + dismiss */}
          {!isMobile && (
            <div className="flex flex-col items-end flex-shrink-0" onClick={e => e.stopPropagation()}>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm mb-2 ${cfg.badge}`}>{n.type}</span>
              <button onClick={() => dismiss(n.id)}
                className="text-[#89726f] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile: badge + dismiss footer */}
        {isMobile && (
          <div className="flex items-center justify-between w-full mt-1 pl-[56px]" onClick={e => e.stopPropagation()}>
            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${cfg.badge}`}>{n.type}</span>
            <button onClick={() => dismiss(n.id)} className="text-[#89726f] p-1">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <main className={`flex-1 min-h-screen bg-[#f9f9ff] ${isMobile ? 'pb-[60px]' : ''}`}>

      {/* ── Top App Bar ───────────────────────────────────────────────────── */}
      <header className={`h-16 flex justify-between items-center bg-[#f9f9ff]/90 backdrop-blur border-b border-[#dcc0bd] sticky top-0 z-40 gap-3 ${isMobile ? 'px-4' : 'px-6'}`}>
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#554240] text-[18px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#f0f3ff] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20"
            placeholder="Search notifications..."
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/technician/dashboard')}
            className={`bg-[#4a0404] text-white rounded-lg text-xs font-mono hover:opacity-90 transition-opacity flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}
          >
            {isMobile ? 'Home' : 'Dashboard'}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-[#554240] hover:text-[#210000] hover:bg-[#e2e8f8] rounded-full transition-colors"
            title="Notification Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#4a0404] text-white text-[10px] font-bold font-mono flex-shrink-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </header>

      {/* ── Main Canvas ───────────────────────────────────────────────────── */}
      <div className={`max-w-[1600px] mx-auto ${isMobile ? 'px-4 py-6' : 'px-8 py-10'}`}>

        {/* Hero */}
        <section className={`mb-6 relative rounded-xl overflow-hidden flex items-end text-white shadow-lg ${isMobile ? 'h-32 p-5' : 'h-48 p-8'}`}>
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80')" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          <div className="relative z-10">
            <h3 className={`font-bold mb-1 ${isMobile ? 'text-xl' : 'text-3xl'}`}>Service Alerts</h3>
            <p className={isMobile ? 'text-sm opacity-90' : 'text-base opacity-90'}>
              Your latest job assignments and facility alerts.
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-xs font-bold">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Filters + Mark all read */}
        <div className={`flex gap-4 mb-4 ${isMobile ? 'flex-col' : 'flex-wrap items-center justify-between'}`}>
          <div className={`flex gap-2 ${isMobile ? 'overflow-x-auto -mx-4 px-4 pb-1' : ''}`}>
            {FILTER_TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex-shrink-0 ${
                  tab === t ? 'bg-[#4a0404] text-white' : 'bg-[#e2e8f8] text-[#554240] hover:bg-[#dcc0bd]'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchNotifications}
              className="text-[#554240] text-sm flex items-center gap-1 hover:text-[#210000] transition-colors">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              {!isMobile && 'Refresh'}
            </button>
            <button onClick={markAllRead} disabled={unreadCount === 0}
              className="text-[#d26a5f] font-bold text-sm flex items-center gap-1 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline">
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              Mark all read
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            // Skeleton
            [1,2,3].map(i => (
              <div key={i} className="h-[96px] bg-white border border-[#dcc0bd] rounded-lg animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[#554240]">
              <span className="material-symbols-outlined text-6xl opacity-20 mb-4">notifications_none</span>
              <p className="text-lg font-semibold">You're all caught up!</p>
              <p className="text-sm max-w-xs mt-1">
                {search || tab !== 'All'
                  ? 'No notifications match your filter.'
                  : 'No notifications yet. New job assignments will appear here.'}
              </p>
              {(search || tab !== 'All') && (
                <button onClick={() => { setSearch(''); setTab('All') }}
                  className="mt-3 text-xs font-mono text-[#4a0404] underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <div className="py-2">
                    <span className="text-xs text-[#89726f] font-bold uppercase tracking-widest">Recent</span>
                  </div>
                  {recent.map(n => <NotifCard key={n.id} n={n} />)}
                </>
              )}
              {earlier.length > 0 && (
                <>
                  <div className="py-4 border-b border-[#dcc0bd]/30 mt-2">
                    <span className="text-xs text-[#89726f] font-bold uppercase tracking-widest">Earlier</span>
                  </div>
                  {earlier.map(n => <NotifCard key={n.id} n={n} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isMobile && <BottomNav />}

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          prefs={prefs}
          onChange={handlePrefChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[60] bg-[#151c27] text-white px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap ${isMobile ? 'bottom-[76px]' : 'bottom-6'}`}>
          <span className="material-symbols-outlined text-[#b8ecbe] text-base">check_circle</span>
          {toast}
        </div>
      )}
    </main>
  )
}