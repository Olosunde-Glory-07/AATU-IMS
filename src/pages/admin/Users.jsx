import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Plus, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { icon: 'dashboard',     label: 'Dashboard',     path: '/admin/dashboard'     },
  { icon: 'list_alt',      label: 'Requests',      path: '/admin/requests'      },
  { icon: 'engineering',   label: 'Job Orders',    path: '/admin/job-orders'    },
  { icon: 'inventory_2',   label: 'Assets',        path: '/admin/assets'        },
  { icon: 'group',         label: 'Users',         path: '/admin/users'         },
  { icon: 'domain',        label: 'Departments',   path: '/admin/departments'   },
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
  { key: 'technician', label: 'Technicians',    icon: 'engineering'          },
  { key: 'staff',      label: 'Staff',          icon: 'badge'                },
  { key: 'student',    label: 'Students',       icon: 'school'               },
]

const ITEMS_PER_PAGE = 10

// Note: no password in EMPTY_FORM for staff/technician
// Admin sets a temp password that the user must change on first login
const EMPTY_FORM = {
  full_name:  '',
  email:      '',
  role:       'staff',
  department: '',
  specialty:  '',
  password:   '',  // temporary password set by admin
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function avatarColor(id = '') {
  const n = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

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
          <button onClick={onClose} className="text-white/70 p-1"><X size={22} /></button>
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
                ${isActive
                  ? 'bg-white/[0.12] text-white font-bold border-l-4 border-[#ffb4aa]'
                  : 'text-white/65 hover:bg-white/[0.06] border-l-4 border-transparent'}`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="p-2 border-t border-white/10">
        <button onClick={() => navigate('/login')} className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 text-xs font-mono rounded hover:bg-white/[0.06] transition-colors">
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
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono tracking-wide
              ${isActive ? 'text-[#4a0404]' : 'text-[#554240]'}`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Users() {
  const isMobile  = useIsMobile()
  const navigate  = useNavigate()
  const { user: adminUser } = useAuth()

  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRole]        = useState('All')
  const [page,        setPage]        = useState(1)
  const [selected,    setSelected]    = useState(null)
  const [showNew,     setShowNew]     = useState(false)
  const [editing,     setEditing]     = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')
  const [toast,       setToast]       = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Fetch all users from profiles table ───────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, department, specialty, status, created_at, matric_number')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers((data ?? []).map(u => ({
        id:         u.id,
        name:       u.full_name ?? 'Unknown',
        email:      '',  // email not on profiles — fetched separately if needed
        role:       u.role ?? 'student',
        dept:       u.department ?? u.specialty ?? '—',
        status:     u.status ?? 'Active',
        matric:     u.matric_number ?? '',
        joined:     u.created_at
          ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : '—',
      })))
    } catch (err) {
      console.error('Fetch users error:', err)
      showToast('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Create user via Edge Function ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!form.full_name.trim()) { setFormError('Full name is required.');  return }
    if (!form.email.trim())     { setFormError('Email is required.');       return }
    if (!form.password.trim())  { setFormError('Temporary password is required.'); return }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return }

    setSubmitting(true)
    try {
      // Get the admin's session token to pass to the Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated. Please log in again.')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email:      form.email.trim().toLowerCase(),
            password:   form.password.trim(),
            full_name:  form.full_name.trim(),
            role:       form.role,
            department: form.department.trim() || null,
            specialty:  form.specialty.trim()  || null,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        // result.error comes from the Edge Function
        throw new Error(result.error ?? `Server error (${response.status})`)
      }

      // Success — refresh the users list from Supabase
      await fetchUsers()
      setShowNew(false)
      setForm(EMPTY_FORM)
      showToast(`Account created for ${form.email}. They will receive an OTP on first login.`)
    } catch (err) {
      console.error('Add user error:', err)
      setFormError(err.message || 'Failed to create user. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Toggle status ─────────────────────────────────────────────────────────
  async function toggleStatus(id) {
    const user = users.find(u => u.id === id)
    if (!user) return
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      setUsers(p => p.map(u => u.id === id ? { ...u, status: newStatus } : u))
      if (selected?.id === id) setSelected(s => ({ ...s, status: newStatus }))
      showToast('Status updated.')
    } catch (err) {
      showToast('Failed to update status.')
    }
  }

  // ── Delete user ───────────────────────────────────────────────────────────
  async function deleteUser(id) {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      if (error) throw error
      setUsers(p => p.filter(u => u.id !== id))
      if (selected?.id === id) setSelected(null)
      showToast('User removed.')
    } catch (err) {
      showToast('Failed to delete user.')
    }
  }

  // ── Save edit ─────────────────────────────────────────────────────────────
  async function saveEdit(e) {
    e.preventDefault()
    if (!editing) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name:  editing.name,
          role:       editing.role,
          department: editing.dept,
          status:     editing.status,
        })
        .eq('id', editing.id)
      if (error) throw error
      setUsers(p => p.map(u => u.id === editing.id ? { ...u, ...editing } : u))
      if (selected?.id === editing.id) setSelected(s => ({ ...s, ...editing }))
      setEditing(null)
      showToast('User updated.')
    } catch (err) {
      showToast('Failed to update user.')
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u =>
      (u.name.toLowerCase().includes(q) ||
       u.email.toLowerCase().includes(q) ||
       u.dept.toLowerCase().includes(q)) &&
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

        {/* Top Bar */}
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
                placeholder="Search users..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isMobile && (
              <select
                value={roleFilter}
                onChange={e => { setRole(e.target.value); setPage(1) }}
                className="px-3 py-2 border border-[#dcc0bd] text-sm rounded-lg focus:outline-none bg-white text-[#151c27] cursor-pointer"
              >
                {['All', 'admin', 'staff', 'technician', 'student'].map(r => (
                  <option key={r} value={r}>{r === 'All' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowNew(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-[#4a0404] text-white text-xs font-mono rounded-lg hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              {!isMobile && 'Add User'}
            </button>
          </div>
        </header>

        <div className={`${isMobile ? 'p-4' : 'p-8'} max-w-[1600px] mx-auto space-y-8`}>

          {/* Page Header */}
          <div>
            <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-[#210000]`}>User Management</h2>
            <p className="text-[#554240] mt-1 text-sm">Directory of university administrative and maintenance personnel.</p>
          </div>

          {/* Stat Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-6'}`}>
            {stats.map(s => (
              <div key={s.label} className={`bg-white border border-[#dcc0bd] ${isMobile ? 'p-4' : 'p-6'} rounded-xl flex items-center gap-4`}>
                <div className={`w-12 h-12 ${s.iconBg} flex items-center justify-center rounded-full flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${s.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-mono text-[#554240]/60">{s.label}</p>
                  <p className="text-2xl font-bold text-[#151c27]">{loading ? '—' : s.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* User List */}
          {loading ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-[#dcc0bd] block mb-3 animate-spin">progress_activity</span>
              <p className="text-[#554240] text-sm">Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-[#dcc0bd] block mb-3">group_add</span>
              <p className="text-[#554240] text-sm">No users yet. Click "Add User" to create the first account.</p>
            </div>
          ) : (
            <div className="space-y-6">
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

                    <div className="bg-white border border-[#dcc0bd] rounded-xl overflow-hidden divide-y divide-[#dcc0bd] shadow-sm">
                      {list.map(u => (
                        <div key={u.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 hover:bg-[#f0f3ff] transition-colors">
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelected(u)}>
                            <Avatar user={u} />
                            <div>
                              <h4 className="font-bold text-[#151c27]">{u.name}</h4>
                              <p className="text-xs font-mono text-[#554240]">{u.dept}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
                            <span className={`px-3 py-1 text-xs font-bold font-mono rounded-full uppercase ${ROLE_BADGE[u.role] ?? ''}`}>
                              {u.role}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-[#396844]' : 'bg-[#89726f]'}`} />
                              <span className="text-xs font-mono text-[#554240]">{u.status}</span>
                            </div>
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => setEditing({ ...u })}
                                className="p-2 text-[#554240] hover:text-[#210000] hover:bg-[#e7eefe] rounded-full transition-colors"
                                title="Edit user"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => toggleStatus(u.id)}
                                className="p-2 text-[#554240] hover:text-[#396844] hover:bg-[#b8ecbe]/30 rounded-full transition-colors"
                                title={u.status === 'Active' ? 'Deactivate' : 'Activate'}
                              >
                                <span className="material-symbols-outlined text-[18px]">{u.status === 'Active' ? 'person_off' : 'person'}</span>
                              </button>
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="p-2 text-[#554240] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
                                title="Delete user"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#dcc0bd]">
                  <span className="text-sm text-[#554240]">Page {safePage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-2 border border-[#dcc0bd] rounded-lg disabled:opacity-40 hover:bg-[#e7eefe] transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-2 border border-[#dcc0bd] rounded-lg disabled:opacity-40 hover:bg-[#e7eefe] transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* ── Add User Modal ──────────────────────────────────────────────────── */}
      {showNew && (
        <>
          <div onClick={() => setShowNew(false)} className="fixed inset-0 bg-black/30 z-[200]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[201] overflow-hidden" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div className="bg-[#4a0404] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Create User Account</h3>
                  <p className="text-white/60 text-xs font-mono mt-0.5">For staff and technician accounts only</p>
                </div>
                <button onClick={() => setShowNew(false)} className="text-white/70 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {formError && (
                <div className="flex items-start gap-2 p-3 bg-[#ffdad6] border border-[#ffb4aa] rounded-lg text-[#93000a] text-sm">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  className={inp}
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. Adeyemi Okafor"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  className={inp}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. adeyemi@aatu.edu.ng"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Role *</label>
                <select
                  className={`${inp} cursor-pointer`}
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-[11px] text-[#554240]/60 mt-1">Students must self-register via the student portal.</p>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Department</label>
                <input
                  className={inp}
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Faculty of Engineering"
                />
              </div>

              {form.role === 'technician' && (
                <div>
                  <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Specialty</label>
                  <input
                    className={inp}
                    value={form.specialty}
                    onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                    placeholder="e.g. Electrical, Plumbing, HVAC"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Temporary Password *</label>
                <input
                  type="password"
                  className={inp}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
                <p className="text-[11px] text-[#554240]/60 mt-1">
                  Share this with the user. They will be required to change it on first login.
                </p>
              </div>

              {/* Info banner */}
              <div className="flex gap-2 p-3 bg-[#f0f3ff] border border-[#dcc0bd] rounded-lg">
                <span className="material-symbols-outlined text-[#554240] text-[16px] flex-shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-[#554240] leading-relaxed">
                  When the user logs in for the first time, Supabase will send a <strong>6-digit OTP</strong> to their email to confirm it. After verification they will be required to <strong>change their password</strong> before accessing the app.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 border border-[#dcc0bd] rounded-lg text-sm text-[#151c27] hover:bg-[#f0f3ff] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono font-bold hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Creating…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Edit User Modal ─────────────────────────────────────────────────── */}
      {editing && (
        <>
          <div onClick={() => setEditing(null)} className="fixed inset-0 bg-black/30 z-[200]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[201] overflow-hidden">
            <div className="bg-[#4a0404] px-6 py-5 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Edit User</h3>
              <button onClick={() => setEditing(null)} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Full Name</label>
                <input className={inp} value={editing.name} onChange={e => setEditing(s => ({ ...s, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Role</label>
                <select className={`${inp} cursor-pointer`} value={editing.role} onChange={e => setEditing(s => ({ ...s, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="technician">Technician</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Department</label>
                <input className={inp} value={editing.dept} onChange={e => setEditing(s => ({ ...s, dept: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#554240] uppercase tracking-wider mb-1.5">Status</label>
                <select className={`${inp} cursor-pointer`} value={editing.status} onChange={e => setEditing(s => ({ ...s, status: e.target.value }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-[#dcc0bd] rounded-lg text-sm hover:bg-[#f0f3ff] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#4a0404] text-white rounded-lg text-sm font-mono font-bold hover:opacity-90">Save Changes</button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── User Detail Modal ───────────────────────────────────────────────── */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} className="fixed inset-0 bg-black/25 z-[200]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-2xl z-[201] overflow-hidden">
            <div className="bg-[#4a0404] px-6 py-5 flex items-center justify-between">
              <h3 className="text-white font-bold">User Profile</h3>
              <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white p-1"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar user={selected} size="lg" />
                <div>
                  <h4 className="font-bold text-[#151c27] text-lg">{selected.name}</h4>
                  <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded-full uppercase ${ROLE_BADGE[selected.role] ?? ''}`}>
                    {selected.role}
                  </span>
                </div>
              </div>
              {[
                ['Department', selected.dept],
                ['Status',     selected.status],
                ['Joined',     selected.joined],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm border-b border-[#f0f3ff] pb-2 last:border-0">
                  <span className="text-[#554240] font-mono text-xs uppercase tracking-wide">{label}</span>
                  <span className="font-medium text-[#151c27]">{value || '—'}</span>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setEditing({ ...selected }); setSelected(null) }} className="flex-1 py-2 border border-[#dcc0bd] rounded-lg text-sm hover:bg-[#f0f3ff] transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
                <button onClick={() => { toggleStatus(selected.id) }} className="flex-1 py-2 border border-[#dcc0bd] rounded-lg text-sm hover:bg-[#f0f3ff] transition-colors flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">{selected.status === 'Active' ? 'person_off' : 'person'}</span>
                  {selected.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#151c27] text-white px-6 py-3 rounded-full text-sm font-mono shadow-xl z-[300] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}