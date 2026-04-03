import { Button } from "@mui/material";

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function UserProfileCard({
  session,
  studentProfile,
  onPhotoSelect,
  onRemovePhoto,
  photoUpdating,
}) {
  const photo = studentProfile?.photoDataUrl;
  const details = studentProfile
    ? [
        { label: "Full Name", value: studentProfile.fullName },
        { label: "Username", value: session.username },
        { label: "Student ID", value: studentProfile.studentId },
        { label: "Department", value: studentProfile.department },
        { label: "Semester", value: studentProfile.semester },
        { label: "Section", value: studentProfile.section },
        { label: "SGPA", value: studentProfile.sgpa },
        { label: "CGPA", value: studentProfile.cgpa },
        { label: "Email", value: studentProfile.email },
        { label: "Phone", value: studentProfile.phone },
        { label: "Tenant", value: session.tenant?.toUpperCase() || session.tenantSlug?.toUpperCase() },
      ]
    : [
        { label: "Name", value: session.displayName },
        { label: "Username", value: session.username },
        { label: "Role", value: session.role },
        { label: "Tenant", value: session.tenant?.toUpperCase() || session.tenantSlug?.toUpperCase() },
        { label: "Last Login", value: new Date(session.lastLogin).toLocaleString() },
      ];

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-200/60 transition-all duration-300 ease-out">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          {photo ? (
            <img
              src={photo}
              alt={session.displayName}
              className="h-20 w-20 rounded-3xl object-cover ring-2 ring-teal-100"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-slate-950 text-2xl font-bold text-white">
              {session.avatarSeed}
            </div>
          )}

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Logged In Profile</p>
            <h3 className="mt-2 text-2xl font-extrabold text-slate-950">
              {studentProfile?.fullName || session.displayName}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {studentProfile
                ? "Your ERP details are shown here across the dashboard."
                : "Your role and account details are visible here across the dashboard."}
            </p>
          </div>
        </div>

        {studentProfile ? (
          <div className="flex flex-wrap gap-3">
            <Button component="label" variant="contained" disabled={photoUpdating}>
              {photo ? "Change and Crop Photo" : "Upload and Crop Photo"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => onPhotoSelect?.(event)}
              />
            </Button>
            {photo ? (
              <Button color="error" variant="outlined" onClick={onRemovePhoto} disabled={photoUpdating}>
                Remove Photo
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {details.map((detail) => (
          <DetailItem key={detail.label} label={detail.label} value={detail.value} />
        ))}
      </div>
    </section>
  );
}
