export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.24em] mb-2" style={{ color: '#7a8898' }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold" style={{ color: '#14213d' }}>{title}</h1>
        {description && (
          <p className="text-sm mt-2 max-w-3xl" style={{ color: '#5f6f82' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  )
}

export function HeroPanel({ title, description, right, children }) {
  return (
    <div
      className="rounded-[28px] p-6 md:p-8 overflow-hidden relative premium-card"
      style={{
        background: 'linear-gradient(135deg, #15338a 0%, #2563eb 38%, #0f766e 100%)',
        boxShadow: '0 28px 70px rgba(21, 51, 138, 0.24)',
      }}
    >
      <div className="absolute -top-10 right-0 w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.14)', filter: 'blur(10px)' }} />
      <div className="absolute -bottom-16 left-20 w-60 h-60 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', filter: 'blur(8px)' }} />
      <div className="absolute inset-0 opacity-60" style={{ background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 42%, transparent 80%)' }} />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
          <p className="text-sm md:text-base mt-3 max-w-2xl text-blue-50/85">{description}</p>
          {children && <div className="mt-6">{children}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

export function SurfaceCard({ children, className = '', soft = false }) {
  return (
    <div
      className={`rounded-3xl p-6 premium-card ${className}`}
      style={{
        background: soft ? '#f8fbff' : '#ffffff',
        border: '1px solid #d7e3f3',
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
      }}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, accent = '#2563eb', badge, meta, icon, trend, trendDirection = 'up' }) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-[20px] flex items-center justify-center text-xs font-semibold metric-icon" style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}10)`, color: accent, border: `1px solid ${accent}22` }}>
          {icon || label.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col items-end gap-2">
          {badge && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-xl" style={{ color: accent, background: `${accent}14` }}>
              {badge}
            </span>
          )}
          {trend && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl" style={{ color: trendDirection === 'down' ? '#dc2626' : '#0f766e', background: trendDirection === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(15,118,110,0.1)' }}>
              <TrendArrow direction={trendDirection} />
              {trend}
            </span>
          )}
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: '#14213d' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#5f6f82' }}>{label}</p>
      {meta && <p className="text-xs mt-3" style={{ color: '#7a8898' }}>{meta}</p>}
    </SurfaceCard>
  )
}

export function ErrorBanner({ message }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-sm"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.24)', color: '#dc2626' }}
    >
      {message}
    </div>
  )
}

export function EmptyPanel({ title, description, action }) {
  return (
    <SurfaceCard className="text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#edf3ff', color: '#2563eb' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <line x1="7" y1="9" x2="17" y2="9" />
          <line x1="7" y1="13" x2="14" y2="13" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold" style={{ color: '#14213d' }}>{title}</h3>
      <p className="text-sm mt-2" style={{ color: '#5f6f82' }}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </SurfaceCard>
  )
}

function TrendArrow({ direction }) {
  if (direction === 'down') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 7h10v10" />
        <path d="M17 7 7 17" />
      </svg>
    )
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 17h10V7" />
      <path d="M17 17 7 7" />
    </svg>
  )
}
