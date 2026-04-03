import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ApprovalOutlined,
  CheckCircleOutline,
  Close,
  Download,
  FileDownloadOutlined,
  MonetizationOnOutlined,
  PaidOutlined,
  PendingActionsOutlined,
  PersonOutline,
  PreviewOutlined,
  ReceiptLongOutlined,
  Search,
  SendOutlined,
  TuneOutlined,
  VisibilityOutlined,
  WorkOutline,
} from '@mui/icons-material';
import api from '../utils/api';
import { DEPARTMENTS } from '../utils/constants';
import { formatCurrency, formatDate, getInitials, stringToColor } from '../utils/helpers';

const ITEMS_PER_PAGE = 8;

const payrollFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: '#fcfdff',
    minHeight: 46,
    '& fieldset': { borderColor: '#dbe4f0' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(37,99,235,0.12)' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb' },
  },
  '& .MuiInputBase-input': { py: 1.45 },
  '& .MuiSelect-select': { py: '13px !important' },
  '& .MuiInputLabel-root': { fontWeight: 600 },
};

const payrollDialogPanelSx = {
  borderRadius: '24px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 14px 38px rgba(15,23,42,0.05)',
};

const payrollSectionSx = {
  ...payrollDialogPanelSx,
  p: { xs: 2.5, sm: 3 },
};

const salaryLabelProps = { shrink: true };

function PayrollSection({ title, description, children, gridSx }) {
  return (
    <Paper elevation={0} sx={payrollSectionSx}>
      <Stack spacing={1.2}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.9, fontSize: '0.92rem', lineHeight: 1.6, color: '#64748b' }}>
            {description}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#eef2f7' }} />
        <Grid container spacing={2.25} sx={gridSx}>
        {children}
        </Grid>
      </Stack>
    </Paper>
  );
}

function PayrollSummaryTile({ label, value, accent, bg }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', backgroundColor: bg, px: 2.2, py: 1.8 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#64748b' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 1.2, fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 800, color: accent }}>
        {value}
      </Typography>
    </Paper>
  );
}

const payrollDetailsCardSx = {
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
  p: { xs: 2.25, sm: 2.75 },
};

const payrollDetailsRowSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  minWidth: 0,
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  px: 2,
  py: 1.5,
};

