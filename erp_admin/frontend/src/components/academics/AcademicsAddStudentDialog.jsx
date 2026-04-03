import { useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress, Dialog } from '@mui/material';
import api from '../../utils/api';

const dialogSteps = ['Personal Details', 'Academic Info', 'Documents'];
const documentCards = [
  { label: 'Previous Transcript', icon: 'upload_file' },
  { label: 'ID Proof', icon: 'badge' },
  { label: 'Medical Certificate', icon: 'medical_services' },
];

const emptyForm = {
  fullName: '',
  rollNumber: '',
  dateOfBirth: '',
  courseSelection: '',
  currentSemester: 1,
};

const draftStorageKey = 'academics_add_student_dialog_draft';

const colors = {
  primary: '#001e40',
  primaryContainer: '#003366',
  primaryFixed: '#d5e3ff',
  onPrimaryFixed: '#001b3c',
  onPrimaryFixedVariant: '#1f477b',
  secondaryContainer: '#d5e3fc',
  onSecondaryContainer: '#57657a',
  surface: '#f7f9fb',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerLowest: '#ffffff',
  outlineVariant: '#c3c6d1',
  outline: '#737780',
  onSurface: '#191c1e',
  onSurfaceVariant: '#43474f',
};

const placeholderPhoto =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBhRLY8iLkZVrZF_rS4v_Ybf13elfrklCnfElm2co9q8384PQWQcCj5xXaUFz61ySKVAKdgNg7S2Sb-Kbb22SOndhIOfO0Ml1tC7V7Mc6bqEMGy-XL9E44Ak0EzuuTIg3c5mLPWD-pUKT3-rIj5XBuJpkMp8xeCH1P5BjfpFDWWIL680q4rPUVSzPnNxZcXXIen5E1xC27zt3MiuVaWnMDBA_fTJYiFpAw_X6vrPtPYJIlP4strwzoqdW7ayy7NQ5RnsYp-jWA-8aIW';

const inputClassName =
  'w-full border-b border-[color:rgba(195,198,209,0.3)] bg-transparent py-2 focus:border-[var(--primary)] focus:ring-0 transition-colors text-[var(--on-surface)] placeholder:text-[var(--outline-variant)] font-medium';
const selectClassName = `${inputClassName} appearance-none`;

