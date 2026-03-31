import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CameraAlt,
  CheckCircle,
  Close,
  Description,
  Edit,
  FileUpload,
  Lock,
} from '@mui/icons-material';
import api from '../../utils/api';

const steps = [
  { id: 'personal', label: 'Personal Details', tip: 'Use the legal name exactly as it should appear on student IDs and official certificates.' },
  { id: 'academic', label: 'Academic Info', tip: 'Pick the student program first so semester, fee, and duration details stay aligned.' },
  { id: 'documents', label: 'Documents', tip: 'Upload clean scans now so the academic office does not need to reopen the enrollment later.' },
];

const documentTypes = ['Previous Transcript', 'ID Proof', 'Medical Certificate'];
const localStorageKey = 'academics_enrollment_draft_v1';

const emptyForm = {
  personalDetails: {
    fullLegalName: '',
    rollNumber: '',
    dateOfBirth: '',
    email: '',
    phone: '',
  },
  academicInfo: {
    programId: '',
    programName: '',
    department: '',
    semester: null,
    year: '',
    feePerSemester: 0,
    durationYears: 0,
  },
  profilePhoto: null,
  documents: documentTypes.map((type) => ({ type, file: null })),
};

const toYearLabel = (semester) => {
  if (!semester) return '';
  if (semester <= 2) return '1st Year';
  if (semester <= 4) return '2nd Year';
  if (semester <= 6) return '3rd Year';
  return '4th Year';
};

const cloneForm = (value) => JSON.parse(JSON.stringify(value));

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Failed to read file.'));
  reader.readAsDataURL(file);
});

const readImageDimensions = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve({ width: image.width, height: image.height });
  image.onerror = () => reject(new Error('Failed to read image dimensions.'));
  image.src = src;
});

const normalizeDraftFromServer = (draft) => {
  if (!draft) return cloneForm(emptyForm);

  return {
    personalDetails: {
      fullLegalName: draft.personalDetails?.fullLegalName || '',
      rollNumber: draft.personalDetails?.rollNumber || '',
      dateOfBirth: draft.personalDetails?.dateOfBirth ? draft.personalDetails.dateOfBirth.slice(0, 10) : '',
      email: draft.personalDetails?.email || '',
      phone: draft.personalDetails?.phone || '',
    },
    academicInfo: {
      programId: draft.academicInfo?.programId || '',
      programName: draft.academicInfo?.programName || '',
      department: draft.academicInfo?.department || '',
      semester: draft.academicInfo?.semester || null,
      year: draft.academicInfo?.year || '',
      feePerSemester: draft.academicInfo?.feePerSemester || 0,
      durationYears: draft.academicInfo?.durationYears || 0,
    },
    profilePhoto: draft.profilePhoto?.content ? draft.profilePhoto : null,
    documents: documentTypes.map((type) => {
      const existing = (draft.documents || []).find((document) => document.type === type);
      return { type, file: existing?.file?.content ? existing.file : null };
    }),
  };
};

