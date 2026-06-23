import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  Emergency:  { iconBg: 'bg-[#ffdad6]', iconColor: 'text-[#ba1a1a]', icon: 'emergency',     border: 'bg-[#ba1a1a]',     badge: 'bg-[#ffdad6] text-[#ba1a1a]' },
  Assigned:   { iconBg: 'bg-[#b8ecbe]', iconColor: 'text-[#3e6d47]', icon: 'assignment',    border: 'bg-[#396844]',     badge: 'bg-[#b8ecbe] text-[#3e6d47]' },
  Message:    { iconBg: 'bg-white border border-[#dcc0bd]', iconColor: 'text-[#d26a5f]', icon: 'mail', border: null,    badge: 'bg-[#e2e8f8] text-[#554240]' },
  Completed:  { iconBg: 'bg-[#b8ecbe]', iconColor: 'text-[#396844]', icon: 'check_circle',  border: 'bg-[#a0d3a6]',     badge: 'bg-[#b8ecbe] text-[#3e6d47]' },
  Memo:       { iconBg: 'bg-[#e2e8f8]', iconColor: 'text-[#554240]', icon: 'info',          border: null,                badge: 'bg-[#e2e8f8] text-[#554240]' },
}

const FILTER_TABS = ['All', 'Emergency', 'Job Orders', 'Admin']

