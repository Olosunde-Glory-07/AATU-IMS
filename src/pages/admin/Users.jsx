import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
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

const AVATAR_COLORS = [
  { bg: 'bg-[#ffdad5]', text: 'text-[#4a0404]' },
  { bg: 'bg-[#b8ecbe]', text: 'text-[#1a3d25]' },
  { bg: 'bg-[#ffdcc3]', text: 'text-[#371a00]' },
  { bg: 'bg-[#dce2f3]', text: 'text-[#151c27]' },
  { bg: 'bg-[#e7eefe]', text: 'text-[#210000]' },
]

const ROLE_BADGE = {
  admin:      'bg-[#ffdad5]/30 text-[#4a0404] border border-[#ffb4aa]/40',
  staff:      'bg-[#b8ecbe]/30 text-[#1a3d25] border border-[#b8ecbe]/60',
  technician: 'bg-[#b8ecbe]/20 text-[#396844] border border-[#b8ecbe]/50',
  student:    'bg-[#ffdcc3]/20 text-[#6e3900] border border-[#ffdcc3]/40',
}

const ROLE_SECTIONS = [
  { key: 'admin',      label: 'Administrators', icon: 'admin_panel_settings' },
  { key: 'technician', label: 'Technicians',    icon: 'engineering' },
  { key: 'staff',      label: 'Staff',          icon: 'badge' },
  { key: 'student',    label: 'Students',       icon: 'school' },
]

const ITEMS_PER_PAGE = 10

