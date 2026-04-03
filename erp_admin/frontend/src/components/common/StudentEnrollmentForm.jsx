import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogContent } from '@mui/material';
import {
  ArrowForward,
  BadgeOutlined,
  CalendarToday,
  CheckCircle,
  Close,
  CreateOutlined,
  FileUploadOutlined,
  MedicalServicesOutlined,
  PhotoCamera,
} from '@mui/icons-material';
import { DEPARTMENTS } from '../../utils/constants';

const steps = [
  { id: 'personal', title: 'Personal Details', caption: 'Identity and student basics' },
  { id: 'academic', title: 'Academic Info', caption: 'Program placement and semester' },
  { id: 'documents', title: 'Documents', caption: 'Proofs required for enrollment' },
];
const documentTypes = ['Previous Transcript', 'ID Proof', 'Medical Certificate'];
const localStorageKey = 'students_new_enrollment_modal_draft_v2';
const palette = {
  ink: '#0f274f',
  panel: '#f3f6fb',
  line: '#d7dfeb',
  accent: '#dde8ff',
  accentDeep: '#0d2d63',
  surface: '#fbfcfe',
};
const placeholderPhoto = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="36" fill="#eef4ff"/><circle cx="122" cy="90" r="42" fill="#d8a17c"/><path d="M56 214c9-41 38-69 66-69 34 0 60 24 68 69" fill="#7d8ea3"/><path d="M81 81c6-27 32-44 62-35 15 4 25 14 31 29-17 0-35 5-52 14-16-11-33-13-41-8z" fill="#39485f"/></svg>')}`;

const emptyForm = {
  fullName: '',
  preferredName: '',
  rollNumber: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  program: '',
  semester: 1,
  year: '1st Year',
  section: 'A',
  guardianName: '',
  guardianPhone: '',
  city: '',
  state: '',
};

const toYearLabel = (semester) => (semester <= 2 ? '1st Year' : semester <= 4 ? '2nd Year' : semester <= 6 ? '3rd Year' : '4th Year');
const toSemesterLabel = (semester) => `SEM ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][semester - 1] || semester}`;

