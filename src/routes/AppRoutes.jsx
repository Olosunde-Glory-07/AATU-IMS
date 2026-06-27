import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Profile from '../pages/shared/Profile'
import ChangePassword from '../pages/shared/ChangePassword'

// Auth pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Callback from '../pages/auth/Callback'

// Layouts
import AdminLayout from '../layouts/AdminLayout'
import StaffLayout from '../layouts/StaffLayout'
import TechnicianLayout from '../layouts/TechnicianLayout'
import StudentLayout from '../layouts/StudentLayout'

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard'
import AdminRequests from '../pages/admin/Requests'
import AdminJobOrders from '../pages/admin/JobOrders'
import AdminAssets from '../pages/admin/Assets'
import AdminUsers from '../pages/admin/Users'
import AdminDepartments from '../pages/admin/Departments'
import AdminSystemHistory from '../pages/admin/SystemHistory'
import AdminNotifications from '../pages/admin/Notifications'

// Staff pages
import StaffDashboard from '../pages/staff/Dashboard'
import StaffMaintenanceRequests from '../pages/staff/MaintenanceRequests'
import StaffDepartmentalHistory from '../pages/staff/DepartmentalHistory'
import StaffNotifications from '../pages/staff/Notifications'

// Technician pages
import TechnicianDashboard from '../pages/technician/Dashboard'
import TechnicianMyJobs from '../pages/technician/MyJobs'
import TechnicianNotifications from '../pages/technician/Notifications'

// Student pages
import StudentDashboard from '../pages/student/Dashboard'
import StudentMyRequests from '../pages/student/MyRequests'
import StudentMyHistory from '../pages/student/MyHistory'
import StudentNotifications from '../pages/student/Notifications'

// Guards
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
  const { user, profile, loading } = useAuth()

  // 🔥 IMPORTANT: prevent routing before profile is ready
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Safe role getter
  const getRoleHome = () => {
    const role = profile?.role

    if (!role) return '/login'

    const map = {
      admin: '/admin/dashboard',
      staff: '/staff/dashboard',
      technician: '/technician/dashboard',
      student: '/student/dashboard',
    }

    return map[role] || '/login'
  }

  return (
    <Routes>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user && profile
            ? <Navigate to={getRoleHome()} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Change Password route */}
      <Route path="/change-password" element={<ChangePassword />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/callback" element={<Callback />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="job-orders" element={<AdminJobOrders />} />
          <Route path="assets" element={<AdminAssets />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="system-history" element={<AdminSystemHistory />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="profile" element={<Profile role="admin" />} />
        </Route>
      </Route>

      {/* Staff routes */}
      <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="requests" element={<StaffMaintenanceRequests />} />
          <Route path="history" element={<StaffDepartmentalHistory />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="profile" element={<Profile role="staff" />} />
        </Route>
      </Route>

      {/* Technician routes */}
      <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TechnicianDashboard />} />
          <Route path="my-jobs" element={<TechnicianMyJobs />} />
          <Route path="notifications" element={<TechnicianNotifications />} />
          <Route path="profile" element={<Profile role="technician" />} />
        </Route>
      </Route>

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="my-requests" element={<StudentMyRequests />} />
          <Route path="my-history" element={<StudentMyHistory />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="profile" element={<Profile role="student" />} />
        </Route>
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}