export default function StatCard({ item, index }) {
  const accents = [
    "from-teal-600 to-cyan-500",
    "from-amber-500 to-orange-500",
    "from-emerald-600 to-lime-500",
    "from-sky-600 to-indigo-500",
  ];

  return (
    <div className="rounded-[26px] border border-white/80 bg-white/85 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
      <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${accents[index % accents.length]}`} />
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        {item.label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-950">{item.value}</p>
      <p className="mt-2 text-sm text-slate-600">{item.trend}</p>
    </div>
  );
}