function StepRow({ index, label, active }) {
  return (
    <div className={`flex items-center gap-4 ${active ? 'text-[var(--primary)]' : 'text-[var(--outline)]'} group`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          active ? 'bg-[var(--primary)] text-white' : 'border-2 border-[var(--outline-variant)] text-[var(--outline)]'
        }`}
      >
        {index + 1}
      </div>
      <span className="text-xs uppercase tracking-widest font-bold">{label}</span>
    </div>
  );
}

function DocumentCard({ label, icon }) {
  return (
    <div className="border-2 border-dashed border-[color:rgba(195,198,209,0.3)] rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-[var(--surface-container-low)] transition-colors group cursor-pointer">
      <span className="material-symbols-outlined text-[var(--outline)] group-hover:text-[var(--primary)]">{icon}</span>
      <span className="text-[10px] font-bold text-center">{label}</span>
    </div>
  );
}

export default function AcademicsAddStudentDialog({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!open) return;

    const savedDraft = window.localStorage.getItem(draftStorageKey);
    let parsedDraft = null;

    try {
      parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }

    setForm(parsedDraft ? { ...emptyForm, ...parsedDraft } : emptyForm);
    setError('');
    setSuccess('');

    let active = true;
    const loadPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const { data } = await api.get('/academics/enrollment/programs');
        if (active) setPrograms(data.data.programs || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load course options.');
      } finally {
        if (active) setLoadingPrograms(false);
      }
    };

    loadPrograms();

    return () => {
      active = false;
    };
  }, [open]);

  const semesterOptions = useMemo(() => [1, 2, 3], []);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveDraft = () => {
    setSavingDraft(true);
    window.localStorage.setItem(draftStorageKey, JSON.stringify(form));
    setSuccess('Draft saved.');
    setTimeout(() => setSavingDraft(false), 150);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/academics/registries/students', form);
      window.localStorage.removeItem(draftStorageKey);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') onClose();
      }}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '56rem',
          borderRadius: '0.75rem',
          boxShadow: '0 0 32px rgba(25,28,30,0.06)',
          overflow: 'hidden',
          backgroundImage: 'none',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(25, 28, 30, 0.4)',
          backdropFilter: 'blur(6px)',
        },
      }}
    >
      <div
        style={{
          '--primary': colors.primary,
          '--primary-container': colors.primaryContainer,
          '--primary-fixed': colors.primaryFixed,
          '--on-primary-fixed': colors.onPrimaryFixed,
          '--on-primary-fixed-variant': colors.onPrimaryFixedVariant,
          '--secondary-container': colors.secondaryContainer,
          '--on-secondary-container': colors.onSecondaryContainer,
          '--surface': colors.surface,
          '--surface-container-low': colors.surfaceContainerLow,
          '--surface-container': colors.surfaceContainer,
          '--surface-container-high': colors.surfaceContainerHigh,
          '--surface-container-lowest': colors.surfaceContainerLowest,
          '--outline-variant': colors.outlineVariant,
          '--outline': colors.outline,
          '--on-surface': colors.onSurface,
          '--on-surface-variant': colors.onSurfaceVariant,
        }}
        className="bg-[var(--surface-container-lowest)] w-full max-w-4xl rounded-xl shadow-[0_0_32px_rgba(25,28,30,0.06)] overflow-hidden flex flex-col md:flex-row h-[921px] md:h-auto relative"
      >
        <div className="w-full md:w-64 bg-[var(--surface-container-low)] p-8 border-r border-[color:rgba(195,198,209,0.15)] flex flex-col gap-8">
          <div>
            <h3 className="font-headline text-xl font-bold text-[var(--primary)] mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
              New Enrollment
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
              Fill in the required academic and personal records to register a new student.
            </p>
          </div>

          <div className="space-y-6">
            {dialogSteps.map((step, index) => (
              <StepRow key={step} index={index} label={step} active={index === 0} />
            ))}
          </div>

          <div className="mt-auto hidden md:block pt-8">
            <div className="p-4 bg-[var(--primary-fixed)] rounded-lg">
              <p className="text-[10px] font-bold text-[var(--on-primary-fixed-variant)] uppercase tracking-wider mb-2">
                Pro Tip
              </p>
              <p className="text-[11px] text-[var(--on-primary-fixed)] leading-normal">
                Ensure the profile image is high resolution for institutional ID cards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-8 md:p-12 overflow-y-auto">
            {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}
            {success ? <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert> : null}

            <section className="space-y-10">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-[var(--surface-container-high)] ring-4 ring-[var(--surface-container)] flex items-center justify-center">
                      <img
                        alt="Student Preview"
                        className="w-full h-full object-cover opacity-80"
                        src={placeholderPhoto}
                      />
                      <div className="absolute inset-0 bg-[color:rgba(0,30,64,0.4)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white">photo_camera</span>
                      </div>
                    </div>
                    <button type="button" className="absolute -bottom-1 -right-1 bg-[var(--primary)] text-white p-2 rounded-full shadow-lg">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--outline)]">Upload Photo</span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
                      Full Legal Name
                    </label>
                    <input
                      className={inputClassName}
                      placeholder="e.g. Alexander Hamilton"
                      type="text"
                      value={form.fullName}
                      onChange={(event) => handleChange('fullName', event.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
                      Roll Number
                    </label>
                    <input
                      className={inputClassName}
                      placeholder="2024-ARCH-012"
                      type="text"
                      value={form.rollNumber}
                      onChange={(event) => handleChange('rollNumber', event.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
                      Date of Birth
                    </label>
                    <input
                      className={inputClassName}
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
                    Course Selection
                  </label>
                  <div className="relative">
                    <select
                      className={selectClassName}
                      value={form.courseSelection}
                      onChange={(event) => handleChange('courseSelection', event.target.value)}
                      disabled={loadingPrograms}
                    >
                      <option value="">Select Program...</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-2 text-[var(--outline-variant)] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
                    Current Semester
                  </label>
                  <div className="flex gap-2 pt-2">
                    {semesterOptions.map((semester) => {
                      const active = Number(form.currentSemester) === semester;
                      return (
                        <button
                          key={semester}
                          type="button"
                          onClick={() => handleChange('currentSemester', semester)}
                          className={`flex-1 py-2 text-xs font-bold border border-[color:rgba(195,198,209,0.3)] rounded transition-colors ${
                            active ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--surface-container-high)]'
                          }`}
                          style={{ color: active ? '#ffffff' : colors.onSurface }}
                        >
                          {`SEM ${['I', 'II', 'III'][semester - 1]}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-variant)]">
                  Required Documents
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {documentCards.map((document) => (
                    <DocumentCard key={document.label} label={document.label} icon={document.icon} />
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="p-8 bg-[var(--surface-container-low)] flex justify-between items-center border-t border-[color:rgba(195,198,209,0.15)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors"
            >
              Cancel
            </button>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-8 py-3 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingDraft ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !form.fullName || !form.rollNumber || !form.dateOfBirth || !form.courseSelection}
                className="px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-[color:rgba(0,30,64,0.2)] hover:scale-[0.98] duration-200 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Creating...' : 'Next Section'}
                {saving ? <CircularProgress size={14} color="inherit" /> : <span className="material-symbols-outlined text-sm">arrow_forward</span>}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white md:text-[var(--on-surface-variant)] hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>
    </Dialog>
  );
}
