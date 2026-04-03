import { forwardRef, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Slide,
  TextField,
  Typography,
} from '@mui/material';
import {
  BadgeOutlined,
  CalendarMonth,
  CameraAlt,
  Close,
  EmailOutlined,
  PersonOutline,
  PhoneOutlined,
  SchoolOutlined,
  Timeline,
} from '@mui/icons-material';
import { DEPARTMENTS, FEE_STATUS, STUDENT_STATUS, YEARS } from '../../utils/constants';
import { getInitials, stringToColor } from '../../utils/helpers';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const initialForm = {
  name: '',
  email: '',
  phone: '',
  rollNo: '',
  dateOfBirth: '',
  admissionDate: '',
  department: '',
  year: '',
  status: STUDENT_STATUS.ACTIVE,
  feeStatus: FEE_STATUS.PENDING,
  cgpa: '',
  avatar: '',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    backgroundColor: '#fcfdff',
    transition: 'all 0.22s ease',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
    '& fieldset': {
      borderColor: 'rgba(203, 213, 225, 0.95)',
    },
    '&:hover': {
      backgroundColor: '#ffffff',
      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
    },
    '&:hover fieldset': {
      borderColor: '#94a3b8',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2563eb',
      borderWidth: 1,
    },
  },
  '& .MuiInputBase-input': {
    py: 1.65,
  },
  '& .MuiSelect-select': {
    py: '13px !important',
  },
};

export default function AddStudentDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  error = '',
}) {
  const [form, setForm] = useState(initialForm);
  const fileInputRef = useRef(null);

  const canSubmit = useMemo(
    () => form.name && form.email && form.rollNo && form.department && form.year,
    [form.department, form.email, form.name, form.rollNo, form.year]
  );

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleClose = () => {
    if (loading) return;
    setForm(initialForm);
    onClose?.();
  };

  const handlePhotoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setField('avatar', reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    const didSave = await onSubmit?.({
      ...form,
      rollNo: form.rollNo.toUpperCase(),
      cgpa: form.cgpa === '' ? '' : Number(form.cgpa),
      avatar: form.avatar || '',
      dateOfBirth: form.dateOfBirth || undefined,
      admissionDate: form.admissionDate || undefined,
    });

    if (didSave !== false) {
      setForm(initialForm);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') handleClose();
      }}
      TransitionComponent={Transition}
      fullWidth
      maxWidth={false}
      BackdropProps={{
        timeout: 240,
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.34)',
          backdropFilter: 'blur(10px)',
        },
      }}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '62rem',
          borderRadius: '22px',
          overflow: 'hidden',
          backgroundImage: 'none',
          backgroundColor: '#f8fafc',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          boxShadow: '0 34px 90px rgba(15, 23, 42, 0.18)',
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 4.5 } }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              border: '1px solid rgba(226,232,240,0.95)',
              bgcolor: 'rgba(255,255,255,0.92)',
              color: '#64748b',
              '&:hover': { bgcolor: '#fff', color: '#334155' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>

          <Box
            sx={{
              pt: { xs: 4, sm: 2 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Fade in={open} timeout={320}>
              <Box sx={{ position: 'relative' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => handlePhotoChange(event.target.files?.[0])}
                />
                <Avatar
                  src={form.avatar || ''}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    width: 90,
                    height: 90,
                    cursor: 'pointer',
                    bgcolor: form.avatar ? 'transparent' : stringToColor(form.name || 'Student'),
                    color: '#fff',
                    fontSize: '1.55rem',
                    fontWeight: 800,
                    border: '4px solid rgba(255,255,255,0.96)',
                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16)',
                  }}
                >
                  {form.avatar ? null : getInitials(form.name || 'Student')}
                </Avatar>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: 34,
                    height: 34,
                    bgcolor: '#0f172a',
                    color: '#fff',
                    boxShadow: '0 10px 20px rgba(15,23,42,0.22)',
                    '&:hover': {
                      bgcolor: '#1e293b',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <CameraAlt sx={{ fontSize: 17 }} />
                </IconButton>
              </Box>
            </Fade>

            <Typography sx={{ mt: 2, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Upload Photo
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: '0.8rem', color: '#64748b' }}>
              Click to upload student image
            </Typography>

            <Box sx={{ mt: 3.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.7rem', sm: '1.95rem' },
                  color: '#020617',
                  letterSpacing: '-0.03em',
                }}
              >
                Add Student
              </Typography>
              <Typography
                sx={{
                  mt: 1.25,
                  maxWidth: 640,
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: '#64748b',
                }}
              >
                Create a polished student record with personal, academic, and status details.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 4,
              borderRadius: '24px',
              border: '1px solid rgba(226,232,240,0.92)',
              backgroundColor: 'rgba(255,255,255,0.92)',
              boxShadow: '0 18px 45px rgba(15,23,42,0.06)',
              p: { xs: 2.5, sm: 3.5 },
            }}
          >
            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : null}

            <Grid container spacing={2.25}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  size="small"
                  fullWidth
                  required
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Roll No"
                  value={form.rollNo}
                  onChange={(event) => setField('rollNo', event.target.value.toUpperCase())}
                  size="small"
                  fullWidth
                  required
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlined sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  size="small"
                  fullWidth
                  required
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlined sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="DOB"
                  value={form.dateOfBirth}
                  onChange={(event) => setField('dateOfBirth', event.target.value)}
                  size="small"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date Joined"
                  value={form.admissionDate}
                  onChange={(event) => setField('admissionDate', event.target.value)}
                  size="small"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth sx={fieldSx}>
                  <Select
                    value={form.department}
                    displayEmpty
                    onChange={(event) => setField('department', event.target.value)}
                    renderValue={(selected) => selected || 'Department'}
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 1.5 }}>
                        <SchoolOutlined sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>Department</MenuItem>
                    {DEPARTMENTS.map((department) => (
                      <MenuItem key={department} value={department}>{department}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth sx={fieldSx}>
                  <Select
                    value={form.year}
                    displayEmpty
                    onChange={(event) => setField('year', event.target.value)}
                    renderValue={(selected) => selected || 'Year'}
                  >
                    <MenuItem value="" disabled>Year</MenuItem>
                    {YEARS.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth sx={fieldSx}>
                  <Select
                    value={form.status}
                    displayEmpty
                    onChange={(event) => setField('status', event.target.value)}
                    renderValue={(selected) => selected || 'Status'}
                  >
                    {Object.values(STUDENT_STATUS).map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth sx={fieldSx}>
                  <Select
                    value={form.feeStatus}
                    displayEmpty
                    onChange={(event) => setField('feeStatus', event.target.value)}
                    renderValue={(selected) => selected || 'Status'}
                  >
                    {Object.values(FEE_STATUS).map((feeStatus) => (
                      <MenuItem key={feeStatus} value={feeStatus}>{feeStatus}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="CGPA"
                  value={form.cgpa}
                  onChange={(event) => setField('cgpa', event.target.value)}
                  size="small"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Timeline sx={{ color: '#94a3b8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              mt: 3,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                borderRadius: '14px',
                px: 3,
                py: 1.2,
                borderColor: '#cbd5e1',
                color: '#475569',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': {
                  borderColor: '#94a3b8',
                  backgroundColor: '#fff',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              variant="contained"
              sx={{
                borderRadius: '14px',
                px: 3.2,
                py: 1.25,
                textTransform: 'none',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
                boxShadow: '0 14px 28px rgba(29,78,216,0.24)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1e40af 0%, #0f172a 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 18px 34px rgba(29,78,216,0.28)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? 'Creating...' : 'Create Student'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
