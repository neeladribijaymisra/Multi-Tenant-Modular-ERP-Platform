import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { HeroPanel, SurfaceCard } from '../../components/ui/PagePrimitives'

export default function Dashboard() {
  const { token } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState('today')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await apiRequest(`/monitoring/dashboard-stats?range=${range}`, { token })
        setDashboard(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [range, token])

  const areaData = useMemo(() => dashboard?.activityTrend || [], [dashboard])

  const tenantBar = useMemo(
    () => (dashboard?.tenantsByPlan || []).map((item) => ({
      name: item._id || 'Unknown',
      admins: item.count,
    })),
    [dashboard]
  )

  const roleData = useMemo(
    () => (dashboard?.adminsByRole || []).map((item, index) => ({
      name: item._id || 'Unassigned',
      value: item.count,
      color: ['#2563eb', '#0f766e', '#8b5cf6', '#d97706', '#ef4444'][index % 5],
    })),
    [dashboard]
  )

  const stats = [
    { label: 'Active Users', value: dashboard?.summary.activeUsers ?? '--', change: rangeLabel(range), tone: '#2563eb', icon: <PeopleIcon />, trend: 'engagement live', trendDirection: 'up' },
    { label: 'Failed Logins', value: dashboard?.summary.failedLoginAttempts ?? '--', change: 'Auth', tone: '#dc2626', icon: <LockAlertIcon />, trend: 'watch closely', trendDirection: 'down' },
    { label: 'System Errors', value: dashboard?.summary.systemErrorCount ?? '--', change: 'Alerts', tone: '#d97706', icon: <PulseIcon />, trend: 'incident load', trendDirection: 'down' },
    { label: 'API Response', value: `${dashboard?.summary.averageApiResponseTime ?? 0} ms`, change: 'Average', tone: '#0f766e', icon: <SparkIcon />, trend: 'latency stable', trendDirection: 'up' },
  ]

  if (loading) return <StatePanel title="Loading dashboard..." />
  if (error) return <StatePanel title={error} danger />

  return (
    <div className="space-y-6 animate-fade-in">
      <HeroPanel
        title="Operational Command View"
        description="Real KPI coverage across access, failures, tenant activity, and API responsiveness for the selected time window."
        right={(
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {['today', 'week', 'month'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className="px-4 py-2 rounded-2xl text-sm font-medium transition-all btn-premium"
                style={range === item ? { background: '#ffffff', color: '#14213d' } : { background: 'rgba(255,255,255,0.12)', color: '#eff6ff', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                {rangeLabel(item)}
              </button>
            ))}
          </div>
        )}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniHeroStat label="Admins" value={dashboard?.summary.totalAdmins ?? '--'} />
          <MiniHeroStat label="Active Tenants" value={dashboard?.summary.activeTenants ?? '--'} />
          <MiniHeroStat label="Pending Tenants" value={dashboard?.summary.pendingTenants ?? '--'} />
          <MiniHeroStat label="Roles" value={dashboard?.summary.totalRoles ?? '--'} />
        </div>
      </HeroPanel>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#14213d' }}>Visibility Snapshot</h2>
          <p className="text-sm mt-1" style={{ color: '#5f6f82' }}>
            Real metrics for {rangeLabel(range).toLowerCase()} with premium presentation and motion
          </p>
        </div>
        <div className="px-4 py-2 rounded-2xl premium-card text-sm" style={{ background: '#ffffff', border: '1px solid #d7e3f3', color: '#5f6f82' }}>
          Server-backed KPI window: <span style={{ color: '#14213d', fontWeight: 700 }}>{rangeLabel(range)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => (
          <SurfaceCard key={item.label} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-[20px] flex items-center justify-center metric-icon" style={{ background: `linear-gradient(135deg, ${item.tone}22, ${item.tone}10)`, color: item.tone, border: `1px solid ${item.tone}22` }}>
                {item.icon}
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-xl" style={{ color: item.tone, background: `${item.tone}14` }}>
                {item.change}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#14213d' }}>{item.value}</p>
            <div className="flex items-center justify-between gap-3 mt-2">
              <p className="text-xs" style={{ color: '#5f6f82' }}>{item.label}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl" style={{ color: item.trendDirection === 'down' ? '#dc2626' : '#0f766e', background: item.trendDirection === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(15,118,110,0.1)' }}>
                {item.trendDirection === 'down' ? <TrendDownIcon /> : <TrendUpIcon />}
                {item.trend}
              </span>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#14213d' }}>Platform Activity</h3>
              <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>Total events and failure spikes over the selected time window</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center metric-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
              <PulseIcon />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6eef7" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7a8898' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7a8898' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 12, fontSize: 12, color: '#14213d' }} />
              <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fill="url(#grad1)" dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="failures" stroke="#ef4444" strokeWidth={2} fill="url(#grad2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#14213d' }}>Admins By Role</h3>
              <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>Distribution from the live admin collection</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center metric-icon" style={{ background: 'rgba(15,118,110,0.1)', color: '#0f766e' }}>
              <PeopleIcon />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {roleData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 8, fontSize: 12, color: '#14213d' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roleData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl px-3 py-2 premium-card" style={{ background: '#fbfdff', border: '1px solid #edf3fb' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: '#5f6f82' }}>{item.name}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: '#14213d' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#14213d' }}>Tenants By Plan</h3>
              <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>Institution distribution across plan tiers</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center metric-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#8b5cf6' }}>
              <SparkIcon />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tenantBar} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6eef7" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a8898' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7a8898' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 12, fontSize: 12, color: '#14213d' }} />
              <Bar dataKey="admins" fill="#0f766e" radius={[8, 8, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#14213d' }}>Recent Admins</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <KpiChip label="Auth health" value={`${dashboard?.summary.failedLoginAttempts ?? 0} failures`} tone="#dc2626" />
            <KpiChip label="API speed" value={`${dashboard?.summary.averageApiResponseTime ?? 0} ms`} tone="#0f766e" />
          </div>
          <div className="space-y-2">
            {(dashboard?.recentAdmins || []).map((admin) => (
              <div key={admin._id} className="flex items-center justify-between rounded-2xl px-3 py-2 premium-card" style={{ background: '#fbfdff', border: '1px solid #edf3fb' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#14213d' }}>{admin.name}</p>
                  <p className="text-xs" style={{ color: '#5f6f82' }}>{admin.email}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-xl" style={{ color: '#2563eb', background: 'rgba(37,99,235,0.1)' }}>{admin.role}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function MiniHeroStat({ label, value }) {
  return (
    <div className="rounded-2xl px-4 py-4 premium-card" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/80">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}

function Card({ children }) {
  return <SurfaceCard>{children}</SurfaceCard>
}

function StatePanel({ title, danger = false }) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: '#ffffff', border: `1px solid ${danger ? '#f3c1c1' : '#d7e3f3'}`, boxShadow: '0 18px 45px rgba(15, 23, 42, 0.05)' }}>
      <p style={{ color: danger ? '#dc2626' : '#5f6f82' }}>{title}</p>
    </div>
  )
}

function KpiChip({ label, value, tone }) {
  return (
    <div className="rounded-2xl px-4 py-3 premium-card" style={{ background: `${tone}10`, border: `1px solid ${tone}20` }}>
      <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: '#7a8898' }}>{label}</p>
      <p className="text-sm font-semibold mt-1" style={{ color: tone }}>{value}</p>
    </div>
  )
}

function rangeLabel(range) {
  if (range === 'week') return 'This Week'
  if (range === 'month') return 'This Month'
  return 'Today'
}

function PeopleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}

function LockAlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" /><path d="M12 15v2" /></svg>
}

function PulseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
}

function SparkIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m13 2-2 6 6-2-2 6 6-2-8 12 2-8-6 2 4-6-6 2 6-10Z" /></svg>
}

function TrendUpIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17h10V7" /><path d="M17 17 7 7" /></svg>
}

function TrendDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 7h10v10" /><path d="M17 7 7 17" /></svg>
}