function initials(name = '') {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColor(id = '') {
  const num = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[num % AVATAR_COLORS.length]
}

// Map a raw profiles row → the shape the UI expects
function mapUser(row) {
  return {
    id:         row.id,
    name:       row.full_name || '—',
    role:       row.role || 'student',
    dept:       row.department || '—',
    status:     row.status || 'Active',
    specialty:  row.specialty || null,
    matric:     row.matric_number || null,
    joined:     row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '—',
  }
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
        <button onClick={() => navigate('/admin/profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 text-xs font-mono rounded hover:bg-white/[0.06] transition-colors">
          <span className="material-symbols-outlined text-[18px]">account_circle</span> User Profile
        </button>
        <button onClick={() => supabase.auth.signOut().then(() => navigate('/login'))} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 text-xs font-mono rounded hover:bg-white/[0.06] transition-colors">
          <span className="material-symbols-outlined text-[18px]">logout</span> Logout
        </button>
      </div>
    </aside>
  )

  if (!isMobile) return <div className="w-[260px] h-screen fixed left-0 top-0 z-50">{content}</div>
  if (!open) return null
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/45 z-[100]" />
      <div className="fixed left-0 top-0 bottom-0 w-[260px] z-[101] shadow-2xl">{content}</div>
    </>
  )
}

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-[#dcc0bd] flex h-[60px]">
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const isActive = location.pathname === item.path
        return (
          <button key={item.label} onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide ${isActive ? 'text-[#4a0404]' : 'text-[#554240]'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Users() {
  const isMobile = useIsMobile()
  const navigate  = useNavigate()

  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [roleFilter, setRole]         = useState('All')
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState(null)
  const [editing, setEditing]         = useState(null)
  const [studentMenu, setStudentMenu] = useState(null)
  const [toast, setToast]             = useState(null)
  const [saving, setSaving]           = useState(false)

  // Load fonts
  useEffect(() => {
    ['aatu-fonts', 'aatu-icons'].forEach((id, i) => {
      if (!document.getElementById(id)) {
        const el = document.createElement('link')
        el.id = id; el.rel = 'stylesheet'
        el.href = i === 0
          ? 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
          : 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
        document.head.appendChild(el)
      }
    })
  }, [])

  // ── Fetch all profiles from Supabase ──────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, department, status, specialty, matric_number, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data ?? []).map(mapUser))
    } catch (err) {
      console.error('Failed to load users:', err)
      showToast('Failed to load users. Check console.', true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Filtered + paginated list ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u =>
      (u.name.toLowerCase().includes(q) ||
       u.dept.toLowerCase().includes(q) ||
       (u.specialty || '').toLowerCase().includes(q)) &&
      (roleFilter === 'All' || u.role === roleFilter)
    )
  }, [users, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const pageUsers  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const grouped = useMemo(() => {
    const result = {}
    ROLE_SECTIONS.forEach(({ key }) => { result[key] = pageUsers.filter(u => u.role === key) })
    return result
  }, [pageUsers])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Update role or status in Supabase ─────────────────────────────────────
  async function toggleStatus(id) {
    const user = users.find(u => u.id === id)
    if (!user) return
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) { showToast('Failed to update status.', true); return }

    setUsers(p => p.map(u => u.id === id ? { ...u, status: newStatus } : u))
    if (selected?.id === id) setSelected(s => ({ ...s, status: newStatus }))
    showToast('Status updated.')
  }

  // ── Save edits to Supabase ────────────────────────────────────────────────
  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:  editing.name,
        role:       editing.role,
        department: editing.dept,
        specialty:  editing.specialty || null,
        status:     editing.status,
      })
      .eq('id', editing.id)

    setSaving(false)

    if (error) { showToast('Failed to save changes.', true); return }

    setUsers(p => p.map(u => u.id === editing.id ? { ...u, ...editing } : u))
    if (selected?.id === editing.id) setSelected(s => ({ ...s, ...editing }))
    setEditing(null)
    showToast('User updated successfully.')
  }

  // ── Delete from Supabase ──────────────────────────────────────────────────
  // NOTE: This only removes the profiles row. The auth.users row requires
  // the Supabase admin API (service role key) or manual deletion in the dashboard.
  // For now, we mark them Inactive instead of hard-deleting.
  async function deactivateUser(id) {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'Inactive' })
      .eq('id', id)

    if (error) { showToast('Failed to deactivate user.', true); return }

    setUsers(p => p.map(u => u.id === id ? { ...u, status: 'Inactive' } : u))
    if (selected?.id === id) setSelected(null)
    setStudentMenu(null)
    showToast('User deactivated.')
  }

  const inp = 'w-full px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20 bg-white'

  const Avatar = ({ user, size = 'md' }) => {
    const c = avatarColor(user.id)
    const sz = size === 'lg' ? 'w-14 h-14 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'
    return (
      <div className={`${sz} rounded-full ${c.bg} ${c.text} flex items-center justify-center font-bold flex-shrink-0`}>
        {initials(user.name)}
      </div>
    )
  }

  const stats = [
    { icon: 'group',       iconBg: 'bg-[#ffdad5]/20', iconColor: 'text-[#4a0404]', label: 'Total Users',       value: users.length },
    { icon: 'engineering', iconBg: 'bg-[#b8ecbe]/30', iconColor: 'text-[#396844]', label: 'Technicians',       value: users.filter(u => u.role === 'technician').length },
    { icon: 'school',      iconBg: 'bg-[#ffdcc3]/30', iconColor: 'text-[#6e3900]', label: 'Students',          value: users.filter(u => u.role === 'student').length },
    { icon: 'warning',     iconBg: 'bg-[#ffdad6]/30', iconColor: 'text-[#ba1a1a]', label: 'Inactive Accounts', value: users.filter(u => u.status === 'Inactive').length },
  ]

  return (
    <div className="flex min-h-screen bg-[#f9f9ff]" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={`flex-1 min-h-screen ${isMobile ? '' : 'ml-[260px]'} ${isMobile ? 'pb-[60px]' : ''}`}>

        {/* ── Top App Bar ─────────────────────────────────────────────────── */}
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
                className="w-full bg-[#f0f3ff] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a0404]/20"
                placeholder="Search users, department..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate('/admin/notifications')} className="p-2 text-[#554240] hover:text-[#210000] transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button onClick={fetchUsers} title="Refresh" className="p-2 text-[#554240] hover:text-[#210000] transition-colors">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </header>

        <div className={`${isMobile ? 'p-4' : 'p-8'} max-w-[1600px] mx-auto space-y-8`}>

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#210000]`}>User Management</h2>
              <p className="text-[#554240] mt-1 text-sm">All registered users from the database.</p>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={e => { setRole(e.target.value); setPage(1) }}
                className="flex items-center gap-2 px-4 py-2 border border-[#89726f] text-[#151c27] text-sm rounded-lg hover:bg-[#e7eefe] transition-colors focus:outline-none cursor-pointer bg-white"
              >
                {['All', 'admin', 'staff', 'technician', 'student'].map(r => (
                  <option key={r} value={r}>{r === 'All' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────────────────── */}
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'}`}>
            {stats.map(s => (
              <div key={s.label} className={`bg-white border border-[#dcc0bd] ${isMobile ? 'p-4' : 'p-6'} rounded-xl flex items-center gap-4`}>
                <div className={`w-12 h-12 ${s.iconBg} flex items-center justify-center rounded-full flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${s.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-mono text-[#554240]/60">{s.label}</p>
                  <p className="text-2xl font-bold text-[#151c27]">
                    {loading ? '—' : s.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Users List ──────────────────────────────────────────────── */}
          <div className="space-y-6">

            {loading ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-[#dcc0bd] block mb-3 animate-spin">autorenew</span>
                <p className="text-[#554240] text-sm font-mono">Loading users from database...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-[#dcc0bd] block mb-3">group_add</span>
                <p className="text-[#554240] text-sm">No users found in the database.</p>
              </div>
            ) : (
              <>
                {ROLE_SECTIONS.map(({ key, label, icon }) => {
                  const list = grouped[key]
                  if (!list || list.length === 0) return null

                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#dcc0bd] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#554240] text-[18px]">{icon}</span>
                          <h3 className="text-lg font-semibold text-[#554240]">{label}</h3>
                        </div>
                        <span className="px-2 py-0.5 bg-[#dce2f3] text-[#151c27] text-xs font-bold font-mono rounded">
                          {list.length} {list.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>

                      {/* Admin / Staff / Technician rows */}
                      {key !== 'student' && (
                        <div className="bg-white border border-[#dcc0bd] rounded-xl overflow-hidden divide-y divide-[#dcc0bd] shadow-sm">
                          {list.map(u => (
                            <div key={u.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 hover:bg-[#f0f3ff] transition-colors group">
                              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelected(u)}>
                                <Avatar user={u} />
                                <div>
                                  <h4 className="font-bold text-[#151c27]">{u.name}</h4>
                                  <p className="text-xs font-mono text-[#554240]">{u.dept}{u.specialty ? ` · ${u.specialty}` : ''}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
                                <span className={`px-3 py-1 text-xs font-bold font-mono rounded-full uppercase ${ROLE_BADGE[u.role]}`}>
                                  {u.role}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-[#396844]' : 'bg-[#89726f]'}`} />
                                  <span className="text-xs font-mono text-[#554240]">{u.status}</span>
                                </div>
                                <div className="flex gap-0.5">
                                  <button onClick={() => setEditing({ ...u })}
                                    className="p-2 text-[#554240] hover:text-[#210000] hover:bg-[#e7eefe] rounded-full transition-colors" title="Edit">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>
                                  <button onClick={() => deactivateUser(u.id)}
                                    className="p-2 text-[#554240] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors" title="Deactivate">
                                    <span className="material-symbols-outlined text-[18px]">person_off</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Students — card grid */}
                      {key === 'student' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {list.map(u => (
                            <div key={u.id}
                              className="bg-white border border-[#dcc0bd] p-4 rounded-xl flex items-center gap-4 hover:border-[#ffb4aa] transition-all group cursor-pointer relative"
                              onClick={() => setSelected(u)}
                            >
                              <Avatar user={u} size="lg" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#151c27] truncate">{u.name}</p>
                                <p className="text-xs font-mono text-[#554240] truncate">{u.matric || u.dept}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-[#ffdcc3]/20 text-[#6e3900] text-[10px] font-bold rounded uppercase">student</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-[#396844]' : 'bg-[#89726f]'}`} />
                                  <span className="text-[10px] font-mono text-[#554240]">{u.status}</span>
                                </div>
                              </div>

                              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setStudentMenu(studentMenu === u.id ? null : u.id)}
                                  className="p-1.5 hover:bg-[#e7eefe] rounded-full transition-colors">
                                  <span className="material-symbols-outlined text-[18px] text-[#554240]">more_vert</span>
                                </button>
                                {studentMenu === u.id && (
                                  <div className="absolute right-0 top-8 bg-white border border-[#dcc0bd] rounded-xl shadow-lg z-20 w-44 overflow-hidden">
                                    <button onClick={() => { setSelected(u); setStudentMenu(null) }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0f3ff] flex items-center gap-2">
                                      <span className="material-symbols-outlined text-[16px]">visibility</span> View Profile
                                    </button>
                                    <button onClick={() => { setEditing({ ...u }); setStudentMenu(null) }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0f3ff] flex items-center gap-2">
                                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                                    </button>
                                    <button onClick={() => { toggleStatus(u.id); setStudentMenu(null) }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0f3ff] flex items-center gap-2">
                                      <span className="material-symbols-outlined text-[16px]">toggle_on</span>
                                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {filtered.length === 0 && (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-[#dcc0bd] block mb-3">manage_accounts</span>
                    <p className="text-[#554240] text-sm">No users match your search.</p>
                    <button onClick={() => { setSearch(''); setRole('All') }} className="mt-3 text-xs font-mono text-[#4a0404] underline">
                      Clear filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-8">
              <p className="text-xs font-mono text-[#554240]">
                Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-2 border border-[#dcc0bd] rounded-lg text-xs font-mono hover:bg-[#e7eefe] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} /> {!isMobile && 'Previous'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-2">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-xs text-[#554240]">...</span>}
                      <button onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-xs font-mono transition-colors ${p === safePage ? 'bg-[#210000] text-white shadow-sm' : 'border border-[#dcc0bd] hover:bg-[#e7eefe]'}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 border border-[#dcc0bd] rounded-lg text-xs font-mono hover:bg-[#e7eefe] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {!isMobile && 'Next'} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* ── User Detail Modal ─────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start p-6 border-b border-[#dcc0bd]">
              <div className="flex items-center gap-4">
                <Avatar user={selected} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-[#151c27]">{selected.name}</h2>
                  <p className="text-xs font-mono text-[#554240]">{selected.dept}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-[#f0f3ff] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 text-xs font-bold font-mono rounded-full uppercase ${ROLE_BADGE[selected.role]}`}>
                  {selected.role}
                </span>
                <span className={`px-3 py-1 text-xs font-bold font-mono rounded-full ${selected.status === 'Active' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  {selected.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['DEPARTMENT', selected.dept],
                  ['JOINED',     selected.joined],
                  selected.specialty && ['SPECIALTY', selected.specialty],
                  selected.matric    && ['MATRIC NO.', selected.matric],
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[10px] font-mono text-[#554240]/60 uppercase tracking-wider mb-1">{l}</p>
                    <p className="font-medium text-[#151c27]">{v}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditing({ ...selected }); setSelected(null) }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm font-mono hover:bg-[#f0f3ff] transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
                <button onClick={() => toggleStatus(selected.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-mono hover:opacity-90 transition-opacity ${selected.status === 'Active' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#b8ecbe] text-[#1a3d25]'}`}>
                  {selected.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ───────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-[#dcc0bd]">
              <div>
                <h2 className="text-xl font-bold text-[#210000]">Edit User</h2>
                <p className="text-xs font-mono text-[#554240] mt-0.5 truncate max-w-[280px]">ID: {editing.id}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-[#f0f3ff] rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">FULL NAME</label>
                <input type="text" required value={editing.name}
                  onChange={e => setEditing(n => ({ ...n, name: e.target.value }))}
                  className={inp} />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] mb-1.5">DEPARTMENT</label>
                <input type="text" value={editing.dept}
                  onChange={e => setEditing(n => ({ ...n, dept: e.target.value }))}
                  className={inp} placeholder="e.g. Computer Science" />
              </div>
              {editing.role === 'technician' && (
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">SPECIALTY</label>
                  <input type="text" value={editing.specialty || ''}
                    onChange={e => setEditing(n => ({ ...n, specialty: e.target.value }))}
                    className={inp} placeholder="e.g. Electrical, Plumbing" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">ROLE</label>
                  <select value={editing.role} onChange={e => setEditing(n => ({ ...n, role: e.target.value }))}
                    className={`${inp} cursor-pointer`}>
                    {['admin', 'staff', 'technician', 'student'].map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#554240] mb-1.5">STATUS</label>
                  <select value={editing.status} onChange={e => setEditing(n => ({ ...n, status: e.target.value }))}
                    className={`${inp} cursor-pointer`}>
                    {['Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-2.5 border border-[#dcc0bd] rounded-lg text-sm font-mono hover:bg-[#f0f3ff] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono hover:opacity-90 transition-opacity font-bold disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed ${isMobile ? 'bottom-[76px]' : 'bottom-6'} left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full text-sm font-mono shadow-xl flex items-center gap-2 whitespace-nowrap
          ${toast.isError ? 'bg-[#ba1a1a] text-white' : 'bg-[#151c27] text-white'}`}>
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.isError ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}

      {studentMenu && <div className="fixed inset-0 z-10" onClick={() => setStudentMenu(null)} />}
    </div>
  )
}