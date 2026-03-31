import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { EmptyPanel, ErrorBanner, PageHeader, StatCard, SurfaceCard } from '../../components/ui/PagePrimitives'

const planColor = { Enterprise: '#2563eb', Pro: '#0f766e', Starter: '#d97706' }
const statusColor = { active: '#16a34a', pending: '#d97706', suspended: '#ef4444' }
const MODULES = ['Academics', 'Finance', 'HR', 'Library', 'Hostel', 'Exam', 'Alumni', 'Research', 'Transport', 'Canteen', 'Health', 'Security']
const TENANT_TYPES = ['University', 'Medical College', 'Research Institute', 'School', 'Other']
const TENANT_PLANS = ['Starter', 'Pro', 'Enterprise']

export default function ManageTenants() {
  const { token } = useAuth()
  const location = useLocation()
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    domain: '',
    type: 'University',
    plan: 'Starter',
    modules: ['Academics'],
  })

  const loadTenants = async () => {
    if (!token) {
      setError('Please sign in to access this page.')
      setLoading(false)
      return
    }

    try {
      setError('')
      const response = await apiRequest('/tenants?limit=100', { token })
      setTenants(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
  }, [token])

  useEffect(() => {
    if (location.state?.globalSearch) {
      setSearch(location.state.globalSearch)
    }
  }, [location.state])

  const filtered = useMemo(
    () => tenants.filter((tenant) => `${tenant.name} ${tenant.domain} ${tenant.type}`.toLowerCase().includes(search.toLowerCase())),
    [tenants, search]
  )

  const handleCreateTenant = async () => {
    if (!form.name || !form.domain) return
    try {
      setSubmitting(true)
      await apiRequest('/tenants', {
        method: 'POST',
        token,
        body: {
          ...form,
          contact: { name: '', email: '', phone: '' },
          maxUsers: 100,
          maxStudents: 1000,
          storageQuota: 50,
        },
      })
      setOpen(false)
      setForm({ name: '', domain: '', type: 'University', plan: 'Starter', modules: ['Academics'] })
      setLoading(true)
      await loadTenants()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTenantStatus = async (tenantId) => {
    try {
      const response = await apiRequest(`/tenants/${tenantId}/toggle-status`, { method: 'PATCH', token })
      setTenants((current) => current.map((tenant) => (tenant._id === tenantId ? response.data : tenant)))
      setSelected((current) => (current?._id === tenantId ? response.data : current))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <StatePanel title="Loading institutions..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="System Management"
        title="Colleges, Departments & Modules"
        description="Add institutions, configure their ERP modules, and track which colleges or departments are active, pending, or suspended."
        actions={<button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Add College / Department</button>}
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Institutions" value={tenants.length} badge="Directory" />
        <StatCard label="Active Institutions" value={tenants.filter((tenant) => tenant.status === 'active').length} accent="#16a34a" badge="Operational" />
        <StatCard label="Pending Onboarding" value={tenants.filter((tenant) => tenant.status === 'pending').length} accent="#d97706" badge="Queue" />
        <StatCard label="Modules Enabled" value={tenants.reduce((sum, tenant) => sum + (tenant.modules?.length || 0), 0)} accent="#7c3aed" badge="Coverage" />
      </div>

      <SurfaceCard>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <input type="text" placeholder="Search colleges, domains, or types..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl outline-none text-sm" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }} />
        </div>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <EmptyPanel title="No institutions found" description="Create your first college or department to begin module configuration." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tenant) => (
            <SurfaceCard key={tenant._id} className="cursor-pointer" soft>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-lg" style={{ color: '#14213d' }}>{tenant.name}</p>
                  <p className="text-xs font-mono mt-1" style={{ color: '#2563eb' }}>{tenant.domain}</p>
                </div>
                <div className="px-2.5 py-1 rounded-xl text-xs font-medium" style={{ background: `${statusColor[tenant.status]}14`, color: statusColor[tenant.status] }}>
                  {tenant.status}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat label="Admins" value={tenant.metadata?.admins ?? 0} />
                <MiniStat label="Students" value={(tenant.metadata?.students ?? 0).toLocaleString()} />
                <MiniStat label="Modules" value={tenant.modules?.length ?? 0} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: `${planColor[tenant.plan]}15`, color: planColor[tenant.plan] }}>{tenant.plan}</span>
                <span className="text-xs" style={{ color: '#7a8898' }}>{tenant.type}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {(tenant.modules || []).slice(0, 4).map((moduleName) => (
                  <span key={moduleName} className="text-xs px-2 py-1 rounded-lg" style={{ background: '#ffffff', border: '1px solid #d7e3f3', color: '#5f6f82' }}>
                    {moduleName}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(tenant)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: '#edf3ff', color: '#2563eb' }}>Manage Modules</button>
                <button onClick={() => toggleTenantStatus(tenant._id)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>Toggle Status</button>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {selected && (
        <Dialog open={!!selected} onClose={() => setSelected(null)} PaperProps={{ sx: { background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 4, minWidth: 760 } }}>
          <DialogTitle sx={{ color: '#14213d', fontFamily: 'Sora', fontWeight: 700 }}>{selected.name}</DialogTitle>
          <DialogContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SurfaceCard soft>
                <h3 className="font-semibold mb-4" style={{ color: '#14213d' }}>Institution Overview</h3>
                <div className="space-y-3">
                  <OverviewRow label="Domain" value={selected.domain} />
                  <OverviewRow label="Type" value={selected.type} />
                  <OverviewRow label="Plan" value={selected.plan} />
                  <OverviewRow label="Status" value={selected.status} />
                  <OverviewRow label="Max Users" value={selected.maxUsers} />
                  <OverviewRow label="Max Students" value={selected.maxStudents} />
                </div>
              </SurfaceCard>
              <SurfaceCard soft>
                <h3 className="font-semibold mb-4" style={{ color: '#14213d' }}>Configured Modules</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MODULES.map((moduleName) => {
                    const enabled = selected.modules?.includes(moduleName)
                    return (
                      <div key={moduleName} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background: enabled ? 'rgba(37,99,235,0.1)' : '#ffffff', color: enabled ? '#2563eb' : '#5f6f82', border: `1px solid ${enabled ? 'rgba(37,99,235,0.24)' : '#d7e3f3'}` }}>
                        {moduleName}
                      </div>
                    )
                  })}
                </div>
              </SurfaceCard>
            </div>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl text-sm" style={{ background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>Close</button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 4, minWidth: 560 } }}>
        <DialogTitle sx={{ color: '#14213d', fontFamily: 'Sora', fontWeight: 700 }}>Create Institution</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <div className="space-y-4">
            <Field label="Institution Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Domain" value={form.domain} onChange={(v) => setForm({ ...form, domain: v })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} type="select" options={TENANT_TYPES} />
              <Field label="Plan" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} type="select" options={TENANT_PLANS} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>Modules</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MODULES.map((moduleName) => {
                  const enabled = form.modules.includes(moduleName)
                  return (
                    <button key={moduleName} type="button" onClick={() => setForm({ ...form, modules: enabled ? form.modules.filter((item) => item !== moduleName) : [...form.modules, moduleName] })} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background: enabled ? 'rgba(37,99,235,0.1)' : '#f8fbff', border: `1px solid ${enabled ? 'rgba(37,99,235,0.28)' : '#d7e3f3'}`, color: enabled ? '#2563eb' : '#5f6f82' }}>
                      {moduleName}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm" style={{ background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>Cancel</button>
          <button onClick={handleCreateTenant} disabled={submitting} className="px-5 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Creating...' : 'Create Institution'}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center p-3 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #d7e3f3' }}>
      <p className="text-base font-bold" style={{ color: '#14213d' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>{label}</p>
    </div>
  )
}

function OverviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: '#5f6f82' }}>{label}</span>
      <span style={{ color: '#14213d', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', options }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }} />
      )}
    </div>
  )
}

function StatePanel({ title }) {
  return <SurfaceCard className="text-center"><p style={{ color: '#5f6f82' }}>{title}</p></SurfaceCard>
}
