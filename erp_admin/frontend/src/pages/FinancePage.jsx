import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Drawer,
  Fade,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  Add,
  ArrowOutward,
  Assessment,
  AttachMoneyOutlined,
  CalendarMonthOutlined,
  CategoryOutlined,
  Close,
  DescriptionOutlined,
  HelpOutline,
  KeyboardArrowDown,
  Lock,
  Logout,
  Menu as MenuIcon,
  NotificationsNone,
  Paid,
  Payments,
  Person,
  Save,
  Search,
  SwapHorizOutlined,
  TrendingDown,
  Wallet,
} from '@mui/icons-material';
import StudentFinancePage from './StudentFinancePage';
import PayrollPage from './PayrollPage';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';

const financeNavItems = [
  { label: 'Finance Overview', path: 'overview' },
  { label: 'Students', path: 'students' },
  { label: 'Payroll', path: 'payroll' },
  { label: 'Settings', path: 'settings' },
];

const financeViews = new Set(['overview', 'students', 'payroll', 'settings']);

const getFinanceViewFromPath = (pathname = '') => {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return financeViews.has(lastSegment) ? lastSegment : 'overview';
};

const initialNotifications = [
  { id: 1, title: 'Vendor invoice due', description: 'Campus maintenance invoice needs approval by Friday.', time: '1h ago', tone: '#d97706', unread: true },
  { id: 2, title: 'Payroll cycle ready', description: 'Monthly payroll batch has been reconciled for release.', time: '4h ago', tone: '#0f766e', unread: true },
  { id: 3, title: 'Budget review reminder', description: 'Engineering faculty budget variance crossed 3% threshold.', time: 'Yesterday', tone: '#2563eb', unread: false },
];

const helpItems = [
  'Use the top search to filter recent transactions instantly.',
  'Generate Financial Report exports the visible transaction set as CSV.',
  'Add New Transaction supports income and expense entries for the overview.',
];

const defaultForm = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  details: '',
  category: 'Tuition',
  type: 'income',
  amount: '',
  status: 'Completed',
  entityCount: '',
  reference: '',
};

const statusStyles = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

const categoryPalette = ['#0f766e', '#2563eb', '#ca8a04', '#9333ea'];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    backgroundColor: '#fcfdff',
    transition: 'all 0.22s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    '& fieldset': { borderColor: 'rgba(203,213,225,0.95)' },
    '&:hover': { backgroundColor: '#ffffff', boxShadow: '0 12px 28px rgba(15,23,42,0.05)' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused': { backgroundColor: '#ffffff', boxShadow: '0 0 0 4px rgba(37,99,235,0.12)' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 1 },
  },
  '& .MuiInputBase-input': { py: 1.65 },
  '& .MuiSelect-select': { py: '13px !important' },
};

