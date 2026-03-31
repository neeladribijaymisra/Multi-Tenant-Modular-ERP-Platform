import { useState, useEffect } from 'react';
import {
  People, School, AccountBalance, TrendingUp, TrendingDown,
  CalendarToday, Assignment, Warning, ArrowForward,
} from '@mui/icons-material';
import {
  Button, Chip, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, TextField, Alert,
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { DEPARTMENTS, YEARS, STUDENT_STATUS, FEE_STATUS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import AdminManagement from '../components/common/AdminManagement';
import FormDialog from '../components/common/FormDialog';

const DEPT_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_STUDENT_FORM = {
  rollNo: '', name: '', email: '', phone: '', department: '', year: '',
  status: STUDENT_STATUS.ACTIVE, feeStatus: FEE_STATUS.PENDING, cgpa: '',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const resetAddForm = () => {
    setStudentForm(EMPTY_STUDENT_FORM);
    setAddError('');
  };

  const openAddStudent = () => {
    resetAddForm();
    setAddDialogOpen(true);
  };

  const closeAddStudent = () => {
    setAddDialogOpen(false);
    setAddError('');
  };

  const handleAddStudent = async () => {
    setAddSaving(true);
    setAddError('');
    const payload = {
      rollNo: studentForm.rollNo,
      name: studentForm.name,
      email: studentForm.email,
      phone: studentForm.phone,
      department: studentForm.department,
      year: studentForm.year,
      status: studentForm.status,
      feeStatus: studentForm.feeStatus,
      cgpa: studentForm.cgpa ? Number(studentForm.cgpa) : 0,
    };

    if (!payload.rollNo || !payload.name || !payload.email || !payload.department || !payload.year) {
      setAddError('Please fill in all required fields.');
      setAddSaving(false);
      return;
    }

    try {
      await api.post('/students', payload);
      closeAddStudent();
      fetchDashboardStats();
    } catch (error) {
      setAddError(error.response?.data?.message || 'Failed to add student.');
    } finally {
      setAddSaving(false);
    }
  };


  const fetchDashboardStats = () => {
    setLoading(true);
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Students', value: stats.students.total.toLocaleString(),
      change: `${stats.students.active} active`, up: true,
      icon: People, color: '#4f46e5', bg: '#eef2ff', sub: 'enrolled students',
    },
    {
      label: 'Faculty Members', value: stats.teachers.active.toLocaleString(),
      change: 'active', up: true,
      icon: School, color: '#06b6d4', bg: '#ecfeff', sub: 'active faculty',
    },
    {
      label: 'Revenue Collected', value: formatCurrency(stats.finance.collected),
      change: `${stats.finance.collectionRate}%`, up: true,
      icon: AccountBalance, color: '#10b981', bg: '#ecfdf5', sub: 'collection rate',
    },
    {
      label: 'Pending Dues', value: formatCurrency(stats.finance.pending),
      change: 'outstanding', up: false,
      icon: Warning, color: '#f59e0b', bg: '#fffbeb', sub: 'to be collected',
    },
  ] : [];

  const enrollmentData = stats?.monthlyEnrollment?.map((m) => ({
    month: MONTH_NAMES[m._id.month],
    students: m.count,
  })) || [];

  const deptData = stats?.studentsByDepartment?.map((d, i) => ({
    name: d._id || 'Other',
    value: d.count,
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="finance-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeInUp">
        <div>
          <h1 className="finance-page-title text-[2.5rem]">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
            <CalendarToday sx={{ fontSize: 14 }} />
            {today}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outlined" size="small" startIcon={<Assignment />} sx={{ borderColor: '#e2e8f0', color: '#475569' }}>
            Generate Report
          </Button>
          <Button variant="contained" size="small" startIcon={<People />} onClick={openAddStudent}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card animate-fadeInUp" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                  <Icon sx={{ fontSize: 22, color: card.color }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${card.up ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {card.up ? <TrendingUp sx={{ fontSize: 13 }} /> : <TrendingDown sx={{ fontSize: 13 }} />}
                  {card.change}
                </div>
              </div>
              <div>
                <p className="font-heading text-2xl font-700 text-slate-900">{card.value}</p>
                <p className="text-slate-600 text-sm font-medium mt-0.5">{card.label}</p>
                <p className="text-slate-400 text-xs mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Enrollment Chart */}
        <div className="lg:col-span-2 finance-card p-5 animate-fadeInUp">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading font-600 text-slate-900 text-base">Student Enrollment Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly new admissions (last 6 months)</p>
            </div>
            <Chip label="Live Data" size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 600, fontSize: '0.7rem' }} />
          </div>
          {enrollmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={enrollmentData}>
                <defs>
                  <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="students" stroke="#4f46e5" strokeWidth={2.5} fill="url(#gradStudents)" name="New Admissions" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No enrollment data yet</div>
          )}
        </div>

        {/* Dept Distribution */}
        <div className="finance-card p-5 animate-fadeInUp">
          <div className="mb-5">
            <h3 className="font-heading font-600 text-slate-900 text-base">Dept. Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Students per department</p>
          </div>
          {deptData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie data={deptData} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {deptData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {deptData.slice(0, 4).map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600 truncate max-w-[120px]">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No department data yet</div>
          )}
        </div>
      </div>

      {/* Upcoming Exams + Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Exams */}
        <div className="finance-card p-5 animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-600 text-slate-900 text-base">Upcoming Exams</h3>
            <button className="text-xs text-primary-600 font-semibold flex items-center gap-1">
              View all <ArrowForward sx={{ fontSize: 13 }} />
            </button>
          </div>
          {stats?.upcomingExams?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingExams.map((exam) => (
                <div key={exam._id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <CalendarToday sx={{ color: '#d97706', fontSize: 18 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{exam.course?.name || 'Exam'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {exam.startTime} · {exam.venue}
                    </p>
                  </div>
                  <Chip label={exam.examType} size="small" sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No upcoming exams in the next 7 days</div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="finance-card p-5 animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-600 text-slate-900 text-base">Recent Announcements</h3>
            <button className="text-xs text-primary-600 font-semibold flex items-center gap-1">
              View all <ArrowForward sx={{ fontSize: 13 }} />
            </button>
          </div>
          {stats?.recentAnnouncements?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAnnouncements.map((ann) => (
                <div key={ann._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ann.priority === 'High' ? '#ef4444' : ann.priority === 'Medium' ? '#f59e0b' : '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{ann.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ann.category} · {new Date(ann.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <Chip label={ann.priority} size="small"
                    sx={{ bgcolor: ann.priority === 'High' ? '#fef2f2' : '#fffbeb', color: ann.priority === 'High' ? '#ef4444' : '#d97706', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No recent announcements</div>
          )}
        </div>
      </div>

      {user?.role === 'superadmin' && (
        <div className="finance-card p-5 animate-fadeInUp">
          <div className="mb-4">
            <h3 className="font-heading font-600 text-slate-900 text-base">Master Admin Controls</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add and manage administrator accounts directly from the dashboard.
            </p>
          </div>
          <AdminManagement compact />
        </div>
      )}

      <FormDialog
        open={addDialogOpen}
        onClose={closeAddStudent}
        title="Quick Add Student"
        subtitle="Capture the essentials from the dashboard without leaving your overview."
        error={addError}
        onPrimary={handleAddStudent}
        primaryDisabled={addSaving || !studentForm.name || !studentForm.rollNo || !studentForm.email || !studentForm.department || !studentForm.year}
        primaryLabel="Add Student"
        loading={addSaving}
      >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Full Name" required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} size="small" fullWidth />
            <TextField label="Roll No." required value={studentForm.rollNo} onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })} size="small" fullWidth />
            <TextField label="Email" required value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} size="small" fullWidth />
            <TextField label="Phone" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} size="small" fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select label="Department" value={studentForm.department} onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Year</InputLabel>
              <Select label="Year" value={studentForm.year} onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}>
                {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={studentForm.status} onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}>
                {Object.values(STUDENT_STATUS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="CGPA" type="number" inputProps={{ min: 0, max: 10, step: 0.1 }} value={studentForm.cgpa} onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })} size="small" fullWidth />
          </div>
      </FormDialog>
    </div>
  );
}
