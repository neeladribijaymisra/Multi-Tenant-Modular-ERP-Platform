import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogContent, IconButton, InputAdornment, MenuItem, TextField } from '@mui/material';
import { ArrowForward, BadgeOutlined, CalendarToday, CheckCircle, Close, CreateOutlined, FileUploadOutlined, KeyboardArrowDown, MedicalServicesOutlined, PhotoCamera } from '@mui/icons-material';
import api from '../../utils/api';

const steps = [
  { id: 'personal', title: 'Personal Details', caption: 'Identity and contact details' },
  { id: 'academic', title: 'Academic Info', caption: 'Program and intake setup' },
  { id: 'documents', title: 'Documents', caption: 'Guardian, address, and proofs' },
];
const documentTypes = ['Previous Transcript', 'ID Proof', 'Medical Certificate'];
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const localStorageKey = 'academics_enrollment_draft_v2';
const palette = { ink: '#0f274f', panel: '#f3f6fb', line: '#d7dfeb', accent: '#dde8ff', accentDeep: '#0d2d63', surface: '#fbfcfe' };
const placeholderPhoto = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="36" fill="#eef4ff"/><circle cx="122" cy="90" r="42" fill="#d8a17c"/><path d="M56 214c9-41 38-69 66-69 34 0 60 24 68 69" fill="#7d8ea3"/><path d="M81 81c6-27 32-44 62-35 15 4 25 14 31 29-17 0-35 5-52 14-16-11-33-13-41-8z" fill="#39485f"/></svg>')}`;

const emptyForm = {
  personalDetails: { fullLegalName: '', preferredName: '', rollNumber: '', dateOfBirth: '', gender: '', email: '', phone: '' },
  academicInfo: { programId: '', programName: '', department: '', semester: 1, year: '1st Year', section: 'A', admissionDate: '', feePerSemester: 0, durationYears: 0 },
  contactInfo: { guardianName: '', guardianRelation: '', guardianPhone: '', guardianEmail: '' },
  address: { street: '', city: '', state: '', pincode: '' },
  profilePhoto: null,
  documents: documentTypes.map((type) => ({ type, file: null })),
};

const cloneForm = (value) => JSON.parse(JSON.stringify(value));
const toYearLabel = (semester) => (semester <= 2 ? '1st Year' : semester <= 4 ? '2nd Year' : semester <= 6 ? '3rd Year' : '4th Year');
const toSemesterLabel = (semester) => `SEM ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][semester - 1] || semester}`;
const readAsDataUrl = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Failed to read file.')); reader.readAsDataURL(file); });
const readImageDimensions = (src) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.width, height: image.height }); image.onerror = () => reject(new Error('Failed to read image dimensions.')); image.src = src; });

