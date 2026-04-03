import { forwardRef, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Fade,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Slide,
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
  AdminPanelSettingsOutlined,
  BadgeOutlined,
  BusinessOutlined,
  Close,
  Delete,
  Edit,
  EmailOutlined,
  LockOutlined,
  LockReset,
  PersonOutline,
  PhoneOutlined,
  ToggleOff,
  ToggleOn,
} from '@mui/icons-material';
import api from '../../utils/api';

const SlideUp = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

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

const ADMIN_DEPARTMENTS = [
  { label: 'Administration', portal: 'masterAdmin' },
  { label: 'Accounts', portal: 'accounts' },
  { label: 'HR', portal: 'hr' },
  { label: 'Academics', portal: 'academics' },
];

const deptPortalMap = Object.fromEntries(ADMIN_DEPARTMENTS.map((d) => [d.label, d.portal]));

const emptyForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'admin',
  phone: '',
  department: 'Administration',
};

export default function AdminManagement({ compact = false }) {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ open: false, mode: 'add', admin: null });
  const [form, setForm] = useState(emptyForm);

  const fetchAdmins = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admins', { params: { page: nextPage, limit: 6 } });
      setAdmins(data.data.admins);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin accounts.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAdmins(page);
  }, [fetchAdmins, page]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const closeDialog = () => {
    setDialog({ open: false, mode: 'add', admin: null });
    setForm(emptyForm);
    setError('');
  };

  const openAddDialog = () => {
    setForm(emptyForm);
    setDialog({ open: true, mode: 'add', admin: null });
    resetMessages();
  };

  const openEditDialog = (admin) => {
    setForm({
      name: admin.name || '',
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      role: admin.role || 'admin',
      phone: admin.phone || '',
      department: admin.department || 'Administration',
    });
    setDialog({ open: true, mode: 'edit', admin });
    resetMessages();
  };

  const handleSave = async () => {
    setSaving(true);
    resetMessages();

    try {
      if (dialog.mode === 'add') {
        await api.post('/admins', { ...form, portal: deptPortalMap[form.department] || 'masterAdmin' });
        closeDialog();
        setSuccess('Admin account created successfully.');
      } else {
        await api.put(`/admins/${dialog.admin._id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          role: form.role,
        });
        closeDialog();
        setSuccess('Admin account updated successfully.');
      }
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save admin account.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete admin account "${admin.username}"?`)) return;

    resetMessages();
    try {
      await api.delete(`/admins/${admin._id}`);
      setSuccess('Admin account deleted successfully.');
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete admin account.');
    }
  };

  const handleToggleStatus = async (admin) => {
    resetMessages();
    try {
      await api.put(`/admins/${admin._id}/toggle-status`);
      setSuccess(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully.`);
      fetchAdmins(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update admin status.');
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert severity="error" onClose={resetMessages}>{error}</Alert>}
      {success && <Alert severity="success" onClose={resetMessages}>{success}</Alert>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-heading font-600 text-slate-900 text-base">Admin Accounts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Create, activate, edit, and remove administrator accounts.</p>
        </div>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={openAddDialog}>
          Add Admin
        </Button>
      </div>

      <div className="finance-card overflow-hidden">
        <TableContainer>
          <Table size={compact ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    No admin accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin._id} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{admin.name}</p>
                        <p className="text-xs text-slate-400">{admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                        {admin.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={admin.role}
                        size="small"
                        sx={{
                          bgcolor: admin.role === 'superadmin' ? '#eef2ff' : '#f8fafc',
                          color: admin.role === 'superadmin' ? '#4f46e5' : '#475569',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={admin.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: admin.isActive ? '#ecfdf5' : '#fef2f2',
                          color: admin.isActive ? '#059669' : '#dc2626',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>{admin.department || 'Administration'}</TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip title={admin.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggleStatus(admin)}>
                            {admin.isActive ? (
                              <ToggleOn sx={{ fontSize: 18, color: '#10b981' }} />
                            ) : (
                              <ToggleOff sx={{ fontSize: 18, color: '#94a3b8' }} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditDialog(admin)}>
                            <Edit sx={{ fontSize: 16, color: '#64748b' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(admin)}>
                            <Delete sx={{ fontSize: 16, color: '#ef4444' }} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Showing {admins.length} of {pagination.total || 0} admin accounts
          </p>
          <Pagination
            count={pagination.totalPages || 1}
            page={page}
            onChange={(_, value) => setPage(value)}
            size="small"
          />
        </div>
      </div>

      <Dialog
        open={dialog.open}
        onClose={(_, reason) => { if (reason !== 'backdropClick') closeDialog(); }}
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

            {/* Close button */}
            <IconButton
              onClick={closeDialog}
              sx={{ position: 'absolute', top: 0, right: 0, border: '1px solid rgba(226,232,240,0.95)', bgcolor: 'rgba(255,255,255,0.92)', color: '#64748b', '&:hover': { bgcolor: '#fff', color: '#334155' } }}
            >
              <Close fontSize="small" />
            </IconButton>

            {/* Header */}
            <Box sx={{ pt: { xs: 4, sm: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Fade in={dialog.open} timeout={320}>
                <Box sx={{ width: 80, height: 80, borderRadius: '22px', background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(15,23,42,0.18)' }}>
                  <AdminPanelSettingsOutlined sx={{ color: '#fff', fontSize: 36 }} />
                </Box>
              </Fade>
              <Typography sx={{ mt: 2.5, fontFamily: '"Manrope",sans-serif', fontWeight: 800, fontSize: { xs: '1.6rem', sm: '1.85rem' }, color: '#020617', letterSpacing: '-0.03em' }}>
                {dialog.mode === 'add' ? 'Add Admin' : 'Edit Admin'}
              </Typography>
              <Typography sx={{ mt: 1, maxWidth: 480, fontSize: '0.9rem', lineHeight: 1.7, color: '#64748b' }}>
                {dialog.mode === 'add'
                  ? 'Create access for a new administrator with role, department, and login credentials.'
                  : 'Update administrator details, role, and department assignment.'}
              </Typography>
            </Box>

            {/* Form card */}
            <Box sx={{ mt: 4, borderRadius: '24px', border: '1px solid rgba(226,232,240,0.92)', backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)', p: { xs: 2.5, sm: 3.5 } }}>
              {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  size="small" fullWidth required sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  size="small" fullWidth required disabled={dialog.mode === 'edit'} sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  size="small" fullWidth required sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <TextField
                  label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  size="small" fullWidth sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                />
                <FormControl size="small" fullWidth sx={fieldSx}>
                  <Select
                    value={form.role} displayEmpty onChange={(e) => setForm({ ...form, role: e.target.value })}
                    renderValue={(v) => v || 'Role'}
                    startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><AdminPanelSettingsOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}
                  >
                    <MenuItem value="superadmin">Superadmin</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth sx={fieldSx}>
                  <Select
                    value={form.department} displayEmpty
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    renderValue={(v) => v || 'Department'}
                    startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BusinessOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}
                  >
                    {ADMIN_DEPARTMENTS.map((d) => (
                      <MenuItem key={d.label} value={d.label}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <span>{d.label}</span>
                          <Chip
                            label={d.portal === 'masterAdmin' ? 'Master Admin portal' : `${d.label} portal`}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {form.department && dialog.mode === 'add' && (
                  <Box sx={{ gridColumn: { sm: 'span 2' }, px: 0.5 }}>
                    <Alert severity="info" sx={{ borderRadius: '14px', fontSize: '0.8rem', py: 0.5 }}>
                      This admin will log in via the <strong>{form.department === 'Administration' ? 'Master Admin' : form.department}</strong> portal using the username and password you set below.
                    </Alert>
                  </Box>
                )}
                {dialog.mode === 'add' && (
                  <TextField
                    label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    size="small" fullWidth required sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }}
                  />
                )}
                {dialog.mode === 'edit' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, gridColumn: { sm: 'span 2' }, color: '#64748b', fontSize: '0.85rem' }}>
                    <LockReset sx={{ fontSize: 16 }} />
                    Password changes are handled through the profile security flow.
                  </Box>
                )}
              </div>
            </Box>

            {/* Actions */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                onClick={closeDialog} variant="outlined"
                sx={{ borderRadius: '14px', px: 3, py: 1.2, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#94a3b8', backgroundColor: '#fff' } }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name || !form.username || !form.email || (dialog.mode === 'add' && !form.password)}
                variant="contained"
                sx={{ borderRadius: '14px', px: 3.2, py: 1.25, textTransform: 'none', fontWeight: 800, background: 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', boxShadow: '0 14px 28px rgba(29,78,216,0.24)', '&:hover': { background: 'linear-gradient(135deg,#1e40af 0%,#0f172a 100%)', transform: 'translateY(-1px)', boxShadow: '0 18px 34px rgba(29,78,216,0.28)' }, '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' } }}
              >
                {saving ? 'Saving...' : dialog.mode === 'add' ? 'Create Admin' : 'Save Changes'}
              </Button>
            </Box>

          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}