export default function EnrollmentWizardDialog({ open, onClose, onSuccess }) {
  const avatarInputRef = useRef(null);
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

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === form.academicInfo.programId) || null,
    [programs, form.academicInfo.programId]
  );

  useEffect(() => {
    if (!open) return;

    let active = true;
    const bootstrap = async () => {
      setBootstrapping(true);
      setLoadingPrograms(true);
      setGeneralError('');
      try {
        const [programsRes, draftRes] = await Promise.all([
          api.get('/academics/enrollment/programs'),
          api.get('/academics/enrollment/draft'),
        ]);

        if (!active) return;

        const localDraft = window.localStorage.getItem(localStorageKey);
        let parsedLocalDraft = null;
        try {
          parsedLocalDraft = localDraft ? JSON.parse(localDraft) : null;
        } catch {
          window.localStorage.removeItem(localStorageKey);
        }
        const serverDraft = draftRes.data.data.draft ? normalizeDraftFromServer(draftRes.data.data.draft) : null;

        setPrograms(programsRes.data.data.programs || []);
        setForm(parsedLocalDraft || serverDraft || cloneForm(emptyForm));
        setStep(0);
        setFieldErrors({});
        setRollCheck({ checking: false, available: null, message: '' });
        setSuccessMessage('');
      } catch (error) {
        if (!active) return;
        setGeneralError(error.response?.data?.message || 'Failed to prepare the enrollment flow.');
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
    if (!open) return;
    window.localStorage.setItem(localStorageKey, JSON.stringify(form));
  }, [form, open]);

  const updateForm = (updater) => {
    setForm((current) => {
      const nextValue = typeof updater === 'function' ? updater(current) : updater;
      return nextValue;
    });
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handlePersonalChange = (field, value) => {
    updateForm((current) => ({
      ...current,
      personalDetails: {
        ...current.personalDetails,
        [field]: field === 'rollNumber' ? value.toUpperCase() : value,
      },
    }));
    clearFieldError(field);
    if (field === 'rollNumber') setRollCheck({ checking: false, available: null, message: '' });
  };

  const handleProgramChange = (_, program) => {
    updateForm((current) => ({
      ...current,
      academicInfo: {
        ...current.academicInfo,
        programId: program?.id || '',
        programName: program?.name || '',
        department: program?.department || '',
        feePerSemester: program?.feePerSemester || 0,
        durationYears: program?.durationYears || 0,
      },
    }));
    clearFieldError('programName');
    clearFieldError('department');
  };

  const handleSemesterSelect = (semester) => {
    updateForm((current) => ({
      ...current,
      academicInfo: {
        ...current.academicInfo,
        semester,
        year: toYearLabel(semester),
      },
    }));
    clearFieldError('semester');
  };

  const validateStep = async (targetStep = step) => {
    const errors = {};

    if (targetStep === 0) {
      if (!form.personalDetails.fullLegalName.trim()) errors.fullLegalName = 'Full legal name is required.';
      if (!form.personalDetails.rollNumber.trim()) errors.rollNumber = 'Roll number is required.';
      else if (!/^[A-Z0-9-]{5,20}$/.test(form.personalDetails.rollNumber)) errors.rollNumber = 'Use 5-20 letters, numbers, or dashes.';
      if (!form.personalDetails.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
      if (form.personalDetails.dateOfBirth && Number.isNaN(new Date(form.personalDetails.dateOfBirth).getTime())) {
        errors.dateOfBirth = 'Enter a valid date.';
      }
      if (rollCheck.available === false) errors.rollNumber = rollCheck.message || 'Roll number is already in use.';
    }

    if (targetStep === 1) {
      if (!form.academicInfo.programName) errors.programName = 'Select a program.';
      if (!form.academicInfo.department) errors.department = 'Department is required.';
      if (!form.academicInfo.semester) errors.semester = 'Select a semester.';
    }

    if (targetStep === 2) {
      const hasAnyDocument = form.documents.some((document) => document.file?.content);
      if (!hasAnyDocument) errors.documents = 'Upload at least one enrollment document.';
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
      setRollCheck({
        checking: false,
        available: false,
        message: error.response?.data?.message || 'Unable to validate roll number.',
      });
    }
  };

  const handleAvatarFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFieldErrors((current) => ({ ...current, profilePhoto: 'Profile photo must be JPG or PNG.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, profilePhoto: 'Profile photo must be 2 MB or less.' }));
      return;
    }

    const content = await readAsDataUrl(file);
    const { width, height } = await readImageDimensions(content);
    if (width < 256 || height < 256) {
      setFieldErrors((current) => ({ ...current, profilePhoto: 'Minimum resolution is 256 x 256.' }));
      return;
    }

    updateForm((current) => ({
      ...current,
      profilePhoto: {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        content,
      },
    }));
    clearFieldError('profilePhoto');
  };

  const handleDocumentFile = async (type, file) => {
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setFieldErrors((current) => ({ ...current, documents: `${type} must be PDF, JPG, or PNG.` }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, documents: `${type} must be 5 MB or less.` }));
      return;
    }

    const content = await readAsDataUrl(file);
    updateForm((current) => ({
      ...current,
      documents: current.documents.map((document) => (
        document.type === type
          ? {
            ...document,
            file: {
              name: file.name,
              mimeType: file.type,
              size: file.size,
              content,
            },
          }
          : document
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

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (!valid) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    const validations = await Promise.all(steps.map((_, index) => validateStep(index)));
    if (validations.some((result) => !result)) {
      setStep(validations.findIndex((result) => !result));
      return;
    }

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
      const responseErrors = error.response?.data?.errors || {};
      setFieldErrors((current) => ({ ...current, ...responseErrors }));
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="relative mx-auto h-32 w-32">
          <Avatar
            src={form.profilePhoto?.content || ''}
            sx={{ width: 128, height: 128, bgcolor: '#e2e8f0', fontSize: 42, fontWeight: 800 }}
          >
            {form.personalDetails.fullLegalName?.charAt(0) || 'S'}
          </Avatar>
          <button
            type="button"
            className="absolute inset-0 rounded-full bg-slate-950/50 opacity-0 transition hover:opacity-100"
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className="flex h-full flex-col items-center justify-center text-white">
              <CameraAlt sx={{ fontSize: 28 }} />
              <span className="mt-2 text-xs font-semibold">Upload Photo</span>
            </div>
          </button>
          <IconButton
            size="small"
            onClick={() => avatarInputRef.current?.click()}
            sx={{
              position: 'absolute',
              right: 4,
              bottom: 4,
              bgcolor: '#0f172a',
              color: '#fff',
              width: 34,
              height: 34,
              '&:hover': { bgcolor: '#020617' },
            }}
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={(event) => handleAvatarFile(event.target.files?.[0]).catch((error) => setGeneralError(error.message))}
        />
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
          JPG/PNG only, max 2 MB, and at least 256 x 256 for ID-card quality.
        </div>
        {fieldErrors.profilePhoto ? <p className="text-xs font-semibold text-rose-600">{fieldErrors.profilePhoto}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          variant="standard"
          label="Full Legal Name"
          value={form.personalDetails.fullLegalName}
          onChange={(event) => handlePersonalChange('fullLegalName', event.target.value)}
          error={Boolean(fieldErrors.fullLegalName)}
          helperText={fieldErrors.fullLegalName}
          fullWidth
          autoFocus
        />
        <TextField
          variant="standard"
          label="Roll Number"
          value={form.personalDetails.rollNumber}
          onChange={(event) => handlePersonalChange('rollNumber', event.target.value)}
          onBlur={handleRollValidation}
          error={Boolean(fieldErrors.rollNumber)}
          helperText={fieldErrors.rollNumber || rollCheck.message}
          fullWidth
        />
        <TextField
          variant="standard"
          label="Date of Birth"
          type="date"
          value={form.personalDetails.dateOfBirth}
          onChange={(event) => handlePersonalChange('dateOfBirth', event.target.value)}
          error={Boolean(fieldErrors.dateOfBirth)}
          helperText={fieldErrors.dateOfBirth}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          variant="standard"
          label="Email"
          value={form.personalDetails.email}
          onChange={(event) => handlePersonalChange('email', event.target.value)}
          helperText="Optional. Autofill can prefill this."
          fullWidth
        />
        <TextField
          variant="standard"
          label="Phone"
          value={form.personalDetails.phone}
          onChange={(event) => handlePersonalChange('phone', event.target.value)}
          helperText={rollCheck.checking ? 'Checking roll number availability...' : ' '}
          fullWidth
        />
      </div>
    </div>
  );

  const renderAcademicStep = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <Autocomplete
          options={programs}
          loading={loadingPrograms}
          value={selectedProgram}
          onChange={handleProgramChange}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="Course Selection"
              error={Boolean(fieldErrors.programName)}
              helperText={fieldErrors.programName || 'Search and select a program.'}
            />
          )}
        />

        <div>
          <p className="text-sm font-semibold text-slate-700">Semester Selection</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {Array.from({ length: (selectedProgram?.durationYears || 4) * 2 }, (_, index) => index + 1).map((semester) => {
              const active = form.academicInfo.semester === semester;
              return (
                <button
                  key={semester}
                  type="button"
                  onClick={() => handleSemesterSelect(semester)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  SEM {semester}
                </button>
              );
            })}
          </div>
          {fieldErrors.semester ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.semester}</p> : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="font-finance-display text-xl font-extrabold text-slate-950">Program Metadata</p>
        <div className="mt-5 space-y-4 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Department</p>
            <p className="mt-1 font-semibold text-slate-900">{form.academicInfo.department || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mapped Year</p>
            <p className="mt-1 font-semibold text-slate-900">{form.academicInfo.year || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Fee / Semester</p>
            <p className="mt-1 font-semibold text-slate-900">{form.academicInfo.feePerSemester ? `INR ${form.academicInfo.feePerSemester.toLocaleString('en-IN')}` : '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Duration</p>
            <p className="mt-1 font-semibold text-slate-900">{form.academicInfo.durationYears ? `${form.academicInfo.durationYears} years` : '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentCard = (document) => {
    const isImage = document.file?.mimeType?.startsWith('image/');
    return (
      <div
        key={document.type}
        className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-slate-400 hover:bg-white"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleDocumentFile(document.type, event.dataTransfer.files?.[0]).catch((error) => setGeneralError(error.message));
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <Description sx={{ color: '#2563eb' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{document.type}</p>
              <p className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG. Max 5 MB.</p>
            </div>
          </div>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileUpload />}
            onClick={() => documentInputRefs.current[document.type]?.click()}
            sx={{ borderRadius: '16px' }}
          >
            {document.file ? 'Replace' : 'Upload'}
          </Button>
        </div>

        <input
          ref={(node) => { documentInputRefs.current[document.type] = node; }}
          type="file"
          hidden
          accept="application/pdf,image/jpeg,image/png"
          onChange={(event) => handleDocumentFile(document.type, event.target.files?.[0]).catch((error) => setGeneralError(error.message))}
        />

        {document.file ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{document.file.name}</p>
                <p className="mt-1 text-xs text-slate-400">{(document.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-rose-600"
                onClick={() => updateForm((current) => ({
                  ...current,
                  documents: current.documents.map((entry) => (entry.type === document.type ? { ...entry, file: null } : entry)),
                }))}
              >
                Remove
              </button>
            </div>
            {isImage ? <img src={document.file.content} alt={document.type} className="mt-3 h-28 w-full rounded-2xl object-cover" loading="lazy" /> : null}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-5 text-center text-xs text-slate-400">
            Drag and drop a file here or choose one manually.
          </div>
        )}
      </div>
    );
  };

  const currentProgress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => { if (reason !== 'backdropClick') onClose(); }}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: '32px',
          overflow: 'hidden',
          backgroundImage: 'none',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.2)',
        },
      }}
      BackdropProps={{ sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.45)' } }}
    >
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Academic Luminary</p>
            <h2 className="font-finance-display mt-2 text-3xl font-extrabold text-slate-950">Add New Student</h2>
            <p className="mt-2 text-sm text-slate-500">A guided enrollment flow for personal details, academic mapping, and supporting documents.</p>
          </div>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </div>
        <LinearProgress variant="determinate" value={currentProgress} sx={{ mt: 3, height: 8, borderRadius: 999 }} />
      </div>

      <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
        {bootstrapping ? (
          <div className="flex h-[560px] items-center justify-center">
            <CircularProgress />
          </div>
        ) : (
          <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-[#f5f7fb] p-5 lg:border-b-0 lg:border-r">
              <div className="space-y-3">
                {steps.map((item, index) => {
                  const active = index === step;
                  const completed = index < step;
                  const locked = index > step;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { if (!locked) setStep(index); }}
                      className={`flex w-full items-start gap-3 rounded-[22px] border px-4 py-3 text-left transition ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'} ${locked ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-white/20 text-white' : completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {completed ? <CheckCircle sx={{ fontSize: 18 }} /> : locked ? <Lock sx={{ fontSize: 16 }} /> : index + 1}
                      </span>
                      <span className="pt-1 text-sm font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Pro Tip</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{steps[step].tip}</p>
              </div>
            </aside>

            <div className="flex min-h-0 flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {generalError ? <Alert severity="error" sx={{ mb: 3 }}>{generalError}</Alert> : null}
                {successMessage ? <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert> : null}

                {step === 0 ? renderPersonalStep() : null}
                {step === 1 ? renderAcademicStep() : null}
                {step === 2 ? (
                  <div>
                    {fieldErrors.documents ? <Alert severity="warning" sx={{ mb: 3 }}>{fieldErrors.documents}</Alert> : null}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {form.documents.map(renderDocumentCard)}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex gap-2">
                  <Button variant="text" color="inherit" onClick={handleCancel}>Cancel</Button>
                  <Button variant="outlined" onClick={handleSaveDraft} disabled={savingDraft || submitting}>
                    {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                  </Button>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <Button variant="outlined" startIcon={<ArrowBack />} disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
                    Previous
                  </Button>
                  {step < steps.length - 1 ? (
                    <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
                      Next Section
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Enrolling...' : 'Create Student Record'}
                    </Button>
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
