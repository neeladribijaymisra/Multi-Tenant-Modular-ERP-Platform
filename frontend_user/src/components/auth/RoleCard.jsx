export default function RoleCard({ role, active, onSelect, index = 0 }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.value)}
      aria-pressed={active}
      className={`animate-card-rise group relative w-full overflow-hidden rounded-[26px] border p-4 text-left transition-all duration-300 ${
        active
          ? "border-slate-900 bg-slate-950 text-white shadow-2xl shadow-slate-900/20"
          : "border-slate-200 bg-white/82 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-900/8"
      }`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.08),_transparent_55%)] transition-opacity duration-500 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={`mb-3 h-2 rounded-full bg-gradient-to-r ${role.accent}`} />
          <p className={`text-lg font-bold ${active ? "text-white" : "text-slate-900"}`}>
            {role.label}
          </p>
          <p
            className={`mt-2 text-sm leading-6 ${
              active ? "text-slate-200" : "text-slate-600"
            }`}
          >
            {role.subtitle}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${
            active
              ? "bg-white/15 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white"
          }`}
        >
          {active ? "Selected" : "Choose"}
        </span>
      </div>
    </button>
  );
}
