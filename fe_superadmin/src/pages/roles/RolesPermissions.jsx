import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { EmptyPanel, ErrorBanner, PageHeader, StatCard, SurfaceCard } from '../../components/ui/PagePrimitives'

const PERMISSIONS = {
  'Academic Management': ['View Students', 'Edit Students', 'Manage Courses', 'Grade Management', 'Attendance', 'Timetable'],
  'Financial Control': ['View Fees', 'Collect Fees', 'Fee Waiver', 'Expense Management', 'Financial Reports', 'Payroll'],
  'User Management': ['View Users', 'Create Users', 'Edit Users', 'Delete Users', 'Role Assignment', 'Password Reset'],
  'System Config': ['View Settings', 'Edit Settings', 'Module Config', 'Backup Access', 'Audit Logs', 'API Access'],
  'Reports & Analytics': ['View Reports', 'Export Data', 'Custom Reports', 'Dashboard Access', 'Analytics', 'Insights'],
}

export default function RolesPermissions() {
  const { token } = useAuth()
  const [roles, setRoles] = useState([])
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [perms, setPerms] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoles = async () => {
      if (!token) {
        setError('Please sign in to access this page.')
        setLoading(false)
        return
      }

      try {
        const response = await apiRequest('/roles?limit=100', { token })
        setRoles(response.data)
        setSelected(response.data[0] || null)
        setPerms(response.data[0]?.permissions || {})
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [token])

  const selectRole = (role) => {
    setSelected(role)
    setPerms(role.permissions || {})
    setEditing(false)
    setError('')
  }

  const togglePerm = (category, permission) => {
    const current = perms[category] || []
    setPerms({
      ...perms,
      [category]: current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    })
  }

  const saveChanges = async () => {
    if (!selected) return

    try {
      setSaving(true)
      const response = await apiRequest(`/roles/${selected._id}`, {
        method: 'PUT',
        token,
        body: {
          name: selected.name,
          description: selected.description,
          color: selected.color,
          permissions: perms,
        },
      })
      setRoles((current) => current.map((role) => (role._id === selected._id ? response.data : role)))
      setSelected(response.data)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalPerms = Object.values(perms).flat().length
  const totalRoles = roles.length
  const systemRoles = roles.filter((role) => role.isSystem).length
  const enabledCategories = useMemo(() => Object.values(perms).filter((entry) => entry?.length).length, [perms])

  if (loading) return <StatePanel title="Loading roles..." />
  if (!selected) {
    return <EmptyPanel title="No roles found" description="Seed or create roles first so permissions can be configured." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Access Control"
        title="Roles & Permissions"
        description="Define roles like Admin, HOD, Registrar, and Finance Admin, then assign the exact permissions each one should control."
        actions={
          editing
            ? (
              <>
                <button onClick={() => { setPerms(selected.permissions || {}); setEditing(false) }} className="px-4 py-2 rounded-2xl text-sm font-medium" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#5f6f82' }}>
                  Cancel
                </button>
                <button onClick={saveChanges} className="px-5 py-2 rounded-2xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </>
            )
            : <button onClick={() => setEditing(true)} className="px-5 py-2 rounded-2xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Edit Permissions</button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Roles" value={totalRoles} badge="Defined" />
        <StatCard label="System Roles" value={systemRoles} accent="#7c3aed" badge="Protected" />
        <StatCard label="Enabled Permissions" value={totalPerms} accent="#0f766e" badge="Live" />
        <StatCard label="Active Categories" value={enabledCategories} accent="#d97706" badge="Coverage" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <SurfaceCard className="xl:col-span-4">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#14213d' }}>Role Directory</h3>
          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role._id}
                onClick={() => selectRole(role)}
                className="w-full text-left p-4 rounded-2xl transition-all"
                style={{
                  background: selected._id === role._id ? `${role.color}12` : '#f8fbff',
                  border: `1px solid ${selected._id === role._id ? `${role.color}44` : '#d7e3f3'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${role.color}1a` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={role.color} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-sm" style={{ color: '#14213d' }}>{role.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${role.color}14`, color: role.color }}>{role.usersCount || 0} users</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>{role.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="xl:col-span-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: selected.color }} />
                <h3 className="font-bold" style={{ color: '#14213d' }}>{selected.name} Permissions</h3>
              </div>
              <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>{totalPerms} permissions enabled for this role</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#edf3ff', color: '#2563eb' }}>
              {editing ? 'Edit mode' : 'View mode'}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {Object.entries(PERMISSIONS).map(([category, permissionList]) => (
              <div key={category} className="rounded-2xl p-4" style={{ background: '#f8fbff', border: '1px solid #d7e3f3' }}>
                <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#7a8898' }}>{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {permissionList.map((permission) => {
                    const active = (perms[category] || []).includes(permission)
                    return (
                      <button
                        key={permission}
                        onClick={() => editing && togglePerm(category, permission)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-left"
                        style={{
                          background: active ? `${selected.color}14` : '#ffffff',
                          border: `1px solid ${active ? `${selected.color}40` : '#d7e3f3'}`,
                          color: active ? selected.color : '#5f6f82',
                          cursor: editing ? 'pointer' : 'default',
                        }}
                      >
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0" style={{ background: active ? selected.color : '#d7e3f3' }}>
                          {active && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        {permission}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

function StatePanel({ title }) {
  return <SurfaceCard className="text-center"><p style={{ color: '#5f6f82' }}>{title}</p></SurfaceCard>
}
