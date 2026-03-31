import { useEffect, useState } from 'react';
import { Button, TextField, Switch, Divider, Avatar, CircularProgress, Alert } from '@mui/material';
import { Person, Lock, Notifications, Palette, School, Save, Security } from '@mui/icons-material';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import AdminManagement from '../components/common/AdminManagement';

const sections = [
  { id: 'profile', label: 'Profile', icon: Person },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'admins', label: 'Manage Admins', icon: Security },
  { id: 'portalAccess', label: 'Portal Access', icon: Security },
  { id: 'notifications', label: 'Notifications', icon: Notifications },
  { id: 'university', label: 'University Info', icon: School },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [active, setActive] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', department: user?.department || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ email: true, sms: false, feeAlerts: true, examAlerts: true, admissions: true, system: false });
  const [portalAccess, setPortalAccess] = useState({ accounts: false, hr: false, academics: false, masterAdmin: true });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProfileSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUser(data.data.admin);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setSuccess('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally { setSaving(false); }
  };

  const handlePortalAccessSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.put('/auth/portal-settings', { portalAccess });
      setPortalAccess(data.data.portalAccess);
      setSuccess('Portal access settings updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update portal access.');
    } finally { setSaving(false); }
  };

  useEffect(() => {
    const loadPortalAccess = async () => {
      try {
        const { data } = await api.get('/auth/portal-settings');
        setPortalAccess(data.data.portalAccess);
      } catch {
        /* silent */
      }
    };
    loadPortalAccess();
  }, []);

  const clearMessages = () => { setError(''); setSuccess(''); };

  return (
    <div className="finance-page">
      <div className="animate-fadeInUp">
        <h1 className="finance-page-title text-[2.5rem]">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account, university, and system preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 animate-fadeInUp">
        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="finance-card p-3 space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => { setActive(s.id); clearMessages(); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all ${active === s.id ? 'bg-slate-900 text-white shadow-card' : 'text-slate-600 hover:bg-white'}`}>
                  <Icon sx={{ fontSize: 18 }} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="finance-card flex-1 p-6">
          {error && <Alert severity="error" onClose={clearMessages} sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" onClose={clearMessages} sx={{ mb: 3 }}>{success}</Alert>}

          {active === 'profile' && (
            <div className="space-y-5">
              <h2 className="font-heading font-600 text-slate-900 text-lg">Profile Settings</h2>
              <div className="flex items-center gap-4">
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#4f46e5', fontSize: 28, fontWeight: 700 }}>
                  {getInitials(user?.name || 'A')}
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.role}</p>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField fullWidth label="Full Name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} size="small" />
                <TextField fullWidth label="Email Address" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} size="small" />
                <TextField fullWidth label="Phone Number" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} size="small" />
                <TextField fullWidth label="Department" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} size="small" />
                <TextField fullWidth label="Username" value={user?.username || ''} size="small" disabled />
                <TextField fullWidth label="Role" value={user?.role || ''} size="small" disabled />
              </div>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={handleProfileSave} disabled={saving}>
                Save Changes
              </Button>
            </div>
          )}

          {active === 'security' && (
            <div className="space-y-5">
              <h2 className="font-heading font-600 text-slate-900 text-lg">Security Settings</h2>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <Security sx={{ color: '#d97706', fontSize: 20, mt: 0.2 }} />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Keep your account secure</p>
                  <p className="text-xs text-amber-700 mt-0.5">Use a strong password with at least 6 characters.</p>
                </div>
              </div>
              <Divider />
              <div className="space-y-4">
                <TextField fullWidth label="Current Password" type="password" size="small" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                <TextField fullWidth label="New Password" type="password" size="small" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                <TextField fullWidth label="Confirm New Password" type="password" size="small" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={handlePasswordSave} disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}>
                Update Password
              </Button>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-5">
              <h2 className="font-heading font-600 text-slate-900 text-lg">Notification Preferences</h2>
              <div className="space-y-2">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Receive alerts via SMS' },
                  { key: 'feeAlerts', label: 'Fee Due Alerts', desc: 'Notify when fee deadlines approach' },
                  { key: 'examAlerts', label: 'Exam Schedule Alerts', desc: 'Notify about exam updates' },
                  { key: 'admissions', label: 'Admission Requests', desc: 'Notify when new applications arrive' },
                  { key: 'system', label: 'System Updates', desc: 'Notify about system maintenance' },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{n.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                    </div>
                    <Switch checked={notifications[n.key]} onChange={(e) => setNotifications((p) => ({ ...p, [n.key]: e.target.checked }))} />
                  </div>
                ))}
              </div>
              <Button variant="contained" startIcon={<Save />}>Save Preferences</Button>
            </div>
          )}

          {active === 'admins' && (
            user?.role === 'superadmin' ? (
              <AdminManagement />
            ) : (
              <div className="space-y-4">
                <h2 className="font-heading font-600 text-slate-900 text-lg">Manage Admins</h2>
                <Alert severity="warning">
                  Only the Master Admin can add or manage administrator accounts.
                </Alert>
              </div>
            )
          )}

          {active === 'portalAccess' && (
            user?.role === 'superadmin' ? (
              <div className="space-y-5">
                <h2 className="font-heading font-600 text-slate-900 text-lg">Portal Access</h2>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-800">Control which login portals are available</p>
                  <p className="text-xs text-slate-500 mt-1">Master Admin stays on at all times. Accounts, HR, and Academics can be turned on or off from here.</p>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'accounts', label: 'Accounts Portal', desc: 'Allow Accounts users to enter from the login screen.' },
                    { key: 'hr', label: 'HR Portal', desc: 'Allow HR users to enter from the login screen.' },
                    { key: 'academics', label: 'Academics Portal', desc: 'Allow Academics users to enter from the login screen.' },
                    { key: 'masterAdmin', label: 'Master Admin Portal', desc: 'Always enabled for system ownership.', locked: true },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <Switch
                        checked={portalAccess[item.key]}
                        disabled={item.locked}
                        onChange={(e) => setPortalAccess((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                    </div>
                  ))}
                </div>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />} onClick={handlePortalAccessSave} disabled={saving}>
                  Save Portal Access
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="font-heading font-600 text-slate-900 text-lg">Portal Access</h2>
                <Alert severity="warning">
                  Only the Master Admin can change login portal availability.
                </Alert>
              </div>
            )
          )}

          {active === 'university' && (
            <div className="space-y-5">
              <h2 className="font-heading font-600 text-slate-900 text-lg">University Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField fullWidth label="University Name" defaultValue="State University of Technology" size="small" />
                <TextField fullWidth label="University Code" defaultValue="SUT-2024" size="small" />
                <TextField fullWidth label="Established Year" defaultValue="1985" size="small" />
                <TextField fullWidth label="Affiliation" defaultValue="UGC Recognized" size="small" />
                <TextField fullWidth label="Contact Email" defaultValue="info@university.edu" size="small" />
                <TextField fullWidth label="Contact Phone" defaultValue="+91 674 123 4567" size="small" />
                <TextField fullWidth label="City" defaultValue="Bhubaneswar" size="small" />
                <TextField fullWidth label="State" defaultValue="Odisha" size="small" />
              </div>
              <TextField fullWidth label="Address" defaultValue="Campus Road, Tech Park, Bhubaneswar" size="small" multiline rows={2} />
              <Button variant="contained" startIcon={<Save />}>Save University Info</Button>
            </div>
          )}

          {active === 'appearance' && (
            <div className="space-y-5">
              <h2 className="font-heading font-600 text-slate-900 text-lg">Appearance</h2>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3">Theme</p>
                <div className="flex gap-3">
                  {['Light', 'Dark', 'System'].map((t) => (
                    <button key={t} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${t === 'Light' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <Divider />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'].map((c) => (
                    <button key={c} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Divider />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Compact Mode</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reduce spacing for denser layout</p>
                </div>
                <Switch />
              </div>
              <Button variant="contained" startIcon={<Save />}>Save Appearance</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
