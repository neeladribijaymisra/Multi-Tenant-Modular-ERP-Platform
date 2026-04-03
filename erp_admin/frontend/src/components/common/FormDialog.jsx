import { Alert, Button, CircularProgress, Dialog, DialogContent } from '@mui/material';
import { CheckCircle, Close } from '@mui/icons-material';

const palette = {
  ink: '#0f274f',
  line: '#d7dfeb',
  accentDeep: '#0d2d63',
  surface: '#fbfcfe',
};

function ActionButton({ onClick, disabled, loading, label }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="contained"
      endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <CheckCircle />}
      sx={{
        background: `linear-gradient(90deg,${palette.ink} 0%,${palette.accentDeep} 100%)`,
        color: '#fff',
        borderRadius: '0.9rem',
        px: 3,
        py: 1.35,
        boxShadow: '0 16px 28px rgba(15,39,79,0.22)',
        fontSize: '0.75rem',
        fontWeight: 800,
        letterSpacing: '0.12em',
        '&:hover': { background: 'linear-gradient(90deg,#0d2345 0%,#0b2758 100%)' },
        '&.Mui-disabled': { background: '#c8d3e2', color: '#fff', boxShadow: 'none' },
      }}
    >
      {label}
    </Button>
  );
}

export default function FormDialog({
  open,
  onClose,
  title,
  subtitle,
  description,
  error,
  children,
  primaryLabel = 'Save',
  secondaryLabel = 'Cancel',
  onPrimary,
  primaryDisabled = false,
  loading = false,
  sidebarEyebrow,
  sidebarTip,
  sidebarMeta = [],
  layout = 'split',
  maxWidth = '62rem',
}) {
  const eyebrow = sidebarEyebrow || 'Management Panel';
  const tip = sidebarTip || 'Fill in all required fields carefully before saving to keep records accurate and up to date.';
  const isStacked = layout === 'stacked';

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => { if (reason !== 'backdropClick') onClose?.(); }}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth,
          maxHeight: 'min(92vh, 980px)',
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
          backgroundColor: 'rgba(19,27,44,0.38)',
        },
      }}
    >
      <DialogContent sx={{ p: 0, bgcolor: palette.surface, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {isStacked ? (
          <div className="flex min-h-[620px] flex-1 flex-col">
            <div className="border-b bg-white px-6 py-6 sm:px-8 sm:py-7" style={{ borderColor: palette.line }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[1.7rem] font-extrabold leading-tight text-slate-950 sm:text-[1.9rem]">{title}</h2>
                  {subtitle && <p className="mt-1.5 text-base font-semibold text-slate-700">{subtitle}</p>}
                  {(description || subtitle) && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{description || subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  <Close />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {children}
            </div>

            <div
              className="flex flex-col gap-4 border-t bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"
              style={{ borderColor: palette.line }}
            >
              <Button
                onClick={onClose}
                variant="text"
                color="inherit"
                sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em' }}
              >
                {secondaryLabel}
              </Button>

              <ActionButton onClick={onPrimary} disabled={primaryDisabled} loading={loading} label={primaryLabel} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[560px] flex-1 flex-col xl:flex-row">
            <aside
              className="flex w-full flex-col gap-6 border-b p-7 xl:w-[280px] xl:border-b-0 xl:border-r"
              style={{ background: 'linear-gradient(180deg,#eef4ff 0%,#f7f9fd 100%)', borderColor: palette.line }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>
                    {eyebrow}
                  </p>
                  <h3 className="mt-2 text-[1.5rem] font-extrabold leading-tight text-slate-950">{title}</h3>
                  {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-600 transition hover:bg-white"
                >
                  <Close />
                </button>
              </div>

              {sidebarMeta.length > 0 && (
                <div className="grid gap-3">
                  {sidebarMeta.map(([label, value]) => (
                    <div key={label} className="rounded-[18px] border bg-white/80 px-4 py-3" style={{ borderColor: palette.line }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto rounded-[24px] p-5 text-white" style={{ background: 'linear-gradient(135deg,#15366c 0%,#0a2348 100%)' }}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">Pro tip</p>
                <p className="mt-3 text-sm leading-6 text-white/90">{tip}</p>
              </div>
            </aside>

            <div className="flex flex-1 flex-col">
              <div className="border-b px-7 py-5 md:px-10" style={{ borderColor: palette.line, backgroundColor: '#fff' }}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: palette.ink }}>
                  {eyebrow}
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-950">{title}</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-7 md:p-10">
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-6" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                  {children}
                </div>
              </div>

              <div
                className="flex flex-col gap-4 border-t bg-white px-7 py-5 sm:flex-row sm:items-center sm:justify-between md:px-10"
                style={{ borderColor: palette.line }}
              >
                <Button
                  onClick={onClose}
                  variant="text"
                  color="inherit"
                  sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em' }}
                >
                  {secondaryLabel}
                </Button>

                <ActionButton onClick={onPrimary} disabled={primaryDisabled} loading={loading} label={primaryLabel} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
