import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Button, TextField, InputAdornment, Avatar, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Pagination, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { Search, Add, Edit, Delete, Download, School, Star, CameraAlt } from '@mui/icons-material';
import api from '../utils/api';
import { getInitials, stringToColor, debounce } from '../utils/helpers';
import { DEPARTMENTS, FACULTY_DESIGNATIONS } from '../utils/constants';
import FormDialog from '../components/common/FormDialog';
import AddFacultyDialog from '../components/common/AddFacultyDialog';

const ITEMS_PER_PAGE = 10;
const emptyForm = { name: '', email: '', phone: '', facultyId: '', department: '', designation: '', subjects: '', experienceYears: '', status: 'Active', avatar: '' };


export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editPhotoRef = useRef(null);

  const fetchTeachers = useCallback(async (q = '', pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: ITEMS_PER_PAGE };
      if (q) params.search = q;
      const { data } = await api.get('/teachers', { params });
      setTeachers(data.data.teachers);
      setPagination(data.data.pagination);
    } catch { setError('Failed to load teachers.'); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/teachers/stats');
      setStats({ total: data.data.total, active: data.data.active, onLeave: data.data.onLeave });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchTeachers('', 1); fetchStats(); }, [fetchTeachers, fetchStats]);

  const debouncedSearch = useMemo(
    () => debounce((val) => { setPage(1); fetchTeachers(val, 1); }, 350),
    [fetchTeachers]
  );
  const handleSearch = (e) => { setSearch(e.target.value); debouncedSearch(e.target.value); };
  const handlePage = (_, v) => { setPage(v); fetchTeachers(search, v); };

  const openAdd = () => { setError(''); setAddDialogOpen(true); };
  const openEdit = (t) => {
    setForm({ name: t.name, email: t.email, phone: t.phone || '', facultyId: t.facultyId, department: t.department, designation: t.designation, subjects: (t.subjects || []).join(', '), experienceYears: t.experienceYears || '', status: t.status, avatar: t.avatar || '' });
    setDialog({ open: true, mode: 'edit', data: t });
  };
  const closeDialog = () => { setDialog({ open: false, mode: 'add', data: null }); setError(''); };

  const handleAddFaculty = async (data) => {
    setSaving(true);
    setError('');
    try {
      await api.post('/teachers', data);
      setAddDialogOpen(false);
      fetchTeachers(search, 1);
      fetchStats();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create faculty.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean), experienceYears: Number(form.experienceYears) || 0, avatar: form.avatar || '' };
      await api.put(`/teachers/${dialog.data._id}`, payload);
      closeDialog(); fetchTeachers(search, page); fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save teacher.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty member?')) return;
    try { await api.delete(`/teachers/${id}`); fetchTeachers(search, page); fetchStats(); }
    catch { setError('Failed to delete teacher.'); }
  };

  return (
    <div className="finance-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeInUp">
        <div>
          <h1 className="finance-page-title text-[2.5rem]">Faculty & Teachers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage faculty profiles, assignments, and performance</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outlined" size="small" startIcon={<Download />} sx={{ borderColor: '#e2e8f0', color: '#475569' }}>Export</Button>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={openAdd}>Add Faculty</Button>
        </div>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: stats.total, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Active', value: stats.active, color: '#10b981', bg: '#ecfdf5' },
          { label: 'On Leave', value: stats.onLeave, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Departments', value: DEPARTMENTS.length, color: '#06b6d4', bg: '#ecfeff' },
        ].map((c) => (
          <div key={c.label} className="stat-card animate-fadeInUp">
            <p className="font-heading text-2xl font-700" style={{ color: c.color }}>{c.value}</p>
            <p className="text-slate-500 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="finance-card p-4 flex gap-3 animate-fadeInUp">
        <TextField placeholder="Search faculty by name or department..." value={search} onChange={handleSearch} size="small" sx={{ flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }} />
      </div>

      {/* Table */}
      <div className="finance-card overflow-hidden animate-fadeInUp">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Faculty Member</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : teachers.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>No faculty found</TableCell></TableRow>
              ) : teachers.map((t) => (
                <TableRow key={t._id} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={t.avatar || ''} sx={{ width: 36, height: 36, bgcolor: stringToColor(t.name), fontSize: 13, fontWeight: 700 }}>{!t.avatar && getInitials(t.name)}</Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">{t.facultyId}</span></TableCell>
                  <TableCell><span className="text-xs font-medium text-slate-700">{t.department}</span></TableCell>
                  <TableCell><span className="text-sm text-slate-700">{t.designation}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(t.subjects || []).slice(0, 2).map((s) => (
                        <Chip key={s} label={s} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#f1f5f9', color: '#475569' }} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm text-slate-700">{t.experienceYears} yrs</span></TableCell>
                  <TableCell>
                    <Chip label={t.status} size="small" sx={{ bgcolor: t.status === 'Active' ? '#eef2ff' : '#fffbeb', color: t.status === 'Active' ? '#4f46e5' : '#d97706', fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(t._id)}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p className="text-xs text-slate-400">Showing {teachers.length} of {pagination.total} faculty members</p>
          <Pagination count={pagination.totalPages} page={page} onChange={handlePage} size="small" />
        </div>
      </div>

      <AddFacultyDialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); setError(''); }}
        onSubmit={handleAddFaculty}
        loading={saving}
        error={error}
      />

      {/* Edit Dialog */}
      <FormDialog
        open={dialog.open}
        onClose={closeDialog}
        title="Edit Faculty"
        subtitle="Update faculty records with department, designation, teaching subjects, and status."
        error={error}
        onPrimary={handleSave}
        primaryDisabled={saving || !form.name || !form.email || !form.facultyId}
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
            <TextField label="Faculty ID" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} size="small" fullWidth required />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} size="small" fullWidth required />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} size="small" fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={form.department} label="Department" onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Designation</InputLabel>
              <Select value={form.designation} label="Designation" onChange={(e) => setForm({ ...form, designation: e.target.value })}>
                {FACULTY_DESIGNATIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Subjects (comma separated)" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} size="small" fullWidth sx={{ gridColumn: { sm: 'span 2' } }} />
            <TextField label="Experience (years)" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} size="small" fullWidth type="number" />
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['Active', 'Inactive', 'On Leave'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
      </FormDialog>
    </div>
  );
}