const NAV_ITEMS = [
  { icon: 'space_dashboard', label: 'Dashboard',     href: '/technician/dashboard' },
  { icon: 'assignment',      label: 'My Jobs',       href: '/technician/my-jobs' },
  { icon: 'notifications',   label: 'Notifications', href: '/technician/notifications' },
]

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-[#dcc0bd] flex h-[60px]">
      {NAV_ITEMS.map(item => (
        <button
          key={item.label}
          onClick={() => navigate(item.href)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide text-[#554240]"
        >
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TechnicianNotifications() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Starts empty — populate from Supabase. No test data.
  const [notifications, setNotifications] = useState([])
  const [tab, setTab]       = useState('All')
  const [search, setSearch] = useState('')
  const [toast, setToast]   = useState(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // ── filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return notifications.filter(n =>
      (tab === 'All' || n.group === tab || (tab === 'Emergency' && n.type === 'Emergency')) &&
      n.title.toLowerCase().includes(q)
    )
  }, [notifications, tab, search])

  const recent  = filtered.filter(n => n.time !== '3 days ago')
  const earlier = filtered.filter(n => n.time === '3 days ago')

  // ── helpers ────────────────────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    showToast('All notifications marked as read.')
  }

  function dismiss(id) {
    setNotifications(prev => prev.filter(n => n.id !== id))
    showToast('Notification dismissed.')
  }

  function handleAction(n, action) {
    markRead(n.id)
    if (action.href) { navigate(action.href); return }
    switch (action.type) {
      case 'ack':         showToast('Emergency acknowledged. Dispatch notified.'); break
      case 'map':         showToast('Opening location on map...'); break
      case 'reschedule':  showToast('Reschedule request sent to admin.'); break
      case 'reply':       showToast('Reply window opened.'); break
      default:            showToast('Action completed.')
    }
  }

  function NotifCard({ n }) {
    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.Memo
    return (
      <div
        onClick={() => markRead(n.id)}
        className={`bg-white border border-[#dcc0bd] rounded-lg flex gap-4 items-start hover:border-[#4a0404]/40 transition-all group relative overflow-hidden cursor-pointer
          ${isMobile ? 'p-3.5 flex-col' : 'p-4'} ${n.read ? 'opacity-70' : ''}`}
      >
        {cfg.border && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.border}`} />}

        <div className={`flex gap-4 w-full ${isMobile ? '' : ''}`}>
          {/* Icon */}
          <div className={`flex-shrink-0 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} ${cfg.iconBg} rounded-full flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${cfg.iconColor} ${isMobile ? 'text-[20px]' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className={`flex justify-between items-start mb-1 gap-3 ${isMobile ? 'flex-col gap-1' : ''}`}>
              <div className="flex items-center gap-2">
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#4a0404] flex-shrink-0" />}
                <h4 className={`font-bold text-[#151c27] ${isMobile ? 'text-sm' : 'text-base'}`}>{n.title}</h4>
              </div>
              <span className="text-xs text-[#554240] font-medium flex-shrink-0">{n.time}</span>
            </div>
            <p className={`text-[#554240] max-w-3xl ${isMobile ? 'text-xs mb-3' : 'text-sm mb-4'}`}>{n.body}</p>

            {n.actions.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
                {n.actions.map(a => (
                  <button
                    key={a.label}
                    onClick={() => handleAction(n, a)}
                    className={`text-xs sm:text-sm font-bold rounded uppercase tracking-wide transition-all ${isMobile ? 'px-4 py-1.5 flex-1' : 'px-6 py-2'} ${
                      a.primary
                        ? n.type === 'Emergency'
                          ? 'bg-[#ba1a1a] text-white hover:brightness-110'
                          : 'bg-[#4a0404] text-white hover:opacity-90'
                        : 'border border-[#89726f] text-[#554240] hover:bg-[#e2e8f8]'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column: badge + dismiss — desktop only, mobile moves these below */}
          {!isMobile && (
            <div className="flex flex-col items-end" onClick={e => e.stopPropagation()}>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm mb-2 ${cfg.badge}`}>{n.type}</span>
              <button
                onClick={() => dismiss(n.id)}
                className="text-[#89726f] hover:text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile: badge + dismiss as a footer row since hover doesn't exist on touch */}
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
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button
            onClick={() => navigate('/technician/dashboard')}
            className={`bg-[#4a0404] text-white rounded-lg text-xs font-mono hover:opacity-90 transition-opacity flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}
          >
            {isMobile ? 'Report' : 'Report Issue'}
          </button>
          {!isMobile && (
            <button className="p-2 text-[#554240] hover:text-[#210000] transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}
          {!isMobile && (
            <div className="w-10 h-10 rounded-full bg-[#ffdad5] border-2 border-[#dcc0bd] flex items-center justify-center font-bold text-[#4a0404] text-sm flex-shrink-0">
              T
            </div>
          )}
        </div>
      </header>

      {/* ── Main Canvas ───────────────────────────────────────────────────── */}
      <div className={`max-w-[1600px] mx-auto ${isMobile ? 'px-4 py-6' : 'px-8 py-10'}`}>

        {/* Hero header */}
        <section className={`mb-6 relative rounded-xl overflow-hidden flex items-end text-white shadow-lg ${isMobile ? 'h-32 p-5' : 'h-48 p-8'}`}>
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          <div className="relative z-10">
            <h3 className={`font-bold mb-1 ${isMobile ? 'text-xl' : 'text-3xl'}`}>Service Alerts</h3>
            <p className={isMobile ? 'text-sm opacity-90' : 'text-base opacity-90'}>
              Review your latest job assignments and critical facility alerts.
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-xs font-bold">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Filters & Actions */}
        <div className={`flex gap-4 mb-4 ${isMobile ? 'flex-col' : 'flex-wrap items-center justify-between'}`}>
          <div className={`flex gap-2 ${isMobile ? 'overflow-x-auto -mx-4 px-4 pb-1' : ''}`}>
            {FILTER_TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex-shrink-0 ${
                  tab === t ? 'bg-[#4a0404] text-white' : 'bg-[#e2e8f8] text-[#554240] hover:bg-[#dcc0bd]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="text-[#d26a5f] font-bold text-sm flex items-center gap-1 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark all as read
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[#554240]">
              <span className="material-symbols-outlined text-6xl opacity-20 mb-4 animate-pulse">notifications_none</span>
              <p className="text-lg font-semibold">You're all caught up!</p>
              <p className="text-sm max-w-xs">No new notifications to show right now. We'll let you know when something comes up.</p>
              {(search || tab !== 'All') && (
                <button onClick={() => { setSearch(''); setTab('All') }} className="mt-3 text-xs font-mono text-[#4a0404] underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {recent.map(n => <NotifCard key={n.id} n={n} />)}

              {earlier.length > 0 && (
                <>
                  <div className="py-4 border-b border-[#dcc0bd]/30 mt-2">
                    <span className="text-xs text-[#89726f] font-bold uppercase tracking-widest">Earlier this week</span>
                  </div>
                  {earlier.map(n => <NotifCard key={n.id} n={n} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile bottom tab bar ──────────────────────────────────────────── */}
      {isMobile && <BottomNav />}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[60] bg-[#151c27] text-white px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap ${isMobile ? 'bottom-[76px]' : 'bottom-6'}`}>
          <span className="material-symbols-outlined text-[#b8ecbe] text-base">check_circle</span>
          {toast}
        </div>
      )}
    </main>
  )
}