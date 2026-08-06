import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  Completed:    'bg-secondary-container text-on-secondary-container',
  Assigned:     'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
  'In Progress':'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
  Logged:       'bg-secondary-container text-on-secondary-container',
  Emergency:    'bg-red-100 dark:bg-red-950 text-error',
  Success:      'bg-secondary-container text-on-secondary-container',
  Medium:       'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
  Pending:      'bg-surface-container-highest text-on-surface-variant',
  Cancelled:    'bg-surface-container-highest text-on-surface-variant',
}

const RANGE_OPTIONS = ['Last 24h', '7 Days', '30 Days']

// Role-based avatar coloring so each role is visually distinct
const ROLE_AVATAR = {
  hod:        { bg: 'bg-blue-100 dark:bg-blue-950',     text: 'text-blue-800 dark:text-blue-200' },
  dean:       { bg: 'bg-blue-100 dark:bg-blue-950',     text: 'text-blue-800 dark:text-blue-200' },
  staff:      { bg: 'bg-secondary-container',            text: 'text-on-secondary-container' },
  technician: { bg: 'bg-orange-100 dark:bg-orange-950',  text: 'text-orange-800 dark:text-orange-200' },
  admin:      { bg: 'bg-red-100 dark:bg-red-950',        text: 'text-red-900 dark:text-red-200' },
}

