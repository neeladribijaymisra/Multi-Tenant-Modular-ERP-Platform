import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Button, Chip, CircularProgress, Dialog, DialogContent,
  Drawer, FormControl, IconButton, InputAdornment, MenuItem, Pagination,
  Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined, Add, CalendarMonthOutlined, Close,
  Download, Edit, NotificationsOutlined, PaidOutlined, PeopleOutlined,
  ReceiptLongOutlined, Search, Visibility, WarningAmberOutlined,
} from '@mui/icons-material';
import api from '../utils/api';
import { formatCurrency, formatDate, getInitials, stringToColor } from '../utils/helpers';
import { DEPARTMENTS } from '../utils/constants';

const feeStatusChip = {
  Paid:    { label: 'Paid',    bg: '#ecfdf5', color: '#059669' },
  Partial: { label: 'Partial', bg: '#fffbeb', color: '#d97706' },
  Pending: { label: 'Pending', bg: '#fef2f2', color: '#dc2626' },
  Overdue: { label: 'Overdue', bg: '#fef2f2', color: '#dc2626' },
};

const paymentModeChip = {
  UPI:  { bg: '#eff6ff', color: '#2563eb' },
  Card: { bg: '#f5f3ff', color: '#7c3aed' },
  Cash: { bg: '#f0fdf4', color: '#16a34a' },
  NEFT: { bg: '#fff7ed', color: '#d97706' },
};

const ITEMS_PER_PAGE = 10;

const defaultPaymentForm = {
  studentId: '',
  amount: '',
  mode: 'UPI',
  transactionId: '',
  date: new Date().toISOString().slice(0, 10),
  description: 'Semester Fee',
};

