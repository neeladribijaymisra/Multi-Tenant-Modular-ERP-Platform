import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Add,
  ArrowOutward,
  Assessment,
  Close,
  HelpOutline,
  Menu as MenuIcon,
  NotificationsNone,
  Paid,
  Payments,
  Search,
  TrendingDown,
  Wallet,
} from '@mui/icons-material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import FormDialog from '../components/common/FormDialog';

const financeNavItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Students', path: '/students' },
  { label: 'Finance', path: '/finance' },
  { label: 'Payroll', path: null },
  { label: 'Management', path: null },
  { label: 'Settings', path: '/settings' },
];

const notifications = [
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

function SidebarContent({ onClose, onGenerateReport }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (item) => {
    if (item.path) navigate(item.path);
    if (onClose) onClose();
  };

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
            const active = item.path ? location.pathname === item.path : item.label === 'Finance';
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavigate(item)}
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
  const { user } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [helpAnchor, setHelpAnchor] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [tableLimit, setTableLimit] = useState(8);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);

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
          <SidebarContent onGenerateReport={handleGenerateReport} />
        </div>
      </aside>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 290 } }}>
        <SidebarContent onClose={() => setMobileOpen(false)} onGenerateReport={handleGenerateReport} />
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
                onClick={() => navigate('/settings')}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#0f172a', fontWeight: 700 }}>
                  {user?.name?.charAt(0) || 'A'}
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user?.name || 'Finance Admin'}</p>
                  <p className="text-xs text-slate-400">{user?.role || 'finance-office'}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
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

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add New Transaction"
        subtitle="Record an income or expense entry for the finance overview and transactions table."
        onPrimary={handleSaveTransaction}
        primaryLabel="Save Transaction"
        primaryDisabled={saving || !form.description || !form.amount}
        loading={saving}
        error={error}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Transaction Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={form.date}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          />
          <TextField
            label="Reference"
            size="small"
            value={form.reference}
            onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
          />
          <TextField
            label="Description"
            size="small"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            sx={{ gridColumn: { sm: 'span 2' } }}
          />
          <TextField
            label="Details"
            size="small"
            value={form.details}
            onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
            sx={{ gridColumn: { sm: 'span 2' } }}
          />
          <TextField
            select
            label="Category"
            size="small"
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          >
            {['Tuition', 'Salary', 'Maintenance', 'Research', 'Administration', 'Payroll', 'Vendor Payment', 'Grant', 'Scholarship', 'Other'].map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type"
            size="small"
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
          >
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>
          <TextField
            label="Amount"
            size="small"
            type="number"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          />
          <TextField
            label="Entity Count"
            size="small"
            type="number"
            value={form.entityCount}
            onChange={(event) => setForm((current) => ({ ...current, entityCount: event.target.value }))}
          />
          <TextField
            select
            label="Status"
            size="small"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            sx={{ gridColumn: { sm: 'span 2' } }}
          >
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </TextField>
        </div>
      </FormDialog>
    </div>
  );
}
