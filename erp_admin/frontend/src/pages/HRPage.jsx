import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Slide,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  BadgeOutlined,
  CakeOutlined,
  CalendarMonthOutlined,
  CameraAlt,
  Close,
  DeleteOutline,
  EmailOutlined,
  EditOutlined,
  EventBusyOutlined,
  EventNoteOutlined,
  GroupsOutlined,
  HomeOutlined,
  HowToRegOutlined,
  MaleOutlined,
  MonetizationOnOutlined,
  NotesOutlined,
  PersonOutline,
  PhoneOutlined,
  Search,
  TodayOutlined,
  VisibilityOutlined,
  WatchLaterOutlined,
  WorkHistoryOutlined,
  WorkOutline,
} from '@mui/icons-material';
import api from '../utils/api';
import StatCard from '../components/common/StatCard';
import { DEPARTMENTS } from '../utils/constants';
import { formatCurrency, formatDate, getInitials, stringToColor } from '../utils/helpers';

const ITEMS_PER_PAGE = 10;
const employmentTypes = ['Full Time', 'Part Time', 'Contract', 'Intern'];
const employeeStatuses = ['Active', 'On Leave', 'Inactive', 'Probation', 'Resigned'];
const attendanceStatuses = ['Present', 'Absent', 'Late', 'Half Day'];
const leaveStatuses = ['Pending', 'Approved', 'Rejected'];
const leaveTypes = ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave', 'Work From Home'];

const emptyEmployeeForm = {
  fullName: '',
  employeeId: '',
  gender: 'Prefer not to say',
  dateOfBirth: '',
  email: '',
  phone: '',
  address: '',
  department: '',
  designation: '',
  employmentType: 'Full Time',
  dateOfJoining: new Date().toISOString().slice(0, 10),
  managerName: '',
  salaryCTC: '',
  status: 'Active',
  profilePhoto: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  notes: '',
};

const emptyAttendanceForm = {
  date: new Date().toISOString().slice(0, 10),
  status: 'Present',
  checkInTime: '09:00',
  checkOutTime: '18:00',
  workingHours: '',
  notes: '',
};

const emptyLeaveForm = {
  leaveType: 'Casual Leave',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: '',
  status: 'Pending',
  reviewNote: '',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: '#fcfdff',
    '& fieldset': { borderColor: '#dbe4f0' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(37,99,235,0.12)' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb' },
  },
  '& .MuiInputLabel-root': { fontWeight: 600 },
};

const employeeDialogFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    backgroundColor: '#fcfdff',
    transition: 'all 0.22s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    '& fieldset': { borderColor: 'rgba(203,213,225,0.95)' },
    '&:hover': {
      backgroundColor: '#ffffff',
      boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
    },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 4px rgba(37,99,235,0.12)',
    },
    '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 1 },
  },
  '& .MuiInputBase-input': { py: 1.65 },
  '& .MuiSelect-select': { py: '13px !important' },
};

const EmployeeDialogTransition = forwardRef(function EmployeeDialogTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const detailCardSx = {
  borderRadius: '22px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  boxShadow: '0 14px 38px rgba(15,23,42,0.05)',
  p: { xs: 2.25, sm: 2.75 },
};

const chipToneMap = {
  Active: { bg: '#ecfdf5', color: '#059669' },
  'On Leave': { bg: '#fff7ed', color: '#c2410c' },
  Inactive: { bg: '#f8fafc', color: '#475569' },
  Probation: { bg: '#eef2ff', color: '#3730a3' },
  Resigned: { bg: '#fef2f2', color: '#dc2626' },
  Pending: { bg: '#fff7ed', color: '#c2410c' },
  Approved: { bg: '#ecfdf5', color: '#059669' },
  Rejected: { bg: '#fef2f2', color: '#dc2626' },
  Present: { bg: '#ecfdf5', color: '#059669' },
  Absent: { bg: '#fef2f2', color: '#dc2626' },
  Late: { bg: '#fff7ed', color: '#c2410c' },
  'Half Day': { bg: '#eef2ff', color: '#2563eb' },
};

function StatusChip({ label }) {
  const tone = chipToneMap[label] || { bg: '#f8fafc', color: '#475569' };
  return <Chip label={label} size="small" sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, fontSize: '0.7rem', height: 24, borderRadius: '999px' }} />;
}

