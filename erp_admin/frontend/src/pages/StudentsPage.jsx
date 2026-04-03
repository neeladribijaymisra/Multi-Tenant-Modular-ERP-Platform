import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Button, TextField, InputAdornment, Avatar, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Pagination, Tooltip,
  CircularProgress, Alert,
} from '@mui/material';
import { Search, Add, Download, Edit, Delete, People, School, CheckCircle, Cancel, CameraAlt } from '@mui/icons-material';
import api, { createStudent } from '../utils/api';
import { getInitials, stringToColor, debounce } from '../utils/helpers';
import { DEPARTMENTS, YEARS } from '../utils/constants';
import FormDialog from '../components/common/FormDialog';
import AddStudentDialog from '../components/common/AddStudentDialog';

const ITEMS_PER_PAGE = 10;

const emptyForm = { name: '', email: '', phone: '', rollNo: '', department: '', year: '', status: 'Active', feeStatus: 'Pending', cgpa: '', avatar: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editPhotoRef = useRef(null);

  const fetchStudents = useCallback(async (q = '', dept = '', yr = '', pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: ITEMS_PER_PAGE };
      if (q) params.search = q;
      if (dept) params.department = dept;
      if (yr) params.year = yr;
      const { data } = await api.get('/students', { params });
      setStudents(data.data.students);
      setPagination(data.data.pagination);
    } catch { setError('Failed to load students.'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/students/stats');
      setStats({ total: data.data.total, active: data.data.active, inactive: data.data.inactive });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStudents('', '', '', 1);
    fetchStats();
  }, [fetchStats, fetchStudents]);

  const debouncedFetch = useMemo(
    () => debounce((q, dept, yr, pg) => fetchStudents(q, dept, yr, pg), 350),
    [fetchStudents]
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    debouncedFetch(value, deptFilter, yearFilter, 1);
  };
  const handleDept = (e) => { const v = e.target.value; setDeptFilter(v); setPage(1); fetchStudents(search, v, yearFilter, 1); };
  const handleYear = (e) => { const v = e.target.value; setYearFilter(v); setPage(1); fetchStudents(search, deptFilter, v, 1); };
  const handlePage = (_, v) => { setPage(v); fetchStudents(search, deptFilter, yearFilter, v); };

  const openAdd = () => { setError(''); setAddDialogOpen(true); };
  const openEdit = (s) => { setForm({ name: s.name, email: s.email, phone: s.phone || '', rollNo: s.rollNo, department: s.department, year: s.year, status: s.status, feeStatus: s.feeStatus, cgpa: s.cgpa || '', avatar: s.avatar || '' }); setDialog({ open: true, mode: 'edit', data: s }); };
  const closeDialog = () => { setDialog({ open: false, mode: 'add', data: null }); setError(''); };
  const handleEnrollmentSuccess = async () => {
    await Promise.all([
      fetchStudents(search, deptFilter, yearFilter, page),
      fetchStats(),
    ]);
  };

  const handleCreateStudent = async (data) => {
    setSaving(true);
    setError('');
    try {
      await createStudent({
        ...data,
        cgpa: data.cgpa === '' ? undefined : data.cgpa,
      });
      setAddDialogOpen(false);
      await handleEnrollmentSuccess();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.put(`/students/${dialog.data._id}`, { ...form, avatar: form.avatar || '' });
      closeDialog();
      fetchStudents(search, deptFilter, yearFilter, page);
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents(search, deptFilter, yearFilter, page);
      fetchStats();
    } catch { setError('Failed to delete student.'); }
  };

  const statCards = [
    { label: 'Total Students', value: stats.total.toLocaleString(), icon: People, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Active', value: stats.active.toLocaleString(), icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Inactive', value: stats.inactive.toLocaleString(), icon: Cancel, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Departments', value: DEPARTMENTS.length.toString(), icon: School, color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <div className="finance-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeInUp">
        <div>
          <h1 className="finance-page-title text-[2.5rem]">Students</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage student records, enrollment, and academic data</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outlined" size="small" startIcon={<Download />} sx={{ borderColor: '#e2e8f0', color: '#475569' }}>Export</Button>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={openAdd}>Add Students</Button>
        </div>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card animate-fadeInUp flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                <Icon sx={{ fontSize: 20, color: s.color }} />
              </div>
              <div>
                <p className="font-heading text-xl font-700 text-slate-900">{s.value}</p>
                <p className="text-slate-500 text-xs font-medium">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="finance-card p-4 flex flex-col sm:flex-row gap-3 animate-fadeInUp">
        <TextField placeholder="Search by name, ID or email..." value={search} onChange={handleSearch} size="small" sx={{ flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Department</InputLabel>
          <Select value={deptFilter} label="Department" onChange={handleDept}>
            <MenuItem value="">All Departments</MenuItem>
            {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Year</InputLabel>
          <Select value={yearFilter} label="Year" onChange={handleYear}>
            <MenuItem value="">All Years</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      {/* Table */}
      <div className="finance-card overflow-hidden animate-fadeInUp">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Roll No.</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>CGPA</TableCell>
                <TableCell>Fees</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No students found</TableCell></TableRow>
              ) : students.map((s) => (
                <TableRow key={s._id} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={s.avatar || ''} sx={{ width: 36, height: 36, bgcolor: stringToColor(s.name), fontSize: 14, fontWeight: 700 }}>
                        {!s.avatar && getInitials(s.name)}
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.programName || s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">{s.rollNo}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-700">{s.department}</span>
                      {s.section ? <span className="text-[11px] text-slate-400">Section {s.section}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-700">{s.year}</span>
                      {s.semester ? <span className="text-[11px] text-slate-400">Semester {s.semester}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell><span className="font-semibold text-slate-800 text-sm">{s.cgpa || '—'}</span></TableCell>
                  <TableCell>
                    <Chip label={s.feeStatus} size="small" sx={{ bgcolor: s.feeStatus === 'Paid' ? '#ecfdf5' : s.feeStatus === 'Overdue' ? '#fef2f2' : '#fff7ed', color: s.feeStatus === 'Paid' ? '#059669' : s.feeStatus === 'Overdue' ? '#ef4444' : '#d97706', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" sx={{ bgcolor: s.status === 'Active' ? '#eef2ff' : '#fef2f2', color: s.status === 'Active' ? '#4f46e5' : '#ef4444', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(s)}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(s._id)}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p className="text-xs text-slate-400">Showing {students.length} of {pagination.total} students</p>
          <Pagination count={pagination.totalPages} page={page} onChange={handlePage} size="small" />
        </div>
      </div>

      {/* Edit Dialog */}
      <FormDialog
        open={dialog.open}
        onClose={closeDialog}
        title="Edit Student"
        subtitle="Update registry details for an existing student record."
        error={error}
        onPrimary={handleSave}
        primaryDisabled={saving || !form.name || !form.rollNo || !form.email}
        primaryLabel="Save Changes"
        loading={saving}
      >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex items-center gap-4 pb-1">
              <div className="relative">
                <input ref={editPhotoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => setForm((f) => ({ ...f, avatar: reader.result || '' }));
                  reader.readAsDataURL(file);
                }} />
                <Avatar src={form.avatar || ''} sx={{ width: 56, height: 56, bgcolor: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>
                  {!form.avatar && form.name?.charAt(0)}
                </Avatar>
                <IconButton onClick={() => editPhotoRef.current?.click()} size="small" sx={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, bgcolor: '#0f172a', color: '#fff', '&:hover': { bgcolor: '#1e293b' } }}>
                  <CameraAlt sx={{ fontSize: 12 }} />
                </IconButton>
              </div>
              <p className="text-xs text-slate-500">Click the avatar to change photo</p>
            </div>
            <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" fullWidth required />
            <TextField label="Roll No." value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} size="small" fullWidth required />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} size="small" fullWidth required />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} size="small" fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={form.department} label="Department" onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Year</InputLabel>
              <Select value={form.year} label="Year" onChange={(e) => setForm({ ...form, year: e.target.value })}>
                {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['Active', 'Inactive', 'Suspended', 'Graduated'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="CGPA" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} size="small" fullWidth type="number" inputProps={{ step: 0.1, min: 0, max: 10 }} />
          </div>
      </FormDialog>
      <AddStudentDialog open={addDialogOpen} onClose={() => { setAddDialogOpen(false); setError(''); }} onSubmit={handleCreateStudent} loading={saving} error={error} />
    </div>
  );
}
