import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Plus, Download, ChevronLeft, ChevronRight, Menu } from 'lucide-react'

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: 'dashboard',     label: 'Dashboard',     path: '/admin/dashboard' },
  { icon: 'list_alt',      label: 'Requests',      path: '/admin/requests' },
  { icon: 'engineering',   label: 'Job Orders',    path: '/admin/job-orders' },
  { icon: 'inventory_2',   label: 'Assets',        path: '/admin/assets' },
  { icon: 'group',         label: 'Users',         path: '/admin/users' },
  { icon: 'domain',        label: 'Departments',   path: '/admin/departments' },
  { icon: 'notifications', label: 'Notifications', path: '/admin/notifications' },
]

// ─── Data ────────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  'HVAC System':      'hvac',
  'Laboratory':       'biotech',
  'Furniture':        'chair',
  'IT Infra':         'router',
  'Critical Utility': 'emergency',
  'Electrical':       'bolt',
  'Equipment':        'build',
  'Structural':       'domain',
}

const STATUS_STYLES = {
  Active:          { pill: 'bg-[#DCFCE7] text-[#166534]', dot: 'bg-[#166534]' },
  Maintenance:     { pill: 'bg-[#FEE2E2] text-[#991B1B]', dot: 'bg-[#991B1B] animate-pulse' },
  Assigned:        { pill: 'bg-[#EEF2FF] text-[#3730A3]', dot: 'bg-[#3730A3]' },
  Decommissioned:  { pill: 'bg-[#F3F4F6] text-[#6B7280]', dot: 'bg-[#6B7280]' },
}

const CONDITION_STYLES = {
  Excellent: 'text-[#166534] bg-[#DCFCE7]',
  Good:      'text-[#3730A3] bg-[#EEF2FF]',
  Fair:      'text-[#92400E] bg-[#FEF3C7]',
  Poor:      'text-[#991B1B] bg-[#FEE2E2]',
}

const FACULTY_OPTIONS = ['All Faculties', 'Faculty of Science', 'Faculty of Arts', 'Engineering Wing', 'Main Library']
const TYPE_OPTIONS    = ['All Asset Types', ...Object.keys(TYPE_ICONS)]
const STATUS_OPTIONS  = ['Any Status', 'Active', 'Maintenance', 'Assigned', 'Decommissioned']

