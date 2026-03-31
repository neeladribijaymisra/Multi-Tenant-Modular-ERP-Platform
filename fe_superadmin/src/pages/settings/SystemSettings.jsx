import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import { ErrorBanner, PageHeader, StatCard, SurfaceCard } from '../../components/ui/PagePrimitives'

const initialSettings = {
  academic: { year: '', startMonth: '', endMonth: '', semesterType: '', maxBacklogs: '', gradingSystem: '' },
  fee: { lateFine: '', graceDays: '', refundPolicy: '', taxPercent: '', currency: '', paymentGateway: '' },
  global: { maintenanceMode: false, allowRegistration: false, emailNotif: false, smsNotif: false, backupFreq: '', sessionTimeout: '' },
  security: { passwordMinLength: 8, passwordExpiry: '90', twoFactorAuth: false, apiKeyRotation: '30', ipWhitelist: [] },
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function SystemSettings() {
  const { token } = useAuth()
  const [tab, setTab] = useState('academic')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(initialSettings)

  useEffect(() => {
    const loadSettings = async () => {
      if (!token) {
        setError('Please sign in to access this page.')
        setLoading(false)
        return
      }

      try {
        const response = await apiRequest('/settings', { token })
        setSettings({
          academic: response.data.academic?.data || initialSettings.academic,
          fee: response.data.fee?.data || initialSettings.fee,
          global: response.data.global?.data || initialSettings.global,
          security: response.data.security?.data || initialSettings.security,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [token])

  const save = async () => {
    try {
      setError('')
      await apiRequest('/settings', {
        method: 'PUT',
        token,
        body: { category: tab, data: settings[tab] },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    }
  }

  const tabs = [
    { id: 'academic', label: 'Academic Config' },
    { id: 'fee', label: 'Fee Structure' },
    { id: 'global', label: 'Global Rules' },
    { id: 'security', label: 'Security' },
  ]

  if (loading) {
    return <StatePanel title="Loading settings..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Global Settings"
        title="System Settings"
        description="Configure academic year, fee structures, institution-wide rules, and security defaults from one clean control surface."
        actions={
          <button onClick={save} className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white" style={{ background: saved ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Academic Year" value={settings.academic.year || '--'} badge="Live" />
        <StatCard label="Default Currency" value={settings.fee.currency || '--'} accent="#16a34a" badge="Finance" />
        <StatCard label="Session Timeout" value={`${settings.global.sessionTimeout || '--'} min`} accent="#d97706" badge="Security" />
        <StatCard label="2FA Policy" value={settings.security.twoFactorAuth ? 'Enabled' : 'Optional'} accent="#7c3aed" badge="Access" />
      </div>

      <SurfaceCard>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className="px-4 py-2 rounded-2xl text-sm font-medium transition-all" style={tab === item.id ? { background: '#2563eb', color: 'white' } : { background: '#f8fbff', color: '#5f6f82', border: '1px solid #d7e3f3' }}>
              {item.label}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {tab === 'academic' && (
          <>
            <SettingCard title="Academic Year">
              <Field label="Current Academic Year" value={settings.academic.year} onChange={(v) => setSettings({ ...settings, academic: { ...settings.academic, year: v } })} />
              <Field label="Start Month" value={settings.academic.startMonth} onChange={(v) => setSettings({ ...settings, academic: { ...settings.academic, startMonth: v } })} type="select" options={months} />
              <Field label="End Month" value={settings.academic.endMonth} onChange={(v) => setSettings({ ...settings, academic: { ...settings.academic, endMonth: v } })} type="select" options={months} />
            </SettingCard>
            <SettingCard title="Academic Rules">
              <Field label="Semester Type" value={settings.academic.semesterType} onChange={(v) => setSettings({ ...settings, academic: { ...settings.academic, semesterType: v } })} type="select" options={['Semester', 'Annual', 'Trimester']} />
              <Field label="Maximum Backlogs Allowed" value={settings.academic.maxBacklogs} onChange={(v) => setSettings({ ...settings, academic: { ...settings.academic, maxBacklogs: v } })} type="number" />
              <Field label="Grading System" value={settings.academic.gradingSystem} onChange={(v) => setSettings({ ...settings, academic: { ...settings.academic, gradingSystem: v } })} type="select" options={['CGPA (10)', 'CGPA (4)', 'Percentage', 'Letter Grade']} />
            </SettingCard>
          </>
        )}

        {tab === 'fee' && (
          <>
            <SettingCard title="Fee Structure Templates">
              <Field label="Late Fine per Day" value={settings.fee.lateFine} onChange={(v) => setSettings({ ...settings, fee: { ...settings.fee, lateFine: v } })} type="number" />
              <Field label="Grace Period (Days)" value={settings.fee.graceDays} onChange={(v) => setSettings({ ...settings, fee: { ...settings.fee, graceDays: v } })} type="number" />
              <Field label="Refund Policy (Days)" value={settings.fee.refundPolicy} onChange={(v) => setSettings({ ...settings, fee: { ...settings.fee, refundPolicy: v } })} type="number" />
            </SettingCard>
            <SettingCard title="Billing Configuration">
              <Field label="GST / Tax Percent (%)" value={settings.fee.taxPercent} onChange={(v) => setSettings({ ...settings, fee: { ...settings.fee, taxPercent: v } })} type="number" />
              <Field label="Currency" value={settings.fee.currency} onChange={(v) => setSettings({ ...settings, fee: { ...settings.fee, currency: v } })} type="select" options={['INR', 'USD', 'EUR', 'GBP']} />
              <Field label="Payment Gateway" value={settings.fee.paymentGateway} onChange={(v) => setSettings({ ...settings, fee: { ...settings.fee, paymentGateway: v } })} type="select" options={['Razorpay', 'PayU', 'Paytm', 'Stripe', 'Cashfree']} />
            </SettingCard>
          </>
        )}

        {tab === 'global' && (
          <>
            <SettingCard title="Global Rules">
              <Toggle label="Maintenance Mode" desc="Block all tenant access temporarily" value={settings.global.maintenanceMode} onChange={(v) => setSettings({ ...settings, global: { ...settings.global, maintenanceMode: v } })} danger />
              <Toggle label="Allow New Registrations" desc="Enable self-onboarding for institutions" value={settings.global.allowRegistration} onChange={(v) => setSettings({ ...settings, global: { ...settings.global, allowRegistration: v } })} />
              <Field label="Session Timeout (minutes)" value={settings.global.sessionTimeout} onChange={(v) => setSettings({ ...settings, global: { ...settings.global, sessionTimeout: v } })} type="number" />
            </SettingCard>
            <SettingCard title="Notifications & Backups">
              <Toggle label="Email Notifications" desc="Send system alerts by email" value={settings.global.emailNotif} onChange={(v) => setSettings({ ...settings, global: { ...settings.global, emailNotif: v } })} />
              <Toggle label="SMS Notifications" desc="Send urgent platform alerts by SMS" value={settings.global.smsNotif} onChange={(v) => setSettings({ ...settings, global: { ...settings.global, smsNotif: v } })} />
              <Field label="Backup Frequency" value={settings.global.backupFreq} onChange={(v) => setSettings({ ...settings, global: { ...settings.global, backupFreq: v } })} type="select" options={['Hourly', 'Daily', 'Weekly', 'Monthly']} />
            </SettingCard>
          </>
        )}

        {tab === 'security' && (
          <>
            <SettingCard title="Password Policy">
              <Field label="Minimum Password Length" value={settings.security.passwordMinLength} onChange={(v) => setSettings({ ...settings, security: { ...settings.security, passwordMinLength: Number(v) } })} type="number" />
              <Field label="Password Expiry (days)" value={settings.security.passwordExpiry} onChange={(v) => setSettings({ ...settings, security: { ...settings.security, passwordExpiry: v } })} type="number" />
              <Field label="API Key Rotation (days)" value={settings.security.apiKeyRotation} onChange={(v) => setSettings({ ...settings, security: { ...settings.security, apiKeyRotation: v } })} type="number" />
            </SettingCard>
            <SettingCard title="Access Control">
              <Toggle label="Two-Factor Authentication" desc="Require extra verification for platform admins" value={settings.security.twoFactorAuth} onChange={(v) => setSettings({ ...settings, security: { ...settings.security, twoFactorAuth: v } })} />
              <div className="rounded-2xl p-3" style={{ background: '#f8fbff', border: '1px solid #d7e3f3' }}>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>IP Whitelist</label>
                <textarea value={(settings.security.ipWhitelist || []).join(', ')} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, ipWhitelist: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) } })} className="w-full min-h-28 px-3 py-2.5 rounded-2xl text-sm outline-none" style={{ background: '#ffffff', border: '1px solid #d7e3f3', color: '#14213d' }} />
              </div>
            </SettingCard>
          </>
        )}
      </div>
    </div>
  )
}

function SettingCard({ title, children }) {
  return (
    <SurfaceCard>
      <h3 className="text-lg font-semibold mb-5" style={{ color: '#14213d' }}>{title}</h3>
      <div className="space-y-4">{children}</div>
    </SurfaceCard>
  )
}

function Field({ label, value, onChange, type = 'text', options }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#7a8898' }}>{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-3 rounded-2xl text-sm outline-none" style={{ background: '#f8fbff', border: '1px solid #d7e3f3', color: '#14213d' }} />
      )}
    </div>
  )
}

function Toggle({ label, desc, value, onChange, danger }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: '#f8fbff', border: '1px solid #d7e3f3' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: danger && value ? '#dc2626' : '#14213d' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: '#5f6f82' }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} className="relative w-10 h-5 rounded-full transition-all" style={{ background: value ? (danger ? '#ef4444' : '#2563eb') : '#c7d4e5' }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: value ? '1.25rem' : '0.125rem' }} />
      </button>
    </div>
  )
}

function StatePanel({ title }) {
  return <SurfaceCard className="text-center"><p style={{ color: '#5f6f82' }}>{title}</p></SurfaceCard>
}