function SidebarContent({ onClose, onGenerateReport, activeView, onViewChange }) {
  return (
    <div className="font-finance-body flex h-full flex-col bg-[#f6f7fb] text-slate-900">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Finance Office</p>
            <h2 className="font-finance-display mt-3 text-2xl font-extrabold">Ayra ERP</h2>
            <p className="mt-2 text-sm text-slate-500">Academic Year 2024-25</p>
          </div>
          {onClose ? (
            <IconButton onClick={onClose} size="small">
              <Close fontSize="small" />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-2">
          {financeNavItems.map((item) => {
            const active = item.path === activeView;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.path) { onViewChange(item.path); if (onClose) onClose(); }
                }}
                className={`finance-nav-link w-full justify-between ${active ? 'active' : ''} ${item.path ? '' : 'opacity-80'}`}
              >
                <span>{item.label}</span>
                {!item.path ? (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Soon
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <Button
          fullWidth
          variant="contained"
          onClick={onGenerateReport}
          startIcon={<Assessment />}
          sx={{
            bgcolor: '#0f172a',
            color: '#fff',
            borderRadius: '18px',
            py: 1.4,
            '&:hover': { bgcolor: '#020617' },
          }}
        >
          Generate Report
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, subline, accent, trend }) {
  const Icon = icon;
  return (
    <div className="finance-card p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          <Icon />
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${accent}14`, color: accent }}>
          {trend}
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <p className="font-finance-display mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subline}</p>
    </div>
  );
}

export default function FinancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateUser } = useAuth();

  const [view, setView] = useState(() => getFinanceViewFromPath(location.pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [helpAnchor, setHelpAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [dialogOpen, setDialogOpen] = useState(false);
  // overview state
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [tableLimit, setTableLimit] = useState(8);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultForm);
  // students state
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  // settings state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const loadOverview = async () => {
    const { data } = await api.get('/finance/overview');
    setOverview(data.data);
  };

  const loadTransactions = async (query = '', limit = tableLimit) => {
    setTableLoading(true);
    try {
      const { data } = await api.get('/finance/transactions', {
        params: {
          search: query,
          limit,
        },
      });
      setTransactions(data.data.transactions);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadOverview(), loadTransactions('', tableLimit)]);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load finance overview.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTransactions(search, tableLimit).catch((err) => {
        setError(err.response?.data?.message || 'Unable to search finance transactions.');
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [search, tableLimit]);

  const loadStudents = useCallback(async (q = '') => {
    setStudentLoading(true);
    try {
      const { data } = await api.get('/students', { params: { search: q, limit: 50 } });
      setStudents(data.data.students);
    } catch { /* silent */ } finally { setStudentLoading(false); }
  }, []);

  useEffect(() => {
    if (view === 'students') loadStudents(studentSearch);
  }, [view, loadStudents]);

  useEffect(() => {
    const t = setTimeout(() => { if (view === 'students') loadStudents(studentSearch); }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  useEffect(() => {
    const nextView = getFinanceViewFromPath(location.pathname);
    setView((current) => (current === nextView ? current : nextView));
  }, [location.pathname]);

  const handleViewChange = useCallback((nextView) => {
    if (!nextView) return;
    setView(nextView);
    navigate(nextView === 'overview' ? '/finance' : `/finance/${nextView}`);
  }, [navigate]);

  const handleProfileSave = async () => {
    setProfileSaving(true); setProfileError(''); setProfileSuccess('');
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUser(data.data.admin);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) { setProfileError(err.response?.data?.message || 'Failed to update profile.'); }
    finally { setProfileSaving(false); }
  };

  const handlePasswordSave = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true); setPwError(''); setPwSuccess('');
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Password updated successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPwError(err.response?.data?.message || 'Failed to update password.'); }
    finally { setPwSaving(false); }
  };

  const handleGenerateReport = () => {
    const csvRows = [
      ['Reporting Period', overview?.reportingPeriod || 'June 2024 - Present'],
      [],
      ['Date', 'Description', 'Details', 'Category', 'Type', 'Amount', 'Status'],
      ...transactions.map((transaction) => [
        formatDate(transaction.date),
        transaction.description,
        transaction.details || '',
        transaction.category,
        transaction.type,
        transaction.amount,
        transaction.status,
      ]),
    ];

    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finance-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTransaction = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/finance/transactions', {
        ...form,
        amount: Number(form.amount),
        entityCount: form.entityCount ? Number(form.entityCount) : 0,
      });
      setDialogOpen(false);
      setForm(defaultForm);
      await Promise.all([loadOverview(), loadTransactions(search, tableLimit)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentReminder = useCallback((student) => {
    if (!student) return;

    const notificationBaseId = Date.now();
    const studentLabel = student.rollNo ? `${student.name} (${student.rollNo})` : student.name;

    setNotifications((current) => [
      {
        id: notificationBaseId,
        title: 'Payment reminder sent',
        description: `Fee reminder has been added to the student notification center for ${studentLabel}.`,
        time: 'Just now',
        tone: '#d97706',
        unread: true,
      },
      {
        id: notificationBaseId + 1,
        title: 'Reminder email queued',
        description: `Email notification prepared for ${student.email || studentLabel} from the Accounts Portal.`,
        time: 'Just now',
        tone: '#2563eb',
        unread: true,
      },
      ...current,
    ]);
    setSuccess(`Reminder sent to ${student.name}. Email and notification entries were added.`);
  }, []);

  const chartData = overview?.chart || [];
  const budgetAllocation = overview?.budgetAllocation || [];

  const filteredSummary = useMemo(() => {
    if (!overview) return [];

    return [
      {
        title: 'Total Revenue (FY 2024-25)',
        value: formatCurrency(overview.kpis.totalRevenue.value),
        subline: `${overview.kpis.totalRevenue.growth}% vs last year`,
        accent: '#2563eb',
        icon: Wallet,
        trend: `+${overview.kpis.totalRevenue.growth}%`,
      },
      {
        title: 'Outstanding Fees',
        value: formatCurrency(overview.kpis.outstandingFees.value),
        subline: `${overview.kpis.outstandingFees.students} students pending`,
        accent: '#d97706',
        icon: Paid,
        trend: 'Needs follow-up',
      },
      {
        title: 'Pending Vendor Payments',
        value: formatCurrency(overview.kpis.pendingVendorPayments.value),
        subline: `${overview.kpis.pendingVendorPayments.invoices} invoices due`,
        accent: '#7c3aed',
        icon: Payments,
        trend: 'Approval queue',
      },
      {
        title: 'Monthly Payroll Expense',
        value: formatCurrency(overview.kpis.monthlyPayrollExpense.value),
        subline: `${overview.kpis.monthlyPayrollExpense.employees} employees`,
        accent: '#0f766e',
        icon: TrendingDown,
        trend: 'Current cycle',
      },
    ];
  }, [overview]);

  // Master admin: render just the overview content inline (AdminLayout provides the shell)
  if (user?.portal !== 'accounts') {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <CircularProgress size={26} />
        </div>
      );
    }
    if (view === 'payroll') {
      return <PayrollPage />;
    }
    if (view === 'students') {
      return <StudentFinancePage onSendReminder={handleStudentReminder} />;
    }
    return (
      <div className="finance-page">
        {error ? <Alert sx={{ mb: 3 }} severity="error" onClose={() => setError('')}>{error}</Alert> : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fadeInUp">
          <div>
            <h1 className="finance-page-title text-[2.5rem]">Finance</h1>
            <p className="text-slate-500 text-sm mt-0.5">Reporting period: {overview?.reportingPeriod || 'June 2024 - Present'}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outlined" startIcon={<Assessment />} onClick={handleGenerateReport}
              sx={{ borderColor: '#e2e8f0', color: '#475569', borderRadius: '14px' }}>
              Generate Report
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
              sx={{ bgcolor: '#0f172a', borderRadius: '14px', '&:hover': { bgcolor: '#1e293b' } }}>
              Add Transaction
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-fadeInUp">
          {filteredSummary.map((item) => <MetricCard key={item.title} {...item} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fadeInUp">
          <div className="lg:col-span-2 finance-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="font-heading font-600 text-slate-900 text-base">Revenue vs. Expenses</h3>
                <p className="text-xs text-slate-400 mt-0.5">Monthly comparison Jan–Jun</p>
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#2563eb]" />Revenue</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#f59e0b]" />Expenses</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={10}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0' }} formatter={(v) => [`${v} L`, 'Amount']} />
                <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#2563eb" maxBarSize={30} />
                <Bar dataKey="expenses" radius={[10, 10, 0, 0]} fill="#f59e0b" maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="finance-card p-6">
            <h3 className="font-heading font-600 text-slate-900 text-base mb-1">Budget Allocation</h3>
            <p className="text-xs text-slate-400 mb-5">Variance tracking</p>
            <div className="space-y-4">
              {budgetAllocation.map((item, i) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="font-heading text-sm font-700 text-slate-950">{item.percent}%</p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percent}%`, backgroundColor: categoryPalette[i % categoryPalette.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="finance-card overflow-hidden animate-fadeInUp">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading font-600 text-slate-900 text-base">Recent Transactions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Income, expense, and status visibility</p>
            </div>
            <Button variant="text" endIcon={<ArrowOutward />} onClick={() => setTableLimit((c) => (c === 8 ? 24 : 8))} sx={{ color: '#0f172a', fontWeight: 700 }}>
              {tableLimit === 8 ? 'View All' : 'Show Recent'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>{['Date', 'Description', 'Category', 'Amount', 'Status'].map((c) => (
                  <th key={c} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{c}</th>
                ))}</tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center"><CircularProgress size={22} /></td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No transactions found.</td></tr>
                ) : transactions.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatDate(t.date)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{t.details || t.reference || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Chip label={t.category} size="small" sx={{ bgcolor: '#eef2ff', color: '#3730a3', fontWeight: 700, borderRadius: '999px' }} />
                    </td>
                    <td className="px-6 py-4">
                      <p className={`font-heading text-base font-700 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[t.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Transaction Dialog */}
        <Dialog open={dialogOpen} onClose={(_, r) => { if (r !== 'backdropClick') { setDialogOpen(false); setForm(defaultForm); } }}
          fullWidth maxWidth={false}
          BackdropProps={{ timeout: 240, sx: { backgroundColor: 'rgba(15,23,42,0.34)', backdropFilter: 'blur(10px)' } }}
          PaperProps={{ sx: { width: '100%', maxWidth: '58rem', borderRadius: '22px', overflow: 'hidden', backgroundImage: 'none', backgroundColor: '#f8fafc', border: '1px solid rgba(226,232,240,0.95)', boxShadow: '0 34px 90px rgba(15,23,42,0.18)' } }}
        >
          <DialogContent sx={{ p: { xs: 3, sm: 4.5 } }}>
            <div style={{ position: 'relative' }}>
              <IconButton onClick={() => { setDialogOpen(false); setForm(defaultForm); }}
                sx={{ position: 'absolute', top: 0, right: 0, border: '1px solid rgba(226,232,240,0.95)', bgcolor: 'rgba(255,255,255,0.92)', color: '#64748b', '&:hover': { bgcolor: '#fff' } }}>
                <Close fontSize="small" />
              </IconButton>
              <Fade in={dialogOpen} timeout={320}>
                <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(15,23,42,0.18)' }}>
                    <Add sx={{ color: '#fff', fontSize: 32 }} />
                  </div>
                  <p style={{ marginTop: 16, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>New Transaction</p>
                  <div style={{ marginTop: 16 }}>
                    <h2 style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#020617', letterSpacing: '-0.03em', margin: 0 }}>Add New Transaction</h2>
                    <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: '#64748b' }}>Record an income or expense entry.</p>
                  </div>
                </div>
              </Fade>
              {error ? <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert> : null}
              <div style={{ marginTop: 24, borderRadius: 24, border: '1px solid rgba(226,232,240,0.92)', backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)', padding: '28px' }}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField label="Transaction Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
                  <TextField label="Reference" size="small" value={form.reference} onChange={(e) => setForm((c) => ({ ...c, reference: e.target.value }))} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
                  <TextField label="Description" size="small" required value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} sx={{ ...fieldSx, gridColumn: 'span 2' }} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
                  <TextField label="Details" size="small" value={form.details} onChange={(e) => setForm((c) => ({ ...c, details: e.target.value }))} sx={{ ...fieldSx, gridColumn: 'span 2' }} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
                  <TextField select label="Category" size="small" value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><CategoryOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}>
                    {['Tuition','Salary','Maintenance','Research','Administration','Payroll','Vendor Payment','Grant','Scholarship','Other'].map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                  <TextField select label="Type" size="small" value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><SwapHorizOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}>
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </TextField>
                  <TextField label="Amount" size="small" type="number" required value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
                  <TextField label="Entity Count" size="small" type="number" value={form.entityCount} onChange={(e) => setForm((c) => ({ ...c, entityCount: e.target.value }))} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><CategoryOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
                  <TextField select label="Status" size="small" value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} sx={{ ...fieldSx, gridColumn: 'span 2' }}>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </TextField>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button onClick={() => { setDialogOpen(false); setForm(defaultForm); }} variant="outlined" sx={{ borderRadius: '14px', px: 3, py: 1.2, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                <Button onClick={handleSaveTransaction} disabled={saving || !form.description || !form.amount} variant="contained"
                  sx={{ borderRadius: '14px', px: 3.2, py: 1.25, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', boxShadow: '0 14px 28px rgba(29,78,216,0.24)', '&:hover': { background: 'linear-gradient(135deg,#1e40af 0%,#0f172a 100%)', transform: 'translateY(-1px)' }, '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' } }}>
                  {saving ? 'Saving...' : 'Save Transaction'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Accounts portal: full Finance workspace with its own sidebar/header/nav
  if (loading) {
    return (
      <div className="font-finance-body flex h-screen items-center justify-center bg-[#eef1f6]">
        <div className="finance-card flex items-center gap-4 px-6 py-5">
          <CircularProgress size={26} />
          <div>
            <p className="font-finance-display text-lg font-bold text-slate-900">Loading finance overview</p>
            <p className="text-sm text-slate-500">Pulling metrics, chart data, and recent transactions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-finance-body flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_32%),linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#eef1f5_100%)] text-slate-900">
      <aside className="hidden w-[290px] flex-shrink-0 border-r border-white/60 bg-[#f6f7fb]/95 lg:flex">
        <div className="fixed flex h-screen w-[290px] flex-col">
          <SidebarContent onGenerateReport={handleGenerateReport} activeView={view} onViewChange={handleViewChange} />
        </div>
      </aside>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 290 } }}>
        <SidebarContent onClose={() => setMobileOpen(false)} onGenerateReport={handleGenerateReport} activeView={view} onViewChange={handleViewChange} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { lg: 'none' } }}>
                <MenuIcon />
              </IconButton>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Application</p>
                <h1 className="font-finance-display text-2xl font-extrabold text-slate-950">University ERP</h1>
              </div>
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search financial records, categories, references..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/70"
              />
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <IconButton
                onClick={(event) => setNotifAnchor(event.currentTarget)}
                sx={{ width: 44, height: 44, border: '1px solid #e2e8f0', bgcolor: '#fff' }}
              >
                <Badge badgeContent={notifications.filter((item) => item.unread).length} color="error" overlap="circular">
                  <NotificationsNone />
                </Badge>
              </IconButton>
              <IconButton
                onClick={(event) => setHelpAnchor(event.currentTarget)}
                sx={{ width: 44, height: 44, border: '1px solid #e2e8f0', bgcolor: '#fff' }}
              >
                <HelpOutline />
              </IconButton>
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300 hover:shadow-sm"
                onClick={(e) => setUserAnchor(e.currentTarget)}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#0f172a', fontWeight: 700 }}>
                  {user?.name?.charAt(0) || 'A'}
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user?.name || 'Finance Admin'}</p>
                  <p className="text-xs text-slate-400">{user?.role || 'finance-office'}</p>
                </div>
                <KeyboardArrowDown sx={{ fontSize: 16, color: '#94a3b8' }} />
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          {view === 'students' && <StudentFinancePage onSendReminder={handleStudentReminder} />}
          {view === 'payroll' && <PayrollPage />}

          {view === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="font-finance-display text-3xl font-extrabold text-slate-950">Profile Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your account details and security</p>
              </div>

              {/* Profile card */}
              <div className="finance-card p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <Avatar sx={{ width: 64, height: 64, bgcolor: '#0f172a', fontSize: 22, fontWeight: 800 }}>
                    {user?.name?.charAt(0) || 'A'}
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg text-slate-900">{user?.name}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.department} · {user?.role}</p>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Personal Information</p>
                {profileError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setProfileError('')}>{profileError}</Alert>}
                {profileSuccess && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setProfileSuccess('')}>{profileSuccess}</Alert>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField fullWidth label="Full Name" value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    size="small" sx={fieldSx} />
                  <TextField fullWidth label="Email" value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                    size="small" sx={fieldSx} />
                  <TextField fullWidth label="Phone" value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                    size="small" sx={fieldSx} />
                  <TextField fullWidth label="Username" value={user?.username || ''} size="small" disabled sx={fieldSx} />
                </div>

                <Button
                  variant="contained" onClick={handleProfileSave} disabled={profileSaving}
                  startIcon={profileSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                  sx={{ mt: 4, bgcolor: '#0f172a', borderRadius: '14px', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#1e293b' } }}
                >
                  Save Changes
                </Button>
              </div>

              {/* Password card */}
              <div className="finance-card p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Change Password</p>
                {pwError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPwError('')}>{pwError}</Alert>}
                {pwSuccess && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setPwSuccess('')}>{pwSuccess}</Alert>}

                <div className="space-y-4">
                  <TextField fullWidth label="Current Password" type="password" size="small"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    sx={fieldSx} />
                  <TextField fullWidth label="New Password" type="password" size="small"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    sx={fieldSx} />
                  <TextField fullWidth label="Confirm New Password" type="password" size="small"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    sx={fieldSx} />
                </div>

                <Button
                  variant="contained" onClick={handlePasswordSave}
                  disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword}
                  startIcon={pwSaving ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                  sx={{ mt: 4, bgcolor: '#0f172a', borderRadius: '14px', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#1e293b' } }}
                >
                  Update Password
                </Button>
              </div>
            </div>
          )}

          {view === 'overview' && (
            <>
          {error ? <Alert sx={{ mb: 3 }} severity="error" onClose={() => setError('')}>{error}</Alert> : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Finance Office</p>
              <h2 className="font-finance-display mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Finance Overview</h2>
              <p className="mt-2 text-sm text-slate-500">Reporting period: {overview?.reportingPeriod || 'June 2024 - Present'}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#0f172a',
                  borderRadius: '18px',
                  px: 2.5,
                  py: 1.2,
                }}
              >
                Generate Financial Report
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  bgcolor: '#0f172a',
                  borderRadius: '18px',
                  px: 2.5,
                  py: 1.2,
                  '&:hover': { bgcolor: '#020617' },
                }}
              >
                Add New Transaction
              </Button>
            </div>
          </div>

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredSummary.map((item) => (
              <MetricCard key={item.title} {...item} />
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="finance-card p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-finance-display text-2xl font-extrabold text-slate-950">Revenue vs. Expenses</h3>
                  <p className="mt-1 text-sm text-slate-500">Monthly comparison for Jan to Jun with hover-enabled bars.</p>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                    Revenue
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    Expenses
                  </div>
                </div>
              </div>
              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={10}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                      contentStyle={{ borderRadius: 18, borderColor: '#e2e8f0', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)' }}
                      formatter={(value) => [`${value} L`, 'Amount']}
                    />
                    <Bar dataKey="revenue" radius={[12, 12, 0, 0]} fill="#2563eb" maxBarSize={34} />
                    <Bar dataKey="expenses" radius={[12, 12, 0, 0]} fill="#f59e0b" maxBarSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="finance-card p-6">
              <h3 className="font-finance-display text-2xl font-extrabold text-slate-950">Budget Allocation</h3>
              <p className="mt-1 text-sm text-slate-500">Structured for budget integrations and variance tracking.</p>

              <div className="mt-6 space-y-5">
                {budgetAllocation.map((item, index) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-finance-display text-lg font-extrabold text-slate-950">{item.percent}%</p>
                        <p className={`text-xs font-semibold ${item.variance >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.variance >= 0 ? '+' : ''}{item.variance}% variance
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%`, backgroundColor: categoryPalette[index % categoryPalette.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {overview?.budgetNote}
              </div>
            </div>
          </section>

          <section className="finance-card mt-6 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-finance-display text-2xl font-extrabold text-slate-950">Recent Financial Transactions</h3>
                <p className="mt-1 text-sm text-slate-500">Dynamic transaction records with income, expense, and status visibility.</p>
              </div>
              <Button
                variant="text"
                endIcon={<ArrowOutward />}
                onClick={() => setTableLimit((current) => (current === 8 ? 24 : 8))}
                sx={{ color: '#0f172a', fontWeight: 700 }}
              >
                {tableLimit === 8 ? 'View All Records' : 'Show Recent'}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Date', 'Description', 'Category', 'Amount', 'Status'].map((column) => (
                      <th key={column} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <CircularProgress size={24} />
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                        No transactions matched your current search.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatDate(transaction.date)}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                          <p className="mt-1 text-xs text-slate-500">{transaction.details || transaction.reference || 'Additional details pending'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Chip
                            label={transaction.category}
                            size="small"
                            sx={{
                              bgcolor: '#eef2ff',
                              color: '#3730a3',
                              fontWeight: 700,
                              borderRadius: '999px',
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <p className={`font-finance-display text-lg font-extrabold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-slate-500">{transaction.type === 'income' ? 'Income' : 'Expense'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[transaction.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
            </>
          )}
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
      >
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-finance-display text-lg font-extrabold text-slate-950">Notifications</p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                {notifications.filter((item) => item.unread).length} unread updates
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Finance
            </div>
          </div>
        </div>
        <div className="bg-white px-3 py-3">
          {notifications.map((item) => (
            <MenuItem
              key={item.id}
              onClick={() => setNotifAnchor(null)}
              sx={{
                alignItems: 'flex-start',
                borderRadius: '18px',
                px: 1.5,
                py: 1.5,
                mb: 1,
                mx: 0.5,
                backgroundColor: item.unread ? '#f8fafc' : 'transparent',
              }}
            >
              <div className="flex w-full gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.tone }} />
                  {item.unread ? <div className="mt-2 h-8 w-px bg-slate-200" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.description}</p>
                  <div className="mt-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: `${item.tone}18`, color: item.tone }}
                    >
                      {item.unread ? 'Needs attention' : 'Reviewed'}
                    </span>
                  </div>
                </div>
              </div>
            </MenuItem>
          ))}
        </div>
      </Menu>

      <Menu
        anchorEl={helpAnchor}
        open={Boolean(helpAnchor)}
        onClose={() => setHelpAnchor(null)}
        PaperProps={{ sx: { width: 360, borderRadius: '20px', mt: 1.5 } }}
      >
        {helpItems.map((item) => (
          <MenuItem key={item} onClick={() => setHelpAnchor(null)} sx={{ whiteSpace: 'normal', py: 1.5 }}>
            <span className="text-sm text-slate-700">{item}</span>
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
        PaperProps={{ sx: { width: 220, borderRadius: '16px', mt: 1.5, boxShadow: '0 12px 40px rgba(15,23,42,0.14)', border: '1px solid #e2e8f0' } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">{user?.name || 'Finance Admin'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email || ''}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{user?.department || 'Accounts'} · {user?.role || 'admin'}</p>
        </div>
        <div className="py-1">
          <MenuItem
            onClick={() => { setUserAnchor(null); logout(); }}
            sx={{ color: '#ef4444', borderRadius: '10px', mx: 0.5, my: 0.5, '&:hover': { bgcolor: '#fef2f2' } }}
          >
            <Logout sx={{ fontSize: 17, mr: 1.5 }} />
            <span className="text-sm font-semibold">Sign out</span>
          </MenuItem>
        </div>
      </Menu>

      {/* Add Transaction Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => { if (reason !== 'backdropClick') { setDialogOpen(false); setForm(defaultForm); } }}
        fullWidth
        maxWidth={false}
        BackdropProps={{ timeout: 240, sx: { backgroundColor: 'rgba(15,23,42,0.34)', backdropFilter: 'blur(10px)' } }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '58rem',
            borderRadius: '22px',
            overflow: 'hidden',
            backgroundImage: 'none',
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(226,232,240,0.95)',
            boxShadow: '0 34px 90px rgba(15,23,42,0.18)',
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          <div style={{ position: 'relative' }}>
            <IconButton
              onClick={() => { setDialogOpen(false); setForm(defaultForm); }}
              sx={{ position: 'absolute', top: 0, right: 0, border: '1px solid rgba(226,232,240,0.95)', bgcolor: 'rgba(255,255,255,0.92)', color: '#64748b', '&:hover': { bgcolor: '#fff', color: '#334155' } }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Fade in={dialogOpen} timeout={320}>
              <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(15,23,42,0.18)' }}>
                  <Add sx={{ color: '#fff', fontSize: 32 }} />
                </div>
                <p style={{ marginTop: 16, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>New Transaction</p>
                <p style={{ marginTop: 4, fontSize: '0.8rem', color: '#64748b' }}>Record income or expense</p>
                <div style={{ marginTop: 20 }}>
                  <h2 style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 800, fontSize: '1.85rem', color: '#020617', letterSpacing: '-0.03em', margin: 0 }}>Add New Transaction</h2>
                  <p style={{ marginTop: 8, fontSize: '0.95rem', lineHeight: 1.7, color: '#64748b' }}>Record an income or expense entry for the finance overview and transactions table.</p>
                </div>
              </div>
            </Fade>

            {error ? <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert> : null}

            <div style={{ marginTop: 24, borderRadius: 24, border: '1px solid rgba(226,232,240,0.92)', backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)', padding: '28px' }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  label="Transaction Date" type="date" size="small" InputLabelProps={{ shrink: true }}
                  value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Reference" size="small"
                  value={form.reference} onChange={(e) => setForm((c) => ({ ...c, reference: e.target.value }))}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Description" size="small" required
                  value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  sx={{ ...fieldSx, gridColumn: 'span 2' }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Details" size="small"
                  value={form.details} onChange={(e) => setForm((c) => ({ ...c, details: e.target.value }))}
                  sx={{ ...fieldSx, gridColumn: 'span 2' }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  select label="Category" size="small"
                  value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CategoryOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                >
                  {['Tuition','Salary','Maintenance','Research','Administration','Payroll','Vendor Payment','Grant','Scholarship','Other'].map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
                <TextField
                  select label="Type" size="small"
                  value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SwapHorizOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </TextField>
                <TextField
                  label="Amount" size="small" type="number" required
                  value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Entity Count" size="small" type="number"
                  value={form.entityCount} onChange={(e) => setForm((c) => ({ ...c, entityCount: e.target.value }))}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CategoryOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  select label="Status" size="small"
                  value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
                  sx={{ ...fieldSx, gridColumn: 'span 2' }}
                >
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </TextField>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button
                onClick={() => { setDialogOpen(false); setForm(defaultForm); }}
                variant="outlined"
                sx={{ borderRadius: '14px', px: 3, py: 1.2, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#94a3b8', backgroundColor: '#fff' } }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTransaction}
                disabled={saving || !form.description || !form.amount}
                variant="contained"
                sx={{ borderRadius: '14px', px: 3.2, py: 1.25, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', boxShadow: '0 14px 28px rgba(29,78,216,0.24)', '&:hover': { background: 'linear-gradient(135deg,#1e40af 0%,#0f172a 100%)', transform: 'translateY(-1px)', boxShadow: '0 18px 34px rgba(29,78,216,0.28)' }, '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' } }}
              >
                {saving ? 'Saving...' : 'Save Transaction'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
