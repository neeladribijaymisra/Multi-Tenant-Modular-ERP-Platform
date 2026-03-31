import { Alert, Button, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
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
    role: "student",
  });
  const [error, setError] = useState("");

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

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await login(form);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const target = location.state?.from?.pathname || `/${form.tenant}/${form.role}/dashboard`;
    navigate(target, { replace: true });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.2),_transparent_30%),linear-gradient(160deg,_#ecfeff_0%,_#f8fafc_45%,_#ecfdf5_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.1fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.22),_transparent_35%)]" />
          <div className="relative">
            <LogoMark />
            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.3em] text-teal-200/80">
              User Portal
            </p>
            <h1 className="mt-4 max-w-2xl text-5xl font-extrabold leading-tight">
              One frontend experience for every university user role.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              This setup gives you a professional ERP user portal with a clean login, tenant-aware
              access, role-based dashboards, quick actions, notices, operational views, and room to
              connect your backend later.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Role-specific dashboard content",
                "Single login flow for all user types",
                "Search, navigation, widgets, and tables",
                "Ready to connect with backend auth later",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur-sm"
                >
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-teal-100/70">Users</p>
                <p className="mt-2 text-3xl font-extrabold">4</p>
                <p className="mt-1 text-sm text-slate-300">
                  Student, teacher, academic, communication
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-teal-100/70">Tenant-Aware</p>
                <p className="mt-2 text-3xl font-extrabold">1+</p>
                <p className="mt-1 text-sm text-slate-300">
                  Fixed to cgu for now, super admin can expand this later
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-teal-100/70">Frontend Ready</p>
                <p className="mt-2 text-3xl font-extrabold">Now</p>
                <p className="mt-1 text-sm text-slate-300">
                  Use this structure before backend integration
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-teal-950/10 backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700/70">
                Login
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Access your ERP workspace</h2>
            </div>
            <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 sm:block">
              Demo mode
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use tenant <strong>cgu</strong> for now. Academic Office is fixed to username
            <strong> academic </strong>and password<strong> password</strong>. Seeded users also
            include teacher <strong>teacher1</strong>, student <strong>student1</strong>, and
            communication <strong>commdesk</strong>, all with password <strong>password</strong>.
          </p>

          {error ? (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Username"
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                fullWidth
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="University / Tenant"
                value={form.tenant}
                onChange={(event) => updateField("tenant", event.target.value.toLowerCase())}
                fullWidth
                helperText="Use cgu for now. Tenant slug will later be controlled by super admin."
              />
              <TextField
                select
                label="Primary Module"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                fullWidth
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
                Choose user type
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {roleOptions.map((role) => (
                  <RoleCard
                    key={role.value}
                    role={role}
                    active={form.role === role.value}
                    onSelect={(value) => updateField("role", value)}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" variant="contained" size="large" fullWidth>
              {authLoading ? "Signing In..." : "Login to Dashboard"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