const ITEMS_PER_PAGE = 8
const EMPTY_FORM = { name: '', location: '', faculty: 'Faculty of Science', type: 'HVAC System', status: 'Active', condition: 'Good', notes: '' }

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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()

  const content = (
    <aside className="w-[260px] bg-[#4a0404] text-white flex flex-col h-full overflow-y-auto border-r border-[#dcc0bd]">
      <div className="p-6 pb-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-md bg-white/[0.18] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div>
            <div className="font-bold text-[17px] leading-tight">AATU</div>
            <div className="text-[10px] tracking-[0.12em] text-white/50 uppercase">Infrastructure Mgmt</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} className="text-white/70 p-1">
            <X size={22} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); if (isMobile) onClose() }}
              className={`w-full flex items-center gap-3 px-4 py-[11px] text-left text-xs font-mono tracking-wide transition-colors rounded
                ${isActive ? 'bg-white/[0.12] text-white font-bold border-l-4 border-[#ffb4aa]' : 'text-white/65 hover:bg-white/[0.06] border-l-4 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 text-xs font-mono rounded hover:bg-white/[0.06] transition-colors">
          <span className="material-symbols-outlined text-[18px]">account_circle</span> User Profile
        </button>
        <button onClick={() => navigate('/login')} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 text-xs font-mono rounded hover:bg-white/[0.06] transition-colors">
          <span className="material-symbols-outlined text-[18px]">logout</span> Logout
        </button>
      </div>
    </aside>
  )

  if (!isMobile) {
    return <div className="w-[260px] h-screen fixed left-0 top-0 z-50">{content}</div>
  }

  if (!open) return null
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/45 z-[100]" />
      <div className="fixed left-0 top-0 bottom-0 w-[260px] z-[101] shadow-2xl">{content}</div>
    </>
  )
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const quickNav = NAV_ITEMS.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-[#dcc0bd] flex h-[60px]">
      {quickNav.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide ${isActive ? 'text-[#4a0404]' : 'text-[#554240]'}`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Assets() {
  const isMobile = useIsMobile()
  const navigate  = useNavigate()

  const [drawerOpen, setDrawerOpen] = useState(false)

  // Starts empty — populate from Supabase. No test data.
  const [assets, setAssets] = useState([])

  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('All Asset Types')
  const [statFilter, setStatFilter] = useState('Any Status')
  const [facFilter, setFacFilter]   = useState('All Faculties')
  const [page, setPage]             = useState(1)
  const [selected, setSelected]     = useState(null)
  const [showNew, setShowNew]       = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [toast, setToast]           = useState(null)

  useEffect(() => {
    ['aatu-fonts', 'aatu-icons'].forEach((id, i) => {
      if (!document.getElementById(id)) {
        const el = document.createElement('link')
        el.id = id
        el.rel = 'stylesheet'
        el.href = i === 0
          ? 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
          : "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        document.head.appendChild(el)
      }
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return assets.filter(a =>
      (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)) &&
      (typeFilter === 'All Asset Types' || a.type === typeFilter) &&
      (statFilter === 'Any Status' || a.status === statFilter) &&
      (facFilter === 'All Faculties' || a.faculty === facFilter)
    )
  }, [assets, search, typeFilter, statFilter, facFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage    = Math.min(page, totalPages)
  const pageItems   = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const totalAssets      = assets.length
  const underMaintenance = assets.filter(a => a.status === 'Maintenance').length
  const criticalMaint    = assets.filter(a => a.status === 'Maintenance' && a.condition === 'Poor').length
  const uniqueLocations  = new Set(assets.map(a => a.faculty)).size
  const activeCount      = assets.filter(a => a.status === 'Active').length
  const complianceRate   = totalAssets === 0 ? '0.0' : ((activeCount / totalAssets) * 100).toFixed(1)

  const facultyDist = useMemo(() => {
    if (assets.length === 0) return []
    const counts = {}
    assets.forEach(a => { counts[a.faculty] = (counts[a.faculty] || 0) + 1 })
    const max = Math.max(...Object.values(counts))
    return Object.entries(counts).map(([f, c]) => ({ faculty: f.replace('Faculty of ', ''), count: c, pct: Math.round((c / max) * 100) }))
  }, [assets])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function updateAsset(id, patch) {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...patch }))
  }

  function deleteAsset(id) {
    setAssets(prev => prev.filter(a => a.id !== id))
    if (selected?.id === id) setSelected(null)
    showToast('Asset removed.')
  }

  function registerAsset(e) {
    e.preventDefault()
    const prefix = form.type.slice(0, 3).toUpperCase().replace(' ', '')
    const newId  = `${prefix}-${String(assets.length + 1).padStart(4, '0')}`
    const today  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setAssets(prev => [{ id: newId, ...form, lastService: today, nextService: 'TBD' }, ...prev])
    setShowNew(false)
    setForm(EMPTY_FORM)
    showToast('Asset registered successfully.')
  }

  function saveEdit(e) {
    e.preventDefault()
    updateAsset(editing.id, editing)
    setEditing(null)
    showToast('Asset updated.')
  }

  function exportCSV() {
    const header = ['ID', 'Name', 'Location', 'Faculty', 'Type', 'Status', 'Condition', 'Last Service', 'Next Service', 'Notes']
    const rows   = filtered.map(a => [a.id, a.name, a.location, a.faculty, a.type, a.status, a.condition, a.lastService, a.nextService, a.notes])
    const csv    = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob   = new Blob([csv], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a'); a.href = url; a.download = 'assets.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Exported assets as CSV.')
  }

  const inp = 'w-full px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 bg-white'
  const sel = `${inp} cursor-pointer`

  return (
    <div className="flex min-h-screen bg-[#f9f9ff]" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={`flex-1 min-h-screen ${isMobile ? '' : 'ml-[260px]'} ${isMobile ? 'pb-[60px]' : ''}`}>

        {/* Top App Bar */}
        <header className={`sticky top-0 z-40 h-16 bg-[#f9f9ff]/90 backdrop-blur border-b border-[#dcc0bd] flex items-center justify-between gap-3 ${isMobile ? 'px-4' : 'px-8'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} className="text-[#151c27] flex-shrink-0">
                <Menu size={24} />
              </button>
            )}
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#554240] text-[18px]">search</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full bg-[#f0f3ff] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 placeholder-[#554240]/60"
                placeholder="Search infrastructure records…"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('/admin/notifications')} className="p-2 text-[#554240] hover:text-[#210000] transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            </button>
            {!isMobile && (
              <>
                <button className="p-2 text-[#554240] hover:text-[#210000] transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
                <div className="h-8 w-px bg-[#dcc0bd]" />
              </>
            )}
            {!isMobile && (
              <button className="bg-[#4a0404] text-white px-4 py-2 rounded-lg text-xs font-mono hover:opacity-90 transition-opacity">
                Report Issue
              </button>
            )}
          </div>
        </header>

        <div className={`${isMobile ? 'p-4' : 'p-8'} max-w-[1600px] mx-auto`}>

          {/* Page Header */}
          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-end'} mb-8`}>
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#210000] mb-1`}>Assets &amp; Infrastructure</h2>
              <p className="text-[#554240] text-sm">Comprehensive registry of university physical resources and equipment lifecycle.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#dcc0bd] text-[#151c27] rounded-lg text-xs font-mono hover:bg-[#e7eefe] transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#4a0404] text-white rounded-lg text-xs font-mono hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> Register New Asset
              </button>
            </div>
          </div>

          {/* Bento Stats */}
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'} mb-8`}>
            {[
              { icon: 'inventory', iconBg: 'bg-[#b8ecbe]/30', badge: null, label: 'Total Assets', value: totalAssets.toLocaleString() },
              { icon: 'build', iconBg: 'bg-[#ffdad5]/30', badge: criticalMaint > 0 ? `Critical: ${criticalMaint}` : null, badgeColor: 'text-[#7e2b23]', label: 'Under Maintenance', value: underMaintenance },
              { icon: 'location_on', iconBg: 'bg-[#ffdcc3]/30', badge: null, label: 'Active Locations', value: `${uniqueLocations} Campus Sites` },
              { icon: 'check_circle', iconBg: 'bg-[#b8ecbe]/30', badge: null, label: 'Compliance Rating', value: `${complianceRate}%` },
            ].map(s => (
              <div key={s.label} className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-[#dcc0bd]`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 ${s.iconBg} rounded-lg`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                  {s.badge && <span className={`text-xs font-mono ${s.badgeColor}`}>{s.badge}</span>}
                </div>
                <p className="text-[#554240] text-xs font-mono opacity-60 uppercase tracking-wide">{s.label}</p>
                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#210000] mt-1`}>{s.value}</h3>
              </div>
            ))}
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-xl border border-[#dcc0bd] overflow-hidden mb-8">

            {/* Toolbar */}
            <div className="p-4 border-b border-[#dcc0bd] bg-white flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                  className="bg-[#f9f9ff] border border-[#dcc0bd] rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer">
                  {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                <select value={statFilter} onChange={e => { setStatFilter(e.target.value); setPage(1) }}
                  className="bg-[#f9f9ff] border border-[#dcc0bd] rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer">
                  {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                <select value={facFilter} onChange={e => { setFacFilter(e.target.value); setPage(1) }}
                  className="bg-[#f9f9ff] border border-[#dcc0bd] rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer">
                  {FACULTY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                {(typeFilter !== 'All Asset Types' || statFilter !== 'Any Status' || facFilter !== 'All Faculties' || search) && (
                  <button
                    onClick={() => { setTypeFilter('All Asset Types'); setStatFilter('Any Status'); setFacFilter('All Faculties'); setSearch(''); setPage(1) }}
                    className="px-3 py-2 text-xs font-mono text-[#ba1a1a] border border-[#ffdad6] bg-[#ffdad6]/30 rounded-lg hover:bg-[#ffdad6] transition-colors flex items-center gap-1"
                  >
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>
              <span className="text-xs font-mono text-[#554240]/60">
                Showing {pageItems.length} of {filtered.length} items
              </span>
            </div>

            {/* Table (desktop) / Cards (mobile) */}
            {isMobile ? (
              <div className="divide-y divide-[#dcc0bd]">
                {pageItems.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#dcc0bd] block mb-2">inventory_2</span>
                    <p className="text-sm text-[#554240]">
                      {assets.length === 0 ? 'No assets registered yet.' : 'No assets match your filters.'}
                    </p>
                  </div>
                ) : pageItems.map(a => {
                  const ss = STATUS_STYLES[a.status] ?? STATUS_STYLES.Active
                  return (
                    <div key={a.id} onClick={() => setSelected(a)} className="p-4 active:bg-[#f0f3ff]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#e7eefe] flex items-center justify-center text-[#554240] flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[a.type] ?? 'category'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#210000]">{a.name}</p>
                          <p className="text-xs font-mono text-[#554240]">ID: {a.id}</p>
                          <p className="text-xs text-[#554240] mt-1">{a.location}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ss.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ss.dot}`} />{a.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f0f3ff] border-b border-[#dcc0bd]">
                      {['ASSET NAME / ID', 'LOCATION', 'TYPE', 'STATUS', 'ACTION'].map(h => (
                        <th key={h} className={`px-6 py-4 text-xs font-mono text-[#554240]/60 font-medium ${h === 'ACTION' ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dcc0bd]">
                    {pageItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <span className="material-symbols-outlined text-4xl text-[#dcc0bd] block mb-2">inventory_2</span>
                          <p className="text-sm text-[#554240]">
                            {assets.length === 0 ? 'No assets registered yet. Click "Register New Asset" to add one.' : 'No assets match your filters.'}
                          </p>
                          {assets.length > 0 && (
                            <button onClick={() => { setTypeFilter('All Asset Types'); setStatFilter('Any Status'); setFacFilter('All Faculties'); setSearch('') }}
                              className="mt-3 text-xs font-mono text-[#4a0404] underline">Clear filters</button>
                          )}
                        </td>
                      </tr>
                    )}
                    {pageItems.map(a => {
                      const ss = STATUS_STYLES[a.status] ?? STATUS_STYLES.Active
                      return (
                        <tr key={a.id} onClick={() => setSelected(a)} className="hover:bg-[#f0f3ff] transition-colors group cursor-pointer">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#e7eefe] flex items-center justify-center text-[#554240] flex-shrink-0">
                                <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[a.type] ?? 'category'}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#210000] group-hover:text-[#4a0404] transition-colors">{a.name}</p>
                                <p className="text-xs font-mono text-[#554240]">ID: {a.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-[#554240]">{a.location}</td>
                          <td className="px-6 py-5">
                            <span className="px-2 py-1 bg-[#dce2f3]/50 rounded-md text-[11px] font-bold text-[#554240] uppercase tracking-wider">{a.type}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ss.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ss.dot}`} />
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelected(a)} className="text-xs font-mono text-[#d26a5f] font-bold hover:underline mr-3">View Details</button>
                            <button onClick={() => setEditing({ ...a })} className="p-1.5 text-[#554240] hover:text-[#210000] hover:bg-[#e7eefe] rounded-full transition-colors">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => deleteAsset(a.id)} className="p-1.5 text-[#554240] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors ml-1">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-[#dcc0bd] bg-white flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-mono text-[#554240]">Page {safePage} of {totalPages} · {filtered.length} total results</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="p-2 border border-[#dcc0bd] rounded-lg hover:bg-[#e7eefe] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-xs text-[#554240]">…</span>}
                      <button onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-mono transition-colors ${p === safePage ? 'bg-[#4a0404] text-white' : 'border border-[#dcc0bd] hover:bg-[#e7eefe]'}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="p-2 border border-[#dcc0bd] rounded-lg hover:bg-[#e7eefe] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-8'}`}>
            <div className="bg-[#4a0404] rounded-xl p-6 md:p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-xl font-semibold mb-2">Predictive Maintenance</h4>
                <p className="text-white/80 text-sm max-w-sm mb-6 leading-relaxed">
                  AI-driven analysis can flag assets that are due for service soon. Register assets with upcoming service dates to populate this insight.
                </p>
                <button onClick={() => { setStatFilter('Maintenance'); setPage(1) }}
                  className="bg-white text-[#4a0404] font-bold text-xs font-mono px-6 py-3 rounded-lg hover:bg-[#f0f3ff] transition-colors">
                  View Maintenance Items
                </button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#dcc0bd] p-6 md:p-8">
              <h4 className="text-lg font-semibold text-[#210000] mb-6">Asset Distribution by Faculty</h4>
              {facultyDist.length === 0 ? (
                <p className="text-sm text-[#554240]">No assets registered yet to show distribution.</p>
              ) : (
                <div className="space-y-4">
                  {facultyDist.map(({ faculty, count, pct }) => (
                    <div key={faculty} className="flex items-center gap-4">
                      <span className="text-xs font-mono text-[#554240] w-36 truncate">{faculty}</span>
                      <div className="flex-1 h-3 bg-[#e7eefe] rounded-full overflow-hidden">
                        <div className="h-full bg-[#d26a5f] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#210000] w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* Detail Side Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <aside className={`fixed top-0 right-0 h-full ${isMobile ? 'w-full' : 'w-[420px]'} bg-white shadow-2xl z-50 flex flex-col overflow-y-auto`}>
            <div className="flex items-start justify-between p-6 border-b border-[#dcc0bd] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#e7eefe] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#554240]" style={{ fontSize: 24 }}>{TYPE_ICONS[selected.type] ?? 'category'}</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#210000] leading-snug">{selected.name}</h2>
                  <p className="text-xs font-mono text-[#554240]">ID: {selected.id}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-[#f0f3ff] rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="px-6 pt-5 flex gap-2 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[selected.status]?.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_STYLES[selected.status]?.dot}`} />{selected.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${CONDITION_STYLES[selected.condition] ?? 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                {selected.condition} Condition
              </span>
            </div>

            <div className="px-6 pt-5 grid grid-cols-2 gap-4">
              {[['TYPE', selected.type], ['FACULTY', selected.faculty], ['LOCATION', selected.location], ['LAST SERVICE', selected.lastService], ['NEXT SERVICE', selected.nextService]].map(([label, value]) => (
                <div key={label} className={label === 'LOCATION' ? 'col-span-2' : ''}>
                  <p className="text-[10px] font-mono text-[#554240]/60 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-medium text-[#151c27]">{value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div className="px-6 pt-4">
                <p className="text-[10px] font-mono text-[#554240]/60 uppercase tracking-wider mb-1">NOTES</p>
                <p className="text-sm text-[#554240] leading-relaxed bg-[#f0f3ff] rounded-lg p-3">{selected.notes}</p>
              </div>
            )}

            <div className="px-6 pt-6">
              <p className="text-[10px] font-mono text-[#554240]/60 uppercase tracking-wider mb-3">UPDATE STATUS</p>
              <div className="grid grid-cols-2 gap-2">
                {['Active', 'Maintenance', 'Assigned', 'Decommissioned'].map(s => (
                  <button key={s} onClick={() => updateAsset(selected.id, { status: s })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${selected.status === s ? 'bg-[#4a0404] text-white' : 'border border-[#dcc0bd] hover:bg-[#f0f3ff] text-[#554240]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <div className="p-6 border-t border-[#dcc0bd] flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => { setEditing({ ...selected }); setSelected(null) }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm font-mono hover:bg-[#f0f3ff] transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit Asset
              </button>
              <button onClick={() => deleteAsset(selected.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ffdad6] text-[#93000a] rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold">
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Register New Asset Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-[#dcc0bd] sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-[#210000]">Register New Asset</h2>
                <p className="text-xs text-[#554240] mt-0.5">Add a new item to the infrastructure registry.</p>
              </div>
              <button onClick={() => setShowNew(false)} className="p-2 hover:bg-[#f0f3ff] rounded-full transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={registerAsset} className="p-6 space-y-4">
              {[{ label: 'ASSET NAME', field: 'name', placeholder: 'e.g. HVAC Unit — Block D' }, { label: 'LOCATION', field: 'location', placeholder: 'e.g. Faculty of Science, North Wing' }].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">{label}</label>
                  <input type="text" required value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className={inp} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">ASSET TYPE</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={sel}>
                    {Object.keys(TYPE_ICONS).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">FACULTY</label>
                  <select value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))} className={sel}>
                    {FACULTY_OPTIONS.filter(f => f !== 'All Faculties').map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">STATUS</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={sel}>
                    {['Active', 'Maintenance', 'Assigned'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">CONDITION</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className={sel}>
                    {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">NOTES (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any additional notes…" className={`${inp} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm font-mono hover:bg-[#f0f3ff] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-[#dcc0bd] sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-[#210000]">Edit Asset</h2>
                <p className="text-xs font-mono text-[#554240] mt-0.5">ID: {editing.id}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-[#f0f3ff] rounded-full transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              {[{ label: 'ASSET NAME', field: 'name' }, { label: 'LOCATION', field: 'location' }].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">{label}</label>
                  <input type="text" required value={editing[field]} onChange={e => setEditing(n => ({ ...n, [field]: e.target.value }))} className={inp} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">ASSET TYPE</label>
                  <select value={editing.type} onChange={e => setEditing(n => ({ ...n, type: e.target.value }))} className={sel}>
                    {Object.keys(TYPE_ICONS).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">FACULTY</label>
                  <select value={editing.faculty} onChange={e => setEditing(n => ({ ...n, faculty: e.target.value }))} className={sel}>
                    {FACULTY_OPTIONS.filter(f => f !== 'All Faculties').map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">STATUS</label>
                  <select value={editing.status} onChange={e => setEditing(n => ({ ...n, status: e.target.value }))} className={sel}>
                    {['Active', 'Maintenance', 'Assigned', 'Decommissioned'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">CONDITION</label>
                  <select value={editing.condition} onChange={e => setEditing(n => ({ ...n, condition: e.target.value }))} className={sel}>
                    {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">NOTES</label>
                <textarea value={editing.notes ?? ''} onChange={e => setEditing(n => ({ ...n, notes: e.target.value }))} rows={3} className={`${inp} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm font-mono hover:bg-[#f0f3ff] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed ${isMobile ? 'bottom-[76px]' : 'bottom-6'} left-1/2 -translate-x-1/2 z-[60] bg-[#151c27] text-white px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap`}>
          <span className="material-symbols-outlined text-[#b8ecbe] text-base">check_circle</span>
          {toast}
        </div>
      )}
    </div>
  )
}