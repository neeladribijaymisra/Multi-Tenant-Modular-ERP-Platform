import LogoMark from "../common/LogoMark";

const navDescriptions = {
  Dashboard: "Overview and alerts",
  Academics: "Records, classes, and curriculum",
  Attendance: "Attendance sheets and summaries",
  Communication: "Notices and messaging",
  Calendar: "Events and deadlines",
  Alert: "Email alerts and broadcasts",
  Hostel: "Hostel inventory and allotments",
  Support: "Requests and follow-up",
  Transport: "Buses, routes, and seat allotments",
};

export default function SidebarNav({
  roleLabel,
  activeModule,
  onSelectModule,
  modules = [],
  showProfile = true,
}) {
  return (
    <aside className="flex min-h-full flex-col rounded-[28px] border border-white/60 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-slate-900/20">
      <LogoMark compact />
      {showProfile ? (
        <div className="mt-8 rounded-3xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-teal-200/90">Signed in as</p>
          <p className="mt-2 text-xl font-bold">{roleLabel}</p>
          <p className="mt-1 text-sm text-slate-300">University role workspace</p>
        </div>
      ) : null}

      <nav className="mt-8 space-y-2">
        {modules.map((module) => {
          const isActive = module === activeModule;

          return (
            <button
              key={module}
              type="button"
              onClick={() => onSelectModule(module)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                isActive
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                  : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <p className="font-semibold">{module}</p>
              <p className={`text-xs ${isActive ? "text-teal-50/90" : "text-slate-400"}`}>
                {navDescriptions[module]}
              </p>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4">
        <p className="text-sm font-semibold">Need help?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          Reach your university ERP admin for new permissions, modules, and tenant settings.
        </p>
      </div>
    </aside>
  );
}