export default function StudentFinancePage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStudents = useCallback(async (q = '', dept = '', status = '', pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: ITEMS_PER_PAGE };
      if (q) params.search = q;
      if (dept) params.department = dept;
      if (status) params.feeStatus = status;
      const { data } = await api.get('/students', { params });
      setStudents(data.data.students);
      setPagination(data.data.pagination);
    } catch { setError('Failed to load students.'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/students/stats');
      setStats(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStudents(); fetchStats(); }, [fetchStudents, fetchStats]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchStudents(search, deptFilter, statusFilter, 1); }, 300);
    return () => clearTimeout(t);
  }, [search, deptFilter, statusFilter]);

  const handleViewStudent = (student) => { setSelectedStudent(student); setDrawerOpen(true); };

  const handleOpenPayment = (student = null) => {
    setPaymentForm({ ...defaultPaymentForm, studentId: student?._id || '' });
    setPaymentDialogOpen(true);
  };

  const handleSavePayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amount) return;
    setSaving(true); setError('');
    try {
      await api.post('/finance/transactions', {
        description: paymentForm.description,
        date: paymentForm.date,
        category: 'Tuition',
        type: 'income',
        amount: Number(paymentForm.amount),
        reference: paymentForm.transactionId,
        details: `Mode: ${paymentForm.mode}`,
        status: 'Completed',
      });
      setPaymentDialogOpen(false);
      setPaymentForm(defaultPaymentForm);
      setSuccess('Payment recorded successfully.');
      fetchStudents(search, deptFilter, statusFilter, page);
      fetchStats();
    } catch (err) { setError(err.response?.data?.message || 'Failed to record payment.'); }
    finally { setSaving(false); }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Name', 'Roll No', 'Department', 'Year', 'Fee Status', 'CGPA'],
      ...students.map((s) => [s.name, s.rollNo, s.department, s.year, s.feeStatus, s.cgpa || '']),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student-finance.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = useMemo(() => [
    {
      title: 'Total Fees Collected',
      value: formatCurrency(stats.total * 45000),
      sub: `+12% vs last semester`,
      icon: AccountBalanceWalletOutlined,
      accent: '#2563eb', bg: '#eff6ff',
    },
    {
      title: 'Pending Fees',
      value: formatCurrency(stats.inactive * 45000),
      sub: `${stats.inactive || 0} students pending`,
      icon: WarningAmberOutlined,
      accent: '#d97706', bg: '#fffbeb',
    },
    {
      title: 'Scholarships Distributed',
      value: formatCurrency(Math.floor((stats.active || 0) * 0.1) * 15000),
      sub: `${Math.floor((stats.active || 0) * 0.1)} beneficiaries`,
      icon: PaidOutlined,
      accent: '#059669', bg: '#ecfdf5',
    },
    {
      title: 'Refund Requests',
      value: `${Math.floor((stats.total || 0) * 0.02)}`,
      sub: 'Awaiting review',
      icon: ReceiptLongOutlined,
      accent: '#7c3aed', bg: '#f5f3ff',
    },
  ], [stats]);

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
    },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-finance-display text-3xl font-extrabold text-slate-950">Student Finance</h2>
          <p className="mt-1 text-sm text-slate-500">Manage student fees, payments, and financial records</p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outlined" startIcon={<Download />} onClick={handleExportCSV}
            sx={{ borderColor: '#e2e8f0', color: '#475569', borderRadius: '14px', textTransform: 'none', fontWeight: 600 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained" startIcon={<Add />} onClick={() => handleOpenPayment()}
            sx={{ bgcolor: '#0f172a', borderRadius: '14px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1e293b' } }}
          >
            Add Payment
          </Button>
        </div>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="finance-card p-5 hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: card.bg }}>
                  <Icon sx={{ fontSize: 22, color: card.accent }} />
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: card.bg, color: card.accent }}>
                  Live
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">{card.title}</p>
              <p className="font-finance-display mt-1 text-2xl font-extrabold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="finance-card p-4 flex flex-col sm:flex-row gap-3">
        <TextField
          placeholder="Search by name or roll number..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          size="small" sx={{ flex: 1, ...fieldSx }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 180, ...fieldSx }}>
          <Select value={deptFilter} displayEmpty onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            renderValue={(v) => v || 'All Departments'}>
            <MenuItem value="">All Departments</MenuItem>
            {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, ...fieldSx }}>
          <Select value={statusFilter} displayEmpty onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            renderValue={(v) => v || 'All Status'}>
            <MenuItem value="">All Status</MenuItem>
            {['Paid', 'Partial', 'Pending', 'Overdue'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      {/* Table */}
      <div className="finance-card overflow-hidden">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['Student', 'Department', 'Total Fees', 'Paid', 'Due', 'Status', 'Last Payment', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No students found</TableCell></TableRow>
              ) : students.map((s) => {
                const totalFees = 45000;
                const paid = s.feeStatus === 'Paid' ? totalFees : s.feeStatus === 'Partial' ? Math.floor(totalFees * 0.5) : 0;
                const due = totalFees - paid;
                const chip = feeStatusChip[s.feeStatus] || feeStatusChip.Pending;
                return (
                  <TableRow key={s._id} hover sx={{ '&:hover': { bgcolor: '#f8faff' }, cursor: 'pointer' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={s.avatar || ''} sx={{ width: 36, height: 36, bgcolor: stringToColor(s.name), fontSize: 13, fontWeight: 700 }}>
                          {!s.avatar && getInitials(s.name)}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.rollNo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs font-medium text-slate-600">{s.department}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-slate-800">{formatCurrency(totalFees)}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-emerald-600">{formatCurrency(paid)}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-rose-600">{formatCurrency(due)}</span></TableCell>
                    <TableCell>
                      <Chip label={chip.label} size="small" sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700, fontSize: '0.7rem', height: 22, borderRadius: '999px' }} />
                    </TableCell>
                    <TableCell><span className="text-xs text-slate-500">{s.updatedAt ? formatDate(s.updatedAt) : '—'}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip title="View Profile">
                          <IconButton size="small" onClick={() => handleViewStudent(s)}>
                            <Visibility sx={{ fontSize: 16, color: '#2563eb' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Payment">
                          <IconButton size="small" onClick={() => handleOpenPayment(s)}>
                            <Edit sx={{ fontSize: 16, color: '#64748b' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Reminder">
                          <IconButton size="small">
                            <NotificationsOutlined sx={{ fontSize: 16, color: '#d97706' }} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p className="text-xs text-slate-400">Showing {students.length} of {pagination.total} students</p>
          <Pagination count={pagination.totalPages} page={page} onChange={(_, v) => { setPage(v); fetchStudents(search, deptFilter, statusFilter, v); }} size="small" />
        </div>
      </div>

      {/* Student Profile Drawer */}
      <Drawer
        anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, bgcolor: '#f8fafc' } }}
      >
        {selectedStudent && (
          <div className="flex h-full flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <p className="font-semibold text-slate-900">Student Financial Profile</p>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}><Close fontSize="small" /></IconButton>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Profile Card */}
              <div className="finance-card p-5 flex items-center gap-4">
                <Avatar src={selectedStudent.avatar || ''} sx={{ width: 64, height: 64, bgcolor: stringToColor(selectedStudent.name), fontSize: 22, fontWeight: 800 }}>
                  {!selectedStudent.avatar && getInitials(selectedStudent.name)}
                </Avatar>
                <div>
                  <p className="font-bold text-lg text-slate-900">{selectedStudent.name}</p>
                  <p className="text-sm text-slate-500 font-mono">{selectedStudent.rollNo}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedStudent.department} · {selectedStudent.year}</p>
                  <Chip
                    label={feeStatusChip[selectedStudent.feeStatus]?.label || 'Pending'}
                    size="small"
                    sx={{ mt: 1, bgcolor: feeStatusChip[selectedStudent.feeStatus]?.bg || '#fef2f2', color: feeStatusChip[selectedStudent.feeStatus]?.color || '#dc2626', fontWeight: 700, fontSize: '0.7rem', height: 20, borderRadius: '999px' }}
                  />
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="finance-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Fee Breakdown</p>
                {[
                  { label: 'Tuition Fee', amount: 30000 },
                  { label: 'Hostel Fee', amount: 8000 },
                  { label: 'Library Fee', amount: 2000 },
                  { label: 'Lab Fee', amount: 3000 },
                  { label: 'Exam Fee', amount: 2000 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-1">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-base font-extrabold text-slate-900">{formatCurrency(45000)}</span>
                </div>
              </div>

              {/* Outstanding Dues */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <WarningAmberOutlined sx={{ fontSize: 18, color: '#dc2626' }} />
                  <p className="text-sm font-bold text-rose-700">Outstanding Dues</p>
                </div>
                <p className="text-2xl font-extrabold text-rose-600">
                  {selectedStudent.feeStatus === 'Paid' ? formatCurrency(0) : selectedStudent.feeStatus === 'Partial' ? formatCurrency(22500) : formatCurrency(45000)}
                </p>
                <p className="text-xs text-rose-500 mt-1">Due by end of semester</p>
              </div>

              {/* Payment History */}
              <div className="finance-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Payment History</p>
                {selectedStudent.feeStatus === 'Pending' ? (
                  <p className="text-sm text-slate-400 text-center py-4">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      { date: '2024-08-01', amount: selectedStudent.feeStatus === 'Paid' ? 45000 : 22500, mode: 'UPI', txn: 'TXN8821934', status: 'Success' },
                    ].map((p, i) => {
                      const modeStyle = paymentModeChip[p.mode] || paymentModeChip.UPI;
                      return (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{formatCurrency(p.amount)}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.date)} · <span className="font-mono">{p.txn}</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip label={p.mode} size="small" sx={{ bgcolor: modeStyle.bg, color: modeStyle.color, fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '999px' }} />
                            <Chip label={p.status} size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '999px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-200 bg-white px-6 py-4 flex gap-3">
              <Button
                fullWidth variant="outlined" startIcon={<NotificationsOutlined />}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#d97706' }}
              >
                Send Reminder
              </Button>
              <Button
                fullWidth variant="contained" startIcon={<Download />}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
              >
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => { setPaymentDialogOpen(false); setPaymentForm(defaultPaymentForm); }}
        fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '20px', backgroundImage: 'none' } }}
        BackdropProps={{ sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15,23,42,0.3)' } }}
      >
        <DialogContent sx={{ p: 4 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-lg font-extrabold text-slate-900">Record Payment</p>
              <p className="text-sm text-slate-500 mt-0.5">Add a fee payment entry for a student</p>
            </div>
            <IconButton size="small" onClick={() => setPaymentDialogOpen(false)} sx={{ border: '1px solid #e2e8f0' }}>
              <Close fontSize="small" />
            </IconButton>
          </div>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <div className="space-y-3">
            <FormControl size="small" fullWidth sx={fieldSx}>
              <Select value={paymentForm.studentId} displayEmpty onChange={(e) => setPaymentForm((f) => ({ ...f, studentId: e.target.value }))}
                renderValue={(v) => { const s = students.find((x) => x._id === v); return s ? `${s.name} (${s.rollNo})` : 'Select Student'; }}
                startAdornment={<InputAdornment position="start" sx={{ ml: 1 }}><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment>}>
                <MenuItem value="" disabled>Select Student</MenuItem>
                {students.map((s) => <MenuItem key={s._id} value={s._id}>{s.name} — {s.rollNo}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Amount (₹)" type="number" size="small" fullWidth value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceWalletOutlined sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment> }} />
            <div className="grid grid-cols-2 gap-3">
              <FormControl size="small" fullWidth sx={fieldSx}>
                <Select value={paymentForm.mode} onChange={(e) => setPaymentForm((f) => ({ ...f, mode: e.target.value }))}>
                  {['UPI', 'Card', 'Cash', 'NEFT'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Date" type="date" size="small" fullWidth value={paymentForm.date}
                onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment> }} />
            </div>
            <TextField label="Transaction ID" size="small" fullWidth value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm((f) => ({ ...f, transactionId: e.target.value }))} sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptLongOutlined sx={{ color: '#94a3b8', fontSize: 18 }} /></InputAdornment> }} />
            <TextField label="Description" size="small" fullWidth value={paymentForm.description}
              onChange={(e) => setPaymentForm((f) => ({ ...f, description: e.target.value }))} sx={fieldSx} />
          </div>

          <div className="flex gap-3 mt-5">
            <Button fullWidth variant="outlined" onClick={() => setPaymentDialogOpen(false)}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#475569' }}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" disabled={saving || !paymentForm.studentId || !paymentForm.amount}
              onClick={handleSavePayment}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' } }}>
              {saving ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
