import { MenuItem, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

function getGradeColor(grade) {
  if (grade === "O") return "#0f766e";
  if (grade === "E") return "#0284c7";
  if (grade === "A") return "#2563eb";
  if (grade === "B") return "#7c3aed";
  if (grade === "C") return "#d97706";
  if (grade === "D") return "#dc2626";
  return "#64748b";
}

function buildGradeDistribution(items) {
  const counts = items.reduce((accumulator, item) => {
    accumulator[item.grade || "NA"] = (accumulator[item.grade || "NA"] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).map(([grade, count]) => ({ grade, count }));
}

export default function ProgressOverviewSection({
  section,
  items,
  attendanceItems,
  studentProfile,
  active,
}) {
  const currentSemester = Number(studentProfile?.semester || 0);
  const semesterOptions = useMemo(
    () =>
      [...new Set(items.map((item) => Number(item.semester)).filter(Boolean))]
        .filter((semester) => semester <= currentSemester)
        .sort((left, right) => left - right),
    [currentSemester, items],
  );
  const [selectedSemester, setSelectedSemester] = useState("");
  const [chartPhase, setChartPhase] = useState("entered");

  useEffect(() => {
    if (!selectedSemester && semesterOptions.length) {
      setSelectedSemester(String(semesterOptions[semesterOptions.length - 1]));
    }
  }, [selectedSemester, semesterOptions]);

  useEffect(() => {
    if (!selectedSemester) {
      return undefined;
    }

    setChartPhase("changing");
    const timeoutId = window.setTimeout(() => {
      setChartPhase("entered");
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [selectedSemester]);

  const semesterItems = useMemo(
    () => items.filter((item) => String(item.semester) === String(selectedSemester)),
    [items, selectedSemester],
  );
  const selectedSemesterNumber = Number(selectedSemester || 0);
  const isCurrentSemester = selectedSemesterNumber === currentSemester;

  const cumulativeAttendance = useMemo(() => {
    const working = attendanceItems.filter((item) => item.status !== "holiday").length;
    const present = attendanceItems.filter((item) => item.status === "present").length;
    return working ? ((present / working) * 100).toFixed(1) : "0.0";
  }, [attendanceItems]);

  const semesterAttendance = useMemo(() => {
    if (!semesterItems.length) {
      return "0.0";
    }

    return (
      semesterItems.reduce((sum, item) => sum + Number(item.attendance || 0), 0) / semesterItems.length
    ).toFixed(1);
  }, [semesterItems]);

  const averageMarks = useMemo(() => {
    if (!semesterItems.length) {
      return "0.0";
    }

    return (semesterItems.reduce((sum, item) => sum + Number(item.marks || 0), 0) / semesterItems.length).toFixed(1);
  }, [semesterItems]);

  const gradeDistribution = useMemo(() => buildGradeDistribution(semesterItems), [semesterItems]);
  const maxMarks = useMemo(() => Math.max(100, ...semesterItems.map((item) => Number(item.marks || 0))), [semesterItems]);
  const passedSemesters = useMemo(
    () => semesterOptions.filter((semester) => semester < currentSemester),
    [currentSemester, semesterOptions],
  );

  return (
    <section
      id={section.key}
      className={`rounded-[28px] border bg-white/85 p-6 shadow-lg shadow-slate-200/60 transition-all duration-500 ease-out ${
        active ? "border-teal-300 ring-2 ring-teal-100" : "border-white/70"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-950">{section.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{section.description}</p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Passed semesters: {passedSemesters.length ? passedSemesters.join(", ") : "None yet"} | Current semester: {currentSemester || "-"}
          </p>
        </div>
        <TextField
          select
          label="Semester Report"
          size="small"
          sx={{ minWidth: 180 }}
          value={selectedSemester}
          onChange={(event) => setSelectedSemester(event.target.value)}
        >
          {semesterOptions.map((semester) => (
            <MenuItem key={semester} value={String(semester)}>
              Semester {semester}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</p>
          <p className="mt-2 text-lg font-extrabold text-slate-950">{studentProfile?.fullName || "-"}</p>
          <p className="mt-1 text-sm text-slate-600">
            {studentProfile?.studentId} | Sem {studentProfile?.semester} | Sec {studentProfile?.section}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected Semester Avg</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{averageMarks}</p>
          <p className="mt-1 text-sm text-slate-600">Average marks across the selected semester subjects</p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {isCurrentSemester ? "Current Semester Attendance" : "Attendance Till Date"}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {isCurrentSemester ? semesterAttendance : cumulativeAttendance}%
          </p>
          <p className="mt-1 text-sm text-slate-600">Cumulative attendance across all recorded classes</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-500 ease-out">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {isCurrentSemester ? "Current Semester Overall Progress" : "Semester Subject Performance"}
          </p>
          <div className="mt-4 space-y-3">
            {isCurrentSemester ? (
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm transition-all duration-500 ease-out">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 transition-all duration-500 ease-out hover:-translate-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subjects Running</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-950">{semesterItems.length}</p>
                    <p className="mt-1 text-sm text-slate-600">Your current semester is tracked as an overall progress window.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 transition-all duration-500 ease-out hover:-translate-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Overall Current Standing</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-950">{averageMarks}</p>
                    <p className="mt-1 text-sm text-slate-600">Average ongoing marks across current-semester subjects.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {semesterItems.map((item) => (
                    <div key={`${item.subjectCode}-${item.semester}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-sm">
                      <p className="text-sm font-bold text-slate-950">{item.subjectName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{item.subjectCode}</p>
                      <p className="mt-2 text-sm text-slate-600">Current marks: {item.marks} | Attendance: {item.attendance}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              semesterItems.map((item) => (
                <div key={`${item.subjectCode}-${item.semester}`} className="rounded-2xl border border-white bg-white p-4 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-md">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{item.subjectName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.subjectCode}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.projectTitle} | {item.projectType} | Project: {item.projectScore}/10
                      </p>
                      {item.teamMembers?.length ? (
                        <p className="mt-1 text-sm text-slate-600">Team: {item.teamMembers.join(", ")}</p>
                      ) : null}
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Grade</p>
                      <p className="mt-1 text-2xl font-extrabold" style={{ color: getGradeColor(item.grade) }}>
                        {item.grade}
                      </p>
                      <p className="text-sm font-semibold text-slate-700">{item.marks} marks</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-500 ease-out">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grade Distribution</p>
            <div className="mt-4 flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 220 220"
                className={`h-[220px] w-[220px] transition-all duration-500 ease-out ${
                  chartPhase === "changing" ? "scale-[0.96] opacity-60" : "scale-100 opacity-100"
                }`}
              >
                {(() => {
                  let offset = 0;
                  const total = Math.max(gradeDistribution.reduce((sum, item) => sum + item.count, 0), 1);

                  return gradeDistribution.map((item) => {
                    const circumference = 2 * Math.PI * 70;
                    const segment = (item.count / total) * circumference;
                    const dashArray = `${segment} ${circumference - segment}`;
                    const dashOffset = -offset;
                    offset += segment;

                    return (
                      <circle
                        key={item.grade}
                        cx="110"
                        cy="110"
                        r="70"
                        fill="transparent"
                        stroke={getGradeColor(item.grade)}
                        strokeWidth="22"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 110 110)"
                        style={{
                          transition:
                            "stroke-dasharray 680ms cubic-bezier(0.22, 1, 0.36, 1), stroke-dashoffset 680ms cubic-bezier(0.22, 1, 0.36, 1), stroke 320ms ease",
                        }}
                      />
                    );
                  });
                })()}
                <text x="110" y="108" textAnchor="middle" className="fill-slate-950 text-xl font-bold transition-all duration-500 ease-out">
                  {selectedSemester || "-"}
                </text>
                <text x="110" y="130" textAnchor="middle" className="fill-slate-500 text-xs transition-all duration-500 ease-out">
                  Semester
                </text>
              </svg>
            </div>
            <div className="mt-2 space-y-2">
              {gradeDistribution.map((item, index) => (
                <div
                  key={item.grade}
                  className="flex items-center justify-between text-sm transition-all duration-500 ease-out"
                  style={{ transitionDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getGradeColor(item.grade) }} />
                    <span className="font-semibold text-slate-700">{item.grade}</span>
                  </div>
                  <span className="text-slate-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-500 ease-out">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Marks Analysis</p>
            <div className="mt-4 space-y-3">
              {semesterItems.map((item, index) => (
                <div key={`${item.subjectCode}-bar`} className="space-y-1 transition-all duration-500 ease-out" style={{ transitionDelay: `${index * 40}ms` }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{item.subjectCode}</span>
                    <span className="text-slate-500">{item.marks}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
                      style={{
                        width: `${(Number(item.marks || 0) / maxMarks) * 100}%`,
                        transition: "width 720ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
