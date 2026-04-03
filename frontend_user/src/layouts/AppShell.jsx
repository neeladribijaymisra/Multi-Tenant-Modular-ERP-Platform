import SidebarNav from "../components/dashboard/SidebarNav";
import TopBar from "../components/dashboard/TopBar";

export default function AppShell({
  children,
  roleLabel,
  activeModule,
  onSelectModule,
  modules = [],
  tenant,
  username,
  avatarSeed,
  searchValue,
  onSearchChange,
  onLogout,
}) {
  const showDashboardInfo = activeModule === "Dashboard";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef6f3_100%)] px-4 py-4 sm:px-6 lg:h-screen lg:overflow-hidden lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:h-[calc(100vh-2rem)] lg:grid-cols-[280px_1fr] lg:items-stretch">
        <div className="lg:h-full lg:min-h-0">
          <SidebarNav
            roleLabel={roleLabel}
            activeModule={activeModule}
            onSelectModule={onSelectModule}
            modules={modules}
            showProfile={showDashboardInfo}
          />
        </div>
        <main className="glass-scroll min-h-0 space-y-4 overflow-x-hidden rounded-[32px] border border-white/70 bg-white/40 p-4 shadow-2xl shadow-teal-950/5 backdrop-blur sm:p-5 lg:h-full lg:overflow-y-auto">
          <TopBar
            tenant={tenant}
            username={username}
            avatarSeed={avatarSeed}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onLogout={onLogout}
            showDashboardInfo={showDashboardInfo}
            activeModule={activeModule}
          />
          <div className="space-y-4 pb-10 lg:space-y-5 lg:pb-16">{children}</div>
        </main>
      </div>
    </div>
  );
}
