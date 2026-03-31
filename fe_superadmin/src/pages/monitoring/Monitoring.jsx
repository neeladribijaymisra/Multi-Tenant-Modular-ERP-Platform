import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { EmptyPanel, ErrorBanner, HeroPanel, PageHeader, StatCard, SurfaceCard } from '../../components/ui/PagePrimitives'

const levelColor = { info: '#2563eb', warning: '#d97706', error: '#ef4444', success: '#16a34a' }
const levelBg = { info: 'rgba(37,99,235,0.08)', warning: 'rgba(217,119,6,0.08)', error: 'rgba(239,68,68,0.08)', success: 'rgba(22,163,74,0.08)' }

export default function Monitoring() {
  const { token } = useAuth()
  const location = useLocation()
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchLog, setSearchLog] = useState('')
  const [health, setHealth] = useState(null)
  const [activity, setActivity] = useState([])
  const [failedLogins, setFailedLogins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState('today')

  useEffect(() => {
    const loadMonitoring = async () => {
      if (!token) {
        setError('Please sign in to access this page.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const [healthResponse, logsResponse, activityResponse] = await Promise.all([
          apiRequest(`/monitoring/system-health?range=${range}`, { token }),
          apiRequest('/monitoring/audit-logs?limit=50', { token }),
          apiRequest(`/monitoring/system-activity?range=${range}`, { token }),
        ])

        setHealth(healthResponse.data)
        setLogs(logsResponse.data)
        setActivity(
          activityResponse.data.activityByHour.map((item) => ({
            t: range === 'today' ? item._id.slice(11, 16) : item._id,
            count: item.count,
            failedLogins: item.failedLogins,
          }))
        )
        setFailedLogins(activityResponse.data.failedLoginLogs || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMonitoring()
  }, [range, token])

  useEffect(() => {
    if (location.state?.globalSearch) {
      setSearchLog(location.state.globalSearch)
    }
  }, [location.state])

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const searchable = `${log.details || ''} ${log.user} ${log.entity} ${log.action}`.toLowerCase()
        return (
          (filter === 'all' || log.status === filter || log.entity?.toLowerCase() === filter || log.action?.toLowerCase() === filter) &&
          searchable.includes(searchLog.toLowerCase())
        )
      }),
    [filter, logs, searchLog]
  )

  const nodes = useMemo(() => {
    if (!health) return []
    return [
      { id: 'Server', role: 'Express runtime', status: health.serverStatus, metric: health.memory.heapUsed, context: formatUptime(health.uptime), icon: <ServerIcon />, tone: '#2563eb' },
      { id: 'Database', role: health.dbName || 'MongoDB', status: health.dbStatus, metric: health.memory.heapTotal, context: health.dbStatus, icon: <DatabaseIcon />, tone: '#0f766e' },
      { id: 'API', role: 'Request pipeline', status: health.apiStatus, metric: `${health.apiResponseTimeMs || 0} ms`, context: health.apiLastRequestAt ? new Date(health.apiLastRequestAt).toLocaleTimeString('en-IN') : 'No traffic', icon: <SparkIcon />, tone: '#8b5cf6' },
    ]
  }, [health])

  if (loading) return <StatePanel title="Loading monitoring..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Monitoring"
        title="System Monitoring & Audit Control"
        description="Track server status, database health, API responsiveness, failed login attempts, and platform audit events from one operational workspace."
      />

      {error && <ErrorBanner message={error} />}

      <HeroPanel
        title="Live System Monitoring"
        description="Backend-driven telemetry for uptime, database connectivity, API health, and suspicious authentication activity."
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
          <HeroStatus label="Server" status={health?.serverStatus || 'unknown'} />
          <HeroStatus label="Database" status={health?.dbStatus || 'unknown'} />
          <HeroStatus label="API" status={health?.apiStatus || 'unknown'} />
          <HeroStatus label="Uptime" status={formatUptime(health?.uptime)} />
        </div>
      </HeroPanel>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Users" value={health?.activeUsers ?? 0} accent="#2563eb" badge={rangeLabel(range)} icon={<PeopleIcon />} trend="usage healthy" trendDirection="up" />
        <StatCard label="Failed Logins" value={health?.failedLoginAttempts ?? 0} accent="#ef4444" badge="Auth" icon={<ShieldAlertIcon />} trend="needs review" trendDirection="down" />
        <StatCard label="System Errors" value={health?.recentErrors24h ?? 0} accent="#d97706" badge="Failures" icon={<PulseIcon />} trend="ops pressure" trendDirection="down" />
        <StatCard label="API Response" value={`${health?.apiResponseTimeMs ?? 0} ms`} accent="#0f766e" badge="Average" icon={<SparkIcon />} trend="pipeline stable" trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {nodes.map((node) => (
          <SurfaceCard key={node.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-[20px] flex items-center justify-center metric-icon" style={{ background: `linear-gradient(135deg, ${node.tone}22, ${node.tone}10)`, color: node.tone, border: `1px solid ${node.tone}22` }}>
                {node.icon}
              </div>
              <div className="px-2.5 py-1 rounded-xl text-xs font-medium capitalize" style={{ background: `${node.status === 'online' || node.status === 'healthy' ? '#16a34a' : '#d97706'}14`, color: node.status === 'online' || node.status === 'healthy' ? '#16a34a' : '#d97706' }}>
                {node.status}
              </div>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#14213d' }}>{node.id}</p>
            <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>{node.role}</p>
            <div className="flex items-center justify-between text-sm mt-4">
              <span style={{ color: '#5f6f82' }}>Metric</span>
              <span style={{ color: '#14213d', fontWeight: 600 }}>{node.metric}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span style={{ color: '#5f6f82' }}>Context</span>
              <span style={{ color: '#14213d', fontWeight: 600 }}>{node.context}</span>
            </div>
          </SurfaceCard>
        ))}

        <SurfaceCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#14213d' }}>Platform Health</h3>
          <div className="space-y-3">
            <StatusRow label="Server status" value={health?.serverStatus || 'unknown'} tone={health?.serverStatus === 'online' ? '#16a34a' : '#ef4444'} />
            <StatusRow label="Database" value={`${health?.dbStatus || 'unknown'}${health?.dbName ? ` (${health.dbName})` : ''}`} tone={health?.dbStatus === 'online' ? '#16a34a' : '#d97706'} />
            <StatusRow label="API health" value={health?.apiStatus || 'unknown'} tone={health?.apiStatus === 'online' ? '#16a34a' : '#d97706'} />
            <StatusRow label="API uptime" value={formatUptime(health?.uptime)} tone="#2563eb" />
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#14213d' }}>Activity Trend</h3>
            <p className="text-sm mt-1" style={{ color: '#5f6f82' }}>Audit volume and failed login attempts for the selected window.</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center metric-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
            <PulseIcon />
          </div>
        </div>
        {activity.length === 0 ? (
          <EmptyPanel title="No activity yet" description="Audit events will appear here as admins use the platform." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6eef7" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#7a8898' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#7a8898' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d7e3f3', borderRadius: 12, fontSize: 12, color: '#14213d' }} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={false} name="Events" />
              <Line type="monotone" dataKey="failedLogins" stroke="#ef4444" strokeWidth={2} dot={false} name="Failed Logins" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#14213d' }}>Failed Login Tracking</h3>
            <p className="text-sm" style={{ color: '#5f6f82' }}>Latest failed authentication attempts with user and network context.</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs font-medium premium-card" style={{ background: '#fff1f2', color: '#dc2626' }}>
            {failedLogins.length} recent failure events
          </div>
        </div>
        {failedLogins.length === 0 ? (
          <EmptyPanel title="No failed logins detected" description="Authentication failures for the selected window will show up here." />
        ) : (
          <div className="space-y-3">
            {failedLogins.map((log) => (
              <div key={log._id} className="flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-2xl premium-card" style={{ background: '#fff7f7', border: '1px solid #fecaca' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center metric-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <ShieldAlertIcon />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#14213d' }}>{log.user || 'Unknown user'}</p>
                  <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>{log.details || 'Invalid credentials submitted'}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: '#7a8898' }}>
                    <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#14213d' }}>System Logs</h3>
            <p className="text-sm" style={{ color: '#5f6f82' }}>Filter audit logs by status, module type, or a free-text search.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input type="text" placeholder="Search logs..." value={searchLog} onChange={(e) => setSearchLog(e.target.value)} className="px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }} />
            <div className="flex gap-2 flex-wrap">
              {['all', 'success', 'failure', 'admin', 'tenant', 'role', 'settings', 'auth'].map((item) => (
                <button key={item} onClick={() => setFilter(item)} className="px-3 py-2 rounded-xl text-xs font-medium capitalize btn-premium" style={filter === item ? { background: '#2563eb', color: 'white' } : { background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyPanel title="No logs match the current filter" description="Try a different search term or wait for new system activity." />
        ) : (
          <div className="space-y-3">
            {filtered.map((log) => (
              <div key={log._id} className="flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-2xl premium-card" style={{ background: '#f8fbff', border: '1px solid #d7e3f3' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center metric-icon" style={{ background: log.status === 'failure' ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)', color: log.status === 'failure' ? '#ef4444' : '#16a34a' }}>
                  {log.status === 'failure' ? <ShieldAlertIcon /> : <PulseIcon />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#14213d' }}>{log.action} {log.entity}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: '#5f6f82' }}>
                    <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                    <span>User: {log.user}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>
                  {log.details && <p className="text-xs mt-2" style={{ color: '#7a8898' }}>{log.details}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium capitalize" style={{ background: levelBg[log.status === 'failure' ? 'error' : 'success'], color: levelColor[log.status === 'failure' ? 'error' : 'success'] }}>{log.status}</span>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#ffffff', border: '1px solid #d7e3f3', color: '#5f6f82' }}>{log.entity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}

function StatePanel({ title }) {
  return <SurfaceCard className="text-center"><p style={{ color: '#5f6f82' }}>{title}</p></SurfaceCard>
}

function HeroStatus({ label, status }) {
  return (
    <div className="rounded-2xl px-4 py-4 premium-card" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/80">{label}</p>
      <p className="text-lg font-bold text-white mt-1 capitalize">{status}</p>
    </div>
  )
}

function StatusRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: '#5f6f82' }}>{label}</span>
      <span style={{ color: tone, fontWeight: 700, textTransform: 'capitalize' }}>{value}</span>
    </div>
  )
}

function formatUptime(seconds = 0) {
  if (!seconds) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function rangeLabel(range) {
  if (range === 'week') return 'This Week'
  if (range === 'month') return 'This Month'
  return 'Today'
}

function PeopleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}

function ShieldAlertIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
}

function PulseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
}

function SparkIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m13 2-2 6 6-2-2 6 6-2-8 12 2-8-6 2 4-6-6 2 6-10Z" /></svg>
}

function ServerIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01" /><path d="M7 17h.01" /></svg>
}

function DatabaseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5" /><path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" /></svg>
}
