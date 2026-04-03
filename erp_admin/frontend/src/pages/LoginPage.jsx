import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  TextField, Button, InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import {
  Visibility, VisibilityOff, School, LockOutlined, PersonOutlined, AdminPanelSettings,
  AccountBalanceWallet, MenuBook, Badge, ArrowBack,
} from '@mui/icons-material';

const branchOptions = [
  {
    id: 'masterAdmin',
    title: 'Master Admin',
    subtitle: 'System-wide control',
    description: 'Manage users, permissions, tenant settings, and platform-wide operations.',
    icon: AdminPanelSettings,
    accent: '#67e8f9',
    glow: 'rgba(103,232,249,0.2)',
    enabled: true,
  },
  {
    id: 'academics',
    title: 'Academics',
    subtitle: 'Academic operations',
    description: 'Handle course planning, timetables, exams, and curriculum workflows.',
    icon: MenuBook,
    accent: '#2dd4bf',
    glow: 'rgba(45,212,191,0.18)',
    enabled: true,
  },
  {
    id: 'accounts',
    title: 'Accounts',
    subtitle: 'Finance desk',
    description: 'Track collections, fee records, dues, receipts, and finance approvals.',
    icon: AccountBalanceWallet,
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,0.18)',
    enabled: false,
  },
  {
    id: 'hr',
    title: 'HR',
    subtitle: 'People administration',
    description: 'Manage staff profiles, onboarding, leave approvals, and department staffing.',
    icon: Badge,
    accent: '#fda4af',
    glow: 'rgba(253,164,175,0.18)',
    enabled: false,
  },
];

const emptyRegisterForm = {
  name: '',
  email: '',
  phone: '',
  username: '',
};

