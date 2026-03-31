export default function LogoMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-500 to-cyan-400 text-sm font-extrabold text-white shadow-lg shadow-teal-700/20">
        U+
      </div>
      {!compact ? (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700/80">
            AYRA ERP
          </p>
          <p className="text-lg font-extrabold text-slate-900">Campus Operations Portal</p>
        </div>
      ) : null}
    </div>
  );
}
