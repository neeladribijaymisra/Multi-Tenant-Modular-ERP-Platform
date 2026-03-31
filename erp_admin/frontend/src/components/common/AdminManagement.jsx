import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { Add, Delete, Edit, LockReset, ToggleOff, ToggleOn } from '@mui/icons-material';
import api from '../../utils/api';
import FormDialog from './FormDialog';

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
        await api.post('/admins', form);
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

      <FormDialog
        open={dialog.open}
        onClose={closeDialog}
        title={dialog.mode === 'add' ? 'Add Admin' : 'Edit Admin'}
        subtitle="Create access for new administrators and control their role, status, and department."
        error={error}
        onPrimary={handleSave}
        primaryDisabled={
          saving ||
          !form.name ||
          !form.username ||
          !form.email ||
          (dialog.mode === 'add' && !form.password)
        }
        primaryLabel={dialog.mode === 'add' ? 'Create Admin' : 'Save Changes'}
        loading={saving}
      >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              size="small"
              fullWidth
              required
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              size="small"
              fullWidth
              required
              disabled={dialog.mode === 'edit'}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              size="small"
              fullWidth
              required
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              size="small"
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="superadmin">Superadmin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              size="small"
              fullWidth
            />
            {dialog.mode === 'add' && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                size="small"
                fullWidth
                required
                sx={{ gridColumn: 'span 1' }}
              />
            )}
            {dialog.mode === 'edit' && (
              <div className="flex items-center gap-2 text-sm text-slate-500 sm:col-span-2">
                <LockReset sx={{ fontSize: 16 }} />
                Password changes stay on the dedicated profile security flow.
              </div>
            )}
          </div>
      </FormDialog>
    </div>
  );
}
