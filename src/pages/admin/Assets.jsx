import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Plus, Download, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

// Semantic status/condition chip colors — literal light+dark chips,
// consistent with the convention used across this app.
const STATUS_STYLES = {
  Active:          { pill: 'bg-[#DCFCE7] dark:bg-emerald-950 text-[#166534] dark:text-emerald-300', dot: 'bg-[#166534] dark:bg-emerald-400' },
  Maintenance:     { pill: 'bg-[#FEE2E2] dark:bg-red-950 text-[#991B1B] dark:text-red-300', dot: 'bg-[#991B1B] dark:bg-red-400 animate-pulse' },
  Assigned:        { pill: 'bg-[#EEF2FF] dark:bg-indigo-950 text-[#3730A3] dark:text-indigo-300', dot: 'bg-[#3730A3] dark:bg-indigo-400' },
  Decommissioned:  { pill: 'bg-[#F3F4F6] dark:bg-gray-800 text-[#6B7280] dark:text-gray-400', dot: 'bg-[#6B7280] dark:bg-gray-400' },
}

const CONDITION_STYLES = {
  Excellent: 'text-[#166534] dark:text-emerald-300 bg-[#DCFCE7] dark:bg-emerald-950',
  Good:      'text-[#3730A3] dark:text-indigo-300 bg-[#EEF2FF] dark:bg-indigo-950',
  Fair:      'text-[#92400E] dark:text-amber-300 bg-[#FEF3C7] dark:bg-amber-950',
  Poor:      'text-[#991B1B] dark:text-red-300 bg-[#FEE2E2] dark:bg-red-950',
}

const STATUS_OPTIONS  = ['Any Status', 'Active', 'Maintenance', 'Assigned', 'Decommissioned']
const ITEMS_PER_PAGE = 8
const EMPTY_FORM = { name: '', location: '', department_id: '', category_id: '', status: 'Active', condition: 'Good', notes: '' }

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

