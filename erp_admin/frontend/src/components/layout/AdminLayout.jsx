import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  Avatar, Badge, Tooltip, Menu, MenuItem, Divider, IconButton,
  Drawer, ClickAwayListener, CircularProgress,
} from '@mui/material';
import {
  Dashboard, People, School, MenuBook, AccountBalance,
  Forum, Settings, Notifications, Search, Menu as MenuIcon,
  Logout, Person, ChevronRight, Close, KeyboardArrowDown, AdminPanelSettings, HelpOutline, Badge as BadgeIcon,
} from '@mui/icons-material';

const baseNavItems = [
  { label: 'Dashboard', icon: Dashboard, path: '/dashboard' },
  { label: 'Students', icon: People, path: '/students' },
  { label: 'Teachers', icon: School, path: '/teachers' },
  { label: 'HR', icon: BadgeIcon, path: '/hr' },
  { label: 'Academics', icon: MenuBook, path: '/academics' },
  { label: 'Finance', icon: AccountBalance, path: '/finance' },
  { label: 'Communication', icon: Forum, path: '/communication' },
];

const adminNavItem = { label: 'My Admins', icon: AdminPanelSettings, path: '/my-admins' };

const bottomItems = [
  { label: 'Settings', icon: Settings, path: '/settings' },
];

