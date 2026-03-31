export default function RoleCard({ role, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.value)}
      className={`w-full rounded-3xl border p-4 text-left transition duration-300 ${
        active
          ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-900/10"
          : "border-slate-200 bg-white/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className={`mb-3 h-2 rounded-full bg-gradient-to-r ${role.accent}`} />
      <p className="text-base font-bold text-slate-900">{role.label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{role.subtitle}</p>
    </button>
  );
}
