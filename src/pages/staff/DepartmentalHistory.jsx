import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  Completed: 'bg-[#b8ecbe] text-[#3e6d47]',
  Assigned:  'bg-[#EEF2FF] text-[#4338CA]',
  Logged:    'bg-[#b8ecbe] text-[#3e6d47]',
  Emergency: 'bg-[#FEE2E2] text-[#ba1a1a]',
  Success:   'bg-[#b8ecbe] text-[#3e6d47]',
  Medium:    'bg-[#FEF3C7] text-[#92400E]',
  Pending:   'bg-[#dce2f3] text-[#554240]',
}

const ACTION_TYPES = ['All Types', 'Approval', 'Dispatch', 'Inventory', 'System Error', 'Backup', 'Security', 'Maintenance']
const RANGE_OPTIONS = ['Last 24h', '7 Days', '30 Days']

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function DepartmentalHistory() {
  const { profile } = useAuth()
  const navigate     = useNavigate()
  const isMobile     = useIsMobile()

  // Starts empty — populate from Supabase. No test data.
  const [logs, setLogs]         = useState([])
  const [activity, setActivity] = useState([]) // recent activity feed, derived from real logs ideally
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('All Types')
  const [range, setRange]       = useState('Last 24h')
  const [page, setPage]         = useState(1)
  const [toast, setToast]       = useState(null)

  const department = profile?.department ?? 'Facility Ops'
  const perPage = 6

  // ── filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l =>
      (typeFilter === 'All Types' || l.type === typeFilter) &&
      (l.type.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q))
    )
  }, [logs, search, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage    = Math.min(page, totalPages)
  const pageLogs    = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  // ── stats (live, no fabricated trend numbers) ──────────────────────────────
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const totalToday  = logs.filter(l => l.time.startsWith(today)).length
  const warnings    = logs.filter(l => l.status === 'Emergency' || l.status === 'Medium').length
  const successRate = logs.length === 0 ? '0.0' : (((logs.length - warnings) / logs.length) * 100).toFixed(1)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function exportLog() {
    const header = ['Timestamp', 'Action Type', 'Actor', 'Status', 'Details']
    const rows   = filtered.map(l => [l.time, l.type, l.actor, l.status, l.detail])
    const csv    = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob   = new Blob([csv], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a'); a.href = url; a.download = 'department-history.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Log exported as CSV.')
  }

  return (
    <main className="flex-1 min-h-screen bg-[#f9f9ff] flex flex-col">

      {/* ── Top App Bar ───────────────────────────────────────────────────── */}
      <header className={`h-16 flex justify-between items-center bg-[#f9f9ff] border-b border-[#dcc0bd] sticky top-0 z-40 gap-3 ${isMobile ? 'px-4' : 'px-6'}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {!isMobile && <h2 className="text-lg font-semibold text-[#151c27] whitespace-nowrap">Departmental History</h2>}
          {!isMobile && <div className="h-6 w-px bg-[#dcc0bd] mx-1" />}
          <div className="relative flex-1 max-w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#554240] text-[18px]">search</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className={`bg-[#f0f3ff] border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 transition-all w-full ${isMobile ? '' : 'max-w-[256px]'}`}
              placeholder="Search action log..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/staff/notifications')}
            className="p-2 hover:bg-[#e2e8f8] rounded-full text-[#554240] transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
          </button>
          {!isMobile && (
            <button className="p-2 hover:bg-[#e2e8f8] rounded-full text-[#554240] transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}
          {!isMobile && (
            <div className="w-8 h-8 rounded-full bg-[#bbefc1] flex items-center justify-center font-bold text-[#00210b] text-xs flex-shrink-0">
              {profile?.full_name?.[0] ?? 'S'}
            </div>
          )}
        </div>
      </header>

      {/* ── Content Body ──────────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-6 max-w-[1600px] w-full mx-auto flex-1 ${isMobile ? 'p-4' : 'p-8'}`}>

        <div className="mb-2">
          <h1 className={`font-bold text-[#151c27] ${isMobile ? 'text-xl' : 'text-2xl'}`}>{department} — Activity Log</h1>
          <p className="text-sm text-[#554240] mt-1">A complete record of actions and events within your department.</p>
        </div>

        {/* ── Summary Bento ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">

          {/* Log Summary Cards */}
          <div className={`col-span-12 lg:col-span-8 grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            <div className={`bg-white rounded-xl border border-[#dcc0bd] flex flex-col gap-2 ${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'col-span-2' : ''}`}>
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#210000] bg-[#210000]/10 p-2 rounded-full">history</span>
              </div>
              <p className="text-xs font-mono text-[#554240] opacity-60">Total Logs Today</p>
              <h3 className="text-2xl font-bold text-[#151c27]">{totalToday}</h3>
            </div>
            <div className={`bg-white rounded-xl border border-[#dcc0bd] flex flex-col gap-2 ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#ba1a1a] bg-[#ba1a1a]/10 p-2 rounded-full">warning</span>
                <span className="text-xs font-mono text-[#ba1a1a] font-bold">{warnings > 0 ? `${warnings} active` : 'None'}</span>
              </div>
              <p className="text-xs font-mono text-[#554240] opacity-60">Department Warnings</p>
              <h3 className="text-2xl font-bold text-[#151c27]">{warnings}</h3>
            </div>
            <div className={`bg-white rounded-xl border border-[#dcc0bd] flex flex-col gap-2 ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-[#396844] bg-[#396844]/10 p-2 rounded-full">check_circle</span>
              </div>
              <p className="text-xs font-mono text-[#554240] opacity-60">Action Success Rate</p>
              <h3 className="text-2xl font-bold text-[#151c27]">{successRate}%</h3>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-xl border border-[#dcc0bd]">
            <h4 className="text-xs font-mono font-bold mb-4 text-[#554240]">Historical Range</h4>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {RANGE_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => { setRange(r); showToast(`Showing logs from ${r.toLowerCase()}.`) }}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors ${
                      range === r ? 'bg-[#4a0404] text-white' : 'border border-[#dcc0bd] hover:bg-[#f0f3ff] text-[#151c27]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <select
                value={typeFilter}
                onChange={e => { setType(e.target.value); setPage(1) }}
                className="w-full flex items-center justify-between px-4 py-2 border border-[#dcc0bd] rounded-lg text-xs font-mono bg-white focus:outline-none cursor-pointer"
              >
                {ACTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Timeline + Log Table ─────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Activity Timeline */}
          <div className={`col-span-12 xl:col-span-4 bg-white rounded-xl border border-[#dcc0bd] h-fit xl:sticky xl:top-24 ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg font-semibold text-[#151c27]">Activity Timeline</h3>
            </div>

            {activity.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-[#dcc0bd] block mb-2">history_toggle_off</span>
                <p className="text-sm text-[#554240]">No recent activity yet.</p>
              </div>
            ) : (
              <div className="relative flex flex-col gap-8">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#dcc0bd]/50" />
                {activity.map(item => (
                  <div key={item.id} className="relative pl-12">
                    <div className={`absolute left-0 top-0 w-10 h-10 ${item.iconBg} ${item.iconColor} flex items-center justify-center rounded-full z-10`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: item.filled ? "'FILL' 1" : "'FILL' 0" }}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-[#151c27]">{item.label}</span>
                      <p className="text-sm text-[#554240]">{item.desc}</p>
                      <span className="text-xs font-mono text-[#554240]/50 mt-1">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Action Log */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#dcc0bd] overflow-hidden">
              <div className={`border-b border-[#dcc0bd] flex justify-between items-center ${isMobile ? 'p-4' : 'p-6'}`}>
                <h3 className="text-lg font-semibold text-[#151c27]">Detailed Action Log</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSearch(''); setType('All Types'); setPage(1) }}
                    className="p-2 border border-[#dcc0bd] rounded-lg hover:bg-[#f0f3ff] transition-colors"
                    title="Clear filters"
                  >
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                  </button>
                  <button
                    onClick={exportLog}
                    className="p-2 border border-[#dcc0bd] rounded-lg hover:bg-[#f0f3ff] transition-colors"
                    title="Export CSV"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>

              {isMobile ? (
                <div>
                  {pageLogs.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-[#554240]">
                      {logs.length === 0 ? 'No log entries yet.' : 'No log entries match your filters.'}
                    </div>
                  ) : pageLogs.map(l => (
                    <div key={l.id} className={`p-4 border-t border-[#dcc0bd] ${l.flagged ? 'bg-red-50/30' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full ${l.avatarBg} ${l.avatarText} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>{l.initials}</div>
                        <span className="text-sm font-bold text-[#151c27] flex-1">{l.actor}</span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATUS_BADGE[l.status] ?? 'bg-[#dce2f3] text-[#554240]'}`}>{l.status}</span>
                      </div>
                      <p className="text-xs text-[#554240] mb-1">{l.detail}</p>
                      <div className="flex gap-2 text-[11px] font-mono text-[#554240]/60">
                        <span>{l.type}</span>
                        <span>•</span>
                        <span>{l.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#f0f3ff]">
                      <tr>
                        {['Timestamp', 'Action Type', 'User / Actor', 'Status', 'Details'].map(h => (
                          <th key={h} className="px-6 py-4 text-xs font-mono text-[#554240]/60">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dcc0bd]">
                      {pageLogs.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[#554240]">
                          {logs.length === 0 ? 'No log entries yet.' : 'No log entries match your filters.'}
                        </td></tr>
                      )}
                      {pageLogs.map(l => (
                        <tr key={l.id} className={`hover:bg-[#f9f9ff] transition-colors cursor-pointer ${l.flagged ? 'bg-red-50/30' : ''}`}>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-[#151c27]">{l.time}</td>
                          <td className="px-6 py-4 text-sm font-bold text-[#151c27]">{l.type}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${l.avatarBg} ${l.avatarText} flex items-center justify-center text-[10px] font-bold`}>{l.initials}</div>
                              <span className="text-sm text-[#151c27]">{l.actor}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_BADGE[l.status] ?? 'bg-[#dce2f3] text-[#554240]'}`}>{l.status}</span>
                          </td>
                          <td className="px-6 py-4 text-sm max-w-xs truncate text-[#554240]">{l.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className={`border-t border-[#dcc0bd] flex justify-between items-center bg-[#f0f3ff] flex-wrap gap-2 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <span className="text-xs font-mono text-[#554240] opacity-60">
                    Showing {pageLogs.length === 0 ? 0 : (safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, filtered.length)} of {filtered.length} entries
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-3 py-1 border border-[#dcc0bd] rounded bg-white text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f9f9ff] transition-colors"
                    >
                      {isMobile ? '‹' : 'Previous'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                          p === safePage ? 'bg-[#4a0404] text-white' : 'border border-[#dcc0bd] bg-white hover:bg-[#f9f9ff]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="px-3 py-1 border border-[#dcc0bd] rounded bg-white text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f9f9ff] transition-colors"
                    >
                      {isMobile ? '›' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Operational Health Snapshot — hidden on mobile, decorative only */}
            {!isMobile && (
              <div className="bg-white rounded-xl border border-[#dcc0bd] p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-semibold text-[#151c27]">Operational Health Snapshot</h4>
                  <select className="bg-[#f0f3ff] border-none rounded-lg text-xs font-mono px-4 py-2 focus:outline-none cursor-pointer">
                    <option>Weekly View</option>
                    <option>Monthly View</option>
                  </select>
                </div>
                {logs.length === 0 ? (
                  <div className="h-48 w-full flex flex-col items-center justify-center bg-[#e7eefe] rounded-lg text-[#554240]">
                    <span className="material-symbols-outlined text-4xl text-[#210000]/20 mb-2">bar_chart</span>
                    <p className="text-xs font-mono opacity-60">No activity data yet to chart.</p>
                  </div>
                ) : (
                  <div className="h-48 w-full relative overflow-hidden bg-[#e7eefe] rounded-lg">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-xs font-mono font-bold opacity-30 select-none">DEPARTMENT ACTIVITY METRIC OVERVIEW</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className={`mt-auto border-t border-[#dcc0bd] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono opacity-60 ${isMobile ? 'py-4 px-4 pb-[76px]' : 'py-6 px-6'}`}>
        <p>© 2026 AATU Infrastructure Management. All rights reserved.</p>
        <div className="flex gap-6">
          <button className="hover:text-[#210000] transition-colors">Privacy Policy</button>
          <button className="hover:text-[#210000] transition-colors">Terms of Service</button>
          <button className="hover:text-[#210000] transition-colors">Help Desk</button>
        </div>
      </footer>

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