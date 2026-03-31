import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/dashboard/Dashboard'
import ManageAdmins from './pages/admins/ManageAdmins'
import RolesPermissions from './pages/roles/RolesPermissions'
import ManageTenants from './pages/tenants/ManageTenants'
import SystemSettings from './pages/settings/SystemSettings'
import Monitoring from './pages/monitoring/Monitoring'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <RouteLoader label="Restoring your session..." />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <RouteLoader label="Checking authentication..." />
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

function RouteLoader({ label }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0f1e', color: '#94a3b8' }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 w-10 h-10 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin"
        />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admins" element={<ManageAdmins />} />
        <Route path="roles" element={<RolesPermissions />} />
        <Route path="tenants" element={<ManageTenants />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="monitoring" element={<Monitoring />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
