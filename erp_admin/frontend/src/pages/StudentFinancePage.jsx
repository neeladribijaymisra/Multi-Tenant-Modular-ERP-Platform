import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  Drawer, Fade, FormControl, IconButton, InputAdornment, MenuItem, Pagination,
  Select, Slide, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined, Add, CalendarMonthOutlined, Close,
  Download, Edit, EmailOutlined, NotificationsOutlined, PaidOutlined, PeopleOutlined,
  ReceiptLongOutlined, Search, Visibility, WarningAmberOutlined,
} from '@mui/icons-material';
import api from '../utils/api';
import { formatCurrency, formatDate, getInitials, stringToColor } from '../utils/helpers';
import { DEPARTMENTS } from '../utils/constants';

const SlideUp = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const payFieldSx = {
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

const feeStatusChip = {
  Paid: { label: 'Paid', bg: '#ecfdf5', color: '#059669' },
  Partial: { label: 'Partial', bg: '#fffbeb', color: '#d97706' },
  Pending: { label: 'Pending', bg: '#fef2f2', color: '#dc2626' },
  Overdue: { label: 'Overdue', bg: '#fef2f2', color: '#dc2626' },
};

const paymentModeChip = {
  UPI: { bg: '#eff6ff', color: '#2563eb' },
  Card: { bg: '#f5f3ff', color: '#7c3aed' },
  Cash: { bg: '#f0fdf4', color: '#16a34a' },
  NEFT: { bg: '#fff7ed', color: '#d97706' },
  Online: { bg: '#f5f3ff', color: '#7c3aed' },
};

const PAYMENT_MODES = ['UPI', 'Card', 'Cash', 'NEFT'];
const PAYMENT_TYPES = ['Tuition Fee', 'Exam Fee', 'Library Fee', 'Hostel Fee', 'Transport Fee', 'Other'];
const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, index) => index + 1);
const ITEMS_PER_PAGE = 10;

const PAYMENT_MODE_TO_API = {
  UPI: 'UPI',
  Card: 'Online',
  Cash: 'Cash',
  NEFT: 'Online',
};

const defaultPaymentForm = {
  studentId: '',
  amount: '',
  semester: 1,
  feeType: 'Tuition Fee',
  mode: 'UPI',
  transactionId: '',
  date: new Date().toISOString().slice(0, 10),
  description: 'Semester Fee',
};

const profileSectionSx = {
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
  p: 2.25,
};

const profileRowSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  minWidth: 0,
};

const profileFieldSx = {
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  backgroundColor: '#f8fafc',
  px: 2,
  py: 1.5,
};