function rangeToDate(range) {
  const now = new Date()
  if (range === 'Last 24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (range === '7 Days')   return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 Days
}

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

  const [logs, setLogs]         = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('All Types')
  const [range, setRange]       = useState('Last 24h')
  const [page, setPage]         = useState(1)
  const [toast, setToast]       = useState(null)

  const department = profile?.department ?? null
  const perPage = 6

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch department history — both requester and staff submitted requests ──
  const fetchHistory = useCallback(async () => {
    if (!department) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id, title, description, category, priority, status,
          location, department, created_at, updated_at,
          created_by, assigned_technician_id,
          reporter:profiles!requests_created_by_fkey ( full_name, role ),
          technician:profiles!requests_assigned_technician_id_fkey ( full_name )
        `)
        .eq('department', department)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Departmental history fetch error:', error)
        showToast(`Failed to load history: ${error.message}`)
        return
      }

      const mapped = (data ?? []).map(r => {
        const actorName = r.reporter?.full_name ?? 'Unknown'
        const actorRole = r.reporter?.role ?? 'user'
        const initials  = actorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const avatar    = ROLE_AVATAR[actorRole] ?? { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' }
        const roleLabel = actorRole === 'hod' ? 'HOD' : actorRole === 'dean' ? 'Dean' : actorRole === 'staff' ? 'Staff' : actorRole === 'admin' ? 'Admin' : actorRole

        return {
          id:         r.id,
          rawDate:    r.created_at,
          time:       new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type:       r.category || 'Other',
          actor:      `${actorName} (${roleLabel})`,
          status:     r.status,
          detail:     r.description ? `${r.title} — ${r.description}` : r.title,
          initials,
          avatarBg:   avatar.bg,
          avatarText: avatar.text,
          flagged:    r.priority === 'Emergency',
          technician: r.technician?.full_name ?? null,
        }
      })

      setLogs(mapped)

      // Recent activity feed — top 6 most recent entries
      setActivity(mapped.slice(0, 6).map(m => ({
        id:       m.id,
        label:    m.type,
        desc:     `${m.actor} — ${m.status}`,
        time:     m.time,
        icon:     m.flagged ? 'emergency' : m.status === 'Completed' ? 'check_circle' : 'assignment',
        iconBg:   m.flagged ? 'bg-error/10' : m.status === 'Completed' ? 'bg-secondary/10' : 'bg-primary/10',
        iconColor:m.flagged ? 'text-error' : m.status === 'Completed' ? 'text-secondary' : 'text-primary',
        filled:   m.status === 'Completed',
      })))
    } catch (err) {
      console.error('Unexpected departmental history error:', err)
      showToast('Failed to load department history.')
    } finally {
      setLoading(false)
    }
  }, [department])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // ── Real-time: updates when new requests come in for this department ─────
  useEffect(() => {
    if (!department) return
    const channel = supabase
      .channel('staff-dept-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `department=eq.${department}` }, () => fetchHistory())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [department, fetchHistory])

  // Dynamic type filter options — built from whatever categories actually exist
  const actionTypes = useMemo(() => {
    const unique = Array.from(new Set(logs.map(l => l.type))).sort()
    return ['All Types', ...unique]
  }, [logs])

  // ── filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const since = rangeToDate(range)
    return logs.filter(l =>
      (typeFilter === 'All Types' || l.type === typeFilter) &&
      new Date(l.rawDate) >= since &&
      (l.type.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q))
    )
  }, [logs, search, typeFilter, range])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage    = Math.min(page, totalPages)
  const pageLogs    = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  // ── stats (live, derived from real data) ───────────────────────────────────
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const totalToday  = logs.filter(l => l.time.startsWith(today)).length
  const warnings    = logs.filter(l => l.status === 'Emergency' || l.flagged).length
  const successRate = logs.length === 0 ? '0.0' : (((logs.length - warnings) / logs.length) * 100).toFixed(1)

  function exportLog() {
    const header = ['Timestamp', 'Category', 'Actor', 'Status', 'Details']
    const rows   = filtered.map(l => [l.time, l.type, l.actor, l.status, l.detail])
    const csv    = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob   = new Blob([csv], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a'); a.href = url; a.download = 'department-history.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Log exported as CSV.')
  }

  return (
    <main className="flex-1 min-h-screen bg-surface flex flex-col">

      {/* ── Top App Bar ───────────────────────────────────────────────────── */}
      <header className={`h-16 flex justify-between items-center bg-surface border-b border-outline-variant sticky top-0 z-40 gap-3 ${isMobile ? 'px-4' : 'px-6'}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {!isMobile && <h2 className="text-lg font-semibold text-on-surface whitespace-nowrap">Departmental History</h2>}
          {!isMobile && <div className="h-6 w-px bg-outline-variant mx-1" />}
          <div className="relative flex-1 max-w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className={`bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all w-full ${isMobile ? '' : 'max-w-[256px]'}`}
              placeholder="Search action log..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/staff/notifications')}
            className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          </button>
          {!isMobile && (
            <button className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}
          {!isMobile && (
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed text-xs flex-shrink-0">
              {profile?.full_name?.[0] ?? 'S'}
            </div>
          )}
        </div>
      </header>

      {/* ── Content Body ──────────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-6 max-w-[1600px] w-full mx-auto flex-1 ${isMobile ? 'p-4' : 'p-8'}`}>

        <div className="mb-2">
          <h1 className={`font-bold text-on-surface ${isMobile ? 'text-xl' : 'text-2xl'}`}>{department ?? 'Your Department'} — Activity Log</h1>
          <p className="text-sm text-on-surface-variant mt-1">A complete record of maintenance requests filed by HODs, Deans, and staff in your department.</p>
        </div>

        {!department && (
          <div className="bg-error-container/40 border border-error-container rounded-xl p-4 text-sm text-on-error-container">
            Your profile doesn't have a department set, so no history can be shown. Contact an admin to update your department.
          </div>
        )}

        {/* ── Summary Bento ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">

          {/* Log Summary Cards */}
          <div className={`col-span-12 lg:col-span-8 grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col gap-2 ${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'col-span-2' : ''}`}>
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-full">history</span>
              </div>
              <p className="text-xs font-mono text-on-surface-variant opacity-60">Total Logs Today</p>
              <h3 className="text-2xl font-bold text-on-surface">{loading ? '—' : totalToday}</h3>
            </div>
            <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col gap-2 ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-error bg-error/10 p-2 rounded-full">warning</span>
                <span className="text-xs font-mono text-error font-bold">{warnings > 0 ? `${warnings} active` : 'None'}</span>
              </div>
              <p className="text-xs font-mono text-on-surface-variant opacity-60">Department Warnings</p>
              <h3 className="text-2xl font-bold text-on-surface">{loading ? '—' : warnings}</h3>
            </div>
            <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col gap-2 ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-full">check_circle</span>
              </div>
              <p className="text-xs font-mono text-on-surface-variant opacity-60">Action Success Rate</p>
              <h3 className="text-2xl font-bold text-on-surface">{loading ? '—' : `${successRate}%`}</h3>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h4 className="text-xs font-mono font-bold mb-4 text-on-surface-variant">Historical Range</h4>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {RANGE_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => { setRange(r); setPage(1); showToast(`Showing logs from ${r.toLowerCase()}.`) }}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors ${
                      range === r ? 'bg-primary-container text-white' : 'border border-outline-variant hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <select
                value={typeFilter}
                onChange={e => { setType(e.target.value); setPage(1) }}
                className="w-full flex items-center justify-between px-4 py-2 border border-outline-variant rounded-lg text-xs font-mono bg-surface-container-lowest focus:outline-none cursor-pointer"
              >
                {actionTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Timeline + Log Table ─────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Activity Timeline */}
          <div className={`col-span-12 xl:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant h-fit xl:sticky xl:top-24 ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg font-semibold text-on-surface">Activity Timeline</h3>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container rounded-lg animate-pulse" />)}
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">history_toggle_off</span>
                <p className="text-sm text-on-surface-variant">No recent activity yet.</p>
              </div>
            ) : (
              <div className="relative flex flex-col gap-8">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-outline-variant/50" />
                {activity.map(item => (
                  <div key={item.id} className="relative pl-12">
                    <div className={`absolute left-0 top-0 w-10 h-10 ${item.iconBg} ${item.iconColor} flex items-center justify-center rounded-full z-10`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: item.filled ? "'FILL' 1" : "'FILL' 0" }}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-on-surface">{item.label}</span>
                      <p className="text-sm text-on-surface-variant">{item.desc}</p>
                      <span className="text-xs font-mono text-on-surface-variant/50 mt-1">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Action Log */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              <div className={`border-b border-outline-variant flex justify-between items-center ${isMobile ? 'p-4' : 'p-6'}`}>
                <h3 className="text-lg font-semibold text-on-surface">Detailed Action Log</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSearch(''); setType('All Types'); setPage(1) }}
                    className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
                    title="Clear filters"
                  >
                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                  </button>
                  <button
                    onClick={fetchHistory}
                    className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
                    title="Refresh"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                  </button>
                  <button
                    onClick={exportLog}
                    className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
                    title="Export CSV"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-14 bg-surface-container rounded-lg animate-pulse" />)}
                </div>
              ) : isMobile ? (
                <div>
                  {pageLogs.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      {logs.length === 0 ? 'No log entries yet.' : 'No log entries match your filters.'}
                    </div>
                  ) : pageLogs.map(l => (
                    <div key={l.id} className={`p-4 border-t border-outline-variant ${l.flagged ? 'bg-error-container/20' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full ${l.avatarBg} ${l.avatarText} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>{l.initials}</div>
                        <span className="text-sm font-bold text-on-surface flex-1">{l.actor}</span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATUS_BADGE[l.status] ?? 'bg-surface-container-highest text-on-surface-variant'}`}>{l.status}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-1">{l.detail}</p>
                      <div className="flex gap-2 text-[11px] font-mono text-on-surface-variant/60">
                        <span>{l.type}</span>
                        <span>•</span>
                        <span>{l.time}</span>
                        {l.technician && (<><span>•</span><span>Tech: {l.technician}</span></>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                      <tr>
                        {['Timestamp', 'Category', 'User / Actor', 'Status', 'Details'].map(h => (
                          <th key={h} className="px-6 py-4 text-xs font-mono text-on-surface-variant/60">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {pageLogs.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                          {logs.length === 0 ? 'No log entries yet.' : 'No log entries match your filters.'}
                        </td></tr>
                      )}
                      {pageLogs.map(l => (
                        <tr key={l.id} className={`hover:bg-surface transition-colors cursor-pointer ${l.flagged ? 'bg-error-container/20' : ''}`}>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-on-surface">{l.time}</td>
                          <td className="px-6 py-4 text-sm font-bold text-on-surface">{l.type}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${l.avatarBg} ${l.avatarText} flex items-center justify-center text-[10px] font-bold`}>{l.initials}</div>
                              <span className="text-sm text-on-surface">{l.actor}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_BADGE[l.status] ?? 'bg-surface-container-highest text-on-surface-variant'}`}>{l.status}</span>
                          </td>
                          <td className="px-6 py-4 text-sm max-w-xs truncate text-on-surface-variant">{l.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className={`border-t border-outline-variant flex justify-between items-center bg-surface-container-low flex-wrap gap-2 ${isMobile ? 'p-3' : 'p-4'}`}>
                  <span className="text-xs font-mono text-on-surface-variant opacity-60">
                    Showing {pageLogs.length === 0 ? 0 : (safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, filtered.length)} of {filtered.length} entries
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors"
                    >
                      {isMobile ? '‹' : 'Previous'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                          p === safePage ? 'bg-primary-container text-white' : 'border border-outline-variant bg-surface-container-lowest hover:bg-surface'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="px-3 py-1 border border-outline-variant rounded bg-surface-container-lowest text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors"
                    >
                      {isMobile ? '›' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Operational Health Snapshot — hidden on mobile, decorative only */}
            {!isMobile && (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-semibold text-on-surface">Operational Health Snapshot</h4>
                  <select className="bg-surface-container-low border-none rounded-lg text-xs font-mono px-4 py-2 focus:outline-none cursor-pointer">
                    <option>Weekly View</option>
                    <option>Monthly View</option>
                  </select>
                </div>
                {logs.length === 0 ? (
                  <div className="h-48 w-full flex flex-col items-center justify-center bg-surface-container rounded-lg text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-primary/20 mb-2">bar_chart</span>
                    <p className="text-xs font-mono opacity-60">No activity data yet to chart.</p>
                  </div>
                ) : (
                  <div className="h-48 w-full relative overflow-hidden bg-surface-container rounded-lg">
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
      <footer className={`mt-auto border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono opacity-60 ${isMobile ? 'py-4 px-4 pb-[76px]' : 'py-6 px-6'}`}>
        <p>© 2026 AATU Infrastructure Management. All rights reserved.</p>
        <div className="flex gap-6">
          <button className="hover:text-primary transition-colors">Privacy Policy</button>
          <button className="hover:text-primary transition-colors">Terms of Service</button>
          <button className="hover:text-primary transition-colors">Help Desk</button>
        </div>
      </footer>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed left-1/2 -translate-x-1/2 z-[60] bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap ${isMobile ? 'bottom-[76px]' : 'bottom-6'}`}>
          <span className="material-symbols-outlined text-secondary-container text-base">check_circle</span>
          {toast}
        </div>
      )}
    </main>
  )
}