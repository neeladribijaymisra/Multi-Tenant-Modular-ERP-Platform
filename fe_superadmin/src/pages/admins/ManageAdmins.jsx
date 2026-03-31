import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { EmptyPanel, ErrorBanner, PageHeader, StatCard, SurfaceCard } from '../../components/ui/PagePrimitives'

const ROLES = ['Tenant Admin', 'HOD', 'Finance Admin', 'Exam Controller', 'Registrar']
const roleColor = {
  'Tenant Admin': '#2563eb',
  HOD: '#0f766e',
  'Finance Admin': '#16a34a',
  'Exam Controller': '#d97706',
  Registrar: '#7c3aed',
}
const statusColor = { active: '#16a34a', inactive: '#64748b', suspended: '#ef4444' }

export default function ManageAdmins() {
  const { token } = useAuth()
  const location = useLocation()
  const [admins, setAdmins] = useState([])
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: ROLES[0],
    tenant: '',
    password: '',
  })

  const loadData = async () => {
    if (!token) {
      setError('Please sign in to access this page.')
      setLoading(false)
      return
    }

    try {
      setError('')
      const [adminResponse, tenantResponse] = await Promise.all([
        apiRequest('/admins?limit=100', { token }),
        apiRequest('/tenants?limit=100', { token }),
      ])
      setAdmins(adminResponse.data)
      setTenants(tenantResponse.data)
      setForm((current) => ({
        ...current,
        tenant: current.tenant || tenantResponse.data[0]?._id || '',
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  useEffect(() => {
    if (location.state?.globalSearch) {
      setSearch(location.state.globalSearch)
    }
  }, [location.state])

  const filtered = useMemo(
    () =>
      admins.filter((admin) => {
        const tenantName = admin.tenant?.name || ''
        return (
          (filterRole === 'All' || admin.role === filterRole) &&
          (`${admin.name} ${admin.email} ${tenantName}`.toLowerCase().includes(search.toLowerCase()))
        )
      }),
    [admins, filterRole, search]
  )

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.tenant) return

    try {
      setSubmitting(true)
      setError('')
      await apiRequest('/admins', {
        method: 'POST',
        token,
        body: form,
      })
      await loadData()
      setOpen(false)
      setForm({
        name: '',
        email: '',
        role: ROLES[0],
        tenant: tenants[0]?._id || '',
        password: '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/admins/${id}`, { method: 'DELETE', token })
      setAdmins((current) => current.filter((admin) => admin._id !== id))
      setDeleteId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleStatus = async (id) => {
    try {
      const response = await apiRequest(`/admins/${id}/toggle-status`, {
        method: 'PATCH',
        token,
      })
      setAdmins((current) => current.map((admin) => (admin._id === id ? response.data : admin)))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <StatePanel title="Loading admins..." />
  }

  const activeAdmins = admins.filter((admin) => admin.status === 'active').length
  const suspendedAdmins = admins.filter((admin) => admin.status === 'suspended').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Access Control"
        title="Manage Admins"
        description="Create admins, assign them to colleges or departments, and keep responsibilities visible across the ERP network."
        actions={(
          <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 14px 28px rgba(37,99,235,0.18)' }}>
            Create Admin
          </button>
        )}
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Admins" value={admins.length} badge="Directory" meta="All configured administrators" />
        <StatCard label="Active Admins" value={activeAdmins} accent="#16a34a" badge="Online" meta="Ready for current operations" />
        <StatCard label="Suspended Admins" value={suspendedAdmins} accent="#ef4444" badge="Review" meta="Needs access review" />
        <StatCard label="Assigned Tenants" value={new Set(admins.map((admin) => admin.tenant?.name).filter(Boolean)).size} accent="#7c3aed" badge="Coverage" meta="Institutions with designated admins" />
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7a8898' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search by admin name, email, or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl outline-none text-sm"
              style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...ROLES].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={
                  filterRole === role
                    ? { background: '#2563eb', color: 'white' }
                    : { background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }
                }
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <EmptyPanel
          title="No admins found"
          description="Create your first admin or adjust the current filters to reveal more records."
          action={
            <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#2563eb' }}>
              Add Admin
            </button>
          }
        />
      ) : (
        <SurfaceCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #e6eef7', background: '#f8fbff' }}>
                  {['Admin', 'Role', 'Institution', 'Status', 'Joined', 'Actions'].map((header) => (
                    <th key={header} className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#7a8898' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((admin, index) => (
                  <tr key={admin._id} style={{ borderBottom: index < filtered.length - 1 ? '1px solid #eef3f9' : 'none' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: roleColor[admin.role] || '#2563eb', fontSize: '0.76rem', fontWeight: 700 }}>
                          {admin.avatar}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#14213d' }}>{admin.name}</p>
                          <p className="text-xs" style={{ color: '#5f6f82' }}>{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-medium" style={{ background: `${roleColor[admin.role]}16`, color: roleColor[admin.role] || '#2563eb' }}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#3d4c5f' }}>{admin.tenant?.name || '--'}</td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl" style={{ background: `${statusColor[admin.status]}14` }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: statusColor[admin.status] }} />
                        <span className="text-xs capitalize" style={{ color: statusColor[admin.status] }}>{admin.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: '#7a8898' }}>
                      {new Date(admin.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleStatus(admin._id)} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: '#edf3ff', color: '#2563eb' }}>
                          Toggle Status
                        </button>
                        <button onClick={() => setDeleteId(admin._id)} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: '#fff1f2', color: '#dc2626' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 4, minWidth: 520, boxShadow: '0 24px 65px rgba(15,23,42,0.12)' } }}>
        <DialogTitle sx={{ color: '#14213d', fontFamily: 'Sora', fontWeight: 700, pb: 1 }}>Create New Admin</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <div className="space-y-4">
            {[{ label: 'Full Name', key: 'name', type: 'text', ph: 'Dr. John Doe' }, { label: 'Email Address', key: 'email', type: 'email', ph: 'admin@university.edu' }, { label: 'Password', key: 'password', type: 'password', ph: 'Set a password' }].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>{field.label}</label>
                <input type={field.type} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.ph} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }} />
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>Assign Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }}>
                  {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>Assign Institution</label>
                <select value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }}>
                  {tenants.map((tenant) => <option key={tenant._id} value={tenant._id}>{tenant.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm" style={{ background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>Cancel</button>
          <button onClick={handleCreate} disabled={submitting} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Creating...' : 'Create Admin'}
          </button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { background: '#ffffff', border: '1px solid #fecaca', borderRadius: 4 } }}>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#fff1f2' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
          </div>
          <p className="font-semibold" style={{ color: '#14213d' }}>Delete Admin?</p>
          <p className="text-sm mt-1" style={{ color: '#5f6f82' }}>This removes the admin record from the system.</p>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm" style={{ background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>Cancel</button>
          <button onClick={() => handleDelete(deleteId)} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#dc2626' }}>Delete</button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

function StatePanel({ title }) {
  return <SurfaceCard className="text-center" ><p style={{ color: '#5f6f82' }}>{title}</p></SurfaceCard>
}
