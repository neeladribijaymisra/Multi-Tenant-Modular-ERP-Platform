import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const highlights = [
  {
    eyebrow: 'Identity Control',
    title: 'Admin provisioning',
    body: 'Create super admins, assign ownership, and keep access policy tightly scoped.',
  },
  {
    eyebrow: 'Tenant Oversight',
    title: 'Multi-campus visibility',
    body: 'Review tenant health, lifecycle status, and critical activity from one command layer.',
  },
  {
    eyebrow: 'Risk Monitoring',
    title: 'Live audit signals',
    body: 'Track failed logins, system alerts, and role changes before they become incidents.',
  },
]

const metrics = [
  { label: 'Tenants', value: '128+' },
  { label: 'Active Admins', value: '540' },
  { label: 'Audit Coverage', value: '24/7' },
]

const defaultCredentials = {
  username: 'superadmin',
  password: 'Admin@1234',
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const result = await login(form.username, form.password)
    setLoading(false)
    if (result.success) navigate('/dashboard')
    else setError(result.message)
  }

  const handleDemoFill = () => {
    setError('')
    setForm(defaultCredentials)
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8" style={{ background: 'transparent' }}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[36px] border animate-fade-in" style={{ background: 'rgba(255,255,255,0.62)', borderColor: 'rgba(215,227,243,0.92)', boxShadow: '0 30px 90px rgba(15, 23, 42, 0.12)', backdropFilter: 'blur(18px)' }}>
        <section className="relative hidden lg:flex lg:w-[56%] flex-col justify-between overflow-hidden px-8 py-8 xl:px-12 xl:py-10" style={{ background: 'linear-gradient(155deg, #0b1f52 0%, #15338a 24%, #2563eb 58%, #0f766e 100%)' }}>
          <div className="absolute -top-16 right-[-5rem] h-72 w-72 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div className="absolute left-[-6rem] top-1/3 h-80 w-80 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="absolute bottom-[-4rem] right-24 h-56 w-56 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.16)' }}>
                <GridMark />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-blue-100/80">ERP SuperAdmin</p>
                <p className="text-sm font-semibold text-white">Operations command center</p>
              </div>
            </div>

            <h1 className="mt-10 max-w-2xl text-5xl font-bold leading-[1.05] text-white">
              Secure every admin action before it touches the platform.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-50/85">
              Centralize identity, tenant control, monitoring, and policy decisions in one login flow built for platform operators.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[24px] px-4 py-4" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-blue-100/72">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid gap-4 xl:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-[28px] p-5" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 18px 40px rgba(11, 31, 82, 0.18)' }}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/72">{item.eyebrow}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-blue-50/82">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex flex-1 items-center justify-center px-5 py-8 md:px-8 lg:px-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.16), rgba(37,99,235,0))' }} />
            <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.14), rgba(15,118,110,0))' }} />
          </div>

          <div className="relative z-10 w-full max-w-xl rounded-[32px] border p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.92)', borderColor: '#d7e3f3', boxShadow: '0 24px 65px rgba(15, 23, 42, 0.08)' }}>
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ background: '#edf3ff', color: '#2563eb' }}>
                  Secure Access
                </div>
                <h2 className="mt-4 text-3xl font-bold" style={{ color: '#14213d' }}>Sign in to continue</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: '#5f6f82' }}>
                  Use your superadmin credentials to open the dashboard, audit activity, and manage tenants.
                </p>
              </div>
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-[20px]" style={{ background: 'linear-gradient(135deg, #2563eb, #0f766e)' }}>
                <GridMark bright />
              </div>
            </div>

            <div className="mb-6 rounded-[24px] p-4" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(15,118,110,0.08))', border: '1px solid #d7e3f3' }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#2563eb' }}>Default Credentials</p>
                  <p className="mt-1 font-mono text-sm" style={{ color: '#5f6f82' }}>
                    Username: <span style={{ color: '#14213d' }}>{defaultCredentials.username}</span>
                  </p>
                  <p className="mt-1 font-mono text-sm" style={{ color: '#5f6f82' }}>
                    Password: <span style={{ color: '#14213d' }}>{defaultCredentials.password}</span>
                  </p>
                </div>
                <button type="button" onClick={handleDemoFill} className="rounded-2xl px-4 py-2 text-sm font-semibold btn-premium" style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #bfd3ef' }}>
                  Use Demo Login
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Username" type="text" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="superadmin" autoComplete="username" />
              <Field
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                placeholder="Enter your password"
                autoComplete="current-password"
                trailing={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-xs font-semibold" style={{ color: '#2563eb' }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                }
              />

              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                    style={{ accentColor: '#2563eb' }}
                  />
                  <span style={{ color: '#5f6f82' }}>Keep me signed in on this device</span>
                </label>
                <span className="text-xs font-medium" style={{ color: '#7a8898' }}>
                  {remember ? 'Session will persist after refresh.' : 'Session clears when you log out.'}
                </span>
              </div>

              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.24)', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white btn-premium transition-all" style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #15338a 60%, #0f766e 100%)' }}>
                {loading ? 'Authenticating...' : 'Enter Dashboard'}
              </button>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoStrip
                title="Protected Session"
                body="Authentication is verified before the dashboard restores your workspace."
              />
              <InfoStrip
                title="Audit Ready"
                body="Failed logins and system activity remain visible from the monitoring area."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type, placeholder, trailing, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: '#7a8898' }}>{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all"
          style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }}
          required
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  )
}

function InfoStrip({ title, body }) {
  return (
    <div className="rounded-[22px] p-4" style={{ background: '#f8fbff', border: '1px solid #d7e3f3' }}>
      <p className="text-sm font-semibold" style={{ color: '#14213d' }}>{title}</p>
      <p className="mt-1 text-xs leading-5" style={{ color: '#5f6f82' }}>{body}</p>
    </div>
  )
}

function GridMark({ bright = false }) {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="4" width="10" height="10" rx="2" fill="white" opacity={bright ? '0.94' : '0.9'} />
      <rect x="18" y="4" width="10" height="10" rx="2" fill="white" opacity="0.62" />
      <rect x="4" y="18" width="10" height="10" rx="2" fill="white" opacity="0.62" />
      <rect x="18" y="18" width="10" height="10" rx="2" fill="white" opacity={bright ? '0.94' : '0.9'} />
    </svg>
  )
}
