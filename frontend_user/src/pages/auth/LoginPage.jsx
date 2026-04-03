import { Alert, Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import RoleCard from "../../components/auth/RoleCard";
import LogoMark from "../../components/common/LogoMark";
import { roleOptions } from "../../data/erpData";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant: tenantParam } = useParams();
  const { login, isAuthenticated, session, authLoading } = useAuth();
  const tenantName = tenantParam || "cgu";

  const [form, setForm] = useState({
    username: "",
    password: "",
    tenant: tenantName,
    role: "",
  });
  const [error, setError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0, active: false });
  const selectedRole = roleOptions.find((role) => role.value === form.role);
  const roleQuotes = {
    student: "Learning opens every next door.",
    teacher: "Guide with clarity, lead with purpose.",
    academic: "Structure creates the path to excellence.",
    communication: "The right message can move an entire campus.",
  };
  const viewportMidpoint =
    typeof window !== "undefined" ? window.innerWidth / 2 : Number.POSITIVE_INFINITY;
  const isCursorOnDarkPanel = cursorGlow.x <= viewportMidpoint;

  if (isAuthenticated) {
    const target =
      location.state?.from?.pathname ||
      `/${session?.tenantSlug || tenantName}/${session?.role || "student"}/dashboard`;
    return <Navigate to={target} replace />;
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function handleRoleSelect(value) {
    setForm((current) => ({ ...current, role: value }));
    setError("");
  }

  useEffect(() => {
    function handlePointerMove(event) {
      setCursorGlow({
        x: event.clientX,
        y: event.clientY,
        active: true,
      });
    }

    function handlePointerLeave() {
      setCursorGlow((current) => ({ ...current, active: false }));
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await login(form);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setIsExiting(true);
    const target = location.state?.from?.pathname || `/${form.tenant}/${form.role}/dashboard`;
    window.setTimeout(() => {
      navigate(target, { replace: true });
    }, 220);
  }

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.2),_transparent_30%),linear-gradient(160deg,_#ecfeff_0%,_#f8fafc_45%,_#ecfdf5_100%)] transition-all duration-500 ease-out ${
        isExiting ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div
        className={`pointer-events-none fixed left-0 top-0 z-20 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-[opacity,transform,background] duration-200 ${
          cursorGlow.active ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: `${cursorGlow.x}px`,
          top: `${cursorGlow.y}px`,
          background: isCursorOnDarkPanel
            ? "radial-gradient(circle, rgba(255,255,255,0.82), rgba(255,255,255,0.34) 38%, rgba(255,255,255,0.12) 60%, transparent 78%)"
            : "radial-gradient(circle, rgba(147,197,253,0.85), rgba(96,165,250,0.36) 38%, rgba(59,130,246,0.16) 60%, transparent 78%)",
          mixBlendMode: isCursorOnDarkPanel ? "screen" : "multiply",
        }}
      />
      <div className="grid min-h-screen w-full items-stretch gap-0 lg:grid-cols-2">
        <section className="relative z-10 flex overflow-hidden bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.22),_transparent_35%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <LogoMark />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-teal-200/80 sm:text-sm">
              User Portal
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl xl:text-[2.8rem]">
              One frontend experience for every university user role.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This setup gives you a professional ERP user portal with a clean login, tenant-aware
              access, role-based dashboards, quick actions, notices, operational views, and room to
              connect your backend later.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Role-specific dashboard content",
                "Single login flow for all user types",
                "Search, navigation, widgets, and tables",
                "Ready to connect with backend auth later",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-slate-100 backdrop-blur-sm"
                >
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-sm uppercase tracking-[0.2em] text-teal-100/70">Users</p>
                <p className="mt-1.5 text-2xl font-extrabold">4</p>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                  Student, teacher, academic, communication
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-sm uppercase tracking-[0.2em] text-teal-100/70">Tenant-Aware</p>
                <p className="mt-1.5 text-2xl font-extrabold">1+</p>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                  Fixed to cgu for now, super admin can expand this later
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-sm uppercase tracking-[0.2em] text-teal-100/70">Frontend Ready</p>
                <p className="mt-1.5 text-2xl font-extrabold">Now</p>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                  Use this structure before backend integration
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 flex min-h-screen flex-col bg-white/82 p-5 shadow-2xl shadow-teal-950/10 backdrop-blur sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700/70">
                Login
              </p>
              <h2 className="mt-1.5 text-2xl font-extrabold text-slate-950 sm:text-3xl">Choose your portal</h2>
            </div>
            <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 sm:block">
              Demo mode
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            "Choose your role, step into your workspace, and keep the journey simple."
          </p>

          {error ? (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          ) : null}

          <div className="mt-5 flex-1 overflow-y-auto">
            {!form.role ? (
              <div className="animate-panel-float flex h-full flex-col space-y-3">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
                  Select user type
                </p>
                <div className="grid flex-1 content-start gap-3 md:grid-cols-2">
                  {roleOptions.map((role, index) => (
                    <RoleCard
                      key={role.value}
                      role={role}
                      active={form.role === role.value}
                      onSelect={handleRoleSelect}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-panel-float h-full rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 shadow-inner shadow-white sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700/75">
                      Login Details
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold text-slate-950">
                      {selectedRole?.label} sign in
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      {`"${roleQuotes[form.role] || "A calm, focused login experience designed for you."}"`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("")}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
                  >
                    Change role
                  </button>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      label="Username"
                      value={form.username}
                      onChange={(event) => updateField("username", event.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              edge="end"
                              onClick={() => setShowPassword((current) => !current)}
                            >
                              {showPassword ? (
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 3L21 21"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                  />
                                  <path
                                    d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M9.88 5.09C10.56 4.89 11.27 4.79 12 4.79C16.5 4.79 20.31 8.14 21.5 12C21.13 13.19 20.5 14.29 19.66 15.21"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M6.1 6.1C4.19 7.38 2.79 9.47 2.5 12C3.69 15.86 7.5 19.21 12 19.21C13.94 19.21 15.76 18.59 17.24 17.52"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M2.5 12C3.69 8.14 7.5 4.79 12 4.79C16.5 4.79 20.31 8.14 21.5 12C20.31 15.86 16.5 19.21 12 19.21C7.5 19.21 3.69 15.86 2.5 12Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </div>

                  <TextField
                    label="University / Tenant"
                    value={form.tenant}
                    onChange={(event) => updateField("tenant", event.target.value.toLowerCase())}
                    fullWidth
                    helperText="Use cgu for now. Tenant slug will later be controlled by super admin."
                  />

                  <Button type="submit" variant="contained" size="large" fullWidth>
                    {authLoading ? "Signing In..." : "Login to Dashboard"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
