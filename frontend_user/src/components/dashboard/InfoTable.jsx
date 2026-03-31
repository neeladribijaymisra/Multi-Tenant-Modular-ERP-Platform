export default function InfoTable({ title, rows }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-200/60">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-slate-950">{title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Live Queue
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="pb-3 font-semibold">Item</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Summary</th>
              <th className="pb-3 font-semibold">Owner</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-b border-slate-100 last:border-b-0">
                <td className="py-4 font-semibold text-slate-900">{row[0]}</td>
                <td className="py-4 text-slate-600">{row[1]}</td>
                <td className="py-4 text-slate-600">{row[2]}</td>
                <td className="py-4 text-slate-600">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