export default function StudentFinancePage({ onSendReminder }) {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [saving, setSaving] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getOutstandingDueAmount = useCallback((student) => {
    if (!student) return 0;
    if (student.feeStatus === 'Paid') return 0;
    if (student.feeStatus === 'Partial') return 22500;
    return 45000;
  }, []);

  const getReminderDueDate = useCallback((student) => (
    student?.dueDate || student?.feeDueDate || student?.semesterEndDate || null
  ), []);

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
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/students/stats');
      setStats(data.data);
    } catch {
      // Silent by design.
    }
  }, []);

  const fetchStudentFees = useCallback(async (studentId) => {
    if (!studentId) {
      setStudentFees([]);
      return;
    }

    setFeesLoading(true);
    try {
      const { data } = await api.get('/finance/fees', { params: { studentId, limit: 50 } });
      setStudentFees(data.data.fees || []);
    } catch {
      setStudentFees([]);
      setError('Failed to load payment history.');
    } finally {
      setFeesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [fetchStudents, fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents(search, deptFilter, statusFilter, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, deptFilter, statusFilter, fetchStudents]);

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
    await fetchStudentFees(student._id);
  };

  const handleOpenPayment = (student = null) => {
    setPaymentForm({
      ...defaultPaymentForm,
      studentId: student?._id || '',
      semester: student?.semester || defaultPaymentForm.semester,
    });
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentForm(defaultPaymentForm);
  };

  const handleSendReminder = async (student) => {
    if (!student) return;

    if (!student.email) {
      setError('No email available for this student');
      setSuccess('');
      return;
    }

    setSendingReminderId(student._id || student.email);
    setError('');
    setSuccess('');

    try {
      await api.post('/reminders/send-fee-reminder', {
        email: student.email,
        studentName: student.name,
        dueAmount: getOutstandingDueAmount(student),
        dueDate: getReminderDueDate(student),
      });

      onSendReminder?.(student);
      setSuccess(`Fee reminder sent to ${student.email}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send fee reminder.');
    } finally {
      setSendingReminderId('');
    }
  };

  const handleSavePayment = async () => {
    if (!paymentForm.studentId || !paymentForm.amount) return;

    setSaving(true);
    setError('');
    try {
      await api.post('/finance/fees', {
        student: paymentForm.studentId,
        totalAmount: Number(paymentForm.amount),
        paidAmount: Number(paymentForm.amount),
        feeType: paymentForm.feeType,
        paymentDate: paymentForm.date,
        paymentMode: PAYMENT_MODE_TO_API[paymentForm.mode] || 'Online',
        transactionId: paymentForm.transactionId,
        status: 'Paid',
        semester: Number(paymentForm.semester),
        remarks: paymentForm.description,
      });

      handleClosePaymentDialog();
      setSuccess('Payment recorded successfully.');
      await fetchStudents(search, deptFilter, statusFilter, page);
      await fetchStats();
      if (selectedStudent?._id === paymentForm.studentId) {
        await fetchStudentFees(paymentForm.studentId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const latestReceipt = useMemo(
    () => [...studentFees]
      .filter((fee) => fee.status === 'Paid' || fee.paidAmount > 0)
      .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt))[0] || null,
    [studentFees]
  );

  const handleDownloadReceipt = (fee = latestReceipt) => {
    if (!selectedStudent || !fee) {
      setError('No payment receipt is available for this student yet.');
      return;
    }

    const receiptWindow = window.open('', '_blank', 'width=960,height=900');
    if (!receiptWindow) {
      setError('Unable to open the receipt window. Please allow pop-ups and try again.');
      return;
    }

    const paidOn = fee.paymentDate || fee.createdAt;
    const amountPaid = Number(fee.paidAmount || fee.totalAmount || 0);
    const remarks = fee.remarks?.trim() || 'Student semester fee payment';

    receiptWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Receipt ${fee.receiptNo || ''}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #eef4ff; color: #0f172a; padding: 32px; }
            .receipt { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe4f0; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12); }
            .hero { padding: 32px 36px 28px; background: linear-gradient(135deg, #0f172a 0%, #0f766e 100%); color: #ffffff; }
            .hero-top { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
            .badge { display: inline-block; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,0.16); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
            .title { margin: 14px 0 6px; font-size: 34px; font-weight: 800; letter-spacing: -0.04em; }
            .subtitle { margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); }
            .content { padding: 30px 36px 36px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 24px; }
            .panel { border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px 20px; background: #f8fafc; }
            .label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 10px; }
            .value { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
            .muted { margin: 0; font-size: 13px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; overflow: hidden; border-radius: 20px; border: 1px solid #e2e8f0; }
            th, td { padding: 15px 18px; text-align: left; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
            th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; background: #f8fafc; }
            tr:last-child td { border-bottom: none; }
            .total-row td { font-size: 16px; font-weight: 800; color: #0f172a; background: #f8fafc; }
            .footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 28px; padding-top: 22px; border-top: 1px dashed #cbd5e1; color: #475569; font-size: 13px; }
            @media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; border-radius: 0; border: none; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="hero">
              <div class="hero-top">
                <div>
                  <span class="badge">Ayra ERP</span>
                  <h1 class="title">Payment Receipt</h1>
                  <p class="subtitle">Official fee payment acknowledgement for student accounts</p>
                </div>
                <div style="text-align:right">
                  <p class="label" style="color:rgba(255,255,255,0.75); margin-bottom:6px;">Receipt No</p>
                  <p class="value" style="color:#ffffff; margin-bottom:12px;">${fee.receiptNo || 'Generated Receipt'}</p>
                  <p class="label" style="color:rgba(255,255,255,0.75); margin-bottom:6px;">Paid On</p>
                  <p class="value" style="color:#ffffff;">${formatDate(paidOn)}</p>
                </div>
              </div>
            </div>
            <div class="content">
              <div class="grid">
                <div class="panel">
                  <div class="label">Student Details</div>
                  <p class="value">${selectedStudent.name}</p>
                  <p class="muted">Roll No: ${selectedStudent.rollNo || 'N/A'}</p>
                  <p class="muted">${selectedStudent.department || 'Department N/A'} | ${selectedStudent.year || 'Year N/A'}</p>
                </div>
                <div class="panel">
                  <div class="label">Payment Details</div>
                  <p class="value">${fee.feeType || 'Fee Payment'}</p>
                  <p class="muted">Semester ${fee.semester || selectedStudent.semester || '-'}</p>
                  <p class="muted">Mode: ${fee.paymentMode || 'Online'}${fee.transactionId ? ` | Ref: ${fee.transactionId}` : ''}</p>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Academic Term</th>
                    <th>Status</th>
                    <th style="text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${remarks}</td>
                    <td>Semester ${fee.semester || selectedStudent.semester || '-'}</td>
                    <td>${fee.status || 'Paid'}</td>
                    <td style="text-align:right;">${formatCurrency(amountPaid)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3">Total Paid</td>
                    <td style="text-align:right;">${formatCurrency(amountPaid)}</td>
                  </tr>
                </tbody>
              </table>
              <div class="footer">
                <span>This receipt was generated digitally from Ayra ERP.</span>
                <span>Generated on ${formatDate(new Date().toISOString())}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Name', 'Roll No', 'Department', 'Year', 'Fee Status', 'CGPA'],
      ...students.map((student) => [student.name, student.rollNo, student.department, student.year, student.feeStatus, student.cgpa || '']),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-finance.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = useMemo(() => [
    {
      title: 'Total Fees Collected',
      value: formatCurrency(stats.total * 45000),
      sub: '+12% vs last semester',
      icon: AccountBalanceWalletOutlined,
      accent: '#2563eb',
      bg: '#eff6ff',
    },
    {
      title: 'Pending Fees',
      value: formatCurrency(stats.inactive * 45000),
      sub: `${stats.inactive || 0} students pending`,
      icon: WarningAmberOutlined,
      accent: '#d97706',
      bg: '#fffbeb',
    },
    {
      title: 'Scholarships Distributed',
      value: formatCurrency(Math.floor((stats.active || 0) * 0.1) * 15000),
      sub: `${Math.floor((stats.active || 0) * 0.1)} beneficiaries`,
      icon: PaidOutlined,
      accent: '#059669',
      bg: '#ecfdf5',
    },
    {
      title: 'Refund Requests',
      value: `${Math.floor((stats.total || 0) * 0.02)}`,
      sub: 'Awaiting review',
      icon: ReceiptLongOutlined,
      accent: '#7c3aed',
      bg: '#f5f3ff',
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-finance-display text-3xl font-extrabold text-slate-950">Student Finance</h2>
          <p className="mt-1 text-sm text-slate-500">Manage student fees, payments, and financial records</p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{ borderColor: '#e2e8f0', color: '#475569', borderRadius: '14px', textTransform: 'none', fontWeight: 600 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenPayment()}
            sx={{ bgcolor: '#0f172a', borderRadius: '14px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1e293b' } }}
          >
            Add Payment
          </Button>
        </div>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="finance-card p-5 transition-transform hover:-translate-y-0.5">
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

      <div className="finance-card flex flex-col gap-3 p-4 sm:flex-row">
        <TextField
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, ...fieldSx }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 180, ...fieldSx }}>
          <Select
            value={deptFilter}
            displayEmpty
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            renderValue={(value) => value || 'All Departments'}
          >
            <MenuItem value="">All Departments</MenuItem>
            {DEPARTMENTS.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, ...fieldSx }}>
          <Select
            value={statusFilter}
            displayEmpty
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            renderValue={(value) => value || 'All Status'}
          >
            <MenuItem value="">All Status</MenuItem>
            {['Paid', 'Partial', 'Pending', 'Overdue'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      <div className="finance-card overflow-hidden">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['Student', 'Department', 'Total Fees', 'Paid', 'Due', 'Status', 'Last Payment', 'Actions'].map((heading) => (
                  <TableCell key={heading} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', py: 1.5 }}>
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No students found
                  </TableCell>
                </TableRow>
              ) : students.map((student) => {
                const totalFees = 45000;
                const paid = student.feeStatus === 'Paid' ? totalFees : student.feeStatus === 'Partial' ? Math.floor(totalFees * 0.5) : 0;
                const due = totalFees - paid;
                const chip = feeStatusChip[student.feeStatus] || feeStatusChip.Pending;

                return (
                  <TableRow key={student._id} hover sx={{ '&:hover': { bgcolor: '#f8faff' }, cursor: 'pointer' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={student.avatar || ''} sx={{ width: 36, height: 36, bgcolor: stringToColor(student.name), fontSize: 13, fontWeight: 700 }}>
                          {!student.avatar && getInitials(student.name)}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                          <p className="text-xs font-mono text-slate-400">{student.rollNo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-xs font-medium text-slate-600">{student.department}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-slate-800">{formatCurrency(totalFees)}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-emerald-600">{formatCurrency(paid)}</span></TableCell>
                    <TableCell><span className="text-sm font-semibold text-rose-600">{formatCurrency(due)}</span></TableCell>
                    <TableCell>
                      <Chip label={chip.label} size="small" sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700, fontSize: '0.7rem', height: 22, borderRadius: '999px' }} />
                    </TableCell>
                    <TableCell><span className="text-xs text-slate-500">{student.updatedAt ? formatDate(student.updatedAt) : '--'}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip title="View Profile">
                          <IconButton size="small" onClick={() => handleViewStudent(student)}>
                            <Visibility sx={{ fontSize: 16, color: '#2563eb' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Payment">
                          <IconButton size="small" onClick={() => handleOpenPayment(student)}>
                            <Edit sx={{ fontSize: 16, color: '#64748b' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Reminder">
                          <IconButton size="small" onClick={() => handleSendReminder(student)}>
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
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
          <p className="text-xs text-slate-400">Showing {students.length} of {pagination.total} students</p>
          <Pagination count={pagination.totalPages} page={page} onChange={(_, value) => { setPage(value); fetchStudents(search, deptFilter, statusFilter, value); }} size="small" />
        </div>
      </div>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, bgcolor: '#f8fafc' } }}
      >
        {selectedStudent && (
          <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: 3, py: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>Student Financial Profile</Typography>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}><Close fontSize="small" /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc', p: 3 }}>
              <Box sx={{ display: 'grid', gap: 2.5 }}>
                <Box sx={profileSectionSx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                    <Avatar
                      src={selectedStudent.avatar || ''}
                      sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: stringToColor(selectedStudent.name), fontSize: 22, fontWeight: 800 }}
                    >
                      {!selectedStudent.avatar && getInitials(selectedStudent.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography noWrap sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{selectedStudent.name}</Typography>
                      <Typography noWrap sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{selectedStudent.rollNo}</Typography>
                      <Box
                        sx={{
                          mt: 0.4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          minWidth: 0,
                          color: selectedStudent.email ? 'text.secondary' : 'error.main',
                        }}
                      >
                        <EmailOutlined sx={{ fontSize: 18, color: 'inherit', flexShrink: 0 }} />
                        <Typography noWrap sx={{ minWidth: 0, fontSize: '0.875rem', color: 'inherit' }}>
                          {selectedStudent.email || 'No email available'}
                        </Typography>
                      </Box>
                      <Typography noWrap sx={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedStudent.department} | {selectedStudent.year}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2.5, display: 'grid', gap: 1.5 }}>
                    <Box sx={{ ...profileFieldSx, ...profileRowSx }}>
                      <Typography sx={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>Roll No</Typography>
                      <Typography noWrap sx={{ minWidth: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{selectedStudent.rollNo}</Typography>
                    </Box>
                    <Box sx={{ ...profileFieldSx, ...profileRowSx }}>
                      <Typography sx={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>Year</Typography>
                      <Typography noWrap sx={{ minWidth: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{selectedStudent.year}</Typography>
                    </Box>
                    <Box sx={{ ...profileFieldSx, ...profileRowSx }}>
                      <Typography sx={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>Status</Typography>
                      <Chip
                        label={feeStatusChip[selectedStudent.feeStatus]?.label || 'Pending'}
                        size="small"
                        sx={{ bgcolor: feeStatusChip[selectedStudent.feeStatus]?.bg || '#fef2f2', color: feeStatusChip[selectedStudent.feeStatus]?.color || '#dc2626', fontWeight: 700, fontSize: '0.7rem', height: 22, borderRadius: '999px' }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={profileSectionSx}>
                  <Typography sx={{ mb: 2, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>Fee Breakdown</Typography>
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {[
                      { label: 'Tuition Fee', amount: 30000 },
                      { label: 'Hostel Fee', amount: 8000 },
                      { label: 'Library Fee', amount: 2000 },
                      { label: 'Lab Fee', amount: 3000 },
                      { label: 'Exam Fee', amount: 2000 },
                    ].map((item) => (
                      <Box key={item.label} sx={{ ...profileFieldSx, ...profileRowSx }}>
                        <Typography sx={{ minWidth: 0, fontSize: '0.92rem', color: '#64748b' }}>{item.label}</Typography>
                        <Typography sx={{ flexShrink: 0, fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(item.amount)}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2, borderTop: '1px solid #e2e8f0', pt: 2 }}>
                    <Box sx={{ ...profileRowSx, borderRadius: '14px', backgroundColor: '#0f172a', px: 2, py: 1.5 }}>
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>Total</Typography>
                      <Typography sx={{ flexShrink: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{formatCurrency(45000)}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={profileSectionSx}>
                  <Box sx={{ borderRadius: '14px', border: '1px solid #fecdd3', backgroundColor: '#fff1f2', p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
                      <WarningAmberOutlined sx={{ mt: '2px', fontSize: 18, color: '#dc2626', flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f43f5e' }}>Outstanding Dues</Typography>
                        <Typography sx={{ mt: 1.25, fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: '#dc2626' }}>
                          {formatCurrency(getOutstandingDueAmount(selectedStudent))}
                        </Typography>
                        <Typography sx={{ mt: 1.25, fontSize: '0.875rem', color: '#e11d48' }}>Due by end of semester</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={profileSectionSx}>
                  <Typography sx={{ mb: 2, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>Payment History</Typography>
                  {feesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={22} />
                    </Box>
                  ) : studentFees.length === 0 ? (
                    <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '14px', backgroundColor: '#f8fafc', px: 2, py: 2.5, textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                      No payments recorded yet.
                    </Box>
                  ) : (
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      {studentFees.map((fee) => {
                        const modeKey = fee.paymentMode === 'Online' ? 'Card' : fee.paymentMode || 'UPI';
                        const modeStyle = paymentModeChip[modeKey] || paymentModeChip.UPI;

                        return (
                          <Box key={fee._id} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: '#f8fafc', px: 2, py: 1.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, minWidth: 0 }}>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>{fee.feeType}</Typography>
                                <Typography sx={{ mt: 0.75, fontSize: '0.78rem', color: '#64748b' }}>Semester {fee.semester || '-'} | {formatDate(fee.paymentDate || fee.createdAt)}</Typography>
                                <Typography noWrap sx={{ mt: 0.75, minWidth: 0, fontSize: '0.76rem', color: '#94a3b8' }}>
                                  Receipt: <span className="font-mono">{fee.receiptNo || fee.transactionId || 'Receipt pending'}</span>
                                </Typography>
                              </Box>
                              <Typography sx={{ flexShrink: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(fee.paidAmount || fee.totalAmount || 0)}</Typography>
                            </Box>
                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <Chip label={modeKey} size="small" sx={{ bgcolor: modeStyle.bg, color: modeStyle.color, fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '999px' }} />
                              <Chip label={fee.status} size="small" sx={{ bgcolor: fee.status === 'Paid' ? '#ecfdf5' : '#fffbeb', color: fee.status === 'Paid' ? '#059669' : '#d97706', fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '999px' }} />
                              <Button
                                size="small"
                                onClick={() => handleDownloadReceipt(fee)}
                                sx={{ minWidth: 0, ml: 'auto', borderRadius: '999px', px: 1.5, textTransform: 'none', fontWeight: 700, color: '#2563eb' }}
                              >
                                Receipt
                              </Button>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={sendingReminderId === (selectedStudent._id || selectedStudent.email) ? <CircularProgress size={16} color="inherit" /> : <NotificationsOutlined />}
                onClick={() => handleSendReminder(selectedStudent)}
                disabled={sendingReminderId === (selectedStudent._id || selectedStudent.email)}
                sx={{ height: 46, borderRadius: '999px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#d97706' }}
              >
                {sendingReminderId === (selectedStudent._id || selectedStudent.email) ? 'Sending...' : 'Send Reminder'}
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Download />}
                onClick={() => handleDownloadReceipt()}
                sx={{ height: 46, borderRadius: '999px', textTransform: 'none', fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
              >
                Download Receipt
              </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>

      <Dialog
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        TransitionComponent={SlideUp}
        fullWidth
        maxWidth={false}
        BackdropProps={{ timeout: 240, sx: { backgroundColor: 'rgba(15,23,42,0.34)', backdropFilter: 'blur(10px)' } }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '52rem',
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
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleClosePaymentDialog}
              sx={{ position: 'absolute', top: 0, right: 0, border: '1px solid rgba(226,232,240,0.95)', bgcolor: 'rgba(255,255,255,0.92)', color: '#64748b', '&:hover': { bgcolor: '#fff', color: '#334155' } }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Box sx={{ pt: { xs: 4, sm: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Fade in={paymentDialogOpen} timeout={320}>
                <Box sx={{ width: 80, height: 80, borderRadius: '22px', background: 'linear-gradient(135deg,#059669 0%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(15,23,42,0.18)' }}>
                  <AccountBalanceWalletOutlined sx={{ color: '#fff', fontSize: 36 }} />
                </Box>
              </Fade>
              <Typography sx={{ mt: 2.5, fontFamily: '"Manrope",sans-serif', fontWeight: 800, fontSize: { xs: '1.6rem', sm: '1.8rem' }, color: '#020617', letterSpacing: '-0.03em' }}>
                Record Payment
              </Typography>
              <Typography sx={{ mt: 1, maxWidth: 420, fontSize: '0.88rem', lineHeight: 1.7, color: '#64748b' }}>
                Add a fee payment entry for a student record.
              </Typography>
            </Box>

            <Box sx={{ mt: 4, borderRadius: '24px', border: '1px solid rgba(226,232,240,0.92)', backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)', p: { xs: 2.5, sm: 3.5 } }}>
              {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                  <FormControl size="small" fullWidth sx={payFieldSx}>
                    <Select
                      value={paymentForm.studentId}
                      displayEmpty
                      onChange={(e) => setPaymentForm((form) => ({ ...form, studentId: e.target.value }))}
                      renderValue={(value) => {
                        const student = students.find((entry) => entry._id === value);
                        return student ? `${student.name} (${student.rollNo})` : 'Select Student';
                      }}
                      startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}
                    >
                      <MenuItem value="" disabled>Select Student</MenuItem>
                      {students.map((student) => <MenuItem key={student._id} value={student._id}>{student.name} - {student.rollNo}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  label="Amount (INR)"
                  type="number"
                  size="small"
                  fullWidth
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((form) => ({ ...form, amount: e.target.value }))}
                  sx={payFieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceWalletOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />

                <FormControl size="small" fullWidth sx={payFieldSx}>
                  <Select
                    value={paymentForm.semester}
                    onChange={(e) => setPaymentForm((form) => ({ ...form, semester: e.target.value }))}
                    startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}
                  >
                    {SEMESTER_OPTIONS.map((semester) => <MenuItem key={semester} value={semester}>Semester {semester}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={payFieldSx}>
                  <Select
                    value={paymentForm.feeType}
                    onChange={(e) => setPaymentForm((form) => ({ ...form, feeType: e.target.value }))}
                    startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><PaidOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}
                  >
                    {PAYMENT_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={payFieldSx}>
                  <Select
                    value={paymentForm.mode}
                    displayEmpty
                    onChange={(e) => setPaymentForm((form) => ({ ...form, mode: e.target.value }))}
                    renderValue={(value) => value || 'Payment Mode'}
                    startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><ReceiptLongOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}
                  >
                    {PAYMENT_MODES.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
                  </Select>
                </FormControl>

                <TextField
                  label="Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm((form) => ({ ...form, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={payFieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />

                <TextField
                  label="Transaction ID"
                  size="small"
                  fullWidth
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((form) => ({ ...form, transactionId: e.target.value }))}
                  sx={payFieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><ReceiptLongOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />

                <TextField
                  label="Description"
                  size="small"
                  fullWidth
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm((form) => ({ ...form, description: e.target.value }))}
                  sx={payFieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PaidOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
              </div>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                onClick={handleClosePaymentDialog}
                variant="outlined"
                sx={{ borderRadius: '14px', px: 3, py: 1.2, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#94a3b8', backgroundColor: '#fff' } }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePayment}
                disabled={saving || !paymentForm.studentId || !paymentForm.amount}
                variant="contained"
                sx={{ borderRadius: '14px', px: 3.2, py: 1.25, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg,#059669 0%,#0f172a 100%)', boxShadow: '0 14px 28px rgba(5,150,105,0.24)', '&:hover': { background: 'linear-gradient(135deg,#047857 0%,#0f172a 100%)', transform: 'translateY(-1px)', boxShadow: '0 18px 34px rgba(5,150,105,0.28)' }, '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' } }}
              >
                {saving ? 'Saving...' : 'Record Payment'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}
