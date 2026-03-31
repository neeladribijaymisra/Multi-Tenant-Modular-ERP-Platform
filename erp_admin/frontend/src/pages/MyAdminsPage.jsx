import { useCallback, useEffect, useState } from 'react';
import { Alert, Chip, CircularProgress } from '@mui/material';
import { AdminPanelSettings, History, PersonOff, QueryStats } from '@mui/icons-material';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';

const roleColors = {
  superadmin: { bg: '#eef2ff', color: '#4f46e5' },
  admin: { bg: '#ecfeff', color: '#0891b2' },
  staff: { bg: '#f8fafc', color: '#475569' },
};

export default function MyAdminsPage() {
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: statsData }, { data: adminsData }] = await Promise.all([
        api.get('/admins/stats'),
        api.get('/admins', { params: { includeDeleted: true, limit: 100 } }),
      ]);

      setStats(statsData.data);
      setAdmins(adminsData.data.admins);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeAdmins = admins.filter((admin) => !admin.isDeleted);
  const removedAdmins = admins.filter((admin) => admin.isDeleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="finance-page">
      <div className="animate-fadeInUp">
        <h1 className="finance-page-title text-[2.5rem]">My Admins</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Review active administrator accounts, archived admins, and lifecycle activity in one place.
        </p>
      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Admins', value: stats?.totals?.totalAdmins || 0, icon: AdminPanelSettings, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Active Now', value: stats?.totals?.activeAdmins || 0, icon: QueryStats, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Inactive', value: stats?.totals?.inactiveAdmins || 0, icon: History, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Removed', value: stats?.totals?.deletedAdmins || 0, icon: PersonOff, color: '#ef4444', bg: '#fef2f2' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="stat-card animate-fadeInUp flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                <Icon sx={{ fontSize: 20, color: item.color }} />
              </div>
              <div>
                <p className="font-heading text-xl font-700 text-slate-900">{item.value}</p>
                <p className="text-slate-500 text-xs font-medium">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="finance-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-600 text-slate-900 text-lg">Active Admin Roster</h2>
            <p className="text-xs text-slate-400 mt-1">Creation date, current status, and latest tracked activity.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(stats?.byRole || []).map((role) => (
              <Chip
                key={role._id}
                label={`${role._id}: ${role.count}`}
                size="small"
                sx={{
                  bgcolor: roleColors[role._id]?.bg || '#f8fafc',
                  color: roleColors[role._id]?.color || '#475569',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              />
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                {['Admin', 'Role', 'Created', 'Last Activity', 'Service Days', 'Status'].map((header) => (
                  <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeAdmins.map((admin) => (
                <tr key={admin._id} className="border-t border-slate-100">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-800">{admin.name}</p>
                    <p className="text-xs text-slate-400">{admin.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Chip
                      label={admin.role}
                      size="small"
                      sx={{
                        bgcolor: roleColors[admin.role]?.bg || '#f8fafc',
                        color: roleColors[admin.role]?.color || '#475569',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(admin.createdAt)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(admin.lastActivity || admin.lastLogin || admin.updatedAt)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{admin.serviceDays} days</td>
                  <td className="px-4 py-3.5">
                    <Chip
                      label={admin.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        bgcolor: admin.isActive ? '#ecfdf5' : '#fffbeb',
                        color: admin.isActive ? '#059669' : '#b45309',
                        fontWeight: 600,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="finance-card p-5">
        <div className="mb-4">
          <h2 className="font-heading font-600 text-slate-900 text-lg">Removed Admin History</h2>
          <p className="text-xs text-slate-400 mt-1">Archived admins remain visible here with service dates and last known activity.</p>
        </div>

        {removedAdmins.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No removed admins yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Admin', 'Created', 'Removed', 'Service Window', 'Last Activity', 'Removed By'].map((header) => (
                    <th key={header} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {removedAdmins.map((admin) => (
                  <tr key={admin._id} className="border-t border-slate-100">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{admin.name}</p>
                      <p className="text-xs text-slate-400">{admin.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(admin.createdAt)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{admin.deletedAt ? formatDate(admin.deletedAt) : '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {formatDate(admin.serviceStart)} to {admin.serviceEnd ? formatDate(admin.serviceEnd) : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{formatDate(admin.lastActivity || admin.updatedAt)}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {admin.deletedBy?.name || admin.deletedBy?.username || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
