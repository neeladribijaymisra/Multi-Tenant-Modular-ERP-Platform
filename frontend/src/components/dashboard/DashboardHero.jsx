export default function DashboardHero({ roleLabel, welcome, modules, actions, onAction }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-7 py-7 text-white shadow-2xl shadow-slate-900/20">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.35),_transparent_60%)]" />
      <div className="relative grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200/90">
            {roleLabel} workspace
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight">
            Professional university ERP experience for day-to-day campus operations.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{welcome}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {modules.map((module) => (
              <span
                key={module}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100"
              >
                {module}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100/80">
            Quick Actions
          </p>
          <div className="mt-4 space-y-3">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onAction?.(action)}
                className="w-full rounded-2xl bg-white px-4 py-3 text-left font-semibold text-slate-900 transition hover:bg-teal-50"
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