export default function LoginPage() {
  const { login, loginError, setLoginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [registerNotice, setRegisterNotice] = useState('');
  const [portalAccess, setPortalAccess] = useState({
    accounts: false,
    hr: false,
    academics: false,
    masterAdmin: true,
  });

  const branches = useMemo(
    () => branchOptions.map((branch) => ({
      ...branch,
      enabled: branch.id === 'masterAdmin' ? true : Boolean(portalAccess[branch.id]),
    })),
    [portalAccess]
  );

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranch) || null,
    [branches, selectedBranch]
  );
  const ActiveBranchIcon = activeBranch?.icon || null;

  useEffect(() => {
    setLoginError('');
    setRegisterNotice('');
  }, [selectedBranch, authMode, setLoginError]);

  useEffect(() => {
    const loadPortalAccess = async () => {
      try {
        const { data } = await api.get('/auth/portal-settings');
        setPortalAccess(data.data.portalAccess);
      } catch {
        /* keep defaults when settings are unavailable */
      }
    };

    loadPortalAccess();
  }, []);

  const chooseBranch = (branchId) => {
    const branch = branches.find((item) => item.id === branchId);
    if (!branch?.enabled) return;
    setSelectedBranch(branchId);
    setAuthMode(null);
  };

  const resetBranchSelection = () => {
    setSelectedBranch(null);
    setAuthMode(null);
    setLoginError('');
    setRegisterNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const expectedRole = selectedBranch === 'masterAdmin' ? 'superadmin' : null;
    await login(username, password, expectedRole, selectedBranch || 'masterAdmin');
    setLoading(false);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!activeBranch) return;

    setRegisterNotice(
      `${activeBranch.title} registration is currently reviewed by the Master Admin. Please create this account from the admin management panel or enable a public registration API first.`
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #08111f 0%, #10243a 42%, #123950 72%, #0f766e 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.22),_transparent_32%),radial-gradient(circle_at_85%_20%,_rgba(103,232,249,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_30%)]" />
          <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full border border-white/10 bg-white/5 blur-2xl" />
          <div className="absolute top-1/4 -right-20 w-72 h-72 rounded-full border border-cyan-200/10 bg-cyan-200/5 blur-3xl" />
          <div className="absolute bottom-8 left-8 w-56 h-56 rounded-full border border-white/10 bg-white/5 blur-2xl" />
          <div className="absolute inset-y-0 right-20 w-px bg-white/10" />

          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl border border-white/15 bg-white/10 flex items-center justify-center backdrop-blur-md shadow-[0_16px_40px_rgba(8,17,31,0.35)]">
              <School sx={{ fontSize: 22, color: 'white' }} />
            </div>
            <div>
              <p className="font-heading font-700 text-xl tracking-tight text-white">AYRA ERP</p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-100/70">Admin Command Center</p>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <p className="text-cyan-100/80 text-sm font-semibold uppercase tracking-[0.28em] mb-4">Education ERP Platform</p>
              <h1 className="font-heading text-5xl font-800 leading-[1.05] text-white">
                Manage your
                <br />
                institution with
                <br />
                <span className="text-cyan-200">clarity and control.</span>
              </h1>
            </div>

            <p className="text-slate-200/85 text-base leading-relaxed max-w-md">
              A unified administrative workspace for academics, accounts, HR, and campus operations built for modern education institutions.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {branches.map((branch) => {
                const Icon = branch.icon;
                const isActive = selectedBranch === branch.id;
                const isDisabled = !branch.enabled;

                return (
                  <div
                    key={branch.id}
                    className={`rounded-3xl border px-4 py-4 backdrop-blur-md transition-all ${
                      isActive
                        ? 'border-white/25 bg-white/14 shadow-[0_22px_50px_rgba(6,11,22,0.32)]'
                        : isDisabled
                          ? 'border-white/8 bg-white/5 opacity-60'
                          : 'border-white/10 bg-white/6'
                    }`}
                    style={{ boxShadow: isActive ? `0 16px 44px ${branch.glow}` : undefined }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{branch.title}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300/70 mt-1">{branch.subtitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10"
                          style={{ backgroundColor: branch.glow }}
                        >
                          <Icon sx={{ fontSize: 20, color: branch.accent }} />
                        </div>
                        {!branch.enabled ? (
                          <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/75">
                            Inactive
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/80 mt-4 leading-relaxed">{branch.description}</p>
                  </div>
                );
              })}
            </div>

          </div>

          <div className="flex flex-wrap gap-2.5">
            {['Master Admin', 'Academics', 'Accounts', 'HR'].map((tag) => (
              <span
                key={tag}
                className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/10 text-xs font-semibold tracking-wide text-slate-100 backdrop-blur-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Branch Access */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-xl animate-fadeInUp">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <School sx={{ fontSize: 22, color: 'white' }} />
            </div>
            <span className="font-heading font-700 text-xl text-slate-900">AYRA ERP</span>
          </div>

          <div className="bg-white rounded-[28px] p-8 shadow-card border border-slate-100">
            {!activeBranch ? (
              <>
                <div className="mb-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-3">Choose admin panel</p>
                  <h2 className="font-heading text-3xl font-700 text-slate-900">Access your branch workspace</h2>
                  <p className="text-slate-500 text-sm mt-2">Select a panel first. Once you click one, this same area will switch into the branch login flow.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branches.map((branch) => {
                    const Icon = branch.icon;
                    const isDisabled = !branch.enabled;

                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => chooseBranch(branch.id)}
                        disabled={isDisabled}
                        className={`rounded-3xl border p-4 text-left transition-all ${
                          isDisabled
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{branch.title}</p>
                            <p className="text-xs uppercase tracking-[0.16em] mt-1 text-slate-400">{branch.subtitle}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100"
                              style={{ color: branch.accent }}
                            >
                              <Icon sx={{ fontSize: 20, color: branch.accent }} />
                            </div>
                            {!branch.enabled ? (
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Inactive
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Portal availability here follows the live settings configured by the Master Admin in the portal access section.
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={resetBranchSelection}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                  >
                    <ArrowBack sx={{ fontSize: 16 }} />
                    Back to panels
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected panel</p>
                    <h3 className="font-heading text-2xl font-700 text-slate-900 mt-2">{activeBranch.title}</h3>
                    <p className="text-sm text-slate-500 mt-2">{activeBranch.description}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: activeBranch.glow }}
                  >
                    {ActiveBranchIcon ? <ActiveBranchIcon sx={{ fontSize: 24, color: activeBranch.accent }} /> : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <Button
                    variant={authMode === 'signin' ? 'contained' : 'outlined'}
                    onClick={() => setAuthMode('signin')}
                    sx={{ py: 1.3, borderRadius: '16px' }}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant={authMode === 'register' ? 'contained' : 'outlined'}
                    onClick={() => setAuthMode('register')}
                    sx={{ py: 1.3, borderRadius: '16px' }}
                  >
                    Register
                  </Button>
                </div>

                {loginError && authMode === 'signin' && (
                  <Alert severity="error" className="mb-5" onClose={() => setLoginError('')}>
                    {loginError}
                  </Alert>
                )}

                {registerNotice && authMode === 'register' && (
                  <Alert severity="info" className="mb-5" onClose={() => setRegisterNotice('')}>
                    {registerNotice}
                  </Alert>
                )}

                {authMode === 'signin' ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <TextField
                      fullWidth
                      label="Username or email"
                      variant="outlined"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      helperText={`Signing in to ${activeBranch.title}`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" />
                        <span className="text-sm text-slate-600">Remember me</span>
                      </label>
                      <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || !username || !password}
                      sx={{ mt: 1, py: 1.4, fontSize: '0.95rem', fontWeight: 600, borderRadius: '16px' }}
                    >
                      {loading ? <CircularProgress size={20} color="inherit" /> : `Sign in to ${activeBranch.title}`}
                    </Button>
                  </form>
                ) : authMode === 'register' ? (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField
                        fullWidth
                        label="Full name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Preferred username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Phone"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      />
                    </div>

                    <Alert severity="warning">
                      Public registration is not connected to the backend yet. This screen is ready for the branch-based flow, but account creation still needs either a public registration API or an internal approval workflow.
                    </Alert>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={!registerForm.name || !registerForm.username || !registerForm.email}
                      sx={{ py: 1.4, fontSize: '0.95rem', fontWeight: 600, borderRadius: '16px' }}
                    >
                      Request {activeBranch.title} access
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-500">
                    Choose whether you want to sign in or register for the selected panel.
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-center text-xs text-slate-400">
                Default admin login still works after selecting a panel. Contact <span className="font-mono text-slate-600">myayrainfo@gmail.com</span> in backend to create the seeded account.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            © {new Date().getFullYear()} AYRA ERP · University Administration System
          </p>
        </div>
      </div>
    </div>
  );
}
