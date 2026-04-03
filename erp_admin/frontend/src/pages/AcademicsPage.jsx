import { forwardRef, useCallback, useEffect, useState } from 'react';
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogContent, Fade, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, Slide, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { Add, BadgeOutlined, CalendarMonthOutlined, Delete, Edit, LockReset, MenuBookOutlined, PeopleOutlined, RoomOutlined, SchoolOutlined, TimerOutlined } from '@mui/icons-material';

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

const dialogPaper = {
  width: '100%', maxWidth: '52rem', borderRadius: '22px', overflow: 'hidden',
  backgroundImage: 'none', backgroundColor: '#f8fafc',
  border: '1px solid rgba(226,232,240,0.95)',
  boxShadow: '0 34px 90px rgba(15,23,42,0.18)',
};

const backdropSx = { timeout: 240, sx: { backgroundColor: 'rgba(15,23,42,0.34)', backdropFilter: 'blur(10px)' } };

function AcademicDialog({ open, onClose, icon: Icon, iconBg = 'linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%)', title, subtitle, error, onSave, saveLabel, saveDisabled, children }) {
  return (
    <Dialog open={open} onClose={(_, r) => { if (r !== 'backdropClick') onClose(); }} TransitionComponent={SlideUp} fullWidth maxWidth={false} BackdropProps={backdropSx} PaperProps={{ sx: dialogPaper }}>
      <DialogContent sx={{ p: { xs: 3, sm: 4.5 } }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 0, right: 0, border: '1px solid rgba(226,232,240,0.95)', bgcolor: 'rgba(255,255,255,0.92)', color: '#64748b', '&:hover': { bgcolor: '#fff', color: '#334155' } }}>
            <Add sx={{ transform: 'rotate(45deg)', fontSize: 18 }} />
          </IconButton>
          <Box sx={{ pt: { xs: 4, sm: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Fade in={open} timeout={320}>
              <Box sx={{ width: 76, height: 76, borderRadius: '20px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(15,23,42,0.18)' }}>
                <Icon sx={{ color: '#fff', fontSize: 34 }} />
              </Box>
            </Fade>
            <Typography sx={{ mt: 2.5, fontFamily: '"Manrope",sans-serif', fontWeight: 800, fontSize: { xs: '1.55rem', sm: '1.8rem' }, color: '#020617', letterSpacing: '-0.03em' }}>{title}</Typography>
            <Typography sx={{ mt: 1, maxWidth: 460, fontSize: '0.88rem', lineHeight: 1.7, color: '#64748b' }}>{subtitle}</Typography>
          </Box>
          <Box sx={{ mt: 4, borderRadius: '24px', border: '1px solid rgba(226,232,240,0.92)', backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)', p: { xs: 2.5, sm: 3.5 } }}>
            {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
            {children}
          </Box>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '14px', px: 3, py: 1.2, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#94a3b8', backgroundColor: '#fff' } }}>Cancel</Button>
            <Button onClick={onSave} disabled={saveDisabled} variant="contained" sx={{ borderRadius: '14px', px: 3.2, py: 1.25, textTransform: 'none', fontWeight: 800, background: iconBg, boxShadow: '0 14px 28px rgba(29,78,216,0.24)', '&:hover': { filter: 'brightness(1.08)', transform: 'translateY(-1px)', boxShadow: '0 18px 34px rgba(29,78,216,0.28)' }, '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' } }}>{saveLabel}</Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
import api from '../utils/api';
import { DEPARTMENTS, FACULTY_DESIGNATIONS } from '../utils/constants';
import { getInitials, stringToColor } from '../utils/helpers';
import FormDialog from '../components/common/FormDialog';

const teacherStatuses = ['Active', 'On Leave', 'Resigned', 'Retired'];
const accountStatuses = ['Pending Setup', 'Active', 'Password Reset Required', 'Disabled'];
const examTypes = ['Mid-Semester', 'End-Semester', 'Internal', 'Practical', 'Viva'];
const curriculumStatuses = ['Draft', 'Active', 'Archived'];
const planTypes = ['Academic Calendar', 'Assessment Plan', 'Program Review', 'Department Plan', 'Record Update'];
const approvalStatuses = ['Draft', 'Pending Approval', 'Approved', 'Rejected'];
const recordStatuses = ['Pending Update', 'In Review', 'Recorded', 'Archived'];
const leaveTypes = ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity Leave', 'Duty Leave'];
const leaveStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

const emptyTeacher = { name: '', email: '', phone: '', facultyId: '', department: '', designation: '', subjects: '', experienceYears: '', status: 'Active', accountStatus: 'Pending Setup', avatar: '' };
const emptyCourse = { name: '', code: '', department: '', semester: '', credits: '', capacity: '', status: 'Active' };
const emptyExam = { course: '', examType: 'Mid-Semester', date: '', startTime: '', endTime: '', venue: '', maxMarks: '' };
const emptyCurriculum = { title: '', program: '', department: '', academicYear: '', semester: '', status: 'Draft', coursesCount: '', reviewCycle: '', notes: '', owner: '' };
const emptyPlan = { title: '', department: '', planType: 'Academic Calendar', academicYear: '', owner: '', approver: '', approvalStatus: 'Draft', recordStatus: 'Pending Update', effectiveDate: '', notes: '' };
const emptyLeave = { teacher: '', leaveType: 'Casual Leave', startDate: '', endDate: '', days: '', reason: '', status: 'Pending', reviewNotes: '' };
const emptyStudentPhoto = { avatar: '' };

function Section({ title, subtitle, action, children }) {
  return (
    <div className="finance-card animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-200">
        <div>
          <h2 className="font-heading text-lg font-700 text-slate-900">{title}</h2>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ title, meta, chips = [], actions, avatar }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-[22px] border border-slate-200 bg-white/80 transition hover:bg-slate-50">
      <Avatar src={avatar || ''} sx={{ width: 42, height: 42, bgcolor: stringToColor(title), fontSize: 14, fontWeight: 700 }}>
        {!avatar && getInitials(title)}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1 break-words">{meta}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((chip) => (
            <Chip key={`${title}-${chip}`} label={chip} size="small" sx={{ bgcolor: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.72rem', height: 24 }} />
          ))}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}

export default function AcademicsPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [overview, setOverview] = useState({});
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [curriculumPlans, setCurriculumPlans] = useState([]);
  const [academicPlans, setAcademicPlans] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [dialog, setDialog] = useState({ open: false, type: '', mode: 'add', data: null });
  const [teacherForm, setTeacherForm] = useState(emptyTeacher);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [examForm, setExamForm] = useState(emptyExam);
  const [curriculumForm, setCurriculumForm] = useState(emptyCurriculum);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [studentPhotoForm, setStudentPhotoForm] = useState(emptyStudentPhoto);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [o, a, s, t, c, e, cp, ap, l] = await Promise.all([
        api.get('/academics/overview'),
        api.get('/academics/teacher-accounts', { params: { limit: 50 } }),
        api.get('/academics/registries/students', { params: { limit: 50 } }),
        api.get('/academics/registries/teachers', { params: { limit: 50 } }),
        api.get('/academics/courses', { params: { limit: 50 } }),
        api.get('/academics/exams', { params: { limit: 50 } }),
        api.get('/academics/curriculum-plans', { params: { limit: 50 } }),
        api.get('/academics/academic-plans', { params: { limit: 50 } }),
        api.get('/academics/leave-requests', { params: { limit: 50 } }),
      ]);
      setOverview(o.data.data);
      setAccounts(a.data.data.teachers);
      setStudents(s.data.data.students);
      setTeachers(t.data.data.teachers);
      setCourses(c.data.data.courses);
      setExams(e.data.data.exams);
      setCurriculumPlans(cp.data.data.plans);
      setAcademicPlans(ap.data.data.plans);
      setLeaveRequests(l.data.data.requests);
    } catch {
      setError('Failed to load academics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const closeDialog = () => { setDialog({ open: false, type: '', mode: 'add', data: null }); setError(''); };
  const open = (type, mode = 'add', data = null) => setDialog({ open: true, type, mode, data });

  const saveAndRefresh = async (request) => {
    setSaving(true);
    setError('');
    try {
      await request();
      closeDialog();
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (path, message) => {
    if (!window.confirm(message)) return;
    try {
      await api.delete(path);
      fetchAll();
    } catch {
      setError('Delete failed.');
    }
  };

  const accountOptions = accounts.map((teacher) => <MenuItem key={teacher._id} value={teacher._id}>{teacher.name}</MenuItem>);

  return (
    <div className="finance-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeInUp">
        <div>
          <h1 className="finance-page-title text-[2.5rem]">Academics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Add, edit, and monitor academic operations from one place.</p>
        </div>

      </div>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {passwordNotice && <Alert severity="success" onClose={() => setPasswordNotice('')}>{passwordNotice}</Alert>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Teacher Accounts', overview.teachers || 0],
          ['Students', overview.students || 0],
          ['Curriculum Plans', overview.curriculumPlans || 0],
          ['Pending Leave', overview.pendingLeaveRequests || 0],
        ].map(([label, value]) => (
          <div key={label} className="stat-card animate-fadeInUp">
            <p className="font-heading text-2xl font-700 text-slate-900">{value}</p>
            <p className="text-slate-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="finance-card animate-fadeInUp">
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: 3, borderBottom: '1px solid #f1f5f9' }}>
          {['Teacher Accounts', 'Registries', 'Courses & Exams', 'Curriculum Plans', 'Academic Plans', 'Leave Requests'].map((label) => (
            <Tab key={label} label={label} sx={{ textTransform: 'none', fontFamily: '"DM Sans"', fontWeight: 600, fontSize: '0.875rem' }} />
          ))}
        </Tabs>

        <div className="p-5">
          {loading ? <div className="flex justify-center py-12"><CircularProgress /></div> : (
            <div className="space-y-5">
              {tab === 0 && <Section title="Teacher Accounts" subtitle="Add, edit, delete teacher accounts and generate teacher passwords."><div className="space-y-3">{accounts.map((teacher) => <Row key={teacher._id} title={teacher.name} meta={`${teacher.facultyId} | ${teacher.email} | ${teacher.department} | ${teacher.designation}`} chips={[teacher.status, teacher.accountStatus || 'Pending Setup', `${teacher.experienceYears || 0} yrs`]} avatar={teacher.avatar} actions={<><Tooltip title="Generate Password"><IconButton size="small" onClick={async () => { const { data } = await api.post(`/academics/teacher-accounts/${teacher._id}/generate-password`); setPasswordNotice(`Temporary password: ${data.data.generatedPassword}`); fetchAll(); }}><LockReset sx={{ fontSize: 18, color: '#d97706' }} /></IconButton></Tooltip><Tooltip title="Edit"><IconButton size="small" onClick={() => { setTeacherForm({ name: teacher.name, email: teacher.email, phone: teacher.phone || '', facultyId: teacher.facultyId, department: teacher.department, designation: teacher.designation, subjects: (teacher.subjects || []).join(', '), experienceYears: teacher.experienceYears || '', status: teacher.status, accountStatus: teacher.accountStatus || 'Pending Setup', avatar: teacher.avatar || '' }); open('teacher', 'edit', teacher); }}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" onClick={() => remove(`/academics/teacher-accounts/${teacher._id}`, 'Delete this teacher account?')}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip></>} />)}</div></Section>}

              {tab === 1 && <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="Student Registry" subtitle="Maintain the student registry used by academics, including student photos."><div className="space-y-3">{students.map((student) => <Row key={student._id} title={student.name} meta={`${student.rollNo} | ${student.email} | ${student.department} | ${student.year || ''}`} chips={[student.status, student.feeStatus || 'Pending', `CGPA ${student.cgpa || 0}`]} avatar={student.avatar} actions={<Tooltip title="Update Photo"><IconButton size="small" onClick={() => { setStudentPhotoForm({ avatar: student.avatar || '' }); open('studentPhoto', 'edit', student); }}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip>} />)}</div></Section><Section title="Teacher Registry" subtitle="Maintain the teacher registry alongside accounts, including teacher photos."><div className="space-y-3">{teachers.map((teacher) => <Row key={teacher._id} title={teacher.name} meta={`${teacher.facultyId} | ${teacher.email} | ${teacher.department}`} chips={[teacher.status, teacher.designation]} avatar={teacher.avatar} />)}</div></Section></div>}

              {tab === 2 && <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="Courses" subtitle="Keep existing course operations inside academics." action={<Button variant="outlined" size="small" startIcon={<Add />} onClick={() => { setCourseForm(emptyCourse); open('course'); }}>Add Course</Button>}><div className="space-y-3">{courses.map((course) => <Row key={course._id} title={course.name} meta={`${course.code} | ${course.department} | Semester ${course.semester}`} chips={[`${course.credits} credits`, `Capacity ${course.capacity}`, course.status]} actions={<><Tooltip title="Edit"><IconButton size="small" onClick={() => { setCourseForm({ name: course.name, code: course.code, department: course.department, semester: course.semester, credits: course.credits, capacity: course.capacity, status: course.status }); open('course', 'edit', course); }}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" onClick={() => remove(`/academics/courses/${course._id}`, 'Delete this course?')}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip></>} />)}</div></Section><Section title="Exam Schedule" subtitle="Schedule and maintain exam entries." action={<Button variant="outlined" size="small" startIcon={<Add />} onClick={() => { setExamForm(emptyExam); open('exam'); }}>Schedule Exam</Button>}><div className="space-y-3">{exams.map((exam) => <Row key={exam._id} title={exam.course?.name || 'Unknown Course'} meta={`${new Date(exam.date).toLocaleDateString('en-IN')} | ${exam.startTime} - ${exam.endTime} | ${exam.venue}`} chips={[exam.examType, exam.status]} actions={<Tooltip title="Delete"><IconButton size="small" onClick={() => remove(`/academics/exams/${exam._id}`, 'Delete this exam schedule?')}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip>} />)}</div></Section></div>}

              {tab === 3 && <Section title="Curriculum Plans" subtitle="Create and manage curriculum plans." action={<Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setCurriculumForm(emptyCurriculum); open('curriculum'); }}>New Plan</Button>}><div className="space-y-3">{curriculumPlans.map((plan) => <Row key={plan._id} title={plan.title} meta={`${plan.program} | ${plan.department} | ${plan.academicYear} | Semester ${plan.semester}`} chips={[plan.status, `${plan.coursesCount || 0} courses`, plan.reviewCycle || 'No review cycle']} actions={<><Tooltip title="Edit"><IconButton size="small" onClick={() => { setCurriculumForm({ title: plan.title, program: plan.program, department: plan.department, academicYear: plan.academicYear, semester: plan.semester, status: plan.status, coursesCount: plan.coursesCount || '', reviewCycle: plan.reviewCycle || '', notes: plan.notes || '', owner: plan.owner?._id || '' }); open('curriculum', 'edit', plan); }}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" onClick={() => remove(`/academics/curriculum-plans/${plan._id}`, 'Delete this curriculum plan?')}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip></>} />)}</div></Section>}

              {tab === 4 && <Section title="Academic Plans and Approvals" subtitle="Manage academic plans, approvals, and records." action={<Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setPlanForm(emptyPlan); open('plan'); }}>Add Plan</Button>}><div className="space-y-3">{academicPlans.map((plan) => <Row key={plan._id} title={plan.title} meta={`${plan.planType} | ${plan.department} | ${plan.academicYear}`} chips={[plan.approvalStatus, plan.recordStatus, plan.approver?.name || 'No approver']} actions={<><Tooltip title="Edit"><IconButton size="small" onClick={() => { setPlanForm({ title: plan.title, department: plan.department, planType: plan.planType, academicYear: plan.academicYear, owner: plan.owner?._id || '', approver: plan.approver?._id || '', approvalStatus: plan.approvalStatus, recordStatus: plan.recordStatus, effectiveDate: plan.effectiveDate ? plan.effectiveDate.slice(0, 10) : '', notes: plan.notes || '' }); open('plan', 'edit', plan); }}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" onClick={() => remove(`/academics/academic-plans/${plan._id}`, 'Delete this academic plan?')}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip></>} />)}</div></Section>}

              {tab === 5 && <Section title="Leave Requests" subtitle="Monitor leave requests and keep review notes current." action={<Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setLeaveForm(emptyLeave); open('leave'); }}>Add Request</Button>}><div className="space-y-3">{leaveRequests.map((item) => <Row key={item._id} title={item.teacher?.name || 'Teacher'} meta={`${item.leaveType} | ${new Date(item.startDate).toLocaleDateString('en-IN')} to ${new Date(item.endDate).toLocaleDateString('en-IN')} | ${item.days} day(s)`} chips={[item.status, item.teacher?.department || 'No department']} actions={<><Tooltip title="Edit"><IconButton size="small" onClick={() => { setLeaveForm({ teacher: item.teacher?._id || '', leaveType: item.leaveType, startDate: item.startDate ? item.startDate.slice(0, 10) : '', endDate: item.endDate ? item.endDate.slice(0, 10) : '', days: item.days || '', reason: item.reason || '', status: item.status, reviewNotes: item.reviewNotes || '' }); open('leave', 'edit', item); }}><Edit sx={{ fontSize: 16, color: '#64748b' }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" onClick={() => remove(`/academics/leave-requests/${item._id}`, 'Delete this leave request?')}><Delete sx={{ fontSize: 16, color: '#ef4444' }} /></IconButton></Tooltip></>} />)}</div></Section>}
            </div>
          )}
        </div>
      </div>
      <FormDialog open={dialog.open && dialog.type === 'teacher'} onClose={closeDialog} title={dialog.mode === 'add' ? 'Add Teacher Account' : 'Edit Teacher Account'} subtitle="Maintain teacher accounts from academics." error={error} onPrimary={() => saveAndRefresh(() => dialog.mode === 'add' ? api.post('/academics/teacher-accounts', { ...teacherForm, subjects: teacherForm.subjects.split(',').map((item) => item.trim()).filter(Boolean), experienceYears: Number(teacherForm.experienceYears) || 0 }) : api.put(`/academics/teacher-accounts/${dialog.data._id}`, { ...teacherForm, subjects: teacherForm.subjects.split(',').map((item) => item.trim()).filter(Boolean), experienceYears: Number(teacherForm.experienceYears) || 0 }))} primaryDisabled={saving || !teacherForm.name || !teacherForm.email || !teacherForm.facultyId} primaryLabel={dialog.mode === 'add' ? 'Create Account' : 'Save Account'} loading={saving}><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><TextField label="Full Name" value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} size="small" fullWidth required /><TextField label="Faculty ID" value={teacherForm.facultyId} onChange={(e) => setTeacherForm({ ...teacherForm, facultyId: e.target.value })} size="small" fullWidth required /><TextField label="Email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} size="small" fullWidth required /><TextField label="Phone" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} size="small" fullWidth /><FormControl size="small" fullWidth><InputLabel>Department</InputLabel><Select value={teacherForm.department} label="Department" onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}>{DEPARTMENTS.map((department) => <MenuItem key={department} value={department}>{department}</MenuItem>)}</Select></FormControl><FormControl size="small" fullWidth><InputLabel>Designation</InputLabel><Select value={teacherForm.designation} label="Designation" onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}>{FACULTY_DESIGNATIONS.map((designation) => <MenuItem key={designation} value={designation}>{designation}</MenuItem>)}</Select></FormControl><TextField label="Photo URL" value={teacherForm.avatar} onChange={(e) => setTeacherForm({ ...teacherForm, avatar: e.target.value })} size="small" fullWidth sx={{ gridColumn: { sm: 'span 2' } }} /><TextField label="Subjects (comma separated)" value={teacherForm.subjects} onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })} size="small" fullWidth sx={{ gridColumn: { sm: 'span 2' } }} /><TextField label="Experience (years)" value={teacherForm.experienceYears} onChange={(e) => setTeacherForm({ ...teacherForm, experienceYears: e.target.value })} size="small" fullWidth type="number" /><FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select value={teacherForm.status} label="Status" onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value })}>{teacherStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl><FormControl size="small" fullWidth sx={{ gridColumn: { sm: 'span 2' } }}><InputLabel>Account Status</InputLabel><Select value={teacherForm.accountStatus} label="Account Status" onChange={(e) => setTeacherForm({ ...teacherForm, accountStatus: e.target.value })}>{accountStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl></div></FormDialog>

      <AcademicDialog
        open={dialog.open && dialog.type === 'course'}
        onClose={closeDialog}
        icon={MenuBookOutlined}
        title={dialog.mode === 'add' ? 'Add Course' : 'Edit Course'}
        subtitle="Define the course name, code, department, semester, credits, and capacity."
        error={error}
        onSave={() => saveAndRefresh(() => dialog.mode === 'add'
          ? api.post('/academics/courses', { ...courseForm, credits: Number(courseForm.credits), capacity: Number(courseForm.capacity) })
          : api.put(`/academics/courses/${dialog.data._id}`, { ...courseForm, credits: Number(courseForm.credits), capacity: Number(courseForm.capacity) }))}
        saveDisabled={saving || !courseForm.name || !courseForm.code}
        saveLabel={dialog.mode === 'add' ? 'Add Course' : 'Save Course'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Course Name" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} size="small" fullWidth required sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MenuBookOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Course Code" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} size="small" fullWidth required sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={courseForm.department} displayEmpty onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })} renderValue={(v) => v || 'Department'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><SchoolOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="" disabled>Department</MenuItem>
              {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Semester" value={courseForm.semester} onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Credits" value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: e.target.value })} size="small" fullWidth type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Capacity" value={courseForm.capacity} onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })} size="small" fullWidth type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
        </div>
      </AcademicDialog>

      <AcademicDialog
        open={dialog.open && dialog.type === 'exam'}
        onClose={closeDialog}
        icon={CalendarMonthOutlined}
        iconBg="linear-gradient(135deg,#0f766e 0%,#0f172a 100%)"
        title="Schedule Exam"
        subtitle="Set the course, exam type, date, time, venue, and maximum marks."
        error={error}
        onSave={() => saveAndRefresh(() => api.post('/academics/exams', { ...examForm, maxMarks: examForm.maxMarks ? Number(examForm.maxMarks) : undefined }))}
        saveDisabled={saving || !examForm.course || !examForm.date || !examForm.startTime || !examForm.endTime || !examForm.venue}
        saveLabel="Schedule Exam"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormControl size="small" fullWidth sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }}>
            <Select value={examForm.course} displayEmpty onChange={(e) => setExamForm({ ...examForm, course: e.target.value })} renderValue={(v) => { const c = courses.find((x) => x._id === v); return c ? `${c.name} (${c.code})` : 'Select Course'; }}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><MenuBookOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="" disabled>Select Course</MenuItem>
              {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={examForm.examType} displayEmpty onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })} renderValue={(v) => v || 'Exam Type'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {examTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} size="small" fullWidth type="date" InputLabelProps={{ shrink: true }} sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Start Time" value={examForm.startTime} onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><TimerOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="End Time" value={examForm.endTime} onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><TimerOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Venue" value={examForm.venue} onChange={(e) => setExamForm({ ...examForm, venue: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><RoomOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Max Marks" value={examForm.maxMarks} onChange={(e) => setExamForm({ ...examForm, maxMarks: e.target.value })} size="small" fullWidth type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
        </div>
      </AcademicDialog>

      <AcademicDialog
        open={dialog.open && dialog.type === 'curriculum'}
        onClose={closeDialog}
        icon={SchoolOutlined}
        iconBg="linear-gradient(135deg,#7c3aed 0%,#0f172a 100%)"
        title={dialog.mode === 'add' ? 'Create Curriculum Plan' : 'Edit Curriculum Plan'}
        subtitle="Define the program, department, academic year, semester, and review details."
        error={error}
        onSave={() => saveAndRefresh(() => dialog.mode === 'add'
          ? api.post('/academics/curriculum-plans', { ...curriculumForm, coursesCount: Number(curriculumForm.coursesCount) || 0 })
          : api.put(`/academics/curriculum-plans/${dialog.data._id}`, { ...curriculumForm, coursesCount: Number(curriculumForm.coursesCount) || 0 }))}
        saveDisabled={saving || !curriculumForm.title || !curriculumForm.program || !curriculumForm.academicYear}
        saveLabel={dialog.mode === 'add' ? 'Create Plan' : 'Save Plan'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Title" value={curriculumForm.title} onChange={(e) => setCurriculumForm({ ...curriculumForm, title: e.target.value })} size="small" fullWidth required sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MenuBookOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Program" value={curriculumForm.program} onChange={(e) => setCurriculumForm({ ...curriculumForm, program: e.target.value })} size="small" fullWidth required sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><SchoolOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={curriculumForm.department} displayEmpty onChange={(e) => setCurriculumForm({ ...curriculumForm, department: e.target.value })} renderValue={(v) => v || 'Department'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><SchoolOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="" disabled>Department</MenuItem>
              {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Academic Year" value={curriculumForm.academicYear} onChange={(e) => setCurriculumForm({ ...curriculumForm, academicYear: e.target.value })} size="small" fullWidth required sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Semester" value={curriculumForm.semester} onChange={(e) => setCurriculumForm({ ...curriculumForm, semester: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={curriculumForm.status} displayEmpty onChange={(e) => setCurriculumForm({ ...curriculumForm, status: e.target.value })} renderValue={(v) => v || 'Status'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {curriculumStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Courses Count" value={curriculumForm.coursesCount} onChange={(e) => setCurriculumForm({ ...curriculumForm, coursesCount: e.target.value })} size="small" fullWidth type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Review Cycle" value={curriculumForm.reviewCycle} onChange={(e) => setCurriculumForm({ ...curriculumForm, reviewCycle: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><TimerOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={curriculumForm.owner} displayEmpty onChange={(e) => setCurriculumForm({ ...curriculumForm, owner: e.target.value })} renderValue={(v) => { const t = accounts.find((a) => a._id === v); return t ? t.name : 'Owner (Unassigned)'; }}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="">Unassigned</MenuItem>
              {accountOptions}
            </Select>
          </FormControl>
          <TextField label="Notes" value={curriculumForm.notes} onChange={(e) => setCurriculumForm({ ...curriculumForm, notes: e.target.value })} size="small" fullWidth multiline minRows={3} sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }} />
        </div>
      </AcademicDialog>
      <FormDialog open={dialog.open && dialog.type === 'studentPhoto'} onClose={closeDialog} title="Update Student Photo" subtitle="Attach a photo URL for the selected student from the academics registry." error={error} onPrimary={() => saveAndRefresh(() => api.put(`/academics/registries/students/${dialog.data._id}`, { avatar: studentPhotoForm.avatar }))} primaryDisabled={saving} primaryLabel="Save Photo" loading={saving}><div className="grid grid-cols-1 gap-3"><TextField label="Student" value={dialog.data?.name || ''} size="small" fullWidth disabled /><TextField label="Photo URL" value={studentPhotoForm.avatar} onChange={(e) => setStudentPhotoForm({ avatar: e.target.value })} size="small" fullWidth /><div className="flex justify-center pt-2"><Avatar src={studentPhotoForm.avatar || ''} sx={{ width: 72, height: 72, bgcolor: stringToColor(dialog.data?.name || 'S') }}>{getInitials(dialog.data?.name || 'S')}</Avatar></div></div></FormDialog>
      <AcademicDialog
        open={dialog.open && dialog.type === 'plan'}
        onClose={closeDialog}
        icon={RoomOutlined}
        iconBg="linear-gradient(135deg,#0891b2 0%,#0f172a 100%)"
        title={dialog.mode === 'add' ? 'Add Academic Plan' : 'Edit Academic Plan'}
        subtitle="Manage academic plans, approvals, record status, and assigned owners."
        error={error}
        onSave={() => saveAndRefresh(() => dialog.mode === 'add'
          ? api.post('/academics/academic-plans', planForm)
          : api.put(`/academics/academic-plans/${dialog.data._id}`, planForm))}
        saveDisabled={saving || !planForm.title || !planForm.department || !planForm.academicYear}
        saveLabel={dialog.mode === 'add' ? 'Add Plan' : 'Save Plan'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Title" value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} size="small" fullWidth required sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MenuBookOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={planForm.department} displayEmpty onChange={(e) => setPlanForm({ ...planForm, department: e.target.value })} renderValue={(v) => v || 'Department'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><SchoolOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="" disabled>Department</MenuItem>
              {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={planForm.planType} displayEmpty onChange={(e) => setPlanForm({ ...planForm, planType: e.target.value })} renderValue={(v) => v || 'Plan Type'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {planTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Academic Year" value={planForm.academicYear} onChange={(e) => setPlanForm({ ...planForm, academicYear: e.target.value })} size="small" fullWidth required sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Effective Date" value={planForm.effectiveDate} onChange={(e) => setPlanForm({ ...planForm, effectiveDate: e.target.value })} size="small" fullWidth type="date" InputLabelProps={{ shrink: true }} sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={planForm.owner} displayEmpty onChange={(e) => setPlanForm({ ...planForm, owner: e.target.value })} renderValue={(v) => { const t = accounts.find((a) => a._id === v); return t ? t.name : 'Owner (Unassigned)'; }}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="">Unassigned</MenuItem>
              {accountOptions}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={planForm.approver} displayEmpty onChange={(e) => setPlanForm({ ...planForm, approver: e.target.value })} renderValue={(v) => { const t = accounts.find((a) => a._id === v); return t ? t.name : 'Approver (Unassigned)'; }}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="">Unassigned</MenuItem>
              {accountOptions}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={planForm.approvalStatus} displayEmpty onChange={(e) => setPlanForm({ ...planForm, approvalStatus: e.target.value })} renderValue={(v) => v || 'Approval Status'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {approvalStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={planForm.recordStatus} displayEmpty onChange={(e) => setPlanForm({ ...planForm, recordStatus: e.target.value })} renderValue={(v) => v || 'Record Status'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {recordStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Notes" value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} size="small" fullWidth multiline minRows={3} sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }} />
        </div>
      </AcademicDialog>

      <AcademicDialog
        open={dialog.open && dialog.type === 'leave'}
        onClose={closeDialog}
        icon={TimerOutlined}
        iconBg="linear-gradient(135deg,#d97706 0%,#0f172a 100%)"
        title={dialog.mode === 'add' ? 'Add Leave Request' : 'Edit Leave Request'}
        subtitle="Record teacher leave with type, dates, duration, reason, and approval status."
        error={error}
        onSave={() => saveAndRefresh(() => dialog.mode === 'add'
          ? api.post('/academics/leave-requests', { ...leaveForm, days: Number(leaveForm.days) || 1 })
          : api.put(`/academics/leave-requests/${dialog.data._id}`, { ...leaveForm, days: Number(leaveForm.days) || 1 }))}
        saveDisabled={saving || !leaveForm.teacher || !leaveForm.startDate || !leaveForm.endDate}
        saveLabel={dialog.mode === 'add' ? 'Add Request' : 'Save Request'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormControl size="small" fullWidth sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }}>
            <Select value={leaveForm.teacher} displayEmpty onChange={(e) => setLeaveForm({ ...leaveForm, teacher: e.target.value })}
              renderValue={(v) => { const t = accounts.find((a) => a._id === v); return t ? t.name : 'Select Teacher'; }}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><PeopleOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              <MenuItem value="" disabled>Select Teacher</MenuItem>
              {accountOptions}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={leaveForm.leaveType} displayEmpty onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })} renderValue={(v) => v || 'Leave Type'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {leaveTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth sx={fieldSx}>
            <Select value={leaveForm.status} displayEmpty onChange={(e) => setLeaveForm({ ...leaveForm, status: e.target.value })} renderValue={(v) => v || 'Status'}
              startAdornment={<InputAdornment position="start" sx={{ ml: 1.5 }}><BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment>}>
              {leaveStatuses.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Start Date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} size="small" fullWidth type="date" InputLabelProps={{ shrink: true }} sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="End Date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} size="small" fullWidth type="date" InputLabelProps={{ shrink: true }} sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Days" value={leaveForm.days} onChange={(e) => setLeaveForm({ ...leaveForm, days: e.target.value })} size="small" fullWidth type="number" sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><TimerOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} size="small" fullWidth sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><MenuBookOutlined sx={{ color: '#94a3b8', fontSize: 19 }} /></InputAdornment> }} />
          <TextField label="Review Notes" value={leaveForm.reviewNotes} onChange={(e) => setLeaveForm({ ...leaveForm, reviewNotes: e.target.value })} size="small" fullWidth multiline minRows={3} sx={{ ...fieldSx, gridColumn: { sm: 'span 2' } }} />
        </div>
      </AcademicDialog>
    </div>
  );
}