function StepItem({ index, title, caption, active, completed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/70"
      style={{ backgroundColor: active ? '#ffffff' : 'transparent' }}
    >
      <span
        className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold"
        style={{
          backgroundColor: active ? palette.ink : completed ? '#e8f7f3' : '#fff',
          borderColor: active ? palette.ink : completed ? '#9ad9ca' : '#c8d3e2',
          color: active ? '#fff' : completed ? '#0f766e' : '#617087',
        }}
      >
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
    <div
      className="rounded-[24px] border p-5"
      style={{
        background: accent ? 'linear-gradient(180deg, #eff5ff 0%, #ffffff 100%)' : '#ffffff',
        borderColor: accent ? '#d4e3ff' : palette.line,
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>{eyebrow}</p>
      <h4 className="mt-2 text-base font-extrabold text-slate-900">{title}</h4>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

function TextInput(props) {
  return <input {...props} className={`input rounded-2xl border-slate-200 py-3 ${props.className || ''}`.trim()} />;
}

function DocumentCard({ label, file, onSelect, inputRef }) {
  const Icon = label === 'ID Proof' ? BadgeOutlined : label === 'Medical Certificate' ? MedicalServicesOutlined : FileUploadOutlined;
  const uploaded = Boolean(file);

  return (
    <div
      className="rounded-[22px] border border-dashed p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{ borderColor: uploaded ? '#9fc0ff' : palette.line, backgroundColor: uploaded ? '#f4f8ff' : '#fff' }}
    >
      <input ref={inputRef} type="file" hidden onChange={(event) => onSelect(event.target.files?.[0])} />
      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: uploaded ? '#dbe8ff' : '#f3f6fb' }}>
          <Icon sx={{ fontSize: 24, color: uploaded ? palette.ink : '#738399' }} />
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-800">{label}</span>
        <span className="text-xs text-slate-500">{uploaded ? file.name : 'Click to upload a document'}</span>
      </button>
    </div>
  );
}

export default function StudentEnrollmentForm({
  open,
  onClose,
  onCancel,
  onSubmit,
  loading = false,
  externalError = '',
}) {
  const resolvedClose = onCancel || onClose;
  const photoInputRef = useRef(null);
  const documentInputRefs = useRef({});
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [photoPreview, setPhotoPreview] = useState('');
  const [documents, setDocuments] = useState(() => documentTypes.reduce((acc, type) => ({ ...acc, [type]: null }), {}));
  const [fieldErrors, setFieldErrors] = useState({});
  const [draftMessage, setDraftMessage] = useState('');

  const completionCount = useMemo(() => {
    let count = 0;
    if (form.fullName && form.rollNumber && form.dateOfBirth && form.email) count += 1;
    if (form.program && form.semester && form.section) count += 1;
    if (form.guardianName && form.guardianPhone && documentTypes.every((type) => documents[type])) count += 1;
    return count;
  }, [documents, form]);

  useEffect(() => {
    if (!open) return;

    const savedDraft = window.localStorage.getItem(localStorageKey);
    if (!savedDraft) {
      setStep(0);
      setForm(emptyForm);
      setPhotoPreview('');
      setDocuments(documentTypes.reduce((acc, type) => ({ ...acc, [type]: null }), {}));
      setFieldErrors({});
      setDraftMessage('');
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft);
      setStep(parsed.step || 0);
      setForm({ ...emptyForm, ...(parsed.form || {}) });
      setPhotoPreview(parsed.photoPreview || '');
      setDocuments(documentTypes.reduce((acc, type) => ({ ...acc, [type]: parsed.documents?.[type] || null }), {}));
      setFieldErrors({});
      setDraftMessage('');
    } catch {
      window.localStorage.removeItem(localStorageKey);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.localStorage.setItem(localStorageKey, JSON.stringify({ step, form, photoPreview, documents }));
  }, [documents, form, open, photoPreview, step]);

  useEffect(() => () => {
    if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const updateField = (key, value) => {
    setForm((current) => {
      const nextSemester = key === 'semester' ? Number(value) : current.semester;
      return {
        ...current,
        [key]: key === 'rollNumber' ? value.toUpperCase() : value,
        ...(key === 'semester' ? { year: toYearLabel(Number(value)) } : {}),
        ...(key === 'program' && !current.section ? { section: 'A' } : {}),
        semester: nextSemester,
      };
    });
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setDraftMessage('');
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setDraftMessage('');
  };

  const handleDocumentPick = (type, file) => {
    if (!file) return;
    setDocuments((current) => ({ ...current, [type]: { name: file.name, size: file.size, type: file.type } }));
    setFieldErrors((current) => {
      if (!current.documents) return current;
      const next = { ...current };
      delete next.documents;
      return next;
    });
    setDraftMessage('');
  };

  const validateStep = (targetStep = step) => {
    const errors = {};

    if (targetStep === 0) {
      if (!form.fullName.trim()) errors.fullName = 'Full legal name is required.';
      if (!form.rollNumber.trim()) errors.rollNumber = 'Roll number is required.';
      if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
      if (!form.email.trim()) errors.email = 'Email is required.';
    }

    if (targetStep === 1) {
      if (!form.program) errors.program = 'Select a program.';
      if (!form.semester) errors.semester = 'Select a semester.';
      if (!form.section.trim()) errors.section = 'Section is required.';
    }

    if (targetStep === 2) {
      if (!form.guardianName.trim()) errors.guardianName = 'Guardian name is required.';
      if (!form.guardianPhone.trim()) errors.guardianPhone = 'Guardian phone is required.';
      if (!form.city.trim()) errors.city = 'City is required.';
      if (!form.state.trim()) errors.state = 'State is required.';
      const missing = documentTypes.filter((type) => !documents[type]);
      if (missing.length > 0) errors.documents = `Upload all required documents: ${missing.join(', ')}.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDraft = () => {
    window.localStorage.setItem(localStorageKey, JSON.stringify({ step, form, photoPreview, documents }));
    setDraftMessage('Draft saved. You can continue later.');
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    await onSubmit?.({
      fullName: form.fullName,
      rollNumber: form.rollNumber,
      dob: form.dateOfBirth,
      program: form.program,
      semester: toSemesterLabel(form.semester),
      photo: photoPreview || '',
      documents,
    });
  };

  const handleCancel = () => {
    setFieldErrors({});
    setDraftMessage('');
    resolvedClose?.();
  };

  const renderPersonalStep = () => (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <InfoCard eyebrow="Profile" title="Student photo" accent>
          <div className="flex flex-col items-center gap-3">
            <div className="group relative cursor-pointer">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] bg-slate-200 ring-2 ring-white shadow-sm">
                <img src={photoPreview || placeholderPhoto} alt="Student Preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-[#0f274f]/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <PhotoCamera sx={{ color: '#fff', fontSize: 16 }} />
                </div>
              </div>
              <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-full p-1.5 text-white shadow-lg" style={{ backgroundColor: palette.ink }}>
                <CreateOutlined sx={{ fontSize: 13 }} />
              </button>
            </div>
            <p className="text-center text-[11px] leading-4 text-slate-500">Use a clear portrait for ID cards.</p>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => handlePhotoChange(event.target.files?.[0])} />
          </div>
        </InfoCard>

        <InfoCard eyebrow="Identity" title="Student record">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Full legal name" error={fieldErrors.fullName}>
                <TextInput placeholder="e.g. Alexander Hamilton" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} />
              </Field>
            </div>
            <Field label="Preferred name">
              <TextInput placeholder="Optional display name" value={form.preferredName} onChange={(event) => updateField('preferredName', event.target.value)} />
            </Field>
            <Field label="Date of birth" error={fieldErrors.dateOfBirth}>
              <div className="relative">
                <TextInput type="date" value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} className="pr-10" />
                <CalendarToday className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 !text-[18px] text-slate-400" />
              </div>
            </Field>
            <Field label="Roll number" error={fieldErrors.rollNumber}>
              <TextInput placeholder="2024-CSE-012" value={form.rollNumber} onChange={(event) => updateField('rollNumber', event.target.value)} />
            </Field>
            <Field label="Phone number">
              <TextInput placeholder="+91 98765 43210" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Primary email" error={fieldErrors.email}>
                <TextInput placeholder="student@college.edu" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
              </Field>
            </div>
          </div>
        </InfoCard>
      </div>
    </section>
  );

  const renderAcademicStep = () => (
    <section className="space-y-6">
      <InfoCard eyebrow="Placement" title="Program allocation" accent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Course selection" error={fieldErrors.program}>
              <select value={form.program} onChange={(event) => updateField('program', event.target.value)} className="input w-full appearance-none rounded-2xl border-slate-200 py-3">
                <option value="">Select program...</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Section" error={fieldErrors.section}>
            <TextInput placeholder="A" value={form.section} onChange={(event) => updateField('section', event.target.value.toUpperCase())} />
          </Field>
          <Field label="Current year">
            <TextInput value={form.year} readOnly />
          </Field>
        </div>
      </InfoCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <InfoCard eyebrow="Placement" title="Current semester">
          <p className="text-xs leading-5 text-slate-500">Choose the semester where this student begins in the selected program.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3].map((semester) => {
              const active = form.semester === semester;
              return (
                <button
                  key={semester}
                  type="button"
                  onClick={() => updateField('semester', semester)}
                  className="rounded-2xl border px-4 py-2.5 text-xs font-extrabold tracking-[0.12em] transition-all"
                  style={{
                    backgroundColor: active ? palette.ink : '#fff',
                    borderColor: active ? palette.ink : palette.line,
                    color: active ? '#fff' : '#334155',
                    boxShadow: active ? '0 10px 24px rgba(15,39,79,0.18)' : 'none',
                  }}
                >
                  {toSemesterLabel(semester)}
                </button>
              );
            })}
          </div>
          {fieldErrors.semester ? <p className="mt-3 text-xs font-semibold text-rose-600">{fieldErrors.semester}</p> : null}
        </InfoCard>

        <div className="grid gap-4">
          {[
            ['Program', form.program || 'Pending'],
            ['Semester', toSemesterLabel(form.semester)],
            ['Section', form.section || 'Pending'],
            ['Roll no.', form.rollNumber || 'Pending'],
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
            <div className="md:col-span-2">
              <Field label="Guardian name" error={fieldErrors.guardianName}>
                <TextInput value={form.guardianName} onChange={(event) => updateField('guardianName', event.target.value)} />
              </Field>
            </div>
            <Field label="Guardian phone" error={fieldErrors.guardianPhone}>
              <TextInput value={form.guardianPhone} onChange={(event) => updateField('guardianPhone', event.target.value)} />
            </Field>
            <Field label="City" error={fieldErrors.city}>
              <TextInput value={form.city} onChange={(event) => updateField('city', event.target.value)} />
            </Field>
            <Field label="State" error={fieldErrors.state}>
              <TextInput value={form.state} onChange={(event) => updateField('state', event.target.value)} />
            </Field>
          </div>
        </InfoCard>

        <InfoCard eyebrow="Uploads" title="Required documents" accent>
          {fieldErrors.documents ? <Alert severity="warning" sx={{ mb: 3 }}>{fieldErrors.documents}</Alert> : null}
          <div className="grid grid-cols-1 gap-4">
            {documentTypes.map((type) => (
              <DocumentCard
                key={type}
                label={type}
                file={documents[type]}
                inputRef={{
                  get current() {
                    return documentInputRefs.current[type];
                  },
                  set current(value) {
                    documentInputRefs.current[type] = value;
                  },
                }}
                onSelect={(file) => handleDocumentPick(type, file)}
              />
            ))}
          </div>
        </InfoCard>
      </div>
    </section>
  );

  const renderStepContent = () => {
    if (step === 0) return renderPersonalStep();
    if (step === 1) return renderAcademicStep();
    return renderDocumentsStep();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') handleCancel();
      }}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '76rem',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(15,23,42,0.18)',
          backgroundImage: 'none',
          border: '1px solid rgba(215,223,235,0.8)',
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(19, 27, 44, 0.38)',
        },
      }}
    >
      <DialogContent sx={{ p: 0, bgcolor: palette.surface }}>
        <div className="flex min-h-[720px] flex-col xl:flex-row">
          <aside className="flex w-full flex-col gap-8 border-b p-7 xl:w-[320px] xl:border-b-0 xl:border-r" style={{ background: 'linear-gradient(180deg, #eef4ff 0%, #f7f9fd 100%)', borderColor: palette.line }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>Students panel</p>
                <h3 className="mt-2 text-[1.7rem] font-extrabold leading-tight text-slate-950">New Enrollment</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Create a polished student record with personal details, academic placement, and document uploads.</p>
              </div>
              <button type="button" onClick={handleCancel} className="rounded-full p-2 text-slate-600 transition hover:bg-white">
                <Close />
              </button>
            </div>

            <div className="rounded-[24px] border bg-white/80 p-5" style={{ borderColor: palette.line }}>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Progress</p>
              <p className="mt-3 text-3xl font-extrabold text-slate-900">{completionCount}/3</p>
              <p className="mt-1 text-sm text-slate-500">Sections ready for submission</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${(completionCount / 3) * 100}%`, backgroundColor: palette.ink }} />
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((item, index) => (
                <StepItem
                  key={item.id}
                  index={index}
                  title={item.title}
                  caption={item.caption}
                  active={index === step}
                  completed={index < step}
                  onClick={() => {
                    if (index <= step) setStep(index);
                  }}
                />
              ))}
            </div>

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
                    ['Program', form.program || 'Pending'],
                    ['Semester', toSemesterLabel(form.semester)],
                    ['Section', form.section || 'Pending'],
                    ['Roll no.', form.rollNumber || 'Pending'],
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
              {externalError ? <Alert severity="error" sx={{ mb: 3 }}>{externalError}</Alert> : null}
              {draftMessage ? <Alert severity="success" sx={{ mb: 3 }}>{draftMessage}</Alert> : null}
              {renderStepContent()}
            </div>

            <div className="flex flex-col gap-4 border-t bg-white px-7 py-6 sm:flex-row sm:items-center sm:justify-between md:px-10" style={{ borderColor: palette.line }}>
              <Button onClick={handleCancel} variant="text" color="inherit" sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em' }}>
                Cancel
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  variant="contained"
                  sx={{
                    backgroundColor: palette.accent,
                    color: '#40546f',
                    borderRadius: '0.9rem',
                    px: 3,
                    py: 1.35,
                    boxShadow: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    '&:hover': { backgroundColor: '#d0defa', boxShadow: 'none' },
                  }}
                >
                  Save Draft
                </Button>
                {step > 0 ? (
                  <Button
                    onClick={() => setStep((current) => current - 1)}
                    variant="outlined"
                    sx={{ borderRadius: '0.9rem', px: 3, py: 1.35, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em' }}
                  >
                    Back
                  </Button>
                ) : null}
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  variant="contained"
                  endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ArrowForward />}
                  sx={{
                    background: `linear-gradient(90deg, ${palette.ink} 0%, ${palette.accentDeep} 100%)`,
                    color: '#fff',
                    borderRadius: '0.9rem',
                    px: 3,
                    py: 1.35,
                    boxShadow: '0 16px 28px rgba(15,39,79,0.22)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    '&:hover': { background: 'linear-gradient(90deg, #0d2345 0%, #0b2758 100%)' },
                  }}
                >
                  {step < steps.length - 1 ? 'Next Section' : 'Create Student'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