function SidebarContent({ onClose, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = useMemo(() => {
    if (user?.portal === 'accounts') return [];
    return user?.role === 'superadmin' ? [...baseNavItems, adminNavItem] : baseNavItems;
  }, [user]);

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <div className="font-finance-body flex flex-col h-full bg-[#f6f7fb] text-slate-900">
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center shadow-card">
            <School sx={{ fontSize: 18, color: 'white' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">University ERP</p>
            <p className="font-finance-display text-xl font-extrabold text-slate-950 leading-tight">AYRA ERP</p>
            <p className="text-xs text-slate-500 font-medium mt-1"></p>
          </div>
        </div>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.35em] px-4 mb-3">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`sidebar-link w-full ${active ? 'active' : ''}`}
            >
              <Icon sx={{ fontSize: 19 }} className="link-icon flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight sx={{ fontSize: 16, ml: 'auto' }} />}
            </button>
          );
        })}

        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.35em] px-4 mb-3">System</p>
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`sidebar-link w-full ${active ? 'active' : ''}`}
              >
                <Icon sx={{ fontSize: 19 }} className="link-icon flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[24px] bg-white border border-slate-200 shadow-sm">
          <Avatar sx={{ width: 38, height: 38, bgcolor: '#0f172a', fontSize: 14, fontWeight: 700 }}>
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@university.edu'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Accounts portal: FinancePage is a fully standalone workspace — render nothing around it
  if (user?.portal === 'accounts') {
    return (
      <main className="h-screen overflow-hidden">
        <Outlet />
      </main>
    );
  }

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [helpAnchor, setHelpAnchor] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Fee submission deadline', desc: 'Semester fee due in 3 days', time: '2h ago', unread: true, tone: '#d97706' },
    { id: 2, title: 'New admission request', desc: '12 new applications pending review', time: '5h ago', unread: true, tone: '#2563eb' },
    { id: 3, title: 'Exam schedule updated', desc: 'Mid-term exams updated for CS dept.', time: '1d ago', unread: false, tone: '#0f766e' },
    { id: 4, title: 'Faculty meeting', desc: 'Dept. heads meeting on Friday 10am', time: '2d ago', unread: false, tone: '#7c3aed' },
  ];
  const helpItems = [
    'Use the top search to jump directly into students, faculty, courses, announcements, and admins.',
    'The new theme mirrors the finance workspace across the full ERP for consistent navigation and visual rhythm.',
    'Profile, settings, and sign out remain available from the avatar menu at the top right.',
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const sectionTitles = {
    students: 'Students',
    teachers: 'Teachers',
    courses: 'Academics',
    announcements: 'Communication',
    admins: 'My Admins',
  };

  useEffect(() => {
    const query = searchVal.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const requests = [
          api.get('/students', { params: { search: query, limit: 3 } }),
          api.get('/teachers', { params: { search: query, limit: 3 } }),
          api.get('/academics/courses', { params: { search: query, limit: 3 } }),
          api.get('/communication/announcements', { params: { search: query, limit: 3 } }),
        ];

        if (user?.role === 'superadmin') {
          requests.push(api.get('/admins', { params: { search: query, limit: 3, includeDeleted: true } }));
        }

        const responses = await Promise.all(requests);
        const [studentsRes, teachersRes, coursesRes, announcementsRes, adminsRes] = responses;

        const mapped = [
          ...(studentsRes?.data?.data?.students || []).map((item) => ({
            id: item._id,
            section: 'students',
            label: item.name,
            subtitle: `${item.rollNo} • ${item.department}`,
            path: '/students',
          })),
          ...(teachersRes?.data?.data?.teachers || []).map((item) => ({
            id: item._id,
            section: 'teachers',
            label: item.name,
            subtitle: `${item.facultyId} • ${item.department}`,
            path: '/teachers',
          })),
          ...(coursesRes?.data?.data?.courses || []).map((item) => ({
            id: item._id,
            section: 'courses',
            label: item.name,
            subtitle: `${item.code} • ${item.department}`,
            path: '/academics',
          })),
          ...(announcementsRes?.data?.data?.announcements || []).map((item) => ({
            id: item._id,
            section: 'announcements',
            label: item.title,
            subtitle: `${item.category} • ${item.status}`,
            path: '/communication',
          })),
          ...((adminsRes?.data?.data?.admins || []).map((item) => ({
            id: item._id,
            section: 'admins',
            label: item.name,
            subtitle: `${item.username} • ${item.isDeleted ? 'Archived' : item.role}`,
            path: '/my-admins',
          }))),
        ];

        setSearchResults(mapped);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
        setSearchOpen(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchVal, user?.role]);

  const groupedResults = useMemo(() => {
    return searchResults.reduce((acc, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {});
  }, [searchResults]);

  const handleResultClick = (item) => {
    navigate(item.path);
    setSearchOpen(false);
    setSearchVal('');
  };

  return (
    <div className="font-finance-body flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_32%),linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#eef1f5_100%)]">
      <aside className="hidden lg:flex w-[290px] flex-shrink-0 border-r border-white/60 bg-[#f6f7fb]/95">
        <div className="fixed flex h-screen w-[290px] flex-col">
          <SidebarContent user={user} />
        </div>
      </aside>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 290, border: 'none' } }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} user={user} />
      </Drawer>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <IconButton
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { lg: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Application</p>
                <h1 className="font-finance-display text-2xl font-extrabold text-slate-950">University ERP</h1>
              </div>
            </div>

            <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
              <div className="flex-1 max-w-3xl relative">
              <div className="relative flex items-center">
                <Search sx={{ fontSize: 18, color: '#94a3b8', position: 'absolute', left: 14 }} />
                <input
                  type="text"
                  value={searchVal}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Global search across students, faculty, courses, announcements, admins..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200/70 focus:border-slate-300 transition-all"
                />
                {searchLoading && (
                  <div className="absolute right-4">
                    <CircularProgress size={16} />
                  </div>
                )}
              </div>

              {searchOpen && (
                <div className="absolute top-[calc(100%+10px)] left-0 right-0 z-30 rounded-[24px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  {Object.keys(groupedResults).length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-400">
                      {searchVal.trim().length < 2 ? 'Type at least 2 characters to search.' : 'No matching records found.'}
                    </div>
                  ) : (
                    Object.entries(groupedResults).map(([section, items]) => (
                      <div key={section} className="border-b border-slate-100 last:border-b-0">
                        <div className="px-4 py-2 bg-slate-50 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          {sectionTitles[section]}
                        </div>
                        {items.map((item) => (
                          <button
                            key={`${section}-${item.id}`}
                            onClick={() => handleResultClick(item)}
                            className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors"
                          >
                            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
              </div>
            </ClickAwayListener>

            <div className="flex items-center gap-2 ml-auto self-end lg:self-auto lg:h-11">
              <Tooltip title="Notifications">
                <IconButton
                  onClick={(e) => setNotifAnchor(e.currentTarget)}
                  size="small"
                  sx={{
                    width: 44,
                    height: 44,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#fff',
                    alignSelf: 'center',
                  }}
                >
                <Badge badgeContent={unreadCount} color="error" max={9} overlap="circular">
                  <Notifications sx={{ fontSize: 20, color: '#64748b' }} />
                </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Help">
                <IconButton
                  onClick={(e) => setHelpAnchor(e.currentTarget)}
                  size="small"
                  sx={{
                    width: 44,
                    height: 44,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#fff',
                    alignSelf: 'center',
                  }}
                >
                  <HelpOutline sx={{ fontSize: 20, color: '#64748b' }} />
                </IconButton>
              </Tooltip>

              <div
                className="flex h-11 items-center gap-2.5 cursor-pointer border border-slate-200 bg-white rounded-2xl px-3 py-2 transition-colors hover:border-slate-300 hover:shadow-sm"
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#0f172a', fontSize: 13, fontWeight: 700 }}>
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
              <KeyboardArrowDown sx={{ fontSize: 16, color: '#94a3b8' }} />
            </div>
          </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{
          sx: {
            width: 380,
            borderRadius: '24px',
            mt: 1.5,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16)',
            backgroundImage: 'none',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-finance-display text-lg font-extrabold text-slate-950">Notifications</p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{unreadCount} unread updates</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Today
            </div>
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto bg-white px-3 py-3">
          {notifications.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => setNotifAnchor(null)}
              sx={{
                alignItems: 'flex-start',
                borderRadius: '18px',
                px: 1.5,
                py: 1.5,
                mb: 1,
                mx: 0.5,
                backgroundColor: n.unread ? '#f8fafc' : 'transparent',
              }}
            >
              <div className="flex w-full gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: n.tone }}
                  />
                  {n.unread ? <div className="mt-2 h-8 w-px bg-slate-200" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      {n.time}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{n.desc}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: `${n.tone}18`, color: n.tone }}
                    >
                      {n.unread ? 'Needs attention' : 'Reviewed'}
                    </span>
                  </div>
                </div>
              </div>
            </MenuItem>
          ))}
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            View all notifications
          </button>
        </div>
      </Menu>

      <Menu
        anchorEl={helpAnchor}
        open={Boolean(helpAnchor)}
        onClose={() => setHelpAnchor(null)}
        PaperProps={{ sx: { width: 360, borderRadius: '20px', mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {helpItems.map((item) => (
          <MenuItem key={item} onClick={() => setHelpAnchor(null)} sx={{ whiteSpace: 'normal', py: 1.5 }}>
            <span className="text-sm text-slate-700">{item}</span>
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 200, borderRadius: 2, mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div className="px-3 py-2.5">
          <p className="font-semibold text-sm text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
          <Person sx={{ fontSize: 17, mr: 1.5, color: '#64748b' }} />
          <span className="text-sm">Profile</span>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
          <Settings sx={{ fontSize: 17, mr: 1.5, color: '#64748b' }} />
          <span className="text-sm">Settings</span>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: '#ef4444' }}>
          <Logout sx={{ fontSize: 17, mr: 1.5 }} />
          <span className="text-sm">Sign out</span>
        </MenuItem>
      </Menu>
    </div>
  );
}