function DetailCard({ title, subtitle, children }) {
  return (
    <Paper elevation={0} sx={detailCardSx}>
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8' }}>{title}</Typography>
          {subtitle ? <Typography sx={{ mt: 0.8, fontSize: '0.92rem', lineHeight: 1.6, color: '#64748b' }}>{subtitle}</Typography> : null}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

function KeyValueRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 1.5, borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
      <Typography sx={{ fontSize: '0.9rem', color: '#64748b' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{value || '-'}</Typography>
    </Box>
  );
}

function AttendanceMetric({ label, value, tone = '#0f172a' }) {
  return (
    <Box sx={{ borderRadius: '18px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', px: 2.25, py: 2 }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#94a3b8' }}>{label}</Typography>
      <Typography sx={{ mt: 1, fontSize: { xs: '1.05rem', sm: '1.2rem' }, fontWeight: 800, color: tone }}>{value}</Typography>
    </Box>
  );
}

function EmployeeFormFields({ form, setForm, departments }) {
  return (
    <Grid container spacing={2.25}>
      <Grid item xs={12} sm={6}>
        <TextField label="Full Name" value={form.fullName} onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))} size="small" fullWidth required sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Employee ID" value={form.employeeId} onChange={(e) => setForm((current) => ({ ...current, employeeId: e.target.value }))} size="small" fullWidth required sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} size="small" fullWidth required sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Phone" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} size="small" fullWidth sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl size="small" fullWidth sx={employeeDialogFieldSx}>
          <Select
            value={form.department}
            displayEmpty
            onChange={(e) => setForm((current) => ({ ...current, department: e.target.value }))}
            renderValue={(value) => value || 'Department'}
            startAdornment={
              <InputAdornment position="start" sx={{ ml: 1.5 }}>
                <WorkOutline sx={{ color: '#94a3b8', fontSize: 19 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="" disabled>Department</MenuItem>
            {departments.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Designation" value={form.designation} onChange={(e) => setForm((current) => ({ ...current, designation: e.target.value }))} size="small" fullWidth required sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><WorkHistoryOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl size="small" fullWidth sx={employeeDialogFieldSx}>
          <Select
            value={form.employmentType}
            displayEmpty
            onChange={(e) => setForm((current) => ({ ...current, employmentType: e.target.value }))}
            renderValue={(value) => value || 'Employment Type'}
            startAdornment={
              <InputAdornment position="start" sx={{ ml: 1.5 }}>
                <WorkOutline sx={{ color: '#94a3b8', fontSize: 19 }} />
              </InputAdornment>
            }
          >
            {employmentTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Date of Joining" type="date" value={form.dateOfJoining} onChange={(e) => setForm((current) => ({ ...current, dateOfJoining: e.target.value }))} size="small" fullWidth required InputLabelProps={{ shrink: true }} sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><TodayOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl size="small" fullWidth sx={employeeDialogFieldSx}>
          <InputLabel>Gender</InputLabel>
          <Select value={form.gender} label="Gender" onChange={(e) => setForm((current) => ({ ...current, gender: e.target.value }))}>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm((current) => ({ ...current, dateOfBirth: e.target.value }))} size="small" fullWidth InputLabelProps={{ shrink: true }} sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><MaleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Manager Name" value={form.managerName} onChange={(e) => setForm((current) => ({ ...current, managerName: e.target.value }))} size="small" fullWidth sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl size="small" fullWidth sx={employeeDialogFieldSx}>
          <Select
            value={form.status}
            displayEmpty
            onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
            renderValue={(value) => value || 'Status'}
          >
            {employeeStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField label="Salary / CTC" type="number" value={form.salaryCTC} onChange={(e) => setForm((current) => ({ ...current, salaryCTC: e.target.value }))} size="small" fullWidth sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><MonetizationOnOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Address" value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} size="small" fullWidth multiline minRows={2} sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.2 }}><HomeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => setForm((current) => ({ ...current, emergencyContactName: e.target.value }))} size="small" fullWidth sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Emergency Phone" value={form.emergencyContactPhone} onChange={(e) => setForm((current) => ({ ...current, emergencyContactPhone: e.target.value }))} size="small" fullWidth sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Emergency Relation" value={form.emergencyContactRelationship} onChange={(e) => setForm((current) => ({ ...current, emergencyContactRelationship: e.target.value }))} size="small" fullWidth sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><GroupsOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} size="small" fullWidth multiline minRows={3} sx={employeeDialogFieldSx} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.2 }}><NotesOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
      </Grid>
    </Grid>
  );
}

export default function HRPage() {
  const [dashboard, setDashboard] = useState(null);
  const [filtersData, setFiltersData] = useState({ departments: [] });
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', department: '', employmentType: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employeeDialog, setEmployeeDialog] = useState({ open: false, mode: 'add', employee: null });
  const [profileOpen, setProfileOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedProfileTab, setSelectedProfileTab] = useState(0);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendanceForm);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const employeePhotoInputRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    const { data } = await api.get('/hr/dashboard');
    setDashboard(data.data);
  }, []);

  const loadFilters = useCallback(async () => {
    const { data } = await api.get('/hr/filters');
    setFiltersData(data.data);
  }, []);

  const loadEmployees = useCallback(async (activeFilters = filters, activePage = page) => {
    setTableLoading(true);
    try {
      const { data } = await api.get('/hr/employees', { params: { ...activeFilters, page: activePage, limit: ITEMS_PER_PAGE } });
      setEmployees(data.data.employees || []);
      setPagination(data.data.pagination || { total: 0, totalPages: 1 });
    } finally {
      setTableLoading(false);
    }
  }, [filters, page]);

  const loadEmployeeDetails = useCallback(async (employeeId) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/hr/employees/${employeeId}`);
      setEmployeeDetails(data.data);
      return data.data;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadDashboard(), loadFilters(), loadEmployees({ search: '', department: '', employmentType: '', status: '' }, 1)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load HR module.');
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadFilters, loadEmployees]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees(filters, page).catch((err) => {
        setError(err.response?.data?.message || 'Unable to load employees.');
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, page, loadEmployees]);

  const summaryCards = useMemo(() => {
    const cards = dashboard?.cards || {};
    return [
      { label: 'Total Employees', value: cards.totalEmployees || 0, sub: 'All active HR records', icon: GroupsOutlined, color: '#2563eb', bg: '#eff6ff' },
      { label: 'Active Employees', value: cards.activeEmployees || 0, sub: 'Currently active workforce', icon: BadgeOutlined, color: '#059669', bg: '#ecfdf5' },
      { label: 'New Joinees', value: cards.newJoinees || 0, sub: 'Joined in the last 30 days', icon: HowToRegOutlined, color: '#7c3aed', bg: '#f5f3ff' },
      { label: 'On Leave Today', value: cards.employeesOnLeaveToday || 0, sub: 'Approved leave overlap today', icon: EventBusyOutlined, color: '#d97706', bg: '#fff7ed' },
      { label: 'Pending Leave', value: cards.pendingLeaveRequests || 0, sub: 'Waiting for review', icon: EventNoteOutlined, color: '#c2410c', bg: '#fff7ed' },
      { label: 'Payroll Linked', value: cards.payrollLinkedEmployees || 0, sub: 'Connected to payroll records', icon: WorkHistoryOutlined, color: '#0f766e', bg: '#ecfeff' },
      { label: 'Upcoming Birthdays', value: cards.upcomingBirthdays || 0, sub: 'Next 30 days', icon: CakeOutlined, color: '#dc2626', bg: '#fef2f2' },
      { label: 'Attrition / Resigned', value: cards.attritionCount || 0, sub: 'Archived or resigned employees', icon: CalendarMonthOutlined, color: '#475569', bg: '#f8fafc' },
    ];
  }, [dashboard]);

  const resetEmployeeForm = () => setEmployeeForm(emptyEmployeeForm);

  const closeEmployeeDialog = () => setEmployeeDialog({ open: false, mode: 'add', employee: null });

  const mapEmployeeToForm = (employee) => ({
    fullName: employee.fullName || '',
    employeeId: employee.employeeId || '',
    gender: employee.gender || 'Prefer not to say',
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : '',
    email: employee.email || '',
    phone: employee.phone || '',
    address: employee.address || '',
    department: employee.department || '',
    designation: employee.designation || '',
    employmentType: employee.employmentType || 'Full Time',
    dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.slice(0, 10) : '',
    managerName: employee.managerName || '',
    salaryCTC: employee.salaryCTC || '',
    status: employee.status || 'Active',
    profilePhoto: employee.profilePhoto || '',
    emergencyContactName: employee.emergencyContact?.name || '',
    emergencyContactRelationship: employee.emergencyContact?.relationship || '',
    emergencyContactPhone: employee.emergencyContact?.phone || '',
    notes: employee.notes || '',
  });

  const buildEmployeePayload = () => ({
    fullName: employeeForm.fullName,
    employeeId: employeeForm.employeeId,
    gender: employeeForm.gender,
    dateOfBirth: employeeForm.dateOfBirth || null,
    email: employeeForm.email,
    phone: employeeForm.phone,
    address: employeeForm.address,
    department: employeeForm.department,
    designation: employeeForm.designation,
    employmentType: employeeForm.employmentType,
    dateOfJoining: employeeForm.dateOfJoining,
    managerName: employeeForm.managerName,
    salaryCTC: Number(employeeForm.salaryCTC) || 0,
    status: employeeForm.status,
    profilePhoto: employeeForm.profilePhoto,
    emergencyContact: {
      name: employeeForm.emergencyContactName,
      relationship: employeeForm.emergencyContactRelationship,
      phone: employeeForm.emergencyContactPhone,
    },
    notes: employeeForm.notes,
  });

  const refreshAll = async () => {
    await Promise.all([loadDashboard(), loadEmployees(filters, page)]);
  };

  const openAddDialog = () => {
    resetEmployeeForm();
    setEmployeeDialog({ open: true, mode: 'add', employee: null });
  };

  const openEditDialog = (employee) => {
    setEmployeeForm(mapEmployeeToForm(employee));
    setEmployeeDialog({ open: true, mode: 'edit', employee });
  };

  const openProfile = async (employee) => {
    setSelectedEmployee(employee);
    setSelectedProfileTab(0);
    setProfileOpen(true);
    await loadEmployeeDetails(employee._id);
  };

  const openAttendanceDialog = async (employee) => {
    setSelectedEmployee(employee);
    setAttendanceForm(emptyAttendanceForm);
    setAttendanceOpen(true);
    await loadEmployeeDetails(employee._id);
  };

  const openLeaveDialog = async (employee) => {
    setSelectedEmployee(employee);
    setLeaveForm(emptyLeaveForm);
    setLeaveOpen(true);
    await loadEmployeeDetails(employee._id);
  };

  const handleSaveEmployee = async () => {
    setSaving(true);
    setError('');
    try {
      if (employeeDialog.mode === 'add') {
        await api.post('/hr/employees', buildEmployeePayload());
        setSuccess('Employee added successfully.');
      } else {
        await api.put(`/hr/employees/${employeeDialog.employee._id}`, buildEmployeePayload());
        setSuccess('Employee updated successfully.');
      }
      closeEmployeeDialog();
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (employee) => {
    if (!window.confirm(`Deactivate ${employee.fullName}?`)) return;
    try {
      await api.delete(`/hr/employees/${employee._id}`);
      setSuccess(`${employee.fullName} was deactivated.`);
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to deactivate employee.');
    }
  };

  const handleEmployeePhotoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEmployeeForm((current) => ({ ...current, profilePhoto: reader.result || '' }));
    reader.readAsDataURL(file);
  };

  const handleSaveAttendance = async () => {
    if (!selectedEmployee) return;
    setAttendanceSaving(true);
    setError('');
    try {
      await api.post(`/hr/employees/${selectedEmployee._id}/attendance`, {
        ...attendanceForm,
        workingHours: attendanceForm.workingHours === '' ? undefined : Number(attendanceForm.workingHours),
      });
      setSuccess('Attendance updated successfully.');
      setAttendanceForm(emptyAttendanceForm);
      await Promise.all([loadEmployeeDetails(selectedEmployee._id), loadDashboard(), loadEmployees(filters, page)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save attendance.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleCreateLeave = async () => {
    if (!selectedEmployee) return;
    setLeaveSaving(true);
    setError('');
    try {
      await api.post(`/hr/employees/${selectedEmployee._id}/leaves`, leaveForm);
      setSuccess('Leave request recorded successfully.');
      setLeaveForm(emptyLeaveForm);
      await Promise.all([loadEmployeeDetails(selectedEmployee._id), loadDashboard(), loadEmployees(filters, page)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create leave request.');
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleLeaveDecision = async (leaveId, status) => {
    try {
      await api.patch(`/hr/leaves/${leaveId}/status`, { status });
      setSuccess(`Leave request ${status.toLowerCase()}.`);
      if (selectedEmployee) {
        await Promise.all([loadEmployeeDetails(selectedEmployee._id), loadDashboard(), loadEmployees(filters, page)]);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${status.toLowerCase()} leave request.`);
    }
  };

  const attendanceSummary = employeeDetails?.attendanceSummary || {};
  const leaveSummary = employeeDetails?.leaveSummary || {};
  const payrollInfo = employeeDetails?.payrollInfo;

  return (
    <div className="finance-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fadeInUp">
        <div>
          <h1 className="finance-page-title text-[2.5rem]">Human Resources</h1>
          <p className="mt-1 text-sm text-slate-500">Manage employees, attendance, leave approvals, and payroll-linked workforce records</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="contained" size="small" startIcon={<Add />} onClick={openAddDialog}>Add Employee</Button>
        </div>
      </div>

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      {success ? <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert> : null}

      {loading ? (
        <div className="finance-card flex items-center justify-center py-16">
          <CircularProgress size={32} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>

          <div className="finance-card p-4 animate-fadeInUp">
            <div className="flex flex-col gap-3 lg:flex-row">
              <TextField
                size="small"
                placeholder="Search by employee name, ID, email, department, or designation"
                value={filters.search}
                onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, search: event.target.value })); }}
                sx={{ ...fieldSx, flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8' }} /></InputAdornment> }}
              />
              <FormControl size="small" sx={{ minWidth: 190, ...fieldSx }}>
                <InputLabel>Department</InputLabel>
                <Select value={filters.department} label="Department" onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, department: event.target.value })); }}>
                  <MenuItem value="">All Departments</MenuItem>
                  {(filtersData.departments || []).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 170, ...fieldSx }}>
                <InputLabel>Employment Type</InputLabel>
                <Select value={filters.employmentType} label="Employment Type" onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, employmentType: event.target.value })); }}>
                  <MenuItem value="">All Types</MenuItem>
                  {employmentTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150, ...fieldSx }}>
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, status: event.target.value })); }}>
                  <MenuItem value="">All Statuses</MenuItem>
                  {employeeStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="finance-card overflow-hidden animate-fadeInUp">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Employment Type</TableCell>
                    <TableCell>Date of Joining</TableCell>
                    <TableCell>Contact Number</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableLoading ? (
                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: '#94a3b8' }}>No employees found for the selected filters.</TableCell></TableRow>
                  ) : employees.map((employee) => (
                    <TableRow key={employee._id} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar src={employee.profilePhoto || ''} sx={{ width: 40, height: 40, bgcolor: stringToColor(employee.fullName || ''), fontWeight: 800, fontSize: 13 }}>
                            {!employee.profilePhoto && getInitials(employee.fullName)}
                          </Avatar>
                          <div>
                            <p className="m-0 text-sm font-semibold text-slate-900">{employee.fullName}</p>
                            <p className="m-0 text-xs text-slate-400">{employee.managerName || 'No manager assigned'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-700">{employee.employeeId}</span></TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>{employee.employmentType}</TableCell>
                      <TableCell>{formatDate(employee.dateOfJoining)}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell><StatusChip label={employee.status} /></TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => openProfile(employee)}>
                              <VisibilityOutlined sx={{ fontSize: 18, color: '#2563eb' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditDialog(employee)}>
                              <EditOutlined sx={{ fontSize: 18, color: '#64748b' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage Leave">
                            <IconButton size="small" onClick={() => openLeaveDialog(employee)}>
                              <EventNoteOutlined sx={{ fontSize: 18, color: '#c2410c' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Attendance">
                            <IconButton size="small" onClick={() => openAttendanceDialog(employee)}>
                              <WatchLaterOutlined sx={{ fontSize: 18, color: '#0f766e' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deactivate">
                            <IconButton size="small" onClick={() => handleDeactivate(employee)}>
                              <DeleteOutline sx={{ fontSize: 18, color: '#dc2626' }} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
              <p className="text-xs text-slate-400">Showing {employees.length} of {pagination.total} employees</p>
              <Pagination count={pagination.totalPages || 1} page={page} onChange={(_, value) => setPage(value)} size="small" />
            </div>
          </div>
        </>
      )}

      <Dialog
        open={employeeDialog.open}
        onClose={(_, reason) => { if (reason !== 'backdropClick') closeEmployeeDialog(); }}
        TransitionComponent={EmployeeDialogTransition}
        fullWidth
        maxWidth={false}
        BackdropProps={{
          timeout: 240,
          sx: { backgroundColor: 'rgba(15,23,42,0.34)', backdropFilter: 'blur(10px)' },
        }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '62rem',
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
              onClick={closeEmployeeDialog}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                border: '1px solid rgba(226,232,240,0.95)',
                bgcolor: 'rgba(255,255,255,0.92)',
                color: '#64748b',
                '&:hover': { bgcolor: '#fff', color: '#334155' },
              }}
            >
              <Close fontSize="small" />
            </IconButton>

            <Box sx={{ pt: { xs: 4, sm: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Fade in={employeeDialog.open} timeout={320}>
                <Box sx={{ position: 'relative' }}>
                  <input
                    ref={employeePhotoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => handleEmployeePhotoUpload(e.target.files?.[0])}
                  />
                  <Avatar
                    src={employeeForm.profilePhoto || ''}
                    onClick={() => employeePhotoInputRef.current?.click()}
                    sx={{
                      width: 90,
                      height: 90,
                      cursor: 'pointer',
                      bgcolor: employeeForm.profilePhoto ? 'transparent' : stringToColor(employeeForm.fullName || 'Employee'),
                      color: '#fff',
                      fontSize: '1.55rem',
                      fontWeight: 800,
                      border: '4px solid rgba(255,255,255,0.96)',
                      boxShadow: '0 16px 36px rgba(15,23,42,0.16)',
                    }}
                  >
                    {employeeForm.profilePhoto ? null : getInitials(employeeForm.fullName || 'Employee')}
                  </Avatar>
                  <IconButton
                    onClick={() => employeePhotoInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      right: -4,
                      bottom: -4,
                      width: 34,
                      height: 34,
                      bgcolor: '#0f172a',
                      color: '#fff',
                      boxShadow: '0 10px 20px rgba(15,23,42,0.22)',
                      '&:hover': { bgcolor: '#1e293b', transform: 'scale(1.05)' },
                    }}
                  >
                    <CameraAlt sx={{ fontSize: 17 }} />
                  </IconButton>
                </Box>
              </Fade>

              <Typography sx={{ mt: 2, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Upload Photo
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '0.8rem', color: '#64748b' }}>
                Click to upload employee image
              </Typography>

              <Box sx={{ mt: 3.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: '1.7rem', sm: '1.95rem' },
                    color: '#020617',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {employeeDialog.mode === 'add' ? 'Add Employee' : 'Edit Employee'}
                </Typography>
                <Typography sx={{ mt: 1.25, maxWidth: 640, fontSize: '0.95rem', lineHeight: 1.7, color: '#64748b' }}>
                  Capture complete employee master data, emergency contact details, and payroll-linked salary information.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 4,
                borderRadius: '24px',
                border: '1px solid rgba(226,232,240,0.92)',
                backgroundColor: 'rgba(255,255,255,0.92)',
                boxShadow: '0 18px 45px rgba(15,23,42,0.06)',
                p: { xs: 2.5, sm: 3.5 },
              }}
            >
              {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
              <EmployeeFormFields form={employeeForm} setForm={setEmployeeForm} departments={(filtersData.departments && filtersData.departments.length ? filtersData.departments : DEPARTMENTS)} />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                onClick={closeEmployeeDialog}
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  px: 3,
                  py: 1.2,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#94a3b8', backgroundColor: '#fff' },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEmployee}
                disabled={saving || !employeeForm.fullName || !employeeForm.employeeId || !employeeForm.email || !employeeForm.department || !employeeForm.designation}
                variant="contained"
                sx={{
                  borderRadius: '14px',
                  px: 3.2,
                  py: 1.25,
                  textTransform: 'none',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)',
                  boxShadow: '0 14px 28px rgba(29,78,216,0.24)',
                  '&:hover': {
                    background: 'linear-gradient(135deg,#1e40af 0%,#0f172a 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 18px 34px rgba(29,78,216,0.28)',
                  },
                  '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                }}
              >
                {saving ? (employeeDialog.mode === 'add' ? 'Creating...' : 'Saving...') : (employeeDialog.mode === 'add' ? 'Create Employee' : 'Save Changes')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
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
          {detailLoading || !employeeDetails ? (
            <div className="flex items-center justify-center py-20"><CircularProgress size={30} /></div>
          ) : (
            <Stack spacing={2.5}>
              <DetailCard title="Employee Profile" subtitle="A complete HR profile with operational and payroll-linked context.">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.2, minWidth: 0 }}>
                    <Avatar src={employeeDetails.employee.profilePhoto || ''} sx={{ width: 72, height: 72, bgcolor: stringToColor(employeeDetails.employee.fullName || ''), fontWeight: 800, fontSize: 24 }}>
                      {!employeeDetails.employee.profilePhoto && getInitials(employeeDetails.employee.fullName)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: { xs: '1.35rem', sm: '1.65rem' }, fontWeight: 800, color: '#0f172a' }}>{employeeDetails.employee.fullName}</Typography>
                      <Typography sx={{ mt: 0.6, fontSize: '0.92rem', color: '#475569' }}>{employeeDetails.employee.employeeId} | {employeeDetails.employee.designation}</Typography>
                      <Typography sx={{ mt: 0.6, fontSize: '0.92rem', color: '#64748b' }}>{employeeDetails.employee.department} | Joined {formatDate(employeeDetails.employee.dateOfJoining)}</Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StatusChip label={employeeDetails.employee.status} />
                    <IconButton onClick={() => setProfileOpen(false)} sx={{ border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                      <Close />
                    </IconButton>
                  </Stack>
                </Box>
              </DetailCard>

              <Paper elevation={0} sx={{ borderRadius: '22px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Tabs value={selectedProfileTab} onChange={(_, value) => setSelectedProfileTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: 1.5, backgroundColor: '#ffffff', '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 56 } }}>
                  {['Personal Details', 'Job Details', 'Attendance Summary', 'Leave Summary', 'Payroll Info', 'Uploaded Documents', 'Performance Notes'].map((label) => <Tab key={label} label={label} />)}
                </Tabs>
              </Paper>

              {selectedProfileTab === 0 ? (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <DetailCard title="Personal Details" subtitle="Core employee identity and contact information.">
                      <Stack spacing={1.25}>
                        <KeyValueRow label="Gender" value={employeeDetails.employee.gender} />
                        <KeyValueRow label="Date of Birth" value={employeeDetails.employee.dateOfBirth ? formatDate(employeeDetails.employee.dateOfBirth) : '-'} />
                        <KeyValueRow label="Phone" value={employeeDetails.employee.phone} />
                        <KeyValueRow label="Email" value={employeeDetails.employee.email} />
                        <KeyValueRow label="Address" value={employeeDetails.employee.address} />
                      </Stack>
                    </DetailCard>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailCard title="Emergency Contact" subtitle="Immediate contact details kept ready for HR operations.">
                      <Stack spacing={1.25}>
                        <KeyValueRow label="Contact Name" value={employeeDetails.employee.emergencyContact?.name} />
                        <KeyValueRow label="Relationship" value={employeeDetails.employee.emergencyContact?.relationship} />
                        <KeyValueRow label="Contact Number" value={employeeDetails.employee.emergencyContact?.phone} />
                        <KeyValueRow label="Notes" value={employeeDetails.employee.notes || 'No notes added'} />
                      </Stack>
                    </DetailCard>
                  </Grid>
                </Grid>
              ) : null}

              {selectedProfileTab === 1 ? (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <DetailCard title="Job Details" subtitle="Department, reporting, and joining metadata.">
                      <Stack spacing={1.25}>
                        <KeyValueRow label="Department" value={employeeDetails.employee.department} />
                        <KeyValueRow label="Designation" value={employeeDetails.employee.designation} />
                        <KeyValueRow label="Employment Type" value={employeeDetails.employee.employmentType} />
                        <KeyValueRow label="Date of Joining" value={formatDate(employeeDetails.employee.dateOfJoining)} />
                        <KeyValueRow label="Manager Name" value={employeeDetails.employee.managerName || 'Not assigned'} />
                      </Stack>
                    </DetailCard>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DetailCard title="Compensation Snapshot" subtitle="Payroll-linked compensation data from the HR master record.">
                      <Stack spacing={1.25}>
                        <KeyValueRow label="Salary / CTC" value={formatCurrency(employeeDetails.employee.salaryCTC || 0)} />
                        <KeyValueRow label="Payroll Linked" value={payrollInfo ? 'Yes' : 'No'} />
                        <KeyValueRow label="Current Payroll Status" value={payrollInfo?.payrollStatus || 'Not linked yet'} />
                        <KeyValueRow label="Salary Type" value={payrollInfo?.salaryType || '-'} />
                      </Stack>
                    </DetailCard>
                  </Grid>
                </Grid>
              ) : null}

              {selectedProfileTab === 2 ? (
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Present" value={attendanceSummary.Present || 0} tone="#059669" /></Grid>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Late" value={attendanceSummary.Late || 0} tone="#c2410c" /></Grid>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Absent" value={attendanceSummary.Absent || 0} tone="#dc2626" /></Grid>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Avg Hours" value={attendanceSummary.averageWorkingHours || 0} tone="#2563eb" /></Grid>
                  </Grid>
                  <DetailCard title="Monthly Attendance Summary" subtitle={attendanceSummary.monthLabel || 'Current month attendance view'}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Check-in</TableCell>
                            <TableCell>Check-out</TableCell>
                            <TableCell>Working Hours</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(employeeDetails.attendanceRecords || []).slice(0, 8).map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>{formatDate(item.date)}</TableCell>
                              <TableCell><StatusChip label={item.status} /></TableCell>
                              <TableCell>{item.checkInTime || '-'}</TableCell>
                              <TableCell>{item.checkOutTime || '-'}</TableCell>
                              <TableCell>{item.workingHours || 0}</TableCell>
                            </TableRow>
                          ))}
                          {(employeeDetails.attendanceRecords || []).length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No attendance records yet.</TableCell></TableRow> : null}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </DetailCard>
                </Stack>
              ) : null}

              {selectedProfileTab === 3 ? (
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Total Requests" value={leaveSummary.total || 0} /></Grid>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Pending" value={leaveSummary.Pending || 0} tone="#c2410c" /></Grid>
                    <Grid item xs={6} md={3}><AttendanceMetric label="Approved" value={leaveSummary.Approved || 0} tone="#059669" /></Grid>
                    <Grid item xs={6} md={3}><AttendanceMetric label="On Leave Today" value={leaveSummary.onLeaveToday ? 'Yes' : 'No'} tone="#2563eb" /></Grid>
                  </Grid>
                  <DetailCard title="Leave Summary" subtitle="Recent leave requests and approval trail.">
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Dates</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(employeeDetails.leaveRecords || []).slice(0, 8).map((item) => (
                            <TableRow key={item._id}>
                              <TableCell>{item.leaveType}</TableCell>
                              <TableCell>{formatDate(item.startDate)} - {formatDate(item.endDate)}</TableCell>
                              <TableCell>{item.reason || '-'}</TableCell>
                              <TableCell><StatusChip label={item.status} /></TableCell>
                            </TableRow>
                          ))}
                          {(employeeDetails.leaveRecords || []).length === 0 ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>No leave records yet.</TableCell></TableRow> : null}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </DetailCard>
                </Stack>
              ) : null}

              {selectedProfileTab === 4 ? (
                <DetailCard title="Payroll Info" subtitle="Linked payroll data is reused from the existing payroll module.">
                  {payrollInfo ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1.25}>
                          <KeyValueRow label="Basic Salary" value={formatCurrency(payrollInfo.basicSalary || 0)} />
                          <KeyValueRow label="Gross Salary" value={formatCurrency(payrollInfo.grossSalary || 0)} />
                          <KeyValueRow label="Net Salary" value={formatCurrency(payrollInfo.netSalary || 0)} />
                          <KeyValueRow label="Payroll Status" value={payrollInfo.payrollStatus} />
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={1.25}>
                          <KeyValueRow label="Month / Year" value={`${payrollInfo.month} ${payrollInfo.year}`} />
                          <KeyValueRow label="Payment Method" value={payrollInfo.paymentMethod || '-'} />
                          <KeyValueRow label="Allowance Total" value={formatCurrency(payrollInfo.totalAllowances || 0)} />
                          <KeyValueRow label="Deduction Total" value={formatCurrency(payrollInfo.totalDeductions || 0)} />
                        </Stack>
                      </Grid>
                    </Grid>
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                      No payroll record has been linked yet. Saving salary/CTC on the employee form creates the payroll connection.
                    </div>
                  )}
                </DetailCard>
              ) : null}

              {selectedProfileTab === 5 ? (
                <DetailCard title="Uploaded Documents" subtitle="Employee documents tracked from the HR master record.">
                  {(employeeDetails.employee.documents || []).length > 0 ? (
                    <Stack spacing={1.25}>
                      {employeeDetails.employee.documents.map((document, index) => (
                        <KeyValueRow key={`${document.name}-${index}`} label={document.name} value={document.url || document.type || 'Uploaded document'} />
                      ))}
                    </Stack>
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                      No documents uploaded for this employee yet.
                    </div>
                  )}
                </DetailCard>
              ) : null}

              {selectedProfileTab === 6 ? (
                <DetailCard title="Performance Notes" subtitle="Recent HR or manager notes captured against the employee profile.">
                  {(employeeDetails.employee.performanceNotes || []).length > 0 ? (
                    <Stack spacing={1.25}>
                      {employeeDetails.employee.performanceNotes.map((note, index) => (
                        <Box key={`${note.note}-${index}`} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', p: 2 }}>
                          <Typography sx={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 700 }}>{note.note}</Typography>
                          <Typography sx={{ mt: 0.7, fontSize: '0.8rem', color: '#94a3b8' }}>{note.author || 'HR Admin'} | {note.createdAt ? formatDate(note.createdAt) : '-'}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                      No performance notes have been added yet.
                    </div>
                  )}
                </DetailCard>
              ) : null}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(226,232,240,0.95)', boxShadow: '0 30px 90px rgba(15,23,42,0.18)' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', px: 3, py: 2.5, bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <div>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Attendance Management</Typography>
              <Typography sx={{ mt: 0.6, fontSize: '0.9rem', color: '#64748b' }}>{selectedEmployee?.fullName} | {attendanceSummary.monthLabel || 'Current month'}</Typography>
            </div>
            <IconButton onClick={() => setAttendanceOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {detailLoading || !employeeDetails ? (
            <div className="flex items-center justify-center py-16"><CircularProgress size={30} /></div>
          ) : (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><AttendanceMetric label="Present" value={attendanceSummary.Present || 0} tone="#059669" /></Grid>
                <Grid item xs={6} md={3}><AttendanceMetric label="Late" value={attendanceSummary.Late || 0} tone="#c2410c" /></Grid>
                <Grid item xs={6} md={3}><AttendanceMetric label="Absent" value={attendanceSummary.Absent || 0} tone="#dc2626" /></Grid>
                <Grid item xs={6} md={3}><AttendanceMetric label="Average Hours" value={attendanceSummary.averageWorkingHours || 0} tone="#2563eb" /></Grid>
              </Grid>

              <DetailCard title="Mark Attendance" subtitle="Record present, absent, late, and half-day statuses with timings.">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}><TextField label="Date" type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm((current) => ({ ...current, date: e.target.value }))} size="small" fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl size="small" fullWidth sx={fieldSx}>
                      <InputLabel>Status</InputLabel>
                      <Select value={attendanceForm.status} label="Status" onChange={(e) => setAttendanceForm((current) => ({ ...current, status: e.target.value }))}>
                        {attendanceStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}><TextField label="Check-in" type="time" value={attendanceForm.checkInTime} onChange={(e) => setAttendanceForm((current) => ({ ...current, checkInTime: e.target.value }))} size="small" fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={2}><TextField label="Check-out" type="time" value={attendanceForm.checkOutTime} onChange={(e) => setAttendanceForm((current) => ({ ...current, checkOutTime: e.target.value }))} size="small" fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={2}><TextField label="Working Hours" type="number" value={attendanceForm.workingHours} onChange={(e) => setAttendanceForm((current) => ({ ...current, workingHours: e.target.value }))} size="small" fullWidth sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={9}><TextField label="Notes" value={attendanceForm.notes} onChange={(e) => setAttendanceForm((current) => ({ ...current, notes: e.target.value }))} size="small" fullWidth sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={3}><Button fullWidth variant="contained" onClick={handleSaveAttendance} disabled={attendanceSaving} sx={{ height: 42, borderRadius: '14px' }}>{attendanceSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Attendance'}</Button></Grid>
                </Grid>
              </DetailCard>

              <DetailCard title="Attendance Records" subtitle="Most recent monthly records for this employee.">
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Check-in</TableCell>
                        <TableCell>Check-out</TableCell>
                        <TableCell>Working Hours</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(employeeDetails.attendanceRecords || []).map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell><StatusChip label={item.status} /></TableCell>
                          <TableCell>{item.checkInTime || '-'}</TableCell>
                          <TableCell>{item.checkOutTime || '-'}</TableCell>
                          <TableCell>{item.workingHours || 0}</TableCell>
                          <TableCell>{item.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {(employeeDetails.attendanceRecords || []).length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>No attendance records captured yet.</TableCell></TableRow> : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DetailCard>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(226,232,240,0.95)', boxShadow: '0 30px 90px rgba(15,23,42,0.18)' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', px: 3, py: 2.5, bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <div>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Leave Management</Typography>
              <Typography sx={{ mt: 0.6, fontSize: '0.9rem', color: '#64748b' }}>{selectedEmployee?.fullName} | Review and record leave requests</Typography>
            </div>
            <IconButton onClick={() => setLeaveOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {detailLoading || !employeeDetails ? (
            <div className="flex items-center justify-center py-16"><CircularProgress size={30} /></div>
          ) : (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><AttendanceMetric label="Total Requests" value={leaveSummary.total || 0} /></Grid>
                <Grid item xs={6} md={3}><AttendanceMetric label="Pending" value={leaveSummary.Pending || 0} tone="#c2410c" /></Grid>
                <Grid item xs={6} md={3}><AttendanceMetric label="Approved" value={leaveSummary.Approved || 0} tone="#059669" /></Grid>
                <Grid item xs={6} md={3}><AttendanceMetric label="Rejected" value={leaveSummary.Rejected || 0} tone="#dc2626" /></Grid>
              </Grid>

              <DetailCard title="Create Leave Request" subtitle="Submit or record employee leave with status and reason.">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl size="small" fullWidth sx={fieldSx}>
                      <InputLabel>Leave Type</InputLabel>
                      <Select value={leaveForm.leaveType} label="Leave Type" onChange={(e) => setLeaveForm((current) => ({ ...current, leaveType: e.target.value }))}>
                        {leaveTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}><TextField label="Start Date" type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm((current) => ({ ...current, startDate: e.target.value }))} size="small" fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={2}><TextField label="End Date" type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm((current) => ({ ...current, endDate: e.target.value }))} size="small" fullWidth InputLabelProps={{ shrink: true }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl size="small" fullWidth sx={fieldSx}>
                      <InputLabel>Status</InputLabel>
                      <Select value={leaveForm.status} label="Status" onChange={(e) => setLeaveForm((current) => ({ ...current, status: e.target.value }))}>
                        {leaveStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}><TextField label="Review Note" value={leaveForm.reviewNote} onChange={(e) => setLeaveForm((current) => ({ ...current, reviewNote: e.target.value }))} size="small" fullWidth sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={9}><TextField label="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm((current) => ({ ...current, reason: e.target.value }))} size="small" fullWidth sx={fieldSx} /></Grid>
                  <Grid item xs={12} md={3}><Button fullWidth variant="contained" onClick={handleCreateLeave} disabled={leaveSaving} sx={{ height: 42, borderRadius: '14px' }}>{leaveSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Leave'}</Button></Grid>
                </Grid>
              </DetailCard>

              <DetailCard title="Leave Requests" subtitle="Approve or reject pending requests directly from the HR module.">
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Leave Type</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Applied Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(employeeDetails.leaveRecords || []).map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.leaveType}</TableCell>
                          <TableCell>{formatDate(item.startDate)}</TableCell>
                          <TableCell>{formatDate(item.endDate)}</TableCell>
                          <TableCell>{item.reason || '-'}</TableCell>
                          <TableCell>{formatDate(item.appliedDate || item.createdAt)}</TableCell>
                          <TableCell><StatusChip label={item.status} /></TableCell>
                          <TableCell align="right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="small" variant="text" disabled={item.status !== 'Pending'} onClick={() => handleLeaveDecision(item._id, 'Approved')} sx={{ minWidth: 0, color: '#059669', fontWeight: 700 }}>Approve</Button>
                              <Button size="small" variant="text" disabled={item.status !== 'Pending'} onClick={() => handleLeaveDecision(item._id, 'Rejected')} sx={{ minWidth: 0, color: '#dc2626', fontWeight: 700 }}>Reject</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(employeeDetails.leaveRecords || []).length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: '#94a3b8' }}>No leave requests recorded yet.</TableCell></TableRow> : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DetailCard>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
