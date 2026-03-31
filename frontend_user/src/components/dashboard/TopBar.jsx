import { Button, Chip, TextField } from "@mui/material";

export default function TopBar({
  tenant,
  username,
  avatarSeed,
  searchValue,
  onSearchChange,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-30 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700/70">
            Tenant Workspace
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">{tenant}</h1>
          <p className="mt-1 text-sm text-slate-600">
            AYRA ERP workspace for student, teacher, academic office, and communication teams.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <Chip label="Live ERP Preview" color="primary" variant="outlined" />
            <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {avatarSeed}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{username}</p>
                <p className="text-xs text-slate-500">User access active</p>
              </div>
            </div>
            <Button variant="contained" color="primary" onClick={onLogout}>
              Logout
            </Button>
          </div>

          <TextField
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search modules, notices, schedules, or records"
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 380 } }}
          />
        </div>
      </div>
    </header>
  );
}