function PayrollDetailsCard({ title, subtitle, children, sx }) {
  return (
    <Paper elevation={0} sx={{ ...payrollDetailsCardSx, ...sx }}>
      <Stack spacing={2.25}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.75, fontSize: '0.92rem', lineHeight: 1.6, color: '#64748b' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

function PayrollInfoRow({ label, value, valueColor = '#0f172a', emphasize = false }) {
  return (
    <Box sx={payrollDetailsRowSx}>
      <Typography sx={{ minWidth: 0, flex: 1, fontSize: '0.9rem', color: '#64748b' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          flexShrink: 0,
          textAlign: 'right',
          fontSize: '0.92rem',
          fontWeight: emphasize ? 800 : 700,
          color: valueColor,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function PayrollMetricTile({ label, value, valueColor = '#0f172a' }) {
  return (
    <Box sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', px: 2, py: 1.8 }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#94a3b8' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: { xs: '1.1rem', sm: '1.3rem' }, fontWeight: 800, color: valueColor }}>
        {value}
      </Typography>
    </Box>
  );
}

const payslipCardSx = {
  borderRadius: '22px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 14px 38px rgba(15,23,42,0.05)',
  p: { xs: 2.25, sm: 2.75 },
};

const payslipRowSx = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 2,
  minWidth: 0,
  py: 1.25,
};

const batchControlCardSx = {
  borderRadius: '22px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 14px 38px rgba(15,23,42,0.05)',
  p: { xs: 2.25, sm: 2.75 },
};

function PayslipSectionCard({ title, subtitle, children, sx }) {
  return (
    <Paper elevation={0} sx={{ ...payslipCardSx, ...sx }}>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.8, fontSize: '0.92rem', lineHeight: 1.6, color: '#64748b' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

function PayslipDataRow({ label, value, emphasize = false, valueColor = '#0f172a', divider = false }) {
  return (
    <>
      <Box sx={payslipRowSx}>
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.92rem', color: '#64748b' }}>
          {label}
        </Typography>
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            textAlign: 'right',
            fontSize: '0.94rem',
            fontWeight: emphasize ? 800 : 700,
            color: valueColor,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
      </Box>
      {divider ? <Divider sx={{ borderColor: '#eef2f7' }} /> : null}
    </>
  );
}

function PayslipSummaryBox({ label, value, valueColor = '#0f172a', emphasize = false, sx }) {
  return (
    <Box
      sx={{
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        backgroundColor: emphasize ? '#ecfdf5' : '#f8fafc',
        px: 2.25,
        py: 2,
        minWidth: 0,
        ...sx,
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: emphasize ? '#059669' : '#94a3b8' }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: { xs: '1.05rem', sm: '1.25rem' }, fontWeight: 800, color: valueColor, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function BatchControlCard({ title, subtitle, children, sx }) {
  return (
    <Paper elevation={0} sx={{ ...batchControlCardSx, ...sx }}>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.8, fontSize: '0.92rem', lineHeight: 1.6, color: '#64748b' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

const statusStyles = {
  Draft: { bg: '#f8fafc', color: '#475569' },
  'Pending Approval': { bg: '#fff7ed', color: '#c2410c' },
  Approved: { bg: '#eff6ff', color: '#1d4ed8' },
  Processed: { bg: '#ecfeff', color: '#0f766e' },
  Paid: { bg: '#ecfdf5', color: '#059669' },
  Failed: { bg: '#fef2f2', color: '#dc2626' },
  'On Hold': { bg: '#fdf4ff', color: '#a21caf' },
};

const reportTypes = [
  'Monthly Payroll Report',
  'Department-wise Salary Report',
  'Deduction Report',
  'Tax Summary',
  'Bonus Report',
  'Payment History',
];

const defaultFilters = {
  search: '',
  department: '',
  payrollStatus: '',
  month: '',
  salaryType: '',
};

const defaultSalaryForm = {
  employeeName: '',
  employeeId: '',
  employeeEmail: '',
  department: '',
  designation: '',
  salaryType: 'Monthly',
  basicSalary: 0,
  allowances: { hra: 0, da: 0, travelAllowance: 0, medicalAllowance: 0, bonus: 0 },
  deductions: { pf: 0, esi: 0, tax: 0, loanDeduction: 0, otherDeductions: 0 },
  paymentMethod: 'Bank Transfer',
  bankAccountNumber: '',
  ifscCode: '',
  month: '',
  year: new Date().getFullYear(),
  effectiveFromDate: new Date().toISOString().slice(0, 10),
  attendance: { totalWorkingDays: 30, presentDays: 30, leaveTaken: 0, lossOfPay: 0, overtimeHours: 0, extraShiftPay: 0 },
  approval: { preparedBy: '', reviewedBy: '', remarks: '' },
  remarks: '',
};

const defaultProcessingForm = {
  month: '',
  year: new Date().getFullYear(),
  department: '',
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildSalaryTotals = (form) => {
  const allowances = { ...form.allowances, extraShiftPay: toNumber(form.attendance.extraShiftPay) };
  const dailyRate = toNumber(form.basicSalary) / Math.max(toNumber(form.attendance.totalWorkingDays), 1);
  const lopAmount = Math.round(dailyRate * toNumber(form.attendance.lossOfPay));
  const deductions = { ...form.deductions, lossOfPayAmount: lopAmount };
  const totalAllowances = Object.values(allowances).reduce((sum, value) => sum + toNumber(value), 0);
  const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + toNumber(value), 0);
  const grossSalary = toNumber(form.basicSalary) + totalAllowances;
  const netSalary = Math.max(0, grossSalary - totalDeductions);
  return { allowances, deductions, totalAllowances, totalDeductions, grossSalary, netSalary };
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function StatusChip({ status }) {
  const tone = statusStyles[status] || statusStyles.Draft;
  return <Chip label={status} size="small" sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, borderRadius: '999px', height: 24 }} />;
}

function SummaryCard({ title, value, subtitle, icon, accent, bg }) {
  const Icon = icon;
  return (
    <div className="finance-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: bg }}>
          <Icon sx={{ color: accent }} />
        </div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: bg, color: accent }}>Live</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{title}</p>
      <p className="font-finance-display mt-1 text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function PayrollPage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState(defaultSalaryForm);
  const [processingForm, setProcessingForm] = useState(defaultProcessingForm);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const payslipPreview = selectedRecord?.payslipPreview;
  const employeeDetails = payslipPreview?.employeeDetails || {};
  const payslipPaymentDate = formatDate(payslipPreview?.paymentDate || new Date().toISOString());
  const payslipCycle = employeeDetails.salaryType || selectedRecord?.salaryType || 'Monthly';
  const payslipMonthLabel = selectedRecord ? `${selectedRecord.month} ${selectedRecord.year} salary statement` : 'Payroll salary statement';
  const payslipEarnings = payslipPreview?.earnings || [];
  const payslipDeductions = payslipPreview?.deductions || [];
  const payslipTotalDeductions = payslipPreview?.totalDeductions ?? payslipDeductions.reduce((sum, [, amount]) => sum + toNumber(amount), 0);

  const loadSummary = useCallback(async () => {
    const { data } = await api.get('/payroll/summary');
    setSummary(data.data);
    setProcessingForm((current) => ({
      ...current,
      month: current.month || data.data.month,
      year: current.year || data.data.year,
    }));
  }, []);

  const loadRecords = useCallback(async (activeFilters = filters, activePage = page) => {
    setTableLoading(true);
    try {
      const { data } = await api.get('/payroll/records', {
        params: { ...activeFilters, page: activePage, limit: ITEMS_PER_PAGE },
      });
      setRecords(data.data.records || []);
      setPagination(data.data.pagination || { totalPages: 1, total: 0 });
    } finally {
      setTableLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadSummary(), loadRecords(defaultFilters, 1)]);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load payroll records.');
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [loadSummary, loadRecords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords(filters, page).catch((err) => {
        setError(err.response?.data?.message || 'Unable to filter payroll records.');
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, page, loadRecords]);

  const totals = useMemo(() => buildSalaryTotals(salaryForm), [salaryForm]);

  const summaryCards = useMemo(() => {
    const cards = summary?.cards || {};
    return [
      { title: 'Total Employees on Payroll', value: cards.totalEmployees || 0, subtitle: 'Active salary structures', icon: PersonOutline, accent: '#2563eb', bg: '#eff6ff' },
      { title: 'Payroll This Month', value: formatCurrency(cards.payrollThisMonth || 0), subtitle: `${summary?.month || 'Current'} salary release`, icon: MonetizationOnOutlined, accent: '#0f766e', bg: '#ecfeff' },
      { title: 'Pending Salary Approvals', value: cards.pendingApprovals || 0, subtitle: 'Awaiting review queue', icon: PendingActionsOutlined, accent: '#d97706', bg: '#fffbeb' },
      { title: 'Total Deductions', value: formatCurrency(cards.totalDeductions || 0), subtitle: 'PF, tax, and payroll deductions', icon: TuneOutlined, accent: '#7c3aed', bg: '#f5f3ff' },
      { title: 'Payslips Generated', value: cards.payslipsGenerated || 0, subtitle: 'Employee payslips ready', icon: ReceiptLongOutlined, accent: '#1d4ed8', bg: '#eef2ff' },
      { title: 'Failed / Unprocessed Payments', value: cards.failedPayments || 0, subtitle: 'Needs attention from accounts', icon: ApprovalOutlined, accent: '#dc2626', bg: '#fef2f2' },
    ];
  }, [summary]);

  const resetSalaryForm = () => {
    setSalaryForm({
      ...defaultSalaryForm,
      month: summary?.month || defaultSalaryForm.month,
      year: summary?.year || defaultSalaryForm.year,
    });
  };

  const refreshData = async () => {
    await Promise.all([loadSummary(), loadRecords(filters, page)]);
  };

  const openAddDialog = () => {
    resetSalaryForm();
    setSelectedRecord(null);
    setSalaryDialogOpen(true);
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setSalaryForm({
      employeeName: record.employeeName,
      employeeId: record.employeeId,
      employeeEmail: record.employeeEmail || '',
      department: record.department,
      designation: record.designation,
      salaryType: record.salaryType,
      basicSalary: record.basicSalary,
      allowances: {
        hra: record.allowances?.hra || 0,
        da: record.allowances?.da || 0,
        travelAllowance: record.allowances?.travelAllowance || 0,
        medicalAllowance: record.allowances?.medicalAllowance || 0,
        bonus: record.allowances?.bonus || 0,
      },
      deductions: {
        pf: record.deductions?.pf || 0,
        esi: record.deductions?.esi || 0,
        tax: record.deductions?.tax || 0,
        loanDeduction: record.deductions?.loanDeduction || 0,
        otherDeductions: record.deductions?.otherDeductions || 0,
      },
      paymentMethod: record.paymentMethod || 'Bank Transfer',
      bankAccountNumber: record.bankAccountNumber || '',
      ifscCode: record.ifscCode || '',
      month: record.month,
      year: record.year,
      effectiveFromDate: (record.effectiveFromDate || '').slice(0, 10),
      attendance: {
        totalWorkingDays: record.attendance?.totalWorkingDays || 30,
        presentDays: record.attendance?.presentDays || 30,
        leaveTaken: record.attendance?.leaveTaken || 0,
        lossOfPay: record.attendance?.lossOfPay || 0,
        overtimeHours: record.attendance?.overtimeHours || 0,
        extraShiftPay: record.attendance?.extraShiftPay || 0,
      },
      approval: {
        preparedBy: record.approval?.preparedBy || '',
        reviewedBy: record.approval?.reviewedBy || '',
        remarks: record.approval?.remarks || '',
      },
      remarks: record.remarks || '',
    });
    setSalaryDialogOpen(true);
  };

  const handleSalaryFieldChange = (field, value) => {
    setSalaryForm((current) => ({ ...current, [field]: value }));
  };

  const handleNestedFieldChange = (section, field, value) => {
    setSalaryForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const handleSaveSalary = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...salaryForm,
        basicSalary: toNumber(salaryForm.basicSalary),
        year: toNumber(salaryForm.year),
        allowances: totals.allowances,
        deductions: {
          ...totals.deductions,
          pf: toNumber(salaryForm.deductions.pf),
          esi: toNumber(salaryForm.deductions.esi),
          tax: toNumber(salaryForm.deductions.tax),
          loanDeduction: toNumber(salaryForm.deductions.loanDeduction),
          otherDeductions: toNumber(salaryForm.deductions.otherDeductions),
        },
        attendance: {
          totalWorkingDays: toNumber(salaryForm.attendance.totalWorkingDays),
          presentDays: toNumber(salaryForm.attendance.presentDays),
          leaveTaken: toNumber(salaryForm.attendance.leaveTaken),
          lossOfPay: toNumber(salaryForm.attendance.lossOfPay),
          overtimeHours: toNumber(salaryForm.attendance.overtimeHours),
          extraShiftPay: toNumber(salaryForm.attendance.extraShiftPay),
        },
      };

      if (selectedRecord?._id) await api.put(`/payroll/salary-structures/${selectedRecord._id}`, payload);
      else await api.post('/payroll/salary-structures', payload);

      setSalaryDialogOpen(false);
      setSuccess(selectedRecord?._id ? 'Salary structure updated.' : 'Salary structure created.');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save salary structure.');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessAction = async (action) => {
    setProcessLoading(true);
    setError('');
    setSuccess('');
    try {
      if (action === 'preview') {
        const { data } = await api.post('/payroll/preview', processingForm);
        setPreviewData(data.data);
        setSuccess('Payroll preview refreshed.');
      } else if (action === 'process') {
        await api.post('/payroll/process', processingForm);
        setSuccess('Monthly payroll processed successfully.');
        await refreshData();
      } else if (action === 'generatePayslips') {
        await api.post('/payroll/payslips/generate-all', processingForm);
        setSuccess('Payslips generated for the selected payroll cycle.');
        await refreshData();
      } else if (action === 'export') {
        const { data } = await api.get('/payroll/export', { params: { ...processingForm, type: 'Monthly Payroll Report' } });
        const headers = Object.keys(data.data.rows[0] || { employeeId: '', employeeName: '', department: '', netSalary: '', payrollStatus: '' });
        downloadCsv('payroll-report.csv', [headers, ...data.data.rows.map((row) => headers.map((key) => row[key]))]);
        setSuccess('Payroll export downloaded.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete payroll processing action.');
    } finally {
      setProcessLoading(false);
    }
  };

  const openPayslip = async (record, delivery = 'download') => {
    setPayslipLoading(true);
    setSelectedRecord(record);
    setError('');
    try {
      const { data } = await api.post(`/payroll/records/${record._id}/payslip`, { delivery });
      setSelectedRecord(data.data.record);
      setPayslipDialogOpen(true);
      if (delivery === 'email') setSuccess(`Payslip email queued for ${record.employeeName}.`);
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate payslip.');
    } finally {
      setPayslipLoading(false);
    }
  };

  const handleRowAction = async (record, action) => {
    setError('');
    setSuccess('');
    try {
      if (action === 'view') {
        const { data } = await api.get(`/payroll/records/${record._id}`);
        setSelectedRecord(data.data.record);
        setDetailsDialogOpen(true);
      }
      if (action === 'markPaid') {
        await api.patch(`/payroll/records/${record._id}/mark-paid`, {});
        setSuccess(`${record.employeeName} marked as paid.`);
        await refreshData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete payroll action.');
    }
  };

  const handleApprovalAction = async (action) => {
    if (!selectedRecord?._id) return;
    setSaving(true);
    setError('');
    try {
      const url = action === 'approve' ? `/payroll/records/${selectedRecord._id}/approve` : `/payroll/records/${selectedRecord._id}/reject`;
      await api.patch(url, {
        remarks: selectedRecord.approval?.remarks || '',
        reviewedBy: selectedRecord.approval?.reviewedBy || '',
      });
      const { data } = await api.get(`/payroll/records/${selectedRecord._id}`);
      setSelectedRecord(data.data.record);
      setSuccess(action === 'approve' ? 'Payroll approved.' : 'Payroll sent back for correction.');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update approval status.');
    } finally {
      setSaving(false);
    }
  };

  const exportReport = async (type) => {
    setError('');
    try {
      const { data } = await api.get('/payroll/export', { params: { type } });
      const headers = Object.keys(data.data.rows[0] || { employeeId: '', employeeName: '', department: '', designation: '', netSalary: '', payrollStatus: '' });
      downloadCsv(`${type.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.csv`, [headers, ...data.data.rows.map((row) => headers.map((key) => row[key]))]);
      setSuccess(`${type} exported successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export payroll report.');
    }
  };

  const printPayslip = () => {
    if (!selectedRecord?.payslipPreview) return;
    const payslip = selectedRecord.payslipPreview;
    const receiptWindow = window.open('', '_blank', 'width=1000,height=900');
    if (!receiptWindow) {
      setError('Unable to open the payslip window. Please allow pop-ups and try again.');
      return;
    }
    receiptWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>Payslip ${payslip.employeeDetails.employeeId}</title><style>*{box-sizing:border-box}body{margin:0;background:#eef2ff;color:#0f172a;font-family:"Segoe UI",Arial,sans-serif;padding:28px}.sheet{max-width:900px;margin:0 auto;background:#fff;border-radius:28px;overflow:hidden;border:1px solid #dbe4f0;box-shadow:0 24px 64px rgba(15,23,42,.12)}.hero{background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#fff;padding:32px 36px}.hero h1{margin:12px 0 6px;font-size:34px}.hero p{margin:0;color:rgba(255,255,255,.82)}.content{padding:30px 36px 36px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:24px}.panel{border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;padding:18px 20px}.label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin-bottom:8px}.value{font-size:15px;font-weight:700;color:#0f172a;margin:0 0 5px}table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;margin-top:12px}th,td{padding:14px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:left}th{background:#f8fafc;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b}td:last-child,th:last-child{text-align:right}tr:last-child td{border-bottom:none}.summary{margin-top:18px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.total{background:#0f172a;color:#fff}.total .label,.total .value{color:#fff}@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border-radius:0;border:none}}</style></head><body><div class="sheet"><div class="hero"><div class="label" style="color:rgba(255,255,255,.74)">AYRA ERP</div><h1>Payslip Preview</h1><p>${payslip.month} ${payslip.year} salary statement</p></div><div class="content"><div class="grid"><div class="panel"><div class="label">Employee Details</div><p class="value">${payslip.employeeDetails.employeeName}</p><p>${payslip.employeeDetails.employeeId}</p><p>${payslip.employeeDetails.department} | ${payslip.employeeDetails.designation}</p></div><div class="panel"><div class="label">Payment</div><p class="value">${formatDate(payslip.paymentDate || new Date().toISOString())}</p><p>${payslip.paymentMethod || 'Bank Transfer'}</p><p>${payslip.employeeDetails.salaryType} salary cycle</p></div></div><table><thead><tr><th>Earnings</th><th>Amount</th></tr></thead><tbody>${payslip.earnings.map(([label, amount]) => `<tr><td>${label}</td><td>${formatCurrency(amount)}</td></tr>`).join('')}</tbody></table><table><thead><tr><th>Deductions</th><th>Amount</th></tr></thead><tbody>${payslip.deductions.map(([label, amount]) => `<tr><td>${label}</td><td>${formatCurrency(amount)}</td></tr>`).join('')}</tbody></table><div class="summary"><div class="panel"><div class="label">Gross Salary</div><p class="value">${formatCurrency(payslip.grossSalary)}</p></div><div class="panel"><div class="label">Total Deductions</div><p class="value">${formatCurrency(payslip.totalDeductions)}</p></div><div class="panel total"><div class="label">Net Salary</div><p class="value">${formatCurrency(payslip.netSalary)}</p></div></div></div></div></body></html>`);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  if (loading) {
    return (
      <div className="finance-card flex items-center gap-4 px-6 py-5">
        <CircularProgress size={24} />
        <div>
          <p className="font-finance-display text-lg font-bold text-slate-900">Loading payroll workspace</p>
          <p className="text-sm text-slate-500">Fetching salary structures, payroll summary, and approvals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-finance-display text-3xl font-extrabold text-slate-950">Payroll Management</h2>
          <p className="mt-1 text-sm text-slate-500">Manage employee salaries, monthly payroll processing, deductions, approvals, and payslips</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={() => exportReport('Monthly Payroll Report')} sx={{ borderColor: '#e2e8f0', color: '#475569', borderRadius: '14px', textTransform: 'none', fontWeight: 700 }}>Export Payroll</Button>
          <Button variant="outlined" startIcon={<PreviewOutlined />} onClick={() => setProcessingDialogOpen(true)} sx={{ borderColor: '#dbeafe', color: '#1d4ed8', borderRadius: '14px', textTransform: 'none', fontWeight: 700, bgcolor: '#eff6ff' }}>Process Monthly Payroll</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog} sx={{ bgcolor: '#0f172a', borderRadius: '14px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1e293b' } }}>Add Employee Salary</Button>
        </div>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => <SummaryCard key={card.title} {...card} />)}
      </div>

      <div className="finance-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <TextField size="small" placeholder="Search by employee name or employee ID" value={filters.search} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, search: event.target.value })); }} sx={{ ...payrollFieldSx, flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8' }} /></InputAdornment> }} />
        <TextField select size="small" value={filters.department} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, department: event.target.value })); }} sx={{ ...payrollFieldSx, minWidth: 180 }} InputProps={{ startAdornment: <InputAdornment position="start"><WorkOutline sx={{ color: '#94a3b8' }} /></InputAdornment> }}>
          <MenuItem value="">All Departments</MenuItem>
          {(summary?.filters?.departments?.length ? summary.filters.departments : DEPARTMENTS).map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={filters.payrollStatus} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, payrollStatus: event.target.value })); }} sx={{ ...payrollFieldSx, minWidth: 170 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {(summary?.filters?.statuses || []).map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={filters.month} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, month: event.target.value })); }} sx={{ ...payrollFieldSx, minWidth: 160 }}>
          <MenuItem value="">All Months</MenuItem>
          {(summary?.filters?.months || []).map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={filters.salaryType} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, salaryType: event.target.value })); }} sx={{ ...payrollFieldSx, minWidth: 150 }}>
          <MenuItem value="">All Salary Types</MenuItem>
          {(summary?.filters?.salaryTypes || []).map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
        </TextField>
      </div>

      <div className="finance-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-finance-display text-lg font-extrabold text-slate-950">Employee Payroll Register</h3>
            <p className="text-xs text-slate-400">Salary structures, approvals, and payout status</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{pagination.total || 0} records</div>
        </div>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                {['Employee ID', 'Name', 'Department', 'Designation', 'Salary Type', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay', 'Payroll Status', 'Action'].map((label) => (
                  <TableCell key={label} sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#94a3b8', borderBottomColor: '#e2e8f0' }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableLoading ? (
                <TableRow><TableCell colSpan={11} sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={22} /></TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={11} sx={{ py: 8, textAlign: 'center', color: '#64748b' }}>No payroll records match the current filters.</TableCell></TableRow>
              ) : records.map((record) => (
                <TableRow key={record._id} hover sx={{ '& td': { borderBottomColor: '#f1f5f9' } }}>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>{record.employeeId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar sx={{ bgcolor: stringToColor(record.employeeName), width: 38, height: 38, fontSize: 13, fontWeight: 800 }}>{getInitials(record.employeeName)}</Avatar>
                      <div>
                        <p className="m-0 text-sm font-semibold text-slate-900">{record.employeeName}</p>
                        <p className="m-0 text-xs text-slate-400">{record.employeeEmail || 'Payroll record'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.designation}</TableCell>
                  <TableCell>{record.salaryType}</TableCell>
                  <TableCell>{formatCurrency(record.basicSalary)}</TableCell>
                  <TableCell>{formatCurrency(record.totalAllowances || 0)}</TableCell>
                  <TableCell>{formatCurrency(record.totalDeductions || 0)}</TableCell>
                  <TableCell><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">{formatCurrency(record.netSalary)}</span></TableCell>
                  <TableCell><StatusChip status={record.payrollStatus} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="small" variant="text" startIcon={<VisibilityOutlined sx={{ fontSize: 16 }} />} onClick={() => handleRowAction(record, 'view')} sx={{ minWidth: 0, textTransform: 'none', fontWeight: 700, color: '#1d4ed8' }}>View</Button>
                      <Button size="small" variant="text" startIcon={<TuneOutlined sx={{ fontSize: 16 }} />} onClick={() => openEditDialog(record)} sx={{ minWidth: 0, textTransform: 'none', fontWeight: 700, color: '#475569' }}>Edit Salary</Button>
                      <Button size="small" variant="text" startIcon={<ReceiptLongOutlined sx={{ fontSize: 16 }} />} onClick={() => openPayslip(record)} disabled={payslipLoading} sx={{ minWidth: 0, textTransform: 'none', fontWeight: 700, color: '#0f766e' }}>Generate Payslip</Button>
                      <Button size="small" variant="text" startIcon={<PaidOutlined sx={{ fontSize: 16 }} />} onClick={() => handleRowAction(record, 'markPaid')} sx={{ minWidth: 0, textTransform: 'none', fontWeight: 700, color: '#059669' }}>Mark Paid</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <Pagination count={pagination.totalPages || 1} page={page} onChange={(_, value) => setPage(value)} color="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="finance-card p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-finance-display text-lg font-extrabold text-slate-950">Payroll Processing Panel</h3>
              <p className="text-xs text-slate-400">Preview and run monthly payroll with payslip generation</p>
            </div>
            <Button variant="outlined" startIcon={<PreviewOutlined />} onClick={() => setProcessingDialogOpen(true)} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700 }}>Open Controls</Button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField select size="small" label="Select Month" value={processingForm.month} onChange={(event) => setProcessingForm((current) => ({ ...current, month: event.target.value }))} sx={payrollFieldSx}>
              {(summary?.filters?.months || []).map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Select Year" type="number" value={processingForm.year} onChange={(event) => setProcessingForm((current) => ({ ...current, year: Number(event.target.value) }))} sx={payrollFieldSx} />
            <TextField select size="small" label="Select Department" value={processingForm.department} onChange={(event) => setProcessingForm((current) => ({ ...current, department: event.target.value }))} sx={payrollFieldSx}>
              <MenuItem value="">All Departments</MenuItem>
              {(summary?.filters?.departments || DEPARTMENTS).map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
            </TextField>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="contained" onClick={() => handleProcessAction('process')} disabled={processLoading} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>Process Payroll</Button>
            <Button variant="outlined" onClick={() => handleProcessAction('preview')} disabled={processLoading} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700 }}>Preview Payroll</Button>
            <Button variant="outlined" onClick={() => handleProcessAction('generatePayslips')} disabled={processLoading} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700 }}>Generate All Payslips</Button>
            <Button variant="outlined" onClick={() => handleProcessAction('export')} disabled={processLoading} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700 }}>Export Payroll</Button>
          </div>
          {previewData && (
            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                  ['Employees', previewData.totals.employees],
                  ['Gross Salary', formatCurrency(previewData.totals.grossSalary)],
                  ['Deductions', formatCurrency(previewData.totals.deductions)],
                  ['Net Salary', formatCurrency(previewData.totals.netSalary)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="finance-card p-6">
          <h3 className="font-finance-display text-lg font-extrabold text-slate-950">Recent Payroll Activity</h3>
          <p className="text-xs text-slate-400">Approvals, processing, and payslip events</p>
          <div className="mt-5 space-y-4">
            {(summary?.recentActivity || []).length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-400">No recent payroll activity yet.</div>
            ) : summary.recentActivity.map((item, index) => (
              <div key={`${item.employeeId}-${index}`} className="flex gap-3">
                <div className="mt-1 flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                  {index !== summary.recentActivity.length - 1 && <div className="mt-2 h-full w-px bg-slate-200" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.employeeName} ({item.employeeId})</p>
                  <p className="mt-1 text-xs text-slate-400">{item.note || item.by}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="finance-card p-6 xl:col-span-2">
          <h3 className="font-finance-display text-lg font-extrabold text-slate-950">Reports & Export</h3>
          <p className="text-xs text-slate-400">Download payroll reports without leaving the workspace</p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {reportTypes.map((type) => (
              <button key={type} type="button" onClick={() => exportReport(type)} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white">
                <p className="text-sm font-semibold text-slate-900">{type}</p>
                <p className="mt-1 text-xs text-slate-400">CSV export with payroll register fields and status summary.</p>
              </button>
            ))}
          </div>
        </div>
        <div className="finance-card p-6">
          <h3 className="font-finance-display text-lg font-extrabold text-slate-950">Operational Notes</h3>
          <div className="mt-5 space-y-3">
            {[
              ['Attendance sync', 'Working days, leave, overtime, and extra shift pay are included in payroll details.'],
              ['Approval routing', 'Prepared, reviewed, and approved metadata are stored with every payroll record.'],
              ['Payslip release', 'Download or email employee payslips directly from each payroll row.'],
            ].map(([label, text]) => (
              <div key={label} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dialog
        open={salaryDialogOpen}
        onClose={(_, reason) => { if (reason !== 'backdropClick') setSalaryDialogOpen(false); }}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '76rem',
            maxHeight: 'min(92vh, 980px)',
            borderRadius: '28px',
            overflow: 'hidden',
            backgroundImage: 'none',
            backgroundColor: '#f8fbff',
            border: '1px solid rgba(226,232,240,0.95)',
            boxShadow: '0 34px 90px rgba(15,23,42,0.18)',
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(15,23,42,0.34)',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', minHeight: { xs: 640, md: 720 }, maxHeight: 'min(92vh, 980px)', flexDirection: 'column' }}>
            <Box sx={{ flexShrink: 0, borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 3.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#0f274f' }}>
                    Payroll Setup
                  </Typography>
                  <Typography sx={{ mt: 1.1, fontFamily: '"Manrope", sans-serif', fontSize: { xs: '1.55rem', sm: '1.85rem' }, fontWeight: 800, letterSpacing: '-0.03em', color: '#020617' }}>
                    {selectedRecord?._id ? 'Edit Salary Structure' : 'Add Salary Structure'}
                  </Typography>
                  <Typography sx={{ mt: 1.2, maxWidth: 780, fontSize: '0.94rem', lineHeight: 1.7, color: '#64748b' }}>
                    Capture salary components, deductions, approval metadata, and payroll timing.
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setSalaryDialogOpen(false)}
                  sx={{
                    flexShrink: 0,
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    color: '#64748b',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
                    '&:hover': { bgcolor: '#f8fafc', color: '#334155' },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 3.5 }, background: 'linear-gradient(180deg,#f8fbff 0%,#f3f7fc 100%)' }}>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Stack spacing={3}>
                <Paper elevation={0} sx={{ ...payrollDialogPanelSx, p: { xs: 2.5, sm: 3 }, background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)' }}>
                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <PayrollSummaryTile label="Salary Type" value={salaryForm.salaryType || 'Not selected'} accent="#0f274f" bg="#eff6ff" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <PayrollSummaryTile label="Gross Salary" value={formatCurrency(totals.grossSalary)} accent="#0f766e" bg="#ecfdf5" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <PayrollSummaryTile label="Net Salary" value={formatCurrency(totals.netSalary)} accent="#1d4ed8" bg="#eef2ff" />
                      </Grid>
                    </Grid>
                    <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #bfdbfe', bgcolor: '#eff6ff', px: 2.25, py: 1.8 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#1d4ed8' }}>
                        Pro tip
                      </Typography>
                      <Typography sx={{ mt: 1, fontSize: '0.92rem', lineHeight: 1.7, color: '#475569' }}>
                        Use the calculated gross, deductions, and net salary summary to validate the structure before saving.
                      </Typography>
                    </Paper>
                  </Stack>
                </Paper>

                <PayrollSection title="Section 1: Employee Details" description="Maintain the employee identity and organizational details tied to this salary structure.">
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Employee Name" size="small" value={salaryForm.employeeName} onChange={(event) => handleSalaryFieldChange('employeeName', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Employee ID" size="small" value={salaryForm.employeeId} onChange={(event) => handleSalaryFieldChange('employeeId', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Employee Email" size="small" value={salaryForm.employeeEmail} onChange={(event) => handleSalaryFieldChange('employeeEmail', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField select label="Department" size="small" value={salaryForm.department} onChange={(event) => handleSalaryFieldChange('department', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth>{DEPARTMENTS.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}</TextField>
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Designation" size="small" value={salaryForm.designation} onChange={(event) => handleSalaryFieldChange('designation', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                </PayrollSection>

                <PayrollSection title="Section 2: Salary Components" description="Review the earnings inputs in a clear payroll-friendly structure.">
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField select label="Salary Type" size="small" value={salaryForm.salaryType} onChange={(event) => handleSalaryFieldChange('salaryType', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth>{['Monthly', 'Hourly', 'Contract'].map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField>
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Basic Pay" type="number" size="small" value={salaryForm.basicSalary} onChange={(event) => handleSalaryFieldChange('basicSalary', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="HRA" type="number" size="small" value={salaryForm.allowances.hra} onChange={(event) => handleNestedFieldChange('allowances', 'hra', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="DA" type="number" size="small" value={salaryForm.allowances.da} onChange={(event) => handleNestedFieldChange('allowances', 'da', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Travel Allowance" type="number" size="small" value={salaryForm.allowances.travelAllowance} onChange={(event) => handleNestedFieldChange('allowances', 'travelAllowance', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Medical Allowance" type="number" size="small" value={salaryForm.allowances.medicalAllowance} onChange={(event) => handleNestedFieldChange('allowances', 'medicalAllowance', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Bonus" type="number" size="small" value={salaryForm.allowances.bonus} onChange={(event) => handleNestedFieldChange('allowances', 'bonus', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                </PayrollSection>

                <PayrollSection title="Section 3: Deductions" description="Keep statutory and manual deductions separate and easy to review.">
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="PF" type="number" size="small" value={salaryForm.deductions.pf} onChange={(event) => handleNestedFieldChange('deductions', 'pf', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="ESI" type="number" size="small" value={salaryForm.deductions.esi} onChange={(event) => handleNestedFieldChange('deductions', 'esi', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Tax" type="number" size="small" value={salaryForm.deductions.tax} onChange={(event) => handleNestedFieldChange('deductions', 'tax', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Loan Deduction" type="number" size="small" value={salaryForm.deductions.loanDeduction} onChange={(event) => handleNestedFieldChange('deductions', 'loanDeduction', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Other Deductions" type="number" size="small" value={salaryForm.deductions.otherDeductions} onChange={(event) => handleNestedFieldChange('deductions', 'otherDeductions', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                </PayrollSection>

                <PayrollSection title="Section 4: Payment & Payroll Period" description="Align payment method, banking details, and the active salary cycle in one place.">
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Payment Method" size="small" value={salaryForm.paymentMethod} onChange={(event) => handleSalaryFieldChange('paymentMethod', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Bank Account Number" size="small" value={salaryForm.bankAccountNumber} onChange={(event) => handleSalaryFieldChange('bankAccountNumber', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="IFSC Code" size="small" value={salaryForm.ifscCode} onChange={(event) => handleSalaryFieldChange('ifscCode', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Effective From Date" type="date" size="small" value={salaryForm.effectiveFromDate} onChange={(event) => handleSalaryFieldChange('effectiveFromDate', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Month" size="small" value={salaryForm.month} onChange={(event) => handleSalaryFieldChange('month', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Year" type="number" size="small" value={salaryForm.year} onChange={(event) => handleSalaryFieldChange('year', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                </PayrollSection>

                <PayrollSection title="Section 5: Attendance / Payroll Metrics" description="Keep payroll-impacting attendance values aligned and easy to scan.">
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Total Working Days" type="number" size="small" value={salaryForm.attendance.totalWorkingDays} onChange={(event) => handleNestedFieldChange('attendance', 'totalWorkingDays', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Present Days" type="number" size="small" value={salaryForm.attendance.presentDays} onChange={(event) => handleNestedFieldChange('attendance', 'presentDays', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Leave Taken" type="number" size="small" value={salaryForm.attendance.leaveTaken} onChange={(event) => handleNestedFieldChange('attendance', 'leaveTaken', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Loss of Pay" type="number" size="small" value={salaryForm.attendance.lossOfPay} onChange={(event) => handleNestedFieldChange('attendance', 'lossOfPay', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Overtime Hours" type="number" size="small" value={salaryForm.attendance.overtimeHours} onChange={(event) => handleNestedFieldChange('attendance', 'overtimeHours', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Extra Shift Pay" type="number" size="small" value={salaryForm.attendance.extraShiftPay} onChange={(event) => handleNestedFieldChange('attendance', 'extraShiftPay', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                </PayrollSection>

                <PayrollSection title="Section 6: Approval Metadata" description="Add ownership and remarks without cramping the end of the form." gridSx={{ alignItems: 'stretch' }}>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Prepared By" size="small" value={salaryForm.approval.preparedBy} onChange={(event) => handleNestedFieldChange('approval', 'preparedBy', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={6} xl={4}>
                    <TextField label="Reviewed By" size="small" value={salaryForm.approval.reviewedBy} onChange={(event) => handleNestedFieldChange('approval', 'reviewedBy', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Remarks" size="small" multiline minRows={3} value={salaryForm.remarks} onChange={(event) => handleSalaryFieldChange('remarks', event.target.value)} sx={payrollFieldSx} InputLabelProps={salaryLabelProps} fullWidth />
                  </Grid>
                </PayrollSection>
              </Stack>
            </Box>

            <Box sx={{ flexShrink: 0, borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: { xs: 3, sm: 4 }, py: 2.25 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1.75 }}>
                <Button
                  onClick={() => setSalaryDialogOpen(false)}
                  variant="text"
                  color="inherit"
                  sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSalary}
                  disabled={saving || !salaryForm.employeeName || !salaryForm.employeeId || !salaryForm.department || !salaryForm.designation}
                  variant="contained"
                  endIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutline />}
                  sx={{
                    minWidth: { xs: '100%', sm: 'auto' },
                    borderRadius: '16px',
                    px: 3.2,
                    py: 1.3,
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'none',
                    background: 'linear-gradient(90deg,#0f274f 0%,#0d2d63 100%)',
                    boxShadow: '0 16px 28px rgba(15,39,79,0.22)',
                    '&:hover': { background: 'linear-gradient(90deg,#0d2345 0%,#0b2758 100%)' },
                    '&.Mui-disabled': { background: '#c8d3e2', color: '#fff', boxShadow: 'none' },
                  }}
                >
                  {selectedRecord?._id ? 'Update Salary Structure' : 'Save Salary Structure'}
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={processingDialogOpen}
        onClose={() => setProcessingDialogOpen(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '64rem',
            maxHeight: 'min(92vh, 920px)',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(226,232,240,0.95)',
            boxShadow: '0 34px 90px rgba(15,23,42,0.18)',
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(19,27,44,0.38)',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            py: { xs: 2.5, sm: 3 },
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8' }}>
                Batch Controls
              </Typography>
              <Typography sx={{ mt: 1, fontSize: { xs: '1.45rem', sm: '1.8rem' }, fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
                Payroll Processing
              </Typography>
              <Typography sx={{ mt: 1.1, maxWidth: '42rem', fontSize: '0.95rem', lineHeight: 1.7, color: '#64748b' }}>
                Select the payroll cycle, preview totals, and complete batch actions.
              </Typography>
            </Box>
            <IconButton onClick={() => setProcessingDialogOpen(false)} sx={{ color: '#475569', border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: '0 8px 20px rgba(15,23,42,0.06)', '&:hover': { bgcolor: '#f8fafc' } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <BatchControlCard title="Configuration" subtitle="Choose the payroll cycle, statement year, and department scope for this batch run.">
              <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}>
                  <TextField select label="Cycle" size="small" value={processingForm.month} onChange={(event) => setProcessingForm((current) => ({ ...current, month: event.target.value }))} sx={payrollFieldSx} fullWidth>
                    {(summary?.filters?.months || []).map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Year" type="number" size="small" value={processingForm.year} onChange={(event) => setProcessingForm((current) => ({ ...current, year: Number(event.target.value) }))} sx={payrollFieldSx} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select label="Department" size="small" value={processingForm.department} onChange={(event) => setProcessingForm((current) => ({ ...current, department: event.target.value }))} sx={payrollFieldSx} fullWidth>
                    <MenuItem value="">All Departments</MenuItem>
                    {(summary?.filters?.departments || DEPARTMENTS).map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </BatchControlCard>

            <BatchControlCard title="Preview Summary" subtitle="Review the current batch scope before running preview, payslip generation, or processing.">
              <Grid container spacing={2.25}>
                <Grid item xs={12} md={4}>
                  <PayslipSummaryBox label="Preview Net Pay" value={formatCurrency(previewData?.totals?.netSalary || 0)} valueColor="#047857" emphasize />
                </Grid>
                <Grid item xs={12} md={4}>
                  <PayslipSummaryBox label="Selected Cycle" value={`${processingForm.month || 'Select month'} ${processingForm.year}`} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <PayslipSummaryBox label="Selected Department" value={processingForm.department || 'All Departments'} />
                </Grid>
              </Grid>
            </BatchControlCard>

            <Alert
              severity="info"
              sx={{
                borderRadius: '20px',
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                color: '#1e3a8a',
                alignItems: 'flex-start',
                boxShadow: '0 10px 26px rgba(37,99,235,0.08)',
                '& .MuiAlert-icon': { color: '#2563eb', mt: '2px' },
              }}
            >
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#2563eb' }}>
                Pro Tip
              </Typography>
              <Typography sx={{ mt: 0.6, fontSize: '0.92rem', lineHeight: 1.65, color: '#1e3a8a' }}>
                Preview payroll before processing so gross, deductions, and net pay totals are reviewed by the accounts team.
              </Typography>
            </Alert>

            <BatchControlCard title="Batch Actions" subtitle="Run supporting payroll actions before final processing.">
              <Grid container spacing={1.75}>
                <Grid item xs={12} md={4}>
                  <Button variant="outlined" onClick={() => handleProcessAction('preview')} disabled={processLoading} fullWidth sx={{ minHeight: 48, borderRadius: '16px', textTransform: 'none', fontWeight: 700 }}>
                    Preview Payroll
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button variant="outlined" onClick={() => handleProcessAction('generatePayslips')} disabled={processLoading} fullWidth sx={{ minHeight: 48, borderRadius: '16px', textTransform: 'none', fontWeight: 700 }}>
                    Generate All Payslips
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button variant="outlined" onClick={() => handleProcessAction('export')} disabled={processLoading} fullWidth sx={{ minHeight: 48, borderRadius: '16px', textTransform: 'none', fontWeight: 700 }}>
                    Export Payroll
                  </Button>
                </Grid>
              </Grid>
            </BatchControlCard>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2.25, borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', justifyContent: 'space-between', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button onClick={() => setProcessingDialogOpen(false)} variant="text" color="inherit" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em' }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleProcessAction('process')}
            disabled={processLoading || !processingForm.month || !processingForm.year}
            variant="contained"
            endIcon={processLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutline />}
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              borderRadius: '16px',
              px: 3.2,
              py: 1.3,
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'none',
              background: 'linear-gradient(90deg,#0f274f 0%,#0d2d63 100%)',
              boxShadow: '0 16px 28px rgba(15,39,79,0.22)',
              '&:hover': { background: 'linear-gradient(90deg,#0d2345 0%,#0b2758 100%)' },
              '&.Mui-disabled': { background: '#c8d3e2', color: '#fff', boxShadow: 'none' },
            }}
          >
            Process Payroll
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={payslipDialogOpen}
        onClose={() => setPayslipDialogOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '68rem',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(226,232,240,0.95)',
            boxShadow: '0 34px 90px rgba(15,23,42,0.18)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '86vh' }}>
          <Box sx={{ borderBottom: '1px solid rgba(226,232,240,0.2)', background: 'linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%)', px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 }, color: '#ffffff' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)' }}>
                  Payslip Preview
                </Typography>
                <Typography sx={{ mt: 1.2, fontSize: { xs: '1.7rem', sm: '2rem' }, fontWeight: 800, lineHeight: 1.15 }}>
                  {employeeDetails.employeeName || selectedRecord?.employeeName}
                </Typography>
                <Typography sx={{ mt: 0.9, fontSize: '0.95rem', color: 'rgba(255,255,255,0.78)' }}>
                  {payslipMonthLabel}
                </Typography>
              </Box>
              <IconButton onClick={() => setPayslipDialogOpen(false)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, overflowY: 'auto', backgroundColor: '#f8fafc' }}>
            {payslipPreview && (
              <Stack spacing={2.5}>
                <PayslipSectionCard title="Employee Details" subtitle="Employee and payment metadata for this salary statement.">
                  <Stack spacing={0}>
                    <PayslipDataRow label="Employee Name" value={employeeDetails.employeeName || '-'} divider />
                    <PayslipDataRow label="Employee ID" value={employeeDetails.employeeId || '-'} divider />
                    <PayslipDataRow label="Department / Designation" value={[employeeDetails.department, employeeDetails.designation].filter(Boolean).join(' / ') || '-'} divider />
                    <PayslipDataRow label="Payment Method" value={payslipPreview.paymentMethod || 'Bank Transfer'} divider />
                    <PayslipDataRow label="Payroll Cycle" value={`${payslipCycle} salary cycle`} divider />
                    <PayslipDataRow label="Payment Date" value={payslipPaymentDate} />
                  </Stack>
                </PayslipSectionCard>

                <Grid container spacing={2.25}>
                  <Grid item xs={12} md={4}>
                    <PayslipSummaryBox label="Gross Salary" value={formatCurrency(payslipPreview.grossSalary)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <PayslipSummaryBox label="Net Salary" value={formatCurrency(payslipPreview.netSalary)} valueColor="#047857" emphasize />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <PayslipSummaryBox label="Payment Date" value={payslipPaymentDate} />
                  </Grid>
                </Grid>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} lg={6}>
                    <PayslipSectionCard title="Earnings Breakdown" subtitle="All salary components credited for the current payroll cycle.">
                      <Stack divider={<Divider sx={{ borderColor: '#eef2f7' }} />} spacing={0}>
                        {payslipEarnings.map(([label, amount]) => (
                          <PayslipDataRow key={label} label={label} value={formatCurrency(amount)} />
                        ))}
                      </Stack>
                    </PayslipSectionCard>
                  </Grid>
                  <Grid item xs={12} lg={6}>
                    <PayslipSectionCard title="Deductions Breakdown" subtitle="Statutory and payroll deductions applied before final payout.">
                      <Stack divider={<Divider sx={{ borderColor: '#eef2f7' }} />} spacing={0}>
                        {payslipDeductions.map(([label, amount]) => (
                          <PayslipDataRow key={label} label={label} value={formatCurrency(amount)} />
                        ))}
                      </Stack>
                    </PayslipSectionCard>
                  </Grid>
                </Grid>

                <PayslipSectionCard title="Final Pay Summary" subtitle="A concise view of the total earnings, deductions, and take-home salary.">
                  <Stack spacing={0}>
                    <PayslipDataRow label="Gross Salary" value={formatCurrency(payslipPreview.grossSalary)} divider />
                    <PayslipDataRow label="Total Deductions" value={formatCurrency(payslipTotalDeductions)} divider />
                    <PayslipDataRow label="Net Salary" value={formatCurrency(payslipPreview.netSalary)} emphasize valueColor="#047857" />
                  </Stack>
                </PayslipSectionCard>
              </Stack>
            )}
          </DialogContent>

          <Box sx={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', px: { xs: 2, sm: 3 }, py: 2.25 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
              <Button variant="outlined" startIcon={<Download />} onClick={printPayslip} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700, px: 2.2 }}>
                Download PDF
              </Button>
              <Button variant="contained" startIcon={<SendOutlined />} onClick={() => openPayslip(selectedRecord, 'email')} sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 700, px: 2.2, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
                Email Payslip
              </Button>
            </Stack>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '74rem',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            border: '1px solid rgba(226,232,240,0.95)',
            boxShadow: '0 34px 90px rgba(15,23,42,0.18)',
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#f8fafc' }}>
          {selectedRecord && (
            <Stack spacing={2.5}>
              <PayrollDetailsCard sx={{ background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)' }}>
                <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, minWidth: 0, flex: 1 }}>
                    <Avatar
                      sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: stringToColor(selectedRecord.employeeName || ''), fontWeight: 800, fontSize: 22 }}
                    >
                      {getInitials(selectedRecord.employeeName || '')}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, fontWeight: 800, color: '#0f172a' }}>
                        {selectedRecord.employeeName}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: '0.92rem', color: '#475569' }}>
                        {selectedRecord.employeeId || 'Employee ID unavailable'}
                      </Typography>
                      <Typography sx={{ mt: 0.75, fontSize: '0.92rem', color: '#64748b' }}>
                        {[selectedRecord.department, selectedRecord.designation].filter(Boolean).join(' / ') || 'Department and designation unavailable'}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                    {selectedRecord.payrollStatus && <StatusChip status={selectedRecord.payrollStatus} />}
                    <IconButton onClick={() => setDetailsDialogOpen(false)} sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                      <Close />
                    </IconButton>
                  </Stack>
                </Box>
              </PayrollDetailsCard>

              <Grid container spacing={2.5} alignItems="stretch">
                <Grid item xs={12} lg={8}>
                  <Stack spacing={2.5}>
                    <PayrollDetailsCard title="Salary Summary" subtitle={`${selectedRecord.month || 'Current'} ${selectedRecord.year || ''} payroll snapshot`.trim()}>
                      <Grid container spacing={1.75}>
                        <Grid item xs={12} sm={4}>
                          <PayrollMetricTile label="Basic Salary" value={formatCurrency(selectedRecord.basicSalary)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <PayrollMetricTile label="Gross Salary" value={formatCurrency(selectedRecord.grossSalary)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <PayrollMetricTile label="Net Salary" value={formatCurrency(selectedRecord.netSalary)} valueColor="#0f766e" />
                        </Grid>
                      </Grid>
                    </PayrollDetailsCard>

                    <PayrollDetailsCard title="Attendance / Leave Integration" subtitle="Payroll-impacting attendance values arranged in clear aligned rows.">
                      <Stack spacing={1.25}>
                        <PayrollInfoRow label="Total Working Days" value={selectedRecord.attendance?.totalWorkingDays || 0} />
                        <PayrollInfoRow label="Present Days" value={selectedRecord.attendance?.presentDays || 0} />
                        <PayrollInfoRow label="Leave Taken" value={selectedRecord.attendance?.leaveTaken || 0} />
                        <PayrollInfoRow label="Loss of Pay" value={selectedRecord.attendance?.lossOfPay || 0} />
                        <PayrollInfoRow label="Overtime Hours" value={selectedRecord.attendance?.overtimeHours || 0} />
                        <PayrollInfoRow label="Extra Shift Pay" value={formatCurrency(selectedRecord.attendance?.extraShiftPay || 0)} emphasize />
                      </Stack>
                    </PayrollDetailsCard>

                    <PayrollDetailsCard title="Salary Breakdown" subtitle="Earnings and deductions are separated into consistent review blocks.">
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1.25}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#94a3b8' }}>
                              Earnings
                            </Typography>
                            {(selectedRecord.payslipPreview?.earnings || []).map(([label, amount]) => (
                              <PayrollInfoRow key={label} label={label} value={formatCurrency(amount)} />
                            ))}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1.25}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#94a3b8' }}>
                              Deductions
                            </Typography>
                            {(selectedRecord.payslipPreview?.deductions || []).map(([label, amount]) => (
                              <PayrollInfoRow key={label} label={label} value={formatCurrency(amount)} />
                            ))}
                          </Stack>
                        </Grid>
                      </Grid>
                    </PayrollDetailsCard>
                  </Stack>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Stack spacing={2.5}>
                    <PayrollDetailsCard title="Approval Workflow" subtitle="Ownership, approval state, and remarks stay together in one review card.">
                      <Stack spacing={1.25}>
                        <PayrollInfoRow label="Prepared By" value={selectedRecord.approval?.preparedBy || 'Not assigned'} />
                        <PayrollInfoRow label="Reviewed By" value={selectedRecord.approval?.reviewedBy || 'Not assigned'} />
                        <PayrollInfoRow label="Approved By" value={selectedRecord.approval?.approvedBy || 'Awaiting approval'} />
                        <PayrollInfoRow label="Approval Date" value={selectedRecord.approval?.approvalDate ? formatDate(selectedRecord.approval.approvalDate) : 'Pending'} />
                        <Box sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', p: 2 }}>
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#94a3b8' }}>
                            Remarks
                          </Typography>
                          <TextField
                            label="Remarks"
                            size="small"
                            multiline
                            minRows={3}
                            value={selectedRecord.approval?.remarks || ''}
                            onChange={(event) => setSelectedRecord((current) => ({ ...current, approval: { ...current.approval, remarks: event.target.value } }))}
                            sx={{ ...payrollFieldSx, mt: 1.5 }}
                            fullWidth
                          />
                        </Box>
                      </Stack>
                      <Divider sx={{ borderColor: '#eef2f7' }} />
                      <Stack direction={{ xs: 'column', sm: 'row', lg: 'column', xl: 'row' }} spacing={1.25}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={() => handleApprovalAction('reject')}
                          disabled={saving}
                          sx={{ minHeight: 46, borderRadius: '14px', textTransform: 'none', fontWeight: 700, color: '#dc2626', borderColor: '#fecaca' }}
                        >
                          Reject
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckCircleOutline />}
                          onClick={() => handleApprovalAction('approve')}
                          disabled={saving}
                          sx={{ minHeight: 46, borderRadius: '14px', textTransform: 'none', fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
                        >
                          Approve
                        </Button>
                      </Stack>
                    </PayrollDetailsCard>

                    <PayrollDetailsCard title="Payroll Timeline" subtitle="Each event is grouped into a structured entry instead of freeform text.">
                      <Stack spacing={1.5}>
                        {(selectedRecord.timeline || []).map((item, index) => (
                          <Box key={`${item.label}-${index}`} sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.5 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '999px', bgcolor: '#0f172a' }} />
                              {index !== (selectedRecord.timeline || []).length - 1 ? <Box sx={{ mt: 1, width: 1, flex: 1, bgcolor: '#cbd5e1', minHeight: 28 }} /> : null}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1, borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', px: 2, py: 1.5 }}>
                              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                                {item.label}
                              </Typography>
                              {item.by ? (
                                <Typography sx={{ mt: 0.5, fontSize: '0.8rem', color: '#64748b' }}>
                                  {item.by}
                                </Typography>
                              ) : null}
                              {item.note ? (
                                <Typography sx={{ mt: 0.75, fontSize: '0.82rem', lineHeight: 1.6, color: '#94a3b8' }}>
                                  {item.note}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </PayrollDetailsCard>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