const inputSx = {
  '& .MuiInputLabel-root': { color: '#617087', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' },
  '& .MuiInputLabel-root.Mui-focused': { color: palette.ink },
  '& .MuiInputBase-root': { borderRadius: '0.9rem', backgroundColor: '#fff', border: `1px solid ${palette.line}`, px: 1.5, py: 0.35, fontWeight: 600 },
  '& .MuiInputBase-root.Mui-focused': { borderColor: palette.ink, boxShadow: '0 0 0 3px rgba(15,39,79,0.08)' },
  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
  '& .MuiInputBase-input': { py: 1.2 },
  '& .MuiFormHelperText-root': { marginLeft: 0.5, marginTop: 0.7 },
};

const normalizeDraftFromServer = (draft) => ({
  personalDetails: {
    fullLegalName: draft.personalDetails?.fullLegalName || '',
    preferredName: draft.personalDetails?.preferredName || '',
    rollNumber: draft.personalDetails?.rollNumber || '',
    dateOfBirth: draft.personalDetails?.dateOfBirth ? draft.personalDetails.dateOfBirth.slice(0, 10) : '',
    gender: draft.personalDetails?.gender || '',
    email: draft.personalDetails?.email || '',
    phone: draft.personalDetails?.phone || '',
  },
  academicInfo: {
    programId: draft.academicInfo?.programId || '',
    programName: draft.academicInfo?.programName || '',
    department: draft.academicInfo?.department || '',
    semester: draft.academicInfo?.semester || 1,
    year: draft.academicInfo?.year || toYearLabel(draft.academicInfo?.semester || 1),
    section: draft.academicInfo?.section || 'A',
    admissionDate: draft.academicInfo?.admissionDate ? draft.academicInfo.admissionDate.slice(0, 10) : '',
    feePerSemester: draft.academicInfo?.feePerSemester || 0,
    durationYears: draft.academicInfo?.durationYears || 0,
  },
  contactInfo: {
    guardianName: draft.contactInfo?.guardianName || '',
    guardianRelation: draft.contactInfo?.guardianRelation || '',
    guardianPhone: draft.contactInfo?.guardianPhone || '',
    guardianEmail: draft.contactInfo?.guardianEmail || '',
  },
  address: {
    street: draft.address?.street || '',
    city: draft.address?.city || '',
    state: draft.address?.state || '',
    pincode: draft.address?.pincode || '',
  },
  profilePhoto: draft.profilePhoto?.content ? draft.profilePhoto : null,
  documents: documentTypes.map((type) => {
    const existing = (draft.documents || []).find((document) => document.type === type);
    return { type, file: existing?.file?.content ? existing.file : null };
  }),
});

function StepItem({ index, title, caption, active, completed, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/70" style={{ backgroundColor: active ? '#ffffff' : 'transparent' }}>
      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold" style={{ backgroundColor: active ? palette.ink : completed ? '#e8f7f3' : '#fff', borderColor: active ? palette.ink : completed ? '#9ad9ca' : '#c8d3e2', color: active ? '#fff' : completed ? '#0f766e' : '#617087' }}>
        {completed ? <CheckCircle sx={{ fontSize: 18 }} /> : index + 1}
      </span>
      <span>
        <span className="block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{caption}</span>
      </span>
    </button>
  );
}

function InfoCard({ eyebrow, title, children, accent = false }) {
  return (
    <div className="rounded-[24px] border p-5" style={{ background: accent ? 'linear-gradient(180deg, #eff5ff 0%, #ffffff 100%)' : '#ffffff', borderColor: accent ? '#d4e3ff' : palette.line }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>{eyebrow}</p>
      <h4 className="mt-2 text-base font-extrabold text-slate-900">{title}</h4>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DocumentCard({ document, onPick, inputRef }) {
  const uploaded = Boolean(document.file?.content);
  const Icon = document.type === 'ID Proof' ? BadgeOutlined : document.type === 'Medical Certificate' ? MedicalServicesOutlined : FileUploadOutlined;
  return (
    <div className="rounded-[22px] border border-dashed p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm" style={{ borderColor: uploaded ? '#9fc0ff' : palette.line, backgroundColor: uploaded ? '#f4f8ff' : '#fff' }}>
      <input ref={inputRef} type="file" hidden accept="application/pdf,image/jpeg,image/png" onChange={(event) => onPick(event.target.files?.[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: uploaded ? '#dbe8ff' : '#f3f6fb' }}><Icon sx={{ fontSize: 24, color: uploaded ? palette.ink : '#738399' }} /></span>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-800">{document.type}</span>
        <span className="text-xs text-slate-500">{uploaded ? document.file.name : 'Click to upload PDF, JPG, or PNG'}</span>
      </button>
    </div>
  );
}

export default function EnrollmentWizardDialog({ open, onClose, onSuccess }) {
  const photoInputRef = useRef(null);
  const documentInputRefs = useRef({});
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => cloneForm(emptyForm));
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [rollCheck, setRollCheck] = useState({ checking: false, available: null, message: '' });
  const selectedProgram = useMemo(() => programs.find((program) => program.id === form.academicInfo.programId) || null, [programs, form.academicInfo.programId]);
  const semesterOptions = useMemo(() => Array.from({ length: Math.max(3, Math.min((selectedProgram?.durationYears || 4) * 2, 8)) }, (_, index) => index + 1), [selectedProgram]);
  const completionCount = useMemo(() => {
    let count = 0;
    if (form.personalDetails.fullLegalName && form.personalDetails.rollNumber && form.personalDetails.dateOfBirth && form.personalDetails.email) count += 1;
    if (form.academicInfo.programId && form.academicInfo.semester && form.academicInfo.section && form.academicInfo.admissionDate) count += 1;
    if (form.contactInfo.guardianName && form.contactInfo.guardianPhone && form.documents.every((item) => item.file?.content)) count += 1;
    return count;
  }, [form]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const bootstrap = async () => {
      setBootstrapping(true);
      setLoadingPrograms(true);
      setGeneralError('');
      try {
        const [programsRes, draftRes] = await Promise.all([api.get('/academics/enrollment/programs'), api.get('/academics/enrollment/draft')]);
        if (!active) return;
        const localDraft = window.localStorage.getItem(localStorageKey);
        let parsedLocalDraft = null;
        try { parsedLocalDraft = localDraft ? JSON.parse(localDraft) : null; } catch { window.localStorage.removeItem(localStorageKey); }
        const serverDraft = draftRes.data.data.draft ? normalizeDraftFromServer(draftRes.data.data.draft) : null;
        setPrograms(programsRes.data.data.programs || []);
        setForm(parsedLocalDraft || serverDraft || cloneForm(emptyForm));
        setStep(0);
        setFieldErrors({});
        setRollCheck({ checking: false, available: null, message: '' });
        setSuccessMessage('');
      } catch (error) {
        if (active) setGeneralError(error.response?.data?.message || 'Failed to prepare the enrollment flow.');
      } finally {
        if (active) {
          setBootstrapping(false);
          setLoadingPrograms(false);
        }
      }
    };
    bootstrap();
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (open) window.localStorage.setItem(localStorageKey, JSON.stringify(form));
  }, [form, open]);

  const updateForm = (updater) => setForm((current) => (typeof updater === 'function' ? updater(current) : updater));
  const clearFieldError = (field) => setFieldErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });

  const handleGroupChange = (group, field, value) => {
    updateForm((current) => ({ ...current, [group]: { ...current[group], [field]: group === 'personalDetails' && field === 'rollNumber' ? value.toUpperCase() : value } }));
    clearFieldError(field);
    if (group === 'personalDetails' && field === 'rollNumber') setRollCheck({ checking: false, available: null, message: '' });
  };

  const handleProgramSelect = (programId) => {
    const program = programs.find((item) => item.id === programId) || null;
    updateForm((current) => ({
      ...current,
      academicInfo: {
        ...current.academicInfo,
        programId: program?.id || '',
        programName: program?.name || '',
        department: program?.department || '',
        feePerSemester: program?.feePerSemester || 0,
        durationYears: program?.durationYears || 0,
        year: toYearLabel(current.academicInfo.semester || 1),
      },
    }));
    clearFieldError('programName');
    clearFieldError('department');
  };

  const handleSemesterSelect = (semester) => {
    updateForm((current) => ({ ...current, academicInfo: { ...current.academicInfo, semester, year: toYearLabel(semester) } }));
    clearFieldError('semester');
    clearFieldError('year');
  };

  const validateStep = async (targetStep = step) => {
    const errors = {};
    if (targetStep === 0) {
      if (!form.personalDetails.fullLegalName.trim()) errors.fullLegalName = 'Full legal name is required.';
      if (!form.personalDetails.rollNumber.trim()) errors.rollNumber = 'Roll number is required.';
      else if (!/^[A-Z0-9-]{5,20}$/.test(form.personalDetails.rollNumber)) errors.rollNumber = 'Use 5-20 letters, numbers, or dashes.';
      if (!form.personalDetails.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
      if (!form.personalDetails.email.trim()) errors.email = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalDetails.email)) errors.email = 'Enter a valid email address.';
      if (!form.personalDetails.phone.trim()) errors.phone = 'Phone number is required.';
      if (rollCheck.available === false) errors.rollNumber = rollCheck.message || 'Roll number already exists.';
    }
    if (targetStep === 1) {
      if (!form.academicInfo.programName) errors.programName = 'Select a program.';
      if (!form.academicInfo.department) errors.department = 'Department is required.';
      if (!form.academicInfo.semester) errors.semester = 'Select a semester.';
      if (!form.academicInfo.section.trim()) errors.section = 'Section is required.';
      if (!form.academicInfo.admissionDate) errors.admissionDate = 'Admission date is required.';
    }
    if (targetStep === 2) {
      if (!form.contactInfo.guardianName.trim()) errors.guardianName = 'Guardian name is required.';
      if (!form.contactInfo.guardianPhone.trim()) errors.guardianPhone = 'Guardian phone is required.';
      if (!form.address.city.trim()) errors.city = 'City is required.';
      if (!form.address.state.trim()) errors.state = 'State is required.';
      const missingDocuments = form.documents.filter((document) => !document.file?.content).map((document) => document.type);
      if (missingDocuments.length > 0) errors.documents = `Upload all required documents: ${missingDocuments.join(', ')}.`;
    }
    setFieldErrors((current) => ({ ...current, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleRollValidation = async () => {
    const rollNumber = form.personalDetails.rollNumber.trim();
    if (!rollNumber || !/^[A-Z0-9-]{5,20}$/.test(rollNumber)) return;
    setRollCheck({ checking: true, available: null, message: '' });
    try {
      const { data } = await api.get('/academics/enrollment/validate-roll', { params: { rollNumber } });
      if (data.data.available) {
        setRollCheck({ checking: false, available: true, message: 'Roll number is available.' });
        clearFieldError('rollNumber');
      } else {
        setRollCheck({ checking: false, available: false, message: 'Roll number already exists.' });
        setFieldErrors((current) => ({ ...current, rollNumber: 'Roll number already exists.' }));
      }
    } catch (error) {
      setRollCheck({ checking: false, available: false, message: error.response?.data?.message || 'Unable to validate roll number.' });
    }
  };

  const handlePhotoFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return setFieldErrors((current) => ({ ...current, profilePhoto: 'Profile photo must be JPG or PNG.' }));
    if (file.size > 2 * 1024 * 1024) return setFieldErrors((current) => ({ ...current, profilePhoto: 'Profile photo must be 2 MB or less.' }));
    const content = await readAsDataUrl(file);
    const { width, height } = await readImageDimensions(content);
    if (width < 256 || height < 256) return setFieldErrors((current) => ({ ...current, profilePhoto: 'Minimum resolution is 256 x 256.' }));
    updateForm((current) => ({ ...current, profilePhoto: { name: file.name, mimeType: file.type, size: file.size, width, height, content } }));
    clearFieldError('profilePhoto');
  };

  const handleDocumentFile = async (type, file) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) return setFieldErrors((current) => ({ ...current, documents: `${type} must be PDF, JPG, or PNG.` }));
    if (file.size > 5 * 1024 * 1024) return setFieldErrors((current) => ({ ...current, documents: `${type} must be 5 MB or less.` }));
    const content = await readAsDataUrl(file);
    updateForm((current) => ({
      ...current,
      documents: current.documents.map((document) => (
        document.type === type ? { ...document, file: { name: file.name, mimeType: file.type, size: file.size, content } } : document
      )),
    }));
    clearFieldError('documents');
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setGeneralError('');
    setSuccessMessage('');
    try {
      await api.post('/academics/enrollment/draft', form);
      window.localStorage.setItem(localStorageKey, JSON.stringify(form));
      setSuccessMessage('Draft saved. You can resume this enrollment later.');
    } catch (error) {
      setGeneralError(error.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleNext = async () => { if (await validateStep(step)) setStep((current) => Math.min(current + 1, steps.length - 1)); };

  const handleSubmit = async () => {
    const validations = await Promise.all(steps.map((_, index) => validateStep(index)));
    if (validations.some((result) => !result)) return setStep(validations.findIndex((result) => !result));
    setSubmitting(true);
    setGeneralError('');
    setSuccessMessage('');
    try {
      await api.post('/academics/enrollment/students', form);
      window.localStorage.removeItem(localStorageKey);
      setSuccessMessage('Student enrolled successfully.');
      onSuccess?.();
      onClose();
    } catch (error) {
      setFieldErrors((current) => ({ ...current, ...(error.response?.data?.errors || {}) }));
      setGeneralError(error.response?.data?.message || 'Failed to submit enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Discard this enrollment draft?')) {
      window.localStorage.removeItem(localStorageKey);
      setForm(cloneForm(emptyForm));
      setStep(0);
      onClose();
    }
  };

  const renderPersonalStep = () => (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <InfoCard eyebrow="Profile" title="Student photo" accent>
          <div className="flex flex-col items-center gap-4">
            <div className="group relative cursor-pointer">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-[30px] bg-slate-200 ring-4 ring-white shadow-sm">
                <img src={form.profilePhoto?.content || placeholderPhoto} alt="Student Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-[#0f274f]/40 opacity-0 transition-opacity group-hover:opacity-100"><PhotoCamera sx={{ color: '#fff' }} /></div>
              </div>
              <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute -bottom-2 -right-2 rounded-full p-2.5 text-white shadow-lg" style={{ backgroundColor: palette.ink }}><CreateOutlined sx={{ fontSize: 18 }} /></button>
            </div>
            <p className="text-center text-xs leading-5 text-slate-500">Use a clear portrait for ID cards and directory listings.</p>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" hidden onChange={(event) => handlePhotoFile(event.target.files?.[0]).catch((error) => setGeneralError(error.message))} />
            {fieldErrors.profilePhoto ? <p className="text-center text-xs font-semibold text-rose-600">{fieldErrors.profilePhoto}</p> : null}
          </div>
        </InfoCard>

        <InfoCard eyebrow="Identity" title="Student record">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField fullWidth variant="standard" label="Full legal name" placeholder="e.g. Alexander Hamilton" value={form.personalDetails.fullLegalName} onChange={(event) => handleGroupChange('personalDetails', 'fullLegalName', event.target.value)} error={Boolean(fieldErrors.fullLegalName)} helperText={fieldErrors.fullLegalName || ' '} sx={{ ...inputSx, gridColumn: { md: 'span 2' } }} />
            <TextField fullWidth variant="standard" label="Preferred name" placeholder="Optional display name" value={form.personalDetails.preferredName} onChange={(event) => handleGroupChange('personalDetails', 'preferredName', event.target.value)} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Gender" select value={form.personalDetails.gender} onChange={(event) => handleGroupChange('personalDetails', 'gender', event.target.value)} sx={inputSx} SelectProps={{ IconComponent: KeyboardArrowDown, displayEmpty: true }}>
              <MenuItem value="">Not specified</MenuItem>
              {genderOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <TextField fullWidth variant="standard" label="Roll number" placeholder="2024-ARCH-012" value={form.personalDetails.rollNumber} onChange={(event) => handleGroupChange('personalDetails', 'rollNumber', event.target.value)} onBlur={handleRollValidation} error={Boolean(fieldErrors.rollNumber)} helperText={fieldErrors.rollNumber || rollCheck.message || ' '} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Date of birth" type="date" value={form.personalDetails.dateOfBirth} onChange={(event) => handleGroupChange('personalDetails', 'dateOfBirth', event.target.value)} error={Boolean(fieldErrors.dateOfBirth)} helperText={fieldErrors.dateOfBirth || (rollCheck.checking ? 'Checking roll number availability...' : ' ')} InputLabelProps={{ shrink: true }} InputProps={{ endAdornment: <InputAdornment position="end"><CalendarToday sx={{ color: '#8b96a6', fontSize: 18 }} /></InputAdornment> }} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Primary email" placeholder="student@college.edu" value={form.personalDetails.email} onChange={(event) => handleGroupChange('personalDetails', 'email', event.target.value)} error={Boolean(fieldErrors.email)} helperText={fieldErrors.email || ' '} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Phone number" placeholder="+91 98765 43210" value={form.personalDetails.phone} onChange={(event) => handleGroupChange('personalDetails', 'phone', event.target.value)} error={Boolean(fieldErrors.phone)} helperText={fieldErrors.phone || ' '} sx={inputSx} />
          </div>
        </InfoCard>
      </div>
    </section>
  );

  const renderAcademicStep = () => (
    <section className="space-y-6">
      <InfoCard eyebrow="Placement" title="Program allocation" accent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField select fullWidth variant="standard" label="Course selection" value={form.academicInfo.programId} onChange={(event) => handleProgramSelect(event.target.value)} error={Boolean(fieldErrors.programName)} helperText={fieldErrors.programName || ' '} sx={{ ...inputSx, gridColumn: { md: 'span 2' } }} SelectProps={{ displayEmpty: true, IconComponent: KeyboardArrowDown, renderValue: (selected) => (!selected ? <span className="text-slate-400">Select program...</span> : programs.find((program) => program.id === selected)?.name || selected) }}>
            {loadingPrograms ? null : programs.map((program) => <MenuItem key={program.id} value={program.id}>{program.name}</MenuItem>)}
          </TextField>
          <TextField fullWidth variant="standard" label="Section" placeholder="A" value={form.academicInfo.section} onChange={(event) => handleGroupChange('academicInfo', 'section', event.target.value.toUpperCase())} error={Boolean(fieldErrors.section)} helperText={fieldErrors.section || ' '} sx={inputSx} />
          <TextField fullWidth variant="standard" label="Admission date" type="date" value={form.academicInfo.admissionDate} onChange={(event) => handleGroupChange('academicInfo', 'admissionDate', event.target.value)} error={Boolean(fieldErrors.admissionDate)} helperText={fieldErrors.admissionDate || ' '} InputLabelProps={{ shrink: true }} InputProps={{ endAdornment: <InputAdornment position="end"><CalendarToday sx={{ color: '#8b96a6', fontSize: 18 }} /></InputAdornment> }} sx={inputSx} />
        </div>
      </InfoCard>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <InfoCard eyebrow="Placement" title="Current semester">
          <p className="text-xs leading-5 text-slate-500">Choose the semester where this student begins in the selected program.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {semesterOptions.map((semester) => {
              const active = form.academicInfo.semester === semester;
              return (
                <button key={semester} type="button" onClick={() => handleSemesterSelect(semester)} className="rounded-2xl border px-4 py-2.5 text-xs font-extrabold tracking-[0.12em] transition-all" style={{ backgroundColor: active ? palette.ink : '#fff', borderColor: active ? palette.ink : palette.line, color: active ? '#fff' : '#334155', boxShadow: active ? '0 10px 24px rgba(15,39,79,0.18)' : 'none' }}>
                  {toSemesterLabel(semester)}
                </button>
              );
            })}
          </div>
          {fieldErrors.semester ? <p className="mt-3 text-xs font-semibold text-rose-600">{fieldErrors.semester}</p> : null}
        </InfoCard>
        <div className="grid gap-4">
          {[
            ['Department', form.academicInfo.department || '-'],
            ['Current year', form.academicInfo.year || '-'],
            ['Fee per semester', form.academicInfo.feePerSemester ? `INR ${form.academicInfo.feePerSemester.toLocaleString('en-IN')}` : '-'],
            ['Program duration', form.academicInfo.durationYears ? `${form.academicInfo.durationYears} years` : '-'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border bg-white px-4 py-4" style={{ borderColor: palette.line }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderDocumentsStep = () => (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard eyebrow="Guardian" title="Emergency contact">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField fullWidth variant="standard" label="Guardian name" value={form.contactInfo.guardianName} onChange={(event) => handleGroupChange('contactInfo', 'guardianName', event.target.value)} error={Boolean(fieldErrors.guardianName)} helperText={fieldErrors.guardianName || ' '} sx={{ ...inputSx, gridColumn: { md: 'span 2' } }} />
            <TextField fullWidth variant="standard" label="Relation" placeholder="Father, Mother, Guardian" value={form.contactInfo.guardianRelation} onChange={(event) => handleGroupChange('contactInfo', 'guardianRelation', event.target.value)} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Guardian phone" value={form.contactInfo.guardianPhone} onChange={(event) => handleGroupChange('contactInfo', 'guardianPhone', event.target.value)} error={Boolean(fieldErrors.guardianPhone)} helperText={fieldErrors.guardianPhone || ' '} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Guardian email" placeholder="Optional" value={form.contactInfo.guardianEmail} onChange={(event) => handleGroupChange('contactInfo', 'guardianEmail', event.target.value)} sx={{ ...inputSx, gridColumn: { md: 'span 2' } }} />
          </div>
        </InfoCard>
        <InfoCard eyebrow="Address" title="Residential details" accent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField fullWidth variant="standard" label="Street address" value={form.address.street} onChange={(event) => handleGroupChange('address', 'street', event.target.value)} sx={{ ...inputSx, gridColumn: { md: 'span 2' } }} />
            <TextField fullWidth variant="standard" label="City" value={form.address.city} onChange={(event) => handleGroupChange('address', 'city', event.target.value)} error={Boolean(fieldErrors.city)} helperText={fieldErrors.city || ' '} sx={inputSx} />
            <TextField fullWidth variant="standard" label="State" value={form.address.state} onChange={(event) => handleGroupChange('address', 'state', event.target.value)} error={Boolean(fieldErrors.state)} helperText={fieldErrors.state || ' '} sx={inputSx} />
            <TextField fullWidth variant="standard" label="Pincode" value={form.address.pincode} onChange={(event) => handleGroupChange('address', 'pincode', event.target.value)} sx={inputSx} />
          </div>
        </InfoCard>
      </div>
      <InfoCard eyebrow="Uploads" title="Required documents">
        {fieldErrors.documents ? <Alert severity="warning" sx={{ mb: 3 }}>{fieldErrors.documents}</Alert> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {form.documents.map((document) => (
            <DocumentCard key={document.type} document={document} inputRef={{ get current() { return documentInputRefs.current[document.type]; }, set current(value) { documentInputRefs.current[document.type] = value; } }} onPick={(file) => handleDocumentFile(document.type, file).catch((error) => setGeneralError(error.message))} />
          ))}
        </div>
      </InfoCard>
    </section>
  );

  const renderStepContent = () => (step === 0 ? renderPersonalStep() : step === 1 ? renderAcademicStep() : renderDocumentsStep());

  return (
    <Dialog open={open} onClose={(_, reason) => { if (reason !== 'backdropClick') onClose(); }} fullWidth maxWidth={false} PaperProps={{ sx: { width: '100%', maxWidth: '76rem', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 30px 90px rgba(15,23,42,0.18)', backgroundImage: 'none', border: '1px solid rgba(215,223,235,0.8)' } }} BackdropProps={{ sx: { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(19, 27, 44, 0.38)' } }}>
      <DialogContent sx={{ p: 0, bgcolor: palette.surface }}>
        {bootstrapping ? <div className="flex h-[720px] items-center justify-center"><CircularProgress /></div> : (
          <div className="flex min-h-[720px] flex-col xl:flex-row">
            <aside className="flex w-full flex-col gap-8 border-b p-7 xl:w-[320px] xl:border-b-0 xl:border-r" style={{ background: 'linear-gradient(180deg, #eef4ff 0%, #f7f9fd 100%)', borderColor: palette.line }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>Academics panel</p>
                  <h3 className="mt-2 text-[1.7rem] font-extrabold leading-tight text-slate-950">New Enrollment</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Create a polished student record with academic details, guardian info, and document uploads.</p>
                </div>
                <IconButton onClick={onClose} sx={{ color: '#334155' }}><Close /></IconButton>
              </div>
              <div className="rounded-[24px] border bg-white/80 p-5" style={{ borderColor: palette.line }}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Progress</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">{completionCount}/3</p>
                <p className="mt-1 text-sm text-slate-500">Sections ready for submission</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${(completionCount / 3) * 100}%`, backgroundColor: palette.ink }} /></div>
              </div>
              <div className="space-y-2">{steps.map((item, index) => <StepItem key={item.id} index={index} title={item.title} caption={item.caption} active={index === step} completed={index < step} onClick={() => { if (index <= step) setStep(index); }} />)}</div>
              <div className="mt-auto rounded-[24px] p-5 text-white" style={{ background: 'linear-gradient(135deg, #15366c 0%, #0a2348 100%)' }}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">Pro tip</p>
                <p className="mt-3 text-sm leading-6 text-white/90">Keep the roll number, guardian contact, and uploaded proofs final before submitting to avoid rework in the student registry.</p>
              </div>
            </aside>
            <div className="flex flex-1 flex-col">
              <div className="border-b px-7 py-6 md:px-10" style={{ borderColor: palette.line, backgroundColor: '#fff' }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>Step {step + 1}</p>
                    <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{steps[step].title}</h2>
                    <p className="mt-2 text-sm text-slate-500">{steps[step].caption}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['Program', form.academicInfo.programName || 'Pending'],
                      ['Semester', form.academicInfo.semester ? toSemesterLabel(form.academicInfo.semester) : 'Pending'],
                      ['Section', form.academicInfo.section || 'Pending'],
                      ['Roll no.', form.personalDetails.rollNumber || 'Pending'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border px-4 py-3" style={{ borderColor: palette.line, backgroundColor: palette.panel }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                        <p className="mt-1 text-xs font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-7 md:p-10">
                {generalError ? <Alert severity="error" sx={{ mb: 3 }}>{generalError}</Alert> : null}
                {successMessage ? <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert> : null}
                {renderStepContent()}
              </div>
              <div className="flex flex-col gap-4 border-t bg-white px-7 py-6 sm:flex-row sm:items-center sm:justify-between md:px-10" style={{ borderColor: palette.line }}>
                <Button onClick={handleCancel} variant="text" color="inherit" sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em' }}>Cancel</Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleSaveDraft} disabled={savingDraft || submitting} variant="contained" sx={{ backgroundColor: palette.accent, color: '#40546f', borderRadius: '0.9rem', px: 3, py: 1.35, boxShadow: 'none', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', '&:hover': { backgroundColor: '#d0defa', boxShadow: 'none' } }}>{savingDraft ? 'SAVE DRAFT...' : 'SAVE DRAFT'}</Button>
                  {step < steps.length - 1 ? (
                    <Button onClick={handleNext} variant="contained" endIcon={<ArrowForward />} sx={{ background: `linear-gradient(90deg, ${palette.ink} 0%, ${palette.accentDeep} 100%)`, color: '#fff', borderRadius: '0.9rem', px: 3, py: 1.35, boxShadow: '0 16px 28px rgba(15,39,79,0.22)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', '&:hover': { background: 'linear-gradient(90deg, #0d2345 0%, #0b2758 100%)' } }}>NEXT SECTION</Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={submitting} variant="contained" endIcon={<ArrowForward />} sx={{ background: `linear-gradient(90deg, ${palette.ink} 0%, ${palette.accentDeep} 100%)`, color: '#fff', borderRadius: '0.9rem', px: 3, py: 1.35, boxShadow: '0 16px 28px rgba(15,39,79,0.22)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', '&:hover': { background: 'linear-gradient(90deg, #0d2345 0%, #0b2758 100%)' } }}>{submitting ? 'CREATING...' : 'CREATE STUDENT'}</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
