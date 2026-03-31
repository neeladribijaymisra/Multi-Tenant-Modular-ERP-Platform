import SidebarNav from "../components/dashboard/SidebarNav";
import TopBar from "../components/dashboard/TopBar";

export default function AppShell({
  children,
  roleLabel,
  activeModule,
  onSelectModule,
  tenant,
  username,
  avatarSeed,
  searchValue,
  onSearchChange,
  onLogout,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef6f3_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_1fr]">
        <SidebarNav
          roleLabel={roleLabel}
          activeModule={activeModule}
          onSelectModule={onSelectModule}
        />
        <main className="space-y-4 overflow-hidden rounded-[32px] border border-white/70 bg-white/40 p-4 shadow-2xl shadow-teal-950/5 backdrop-blur sm:p-5">
          <TopBar
            tenant={tenant}
            username={username}
            avatarSeed={avatarSeed}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onLogout={onLogout}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
