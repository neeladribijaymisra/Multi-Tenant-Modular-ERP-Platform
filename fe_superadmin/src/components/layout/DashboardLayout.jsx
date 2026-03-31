import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'

const NAV = [
  { to: '/dashboard', icon: GridIcon, label: 'Dashboard' },
  { to: '/tenants', icon: BuildingIcon, label: 'Tenants' },
  { to: '/admins', icon: UsersIcon, label: 'Manage Admins' },
  { to: '/roles', icon: ShieldIcon, label: 'Roles & Permissions' },
  { to: '/monitoring', icon: ActivityIcon, label: 'Monitoring' },
  { to: '/settings', icon: SettingsIcon, label: 'System Settings' },
]

export default function DashboardLayout() {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [liveNow, setLiveNow] = useState(() => new Date())
  const [admins, setAdmins] = useState([])
  const [tenants, setTenants] = useState([])
  const [logs, setLogs] = useState([])
  const [health, setHealth] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loadingSearchData, setLoadingSearchData] = useState(true)
  const searchRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadHeaderData = async () => {
      if (!token) return

      try {
        setLoadingSearchData(true)
        const [adminsResponse, tenantsResponse, logsResponse, healthResponse] = await Promise.all([
          apiRequest('/admins?limit=100', { token }),
          apiRequest('/tenants?limit=100', { token }),
          apiRequest('/monitoring/audit-logs?limit=50', { token }),
          apiRequest('/monitoring/system-health', { token }),
        ])

        setAdmins(adminsResponse.data)
        setTenants(tenantsResponse.data)
        setLogs(logsResponse.data)
        setHealth(healthResponse.data)
      } finally {
        setLoadingSearchData(false)
      }
    }

    loadHeaderData()
  }, [token])

  useEffect(() => {
    const handleClickAway = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
      }

      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickAway)
    return () => document.removeEventListener('mousedown', handleClickAway)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const liveDate = useMemo(
    () =>
      liveNow.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    [liveNow]
  )

  const liveTime = useMemo(
    () =>
      liveNow.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [liveNow]
  )

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []

    const adminMatches = admins
      .filter((admin) =>
        `${admin.name} ${admin.email} ${admin.role} ${admin.tenant?.name || ''}`.toLowerCase().includes(term)
      )
      .slice(0, 4)
      .map((admin) => ({
        id: `admin-${admin._id}`,
        category: 'Admins',
        title: admin.name,
        subtitle: `${admin.role} - ${admin.email}`,
        meta: admin.tenant?.name || 'Unassigned tenant',
        color: '#2563eb',
        route: '/admins',
        searchValue: admin.name,
      }))

    const tenantMatches = tenants
      .filter((tenant) =>
        `${tenant.name} ${tenant.domain} ${tenant.type} ${tenant.plan}`.toLowerCase().includes(term)
      )
      .slice(0, 4)
      .map((tenant) => ({
        id: `tenant-${tenant._id}`,
        category: 'Tenants',
        title: tenant.name,
        subtitle: `${tenant.type} - ${tenant.domain}`,
        meta: `${tenant.plan} plan`,
        color: '#0f766e',
        route: '/tenants',
        searchValue: tenant.name,
      }))

    const logMatches = logs
      .filter((log) =>
        `${log.action} ${log.entity} ${log.user} ${log.details || ''} ${log.status}`.toLowerCase().includes(term)
      )
      .slice(0, 5)
      .map((log) => ({
        id: `log-${log._id}`,
        category: 'Logs',
        title: `${toTitleCase(log.action)} ${toTitleCase(log.entity)}`,
        subtitle: log.details || `${log.user || 'System'} triggered a ${log.status} event`,
        meta: new Date(log.createdAt).toLocaleString('en-IN'),
        color: log.status === 'failure' ? '#ef4444' : '#d97706',
        route: '/monitoring',
        searchValue: log.details || `${log.action} ${log.entity}`,
      }))

    return [...adminMatches, ...tenantMatches, ...logMatches].slice(0, 10)
  }, [admins, logs, search, tenants])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  const sidebarHighlights = useMemo(
    () => [
      { label: 'Unread', value: unreadCount, tone: '#2563eb' },
      { label: 'Alerts', value: health?.recentErrors24h ?? 0, tone: '#d97706' },
    ],
    [health?.recentErrors24h, unreadCount]
  )

  useEffect(() => {
    const adminCreatedNotifications = admins
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2)
      .map((admin) => ({
        id: `admin-created-${admin._id}`,
        kind: 'admin',
        title: 'Admin created',
        desc: `${admin.name} was added as ${admin.role}${admin.tenant?.name ? ` for ${admin.tenant.name}` : ''}.`,
        time: admin.createdAt,
        color: '#0f766e',
        route: '/admins',
        searchValue: admin.name,
      }))

    const failedLoginNotifications = logs
      .filter((log) => {
        const text = `${log.action} ${log.entity} ${log.details || ''}`.toLowerCase()
        return log.status === 'failure' && (text.includes('login') || text.includes('auth') || text.includes('sign in'))
      })
      .slice(0, 2)
      .map((log) => ({
        id: `failed-login-${log._id}`,
        kind: 'failed-login',
        title: 'Failed login',
        desc: log.details || `${log.user || 'Unknown user'} had a failed sign-in attempt.`,
        time: log.createdAt,
        color: '#ef4444',
        route: '/monitoring',
        searchValue: log.details || log.user || 'failed login',
      }))

    const systemAlerts = []

    if (health?.recentErrors24h > 0) {
      systemAlerts.push({
        id: 'system-alert-recent-errors',
        kind: 'system-alert',
        title: 'System alert',
        desc: `${health.recentErrors24h} failed system events were recorded in the last 24 hours.`,
        time: new Date().toISOString(),
        color: '#d97706',
        route: '/monitoring',
        searchValue: 'failure',
      })
    }

    const fallbackAlertLog = logs.find((log) => log.status === 'failure')
    if (!systemAlerts.length && fallbackAlertLog) {
      systemAlerts.push({
        id: `system-alert-${fallbackAlertLog._id}`,
        kind: 'system-alert',
        title: 'System alert',
        desc: fallbackAlertLog.details || `${fallbackAlertLog.entity} reported a failed event.`,
        time: fallbackAlertLog.createdAt,
        color: '#d97706',
        route: '/monitoring',
        searchValue: fallbackAlertLog.details || fallbackAlertLog.entity,
      })
    }

    const nextNotifications = [...failedLoginNotifications, ...systemAlerts, ...adminCreatedNotifications]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6)
      .map((item, index) => {
        const current = notifications.find((notification) => notification.id === item.id)
        return {
          ...item,
          read: current?.read ?? index > 1,
        }
      })

    setNotifications(nextNotifications)
  }, [admins, health, logs])

  const groupedResults = useMemo(() => {
    return searchResults.reduce((groups, result) => {
      if (!groups[result.category]) groups[result.category] = []
      groups[result.category].push(result)
      return groups
    }, {})
  }, [searchResults])

  const handleSearchSelect = (item) => {
    setSearch(item.title)
    setSearchOpen(false)
    navigate(item.route, { state: { globalSearch: item.searchValue } })
  }

  const handleNotificationSelect = (notification) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
    )
    setNotifOpen(false)
    navigate(notification.route, { state: { globalSearch: notification.searchValue } })
  }

  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <aside
        className="flex flex-col transition-all duration-300 relative z-20"
        style={{
          width: collapsed ? '78px' : '252px',
          background: 'linear-gradient(180deg, #fdfefe 0%, #f4f8ff 48%, #eef5ff 100%)',
          borderRight: '1px solid #d7e3f3',
          boxShadow: '18px 0 45px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div className="px-3 pt-3">
          <div className="rounded-[28px] p-3 relative overflow-hidden premium-card" style={{ background: 'linear-gradient(155deg, #15338a 0%, #2563eb 38%, #0f766e 100%)', boxShadow: '0 24px 50px rgba(21, 51, 138, 0.28)' }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }} />
            <div className="absolute -left-6 bottom-0 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="relative flex items-start gap-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="10" height="10" rx="2" fill="white" opacity="0.92" />
                  <rect x="18" y="4" width="10" height="10" rx="2" fill="white" opacity="0.62" />
                  <rect x="4" y="18" width="10" height="10" rx="2" fill="white" opacity="0.62" />
                  <rect x="18" y="18" width="10" height="10" rx="2" fill="white" opacity="0.92" />
                </svg>
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100/80">Control Layer</p>
                  <p className="font-bold text-base mt-1 text-white">ERP SuperAdmin</p>
                  <p className="text-xs mt-1 text-blue-50/80">Unified tenant, admin, and monitoring workspace</p>
                </div>
              )}
              <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-2 rounded-xl transition-all btn-premium" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
                </svg>
              </button>
            </div>

            {!collapsed && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {sidebarHighlights.map((item) => (
                  <div key={item.label} className="rounded-2xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-blue-100/75">{item.label}</p>
                    <p className="text-lg font-bold text-white mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pt-5 pb-2">
          {!collapsed && <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#7a8898' }}>Navigation</p>}
        </div>

        <nav className="flex-1 py-2 px-3 space-y-2 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Tooltip key={to} title={collapsed ? label : ''} placement="right">
              <NavLink
                to={to}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-150 premium-card ${isActive ? '' : 'hover:bg-blue-50'}`}
                style={({ isActive }) =>
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(15,118,110,0.1))',
                        color: '#14213d',
                        border: '1px solid rgba(37,99,235,0.18)',
                        boxShadow: '0 14px 30px rgba(37,99,235,0.12)',
                      }
                    : { color: '#5f6f82', border: '1px solid rgba(215,227,243,0.7)', background: 'rgba(255,255,255,0.58)' }
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center metric-icon" style={{ background: isActive ? 'rgba(37,99,235,0.14)' : 'rgba(148,163,184,0.08)', color: isActive ? '#2563eb' : '#5f6f82' }}>
                      <Icon size={18} color={isActive ? '#2563eb' : '#5f6f82'} />
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{label}</span>
                        <span className="text-[11px]" style={{ color: isActive ? '#2563eb' : '#8a97a8' }}>
                          {navHint(label)}
                        </span>
                      </div>
                    )}
                    {!collapsed && isActive && <div className="ml-auto w-2 h-2 rounded-full" style={{ background: '#0f766e', boxShadow: '0 0 0 6px rgba(15,118,110,0.12)' }} />}
                  </>
                )}
              </NavLink>
            </Tooltip>
          ))}
        </nav>

        <div className="px-3 pb-3">
          {!collapsed && (
            <div className="rounded-[24px] p-3 mb-3 premium-card" style={{ background: '#ffffff', border: '1px solid #d7e3f3' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: '#7a8898' }}>System Pulse</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#14213d' }}>Operational</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', color: '#16a34a' }}>
                  <PulseSidebarIcon />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span style={{ color: '#5f6f82' }}>Today</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{liveDate}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-[24px] p-3 premium-card" style={{ background: '#f4f8ff', border: '1px solid #dce7f6' }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#2563eb', fontSize: '0.76rem', fontWeight: 700 }}>
              {user?.avatar}
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#14213d' }}>{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: '#2563eb' }}>SuperAdmin</p>
                </div>
                <Tooltip title="Logout">
                  <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white transition-colors btn-premium" style={{ color: '#5f6f82' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 flex-shrink-0" style={{ background: 'rgba(248,251,255,0.92)', borderBottom: '1px solid #d7e3f3', backdropFilter: 'blur(20px)' }}>
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#7a8898' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search admins, tenants, logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-2xl outline-none transition-all"
              style={{ background: '#ffffff', border: '1px solid #d7e3f3', color: '#14213d', boxShadow: '0 8px 24px rgba(20, 33, 61, 0.04)' }}
              onFocus={(e) => {
                setSearchOpen(true)
                e.target.style.borderColor = '#2563eb'
              }}
              onBlur={(e) => { e.target.style.borderColor = '#d7e3f3' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono px-1.5 py-0.5 rounded-lg" style={{ background: '#edf3ff', color: '#6b7b90' }}>Ctrl K</span>
            {searchOpen && (
              <div className="absolute left-0 right-0 top-14 rounded-3xl overflow-hidden z-50" style={{ background: '#ffffff', border: '1px solid #d7e3f3', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.14)' }}>
                {search.trim() === '' ? (
                  <div className="px-4 py-4 text-sm" style={{ color: '#5f6f82' }}>
                    Search across admins, tenants, and monitoring logs.
                  </div>
                ) : loadingSearchData ? (
                  <div className="px-4 py-4 text-sm" style={{ color: '#5f6f82' }}>
                    Loading search index...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-sm" style={{ color: '#5f6f82' }}>
                    No matching admins, tenants, or logs found.
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([group, items], groupIndex) => (
                    <div key={group} style={{ borderTop: groupIndex === 0 ? 'none' : '1px solid #eef3f9' }}>
                      <div className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#7a8898' }}>
                        {group}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSearchSelect(item)}
                          className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#14213d' }}>{item.title}</p>
                              <p className="text-xs truncate mt-0.5" style={{ color: '#5f6f82' }}>{item.subtitle}</p>
                              <p className="text-xs mt-1" style={{ color: '#8a97a8' }}>{item.meta}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: '#ffffff', border: '1px solid #d7e3f3', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 0 6px rgba(16,185,129,0.12)' }} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#7a8898' }}>Realtime</p>
              <p className="text-sm font-semibold" style={{ color: '#14213d' }}>{liveTime}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#7a8898' }}>Today</p>
              <p className="text-sm font-semibold" style={{ color: '#2563eb' }}>{liveDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-xl transition-colors hover:bg-blue-50" style={{ color: '#5f6f82', background: '#ffffff', border: '1px solid #d7e3f3' }}>
                <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                </Badge>
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#ffffff', border: '1px solid #d7e3f3' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #e5edf7' }}>
                    <div>
                      <span className="text-sm font-semibold block" style={{ color: '#14213d' }}>Notifications</span>
                      <span className="text-xs" style={{ color: '#7a8898' }}>Admin activity, failed logins, and system alerts</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>{unreadCount} unread</span>
                  </div>
                  <div className="px-4 py-2 flex items-center justify-end gap-2" style={{ borderBottom: notifications.length ? '1px solid #f1f5fb' : 'none' }}>
                    <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: '#edf3ff', color: '#2563eb' }}>
                      Mark as read
                    </button>
                    <button type="button" onClick={handleClearAllNotifications} className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: '#fff7ed', color: '#b45309' }}>
                      Clear all
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-5 text-sm" style={{ color: '#5f6f82' }}>
                      No new notification items right now.
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationSelect(n)}
                        className="w-full px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors text-left"
                        style={{ borderBottom: i < notifications.length - 1 ? '1px solid #f1f5fb' : 'none', background: n.read ? '#ffffff' : '#f8fbff' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium" style={{ color: '#14213d' }}>{n.title}</p>
                              {!n.read && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>New</span>}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: '#5f6f82' }}>{n.desc}</p>
                            <p className="text-xs mt-1" style={{ color: '#8a97a8' }}>{formatRelativeTime(n.time)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#047857' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s infinite' }} />
              System Online
            </div>

            <div className="flex items-center gap-2 pl-2">
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>{user?.avatar}</Avatar>
              <div className="hidden md:block">
                <p className="text-xs font-semibold leading-tight" style={{ color: '#14213d' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: '#2563eb' }}>SuperAdmin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'transparent' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function formatRelativeTime(value) {
  const time = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((Date.now() - time) / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function navHint(label) {
  if (label === 'Dashboard') return 'Overview and KPIs'
  if (label === 'Tenants') return 'Institutions and modules'
  if (label === 'Manage Admins') return 'Access and ownership'
  if (label === 'Roles & Permissions') return 'Policy and control'
  if (label === 'Monitoring') return 'Health and audit trail'
  if (label === 'System Settings') return 'Platform preferences'
  return ''
}

function toTitleCase(value = '') {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function GridIcon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
}
function BuildingIcon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}
function UsersIcon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function ShieldIcon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}
function ActivityIcon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
}
function SettingsIcon({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
}
function PulseSidebarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
}