// ─── Sidebar (pinned brand color — does not change with dark mode) ──────────
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
        <button onClick={() => navigate('/admin/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 text-xs font-mono rounded hover:bg-white/[0.06] transition-colors">
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
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-surface-container-lowest border-t border-outline-variant flex h-[60px]">
      {quickNav.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}
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

  const [assets, setAssets]         = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]       = useState(true)

  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('All Asset Types')
  const [statFilter, setStatFilter] = useState('Any Status')
  const [deptFilter, setDeptFilter] = useState('All Departments')
  const [page, setPage]             = useState(1)
  const [selected, setSelected]     = useState(null)
  const [showNew, setShowNew]       = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Fetch categories & departments (for dropdowns + filters) ──────────────
  useEffect(() => {
    (async () => {
      const [{ data: cats, error: catErr }, { data: depts, error: deptErr }] = await Promise.all([
        supabase.from('asset_categories').select('id, name, maintenance_type, icon').order('name'),
        supabase.from('departments').select('id, name').order('name'),
      ])
      if (catErr) console.error('Categories fetch error:', catErr.message)
      if (deptErr) console.error('Departments fetch error:', deptErr.message)
      setCategories(cats ?? [])
      setDepartments(depts ?? [])
    })()
  }, [])

  // ── Fetch assets via the pre-joined view ───────────────────────────────────
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('asset_overview')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAssets((data ?? []).map(a => ({
        id: a.id,
        name: a.name,
        location: a.location,
        status: a.status,
        condition: a.condition,
        notes: a.notes,
        lastService: a.last_service,
        nextService: a.next_service,
        departmentId: a.department_id,
        departmentName: a.department_name,
        categoryId: a.category_id,
        categoryName: a.category_name,
        categoryIcon: a.category_icon || 'category',
        maintenanceType: a.maintenance_type,
      })))
    } catch (err) {
      console.error('Assets fetch error:', err)
      showToast(`Failed to load assets: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  // ── Real-time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('admin-assets-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchAssets())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchAssets])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return assets.filter(a =>
      (a.name.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q) || a.departmentName?.toLowerCase().includes(q)) &&
      (typeFilter === 'All Asset Types' || a.categoryName === typeFilter) &&
      (statFilter === 'Any Status' || a.status === statFilter) &&
      (deptFilter === 'All Departments' || a.departmentName === deptFilter)
    )
  }, [assets, search, typeFilter, statFilter, deptFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage    = Math.min(page, totalPages)
  const pageItems   = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const totalAssets      = assets.length
  const underMaintenance = assets.filter(a => a.status === 'Maintenance').length
  const activeCount      = assets.filter(a => a.status === 'Active').length
  const complianceRate   = totalAssets === 0 ? '0.0' : ((activeCount / totalAssets) * 100).toFixed(1)
  const uniqueDepartments = new Set(assets.map(a => a.departmentName)).size

  // Grouped by MAINTENANCE TYPE (not faculty) — ties directly to the schema's
  // asset_categories.maintenance_type, e.g. "Servicing", "Software Update".
  const maintenanceDist = useMemo(() => {
    if (assets.length === 0) return []
    const counts = {}
    assets.forEach(a => { counts[a.maintenanceType || 'Unspecified'] = (counts[a.maintenanceType || 'Unspecified'] || 0) + 1 })
    const max = Math.max(...Object.values(counts))
    return Object.entries(counts).map(([type, c]) => ({ type, count: c, pct: Math.round((c / max) * 100) }))
  }, [assets])

  function showToastAndClose(msg) { showToast(msg) }

  async function updateAssetStatus(id, status) {
    try {
      const { error } = await supabase.from('assets').update({ status }).eq('id', id)
      if (error) throw error
      setAssets(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
      showToast('Status updated.')
    } catch (err) {
      showToast(`Failed to update status: ${err.message}`)
    }
  }

  async function deleteAsset(id) {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id)
      if (error) throw error
      setAssets(prev => prev.filter(a => a.id !== id))
      if (selected?.id === id) setSelected(null)
      showToast('Asset removed.')
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`)
    }
  }

  async function registerAsset(e) {
    e.preventDefault()
    if (!form.department_id || !form.category_id) {
      showToast('Please select a department and category.')
      return
    }
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: form.name.trim(),
          location: form.location.trim() || null,
          department_id: form.department_id,
          category_id: form.category_id,
          status: form.status,
          condition: form.condition,
          notes: form.notes.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      await fetchAssets()
      setShowNew(false)
      setForm(EMPTY_FORM)
      showToast('Asset registered successfully.')
    } catch (err) {
      console.error('Register asset error:', err)
      showToast(`Failed to register asset: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('assets')
        .update({
          name: editing.name,
          location: editing.location,
          department_id: editing.departmentId,
          category_id: editing.categoryId,
          status: editing.status,
          condition: editing.condition,
          notes: editing.notes,
        })
        .eq('id', editing.id)

      if (error) throw error

      await fetchAssets()
      setEditing(null)
      showToast('Asset updated.')
    } catch (err) {
      console.error('Edit asset error:', err)
      showToast(`Failed to update: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function exportCSV() {
    const header = ['Name', 'Location', 'Department', 'Category', 'Maintenance Type', 'Status', 'Condition', 'Last Service', 'Next Service', 'Notes']
    const rows   = filtered.map(a => [a.name, a.location, a.departmentName, a.categoryName, a.maintenanceType, a.status, a.condition, a.lastService, a.nextService, a.notes])
    const csv    = [header, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob   = new Blob([csv], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a'); a.href = url; a.download = 'assets.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Exported assets as CSV.')
  }

  const inp = 'w-full px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20 bg-surface-container-lowest text-on-surface'
  const sel = `${inp} cursor-pointer`

  const departmentOptions = ['All Departments', ...departments.map(d => d.name)]
  const typeOptions = ['All Asset Types', ...categories.map(c => c.name)]

  return (
    <div className="flex min-h-screen bg-background" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={`flex-1 min-h-screen ${isMobile ? '' : 'ml-[260px]'} ${isMobile ? 'pb-[60px]' : ''}`}>

        <header className={`sticky top-0 z-40 h-16 bg-background/90 backdrop-blur border-b border-outline-variant flex items-center justify-between gap-3 ${isMobile ? 'px-4' : 'px-8'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} className="text-on-surface flex-shrink-0">
                <Menu size={24} />
              </button>
            )}
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20 placeholder-on-surface-variant/60 text-on-surface"
                placeholder="Search infrastructure records…"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('/admin/notifications')} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
            </button>
          </div>
        </header>

        <div className={`${isMobile ? 'p-4' : 'p-8'} max-w-[1600px] mx-auto`}>

          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-end'} mb-8`}>
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-on-surface mb-1`}>Assets &amp; Infrastructure</h2>
              <p className="text-on-surface-variant text-sm">Registry of department assets, grouped by required maintenance.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg text-xs font-mono hover:bg-surface-container transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => { setForm(EMPTY_FORM); setShowNew(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-lg text-xs font-mono hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> Register New Asset
              </button>
            </div>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'} mb-8`}>
            {[
              { icon: 'inventory', iconBg: 'bg-[#b8ecbe]/30 dark:bg-[#264d30]/40', label: 'Total Assets', value: totalAssets.toLocaleString() },
              { icon: 'build', iconBg: 'bg-error-container/30', label: 'Under Maintenance', value: underMaintenance },
              { icon: 'domain', iconBg: 'bg-[#ffdcc3]/30 dark:bg-[#5c3a1a]/40', label: 'Departments with Assets', value: uniqueDepartments },
              { icon: 'check_circle', iconBg: 'bg-[#b8ecbe]/30 dark:bg-[#264d30]/40', label: 'Compliance Rating', value: `${complianceRate}%` },
            ].map(s => (
              <div key={s.label} className={`bg-surface-container-lowest ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-outline-variant`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 ${s.iconBg} rounded-lg`}>
                    <span className="material-symbols-outlined text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                </div>
                <p className="text-on-surface-variant text-xs font-mono opacity-60 uppercase tracking-wide">{s.label}</p>
                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-on-surface mt-1`}>{loading ? '—' : s.value}</h3>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden mb-8">

            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                  className="bg-background border border-outline-variant rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer text-on-surface">
                  {typeOptions.map(o => <option key={o}>{o}</option>)}
                </select>
                <select value={statFilter} onChange={e => { setStatFilter(e.target.value); setPage(1) }}
                  className="bg-background border border-outline-variant rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer text-on-surface">
                  {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
                <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}
                  className="bg-background border border-outline-variant rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer text-on-surface">
                  {departmentOptions.map(o => <option key={o}>{o}</option>)}
                </select>
                {(typeFilter !== 'All Asset Types' || statFilter !== 'Any Status' || deptFilter !== 'All Departments' || search) && (
                  <button
                    onClick={() => { setTypeFilter('All Asset Types'); setStatFilter('Any Status'); setDeptFilter('All Departments'); setSearch(''); setPage(1) }}
                    className="px-3 py-2 text-xs font-mono text-error border border-error-container bg-error-container/30 rounded-lg hover:bg-error-container transition-colors flex items-center gap-1"
                  >
                    <X size={12} /> Clear filters
                  </button>
                )}
              </div>
              <span className="text-xs font-mono text-on-surface-variant/60">
                Showing {pageItems.length} of {filtered.length} items
              </span>
            </div>

            {isMobile ? (
              <div className="divide-y divide-outline-variant">
                {loading ? (
                  <div className="px-6 py-16 text-center text-sm text-on-surface-variant">Loading assets…</div>
                ) : pageItems.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">inventory_2</span>
                    <p className="text-sm text-on-surface-variant">
                      {assets.length === 0 ? 'No assets registered yet.' : 'No assets match your filters.'}
                    </p>
                  </div>
                ) : pageItems.map(a => {
                  const ss = STATUS_STYLES[a.status] ?? STATUS_STYLES.Active
                  return (
                    <div key={a.id} onClick={() => setSelected(a)} className="p-4 active:bg-surface-container-low">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]">{a.categoryIcon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface">{a.name}</p>
                          <p className="text-xs font-mono text-on-surface-variant">{a.departmentName} · {a.categoryName}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{a.location || '—'}</p>
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
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      {['ASSET NAME', 'DEPARTMENT', 'CATEGORY', 'MAINTENANCE TYPE', 'STATUS', 'ACTION'].map(h => (
                        <th key={h} className={`px-6 py-4 text-xs font-mono text-on-surface-variant/60 font-medium ${h === 'ACTION' ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {loading && (
                      <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-on-surface-variant">Loading assets…</td></tr>
                    )}
                    {!loading && pageItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">inventory_2</span>
                          <p className="text-sm text-on-surface-variant">
                            {assets.length === 0 ? 'No assets registered yet. Click "Register New Asset" to add one.' : 'No assets match your filters.'}
                          </p>
                        </td>
                      </tr>
                    )}
                    {pageItems.map(a => {
                      const ss = STATUS_STYLES[a.status] ?? STATUS_STYLES.Active
                      return (
                        <tr key={a.id} onClick={() => setSelected(a)} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                                <span className="material-symbols-outlined text-[20px]">{a.categoryIcon}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-on-surface group-hover:text-primary-container transition-colors">{a.name}</p>
                                <p className="text-xs font-mono text-on-surface-variant">{a.location || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant">{a.departmentName}</td>
                          <td className="px-6 py-5">
                            <span className="px-2 py-1 bg-surface-container-high/50 rounded-md text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{a.categoryName}</span>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface-variant">{a.maintenanceType}</td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ss.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ss.dot}`} />
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelected(a)} className="text-xs font-mono text-primary-container font-bold hover:underline mr-3">View</button>
                            <button onClick={() => setEditing({ ...a })} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => deleteAsset(a.id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors ml-1">
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

            {filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-mono text-on-surface-variant">Page {safePage} of {totalPages} · {filtered.length} total results</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-on-surface">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-xs text-on-surface-variant">…</span>}
                      <button onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-mono transition-colors ${p === safePage ? 'bg-primary-container text-white' : 'border border-outline-variant hover:bg-surface-container text-on-surface'}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-on-surface">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-8'}`}>
            <div className="bg-[#4a0404] rounded-xl p-6 md:p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-xl font-semibold mb-2">Predictive Maintenance</h4>
                <p className="text-white/80 text-sm max-w-sm mb-6 leading-relaxed">
                  Filter assets currently under maintenance to see what's actively being serviced across every department.
                </p>
                <button onClick={() => { setStatFilter('Maintenance'); setDeptFilter('All Departments'); setPage(1) }}
                  className="bg-white text-[#4a0404] font-bold text-xs font-mono px-6 py-3 rounded-lg hover:bg-[#f0f3ff] transition-colors">
                  View Maintenance Items
                </button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 md:p-8">
              <h4 className="text-lg font-semibold text-on-surface mb-6">Assets by Maintenance Type</h4>
              {maintenanceDist.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No assets registered yet to show distribution.</p>
              ) : (
                <div className="space-y-4">
                  {maintenanceDist.map(({ type, count, pct }) => (
                    <div key={type} className="flex items-center gap-4">
                      <span className="text-xs font-mono text-on-surface-variant w-36 truncate">{type}</span>
                      <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-[#d26a5f] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-on-surface w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* ── Detail Drawer ─────────────────────────────────────────────────────── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <aside className={`fixed top-0 right-0 h-full ${isMobile ? 'w-full' : 'w-[420px]'} bg-surface-container-lowest shadow-2xl z-50 flex flex-col overflow-y-auto`}>
            <div className="flex items-start justify-between p-6 border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 24 }}>{selected.categoryIcon}</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface leading-snug">{selected.name}</h2>
                  <p className="text-xs font-mono text-on-surface-variant">{selected.departmentName}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"><X size={18} /></button>
            </div>

            <div className="px-6 pt-5 flex gap-2 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[selected.status]?.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_STYLES[selected.status]?.dot}`} />{selected.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${CONDITION_STYLES[selected.condition] ?? 'bg-[#f3f4f6] dark:bg-gray-800 text-[#6b7280] dark:text-gray-400'}`}>
                {selected.condition} Condition
              </span>
            </div>

            <div className="px-6 pt-5 grid grid-cols-2 gap-4">
              {[
                ['CATEGORY', selected.categoryName],
                ['MAINTENANCE TYPE', selected.maintenanceType],
                ['LOCATION', selected.location || '—'],
                ['LAST SERVICE', selected.lastService || 'Not recorded'],
                ['NEXT SERVICE', selected.nextService || 'Not scheduled'],
              ].map(([label, value]) => (
                <div key={label} className={label === 'LOCATION' ? 'col-span-2' : ''}>
                  <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-medium text-on-surface">{value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div className="px-6 pt-4">
                <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider mb-1">NOTES</p>
                <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low rounded-lg p-3">{selected.notes}</p>
              </div>
            )}

            <div className="px-6 pt-6">
              <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider mb-3">UPDATE STATUS</p>
              <div className="grid grid-cols-2 gap-2">
                {['Active', 'Maintenance', 'Assigned', 'Decommissioned'].map(s => (
                  <button key={s} onClick={() => updateAssetStatus(selected.id, s)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all ${selected.status === s ? 'bg-primary-container text-white' : 'border border-outline-variant hover:bg-surface-container-low text-on-surface-variant'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <div className="p-6 border-t border-outline-variant flex gap-3 sticky bottom-0 bg-surface-container-lowest">
              <button onClick={() => { setEditing({ ...selected }); setSelected(null) }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-mono hover:bg-surface-container-low transition-colors text-on-surface">
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit Asset
              </button>
              <button onClick={() => deleteAsset(selected.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error-container text-on-error-container rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold">
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Register New Asset Modal ─────────────────────────────────────────── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Register New Asset</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Add a new item to the infrastructure registry.</p>
              </div>
              <button onClick={() => setShowNew(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"><X size={18} /></button>
            </div>
            <form onSubmit={registerAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1.5">ASSET NAME</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Generator Unit A" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1.5">LOCATION</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. North Wing, Ground Floor" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">DEPARTMENT *</label>
                  <select required value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} className={sel}>
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">CATEGORY *</label>
                  <select required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className={sel}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.maintenance_type})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">STATUS</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={sel}>
                    {['Active', 'Maintenance', 'Assigned'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">CONDITION</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className={sel}>
                    {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1.5">NOTES (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any additional notes…" className={`${inp} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-mono hover:bg-surface-container-low transition-colors text-on-surface">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary-container text-white rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold disabled:opacity-60">
                  {saving ? 'Registering…' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Asset Modal ──────────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Edit Asset</h2>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant"><X size={18} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1.5">ASSET NAME</label>
                <input type="text" required value={editing.name} onChange={e => setEditing(n => ({ ...n, name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1.5">LOCATION</label>
                <input type="text" value={editing.location ?? ''} onChange={e => setEditing(n => ({ ...n, location: e.target.value }))} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">DEPARTMENT</label>
                  <select value={editing.departmentId} onChange={e => setEditing(n => ({ ...n, departmentId: e.target.value }))} className={sel}>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">CATEGORY</label>
                  <select value={editing.categoryId} onChange={e => setEditing(n => ({ ...n, categoryId: e.target.value }))} className={sel}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.maintenance_type})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">STATUS</label>
                  <select value={editing.status} onChange={e => setEditing(n => ({ ...n, status: e.target.value }))} className={sel}>
                    {['Active', 'Maintenance', 'Assigned', 'Decommissioned'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-on-surface-variant mb-1.5">CONDITION</label>
                  <select value={editing.condition} onChange={e => setEditing(n => ({ ...n, condition: e.target.value }))} className={sel}>
                    {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-on-surface-variant mb-1.5">NOTES</label>
                <textarea value={editing.notes ?? ''} onChange={e => setEditing(n => ({ ...n, notes: e.target.value }))} rows={3} className={`${inp} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-mono hover:bg-surface-container-low transition-colors text-on-surface">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary-container text-white rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed ${isMobile ? 'bottom-[76px]' : 'bottom-6'} left-1/2 -translate-x-1/2 z-[60] bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap`}>
          <span className="material-symbols-outlined text-[#b8ecbe] text-base">check_circle</span>
          {toast}
        </div>
      )}
    </div>
  )
}