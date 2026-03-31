export default function DashboardHero({ roleLabel, welcome, modules, actions, onAction }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-6 text-white shadow-2xl shadow-slate-900/20 transition-all duration-500 ease-out">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.35),_transparent_60%)]" />
      <div className="relative grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/90">
            {roleLabel} workspace
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight">
            Professional university ERP experience for day-to-day campus operations.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{welcome}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {modules.map((module) => (
              <span
                key={module}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100"
              >
                {module}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 min-w-0 self-start rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100/80">
            Quick Actions
          </p>
          <div className="mt-4 grid gap-2">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onAction?.(action)}
                className="w-full rounded-2xl bg-white px-3 py-2 text-left text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:bg-teal-50"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
