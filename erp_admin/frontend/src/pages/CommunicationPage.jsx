import { useState, useEffect, useCallback } from 'react';
import {
  Button, Chip, TextField, InputAdornment, Avatar, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import { Forum, Add, Search, Announcement, Email, Sms, Campaign, Edit, Delete } from '@mui/icons-material';
import api from '../utils/api';
import { ANNOUNCEMENT_CATEGORIES, PRIORITY_LEVELS } from '../utils/constants';
import { debounce } from '../utils/helpers';
import FormDialog from '../components/common/FormDialog';

const CAT_COLORS = { Academic: '#4f46e5', Finance: '#10b981', Events: '#f59e0b', General: '#06b6d4', Faculty: '#8b5cf6', Examinations: '#ef4444' };

const emptyForm = { title: '', content: '', category: 'General', priority: 'Medium', audience: 'All', status: 'Draft' };

export default function CommunicationPage() {
  const [tab, setTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [commStats, setCommStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async (q = search) => {
    try {
      const params = { limit: 20 };
      if (q) params.search = q;
      const { data } = await api.get('/communication/announcements', { params });
      setAnnouncements(data.data.announcements);
    } catch { setError('Failed to load announcements.'); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/communication/stats');
      setCommStats({ total: data.data.total, published: data.data.published, drafts: data.data.drafts });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchAnnouncements(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  const debouncedSearch = useCallback(debounce((val) => fetchAnnouncements(val), 400), []);
  const handleSearch = (e) => { setSearch(e.target.value); debouncedSearch(e.target.value); };

  const openAdd = () => { setForm(emptyForm); setDialog({ open: true, mode: 'add', data: null }); };
  const openEdit = (a) => {
    setForm({ title: a.title, content: a.content || '', category: a.category, priority: a.priority, audience: a.audience, status: a.status });
    setDialog({ open: true, mode: 'edit', data: a });
  };
  const closeDialog = () => { setDialog({ open: false, mode: 'add', data: null }); setError(''); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (dialog.mode === 'add') await api.post('/communication/announcements', form);
      else await api.put(`/communication/announcements/${dialog.data._id}`, form);
      closeDialog(); fetchAnnouncements(); fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await api.delete(`/communication/announcements/${id}`); fetchAnnouncements(); fetchStats(); }
    catch { setError('Failed to delete announcement.'); }
  };

  const statCards = [
    { label: 'Total Announcements', value: commStats.total, icon: Announcement, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Published', value: commStats.published, icon: Email, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Drafts', value: commStats.drafts, icon: Sms, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Categories', value: ANNOUNCEMENT_CATEGORIES.length, icon: Campaign, color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <div className="finance-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeInUp">
        <div>
          <h1 className="finance-page-title text-[2.5rem]">Communication</h1>
          <p className="text-slate-500 text-sm mt-0.5">Announcements, messages, and notifications</p>
        </div>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={openAdd}>New Announcement</Button>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Quick stats */}
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

      {/* Tab switcher */}
      <div className="flex gap-2 animate-fadeInUp">
        {['announcements', 'messages'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-200 hover:text-primary-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
      <div className="finance-card overflow-hidden animate-fadeInUp">
          <div className="px-5 py-4 border-b border-slate-100">
            <TextField placeholder="Search announcements..." value={search} onChange={handleSearch} size="small" fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }} />
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><CircularProgress /></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No announcements found</div>
              ) : announcements.map((a) => (
                <div key={a._id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (CAT_COLORS[a.category] || '#64748b') + '20', color: CAT_COLORS[a.category] || '#64748b' }}>
                    <Announcement sx={{ fontSize: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-900">{a.title}</p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Chip label={a.category} size="small" sx={{ bgcolor: (CAT_COLORS[a.category] || '#64748b') + '18', color: CAT_COLORS[a.category] || '#64748b', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                      <span className="text-xs text-slate-400">To: {a.audience}</span>
                      <Chip label={a.status} size="small" sx={{ bgcolor: a.status === 'Published' ? '#ecfdf5' : '#f8fafc', color: a.status === 'Published' ? '#059669' : '#64748b', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                      <Chip label={a.priority} size="small" sx={{ bgcolor: a.priority === 'High' ? '#fef2f2' : a.priority === 'Medium' ? '#fffbeb' : '#f8fafc', color: a.priority === 'High' ? '#ef4444' : a.priority === 'Medium' ? '#d97706' : '#94a3b8', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(a)}><Edit sx={{ fontSize: 15, color: '#64748b' }} /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(a._id)}><Delete sx={{ fontSize: 15, color: '#ef4444' }} /></IconButton></Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="finance-card p-8 text-center text-slate-400 animate-fadeInUp">
          <Forum sx={{ fontSize: 48, opacity: 0.3 }} />
          <p className="mt-3 font-medium">Messaging module</p>
          <p className="text-sm mt-1">Direct messaging between admin, faculty, and students coming soon.</p>
        </div>
      )}

      <FormDialog
        open={dialog.open}
        onClose={closeDialog}
        title={dialog.mode === 'add' ? 'New Announcement' : 'Edit Announcement'}
        subtitle="Compose the message, set its audience, and control how urgently it should be seen."
        error={error}
        onPrimary={handleSave}
        primaryDisabled={saving || !form.title}
        primaryLabel={dialog.mode === 'add' ? 'Create Announcement' : 'Save Changes'}
        loading={saving}
      >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} size="small" fullWidth required sx={{ gridColumn: { sm: 'span 2' } }} />
            <TextField label="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} size="small" fullWidth multiline rows={4} sx={{ gridColumn: { sm: 'span 2' } }} />
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {ANNOUNCEMENT_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={form.priority} label="Priority" onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITY_LEVELS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} size="small" fullWidth placeholder="All, Students, Faculty..." />
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Published">Published</MenuItem>
              </Select>
            </FormControl>
          </div>
      </FormDialog>
    </div>
  );
}
