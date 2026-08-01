import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, ClipboardList, History, Bell, User, LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/staff/dashboard',     label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/staff/requests',      label: 'Maintenance Requests', icon: ClipboardList },
  { to: '/staff/history',       label: 'Dept. History',        icon: History },
  { to: '/staff/notifications', label: 'Notifications',        icon: Bell },
]

export default function StaffLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-[260px] bg-[#396844] text-white flex flex-col z-50 overflow-y-auto
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              AATU
            </div>
            <p className="text-xs text-white/60 font-mono">Staff Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-grow py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 py-3 px-6 text-xs font-mono tracking-wide transition-colors duration-200
                ${isActive ? 'bg-white/10 text-white font-bold' : 'text-white/70 hover:text-white hover:bg-white/5'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 w-1 h-full bg-[#a0d3a6] rounded-r" />}
                  <Icon size={18} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <NavLink
            to="/staff/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 py-3 px-4 text-xs font-mono tracking-wide transition-colors duration-200 rounded-lg
              ${isActive ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`
            }
          >
            <User size={18} /> Profile &amp; Settings
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 py-3 px-4 text-white/50 hover:text-white transition-colors text-xs font-mono">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px] pt-14 lg:pt-0">
        <Outlet />
      </div>
    </div>
  )
}