import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";

function getStatusStyles(status) {
  if (status === "present") {
    return "bg-emerald-500 text-white";
  }

  if (status === "absent") {
    return "bg-rose-500 text-white";
  }

  if (status === "holiday") {
    return "bg-amber-300 text-slate-950";
  }

  return "bg-white text-slate-500";
}

function nextStatus(currentStatus) {
  if (currentStatus === "present") {
    return "absent";
  }

  if (currentStatus === "absent") {
    return "holiday";
  }

  if (currentStatus === "holiday") {
    return "";
  }

  return "present";
}

function getMonthDateRange(monthLabel) {
  const [monthName, year] = String(monthLabel || "").split(" ");
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

  if (Number.isNaN(monthIndex)) {
    return [];
  }

  const daysInMonth = new Date(Number(year), monthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_item, index) => {
    const date = new Date(Number(year), monthIndex, index + 1);
    return {
      iso: date.toISOString().slice(0, 10),
      label: index + 1,
      weekday: date.toLocaleString("en-US", { weekday: "short" }),
      isSunday: date.getDay() === 0,
    };
  });
}

function calculatePercentage(records, startDate, endDate) {
  const filtered = records.filter((item) => item.date >= startDate && item.date <= endDate);
  const workingDays = filtered.filter((item) => item.status !== "holiday").length;
  const presentDays = filtered.filter((item) => item.status === "present").length;

  return {
    presentDays,
    workingDays,
    percentage: workingDays ? ((presentDays / workingDays) * 100).toFixed(1) : "0.0",
  };
}

export default function AttendanceSection({
  section,
  items,
  students,
  session,
  loading,
  error,
  active,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  canEdit,
}) {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const todayKey = new Date().toISOString().slice(0, 10);
  const tableContainerRef = useRef(null);

  const semesterOptions = useMemo(
    () => [...new Set(students.map((student) => String(student.semester)).filter(Boolean))].sort((left, right) => Number(left) - Number(right)),
    [students],
  );
  const sectionOptions = useMemo(
    () =>
      [...new Set(
        students
          .filter((student) => !selectedSemester || String(student.semester) === selectedSemester)
          .map((student) => String(student.section).toUpperCase())
          .filter(Boolean),
      )].sort(),
    [selectedSemester, students],
  );
  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          (!selectedSemester || String(student.semester) === selectedSemester) &&
          (!selectedSection || String(student.section).toUpperCase() === selectedSection),
      ),
    [selectedSection, selectedSemester, students],
  );
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (!selectedSemester || String(item.semester) === selectedSemester) &&
          (!selectedSection || String(item.section).toUpperCase() === selectedSection),
      ),
    [items, selectedSection, selectedSemester],
  );
  const monthOptions = useMemo(() => [...new Set(filteredItems.map((item) => item.monthLabel))], [filteredItems]);

  const monthDays = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth]);

  useEffect(() => {
    if (!selectedSemester && semesterOptions.length) {
      setSelectedSemester(semesterOptions[0]);
    }
  }, [selectedSemester, semesterOptions]);

  useEffect(() => {
    if (!selectedSection && sectionOptions.length) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);

  useEffect(() => {
    if (selectedSection && !sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0] || "");
    }
  }, [sectionOptions, selectedSection]);

  useEffect(() => {
    if ((!selectedMonth || !monthOptions.includes(selectedMonth)) && monthOptions.length) {
      const currentMonthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
      setSelectedMonth(monthOptions.includes(currentMonthLabel) ? currentMonthLabel : monthOptions[monthOptions.length - 1]);
    }
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
    const monthStart = monthDays[0]?.iso || "";
    const monthEnd = monthDays[monthDays.length - 1]?.iso || "";

    if (!monthStart || !monthEnd) {
      setRangeStart("");
      setRangeEnd("");
      return;
    }

    setRangeStart((current) => (current >= monthStart && current <= monthEnd ? current : monthStart));
    setRangeEnd((current) => (current >= monthStart && current <= monthEnd ? current : monthEnd));
  }, [monthDays]);

  const visibleStudents = useMemo(() => {
    return [...filteredStudents].sort((left, right) => String(left.fullName).localeCompare(String(right.fullName)));
  }, [filteredStudents]);

  const recordsByStudentAndDate = useMemo(() => {
    return filteredItems.reduce((accumulator, item) => {
      accumulator[`${item.studentId}-${item.date}`] = item;
      return accumulator;
    }, {});
  }, [filteredItems]);

  const activeRange = useMemo(() => {
    const fallbackStart = monthDays[0]?.iso || "";
    const fallbackEnd = monthDays[monthDays.length - 1]?.iso || "";
    const proposedStart = rangeStart || fallbackStart;
    const proposedEnd = rangeEnd || fallbackEnd;

    return {
      start: proposedStart <= proposedEnd ? proposedStart : proposedEnd,
      end: proposedStart <= proposedEnd ? proposedEnd : proposedStart,
    };
  }, [monthDays, rangeEnd, rangeStart]);

  const visibleDays = useMemo(
    () => monthDays.filter((day) => day.iso >= activeRange.start && day.iso <= activeRange.end),
    [activeRange.end, activeRange.start, monthDays],
  );

  useEffect(() => {
    if (session?.role !== "student") {
      return;
    }

    const container = tableContainerRef.current;
    if (!container) {
      return;
    }

    const targetCell = container.querySelector(`[data-day-key="${todayKey}"]`);
    if (!targetCell) {
      return;
    }

    const nextScrollLeft =
      targetCell.offsetLeft - container.clientWidth / 2 + targetCell.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, nextScrollLeft),
      behavior: "smooth",
    });
  }, [selectedMonth, session?.role, todayKey, visibleDays]);

  async function handleCellClick(student, day) {
    if (!canEdit || day.iso > todayKey) {
      return;
    }

    const existingRecord = recordsByStudentAndDate[`${student.studentId}-${day.iso}`];
    const next = nextStatus(existingRecord?.status);

    if (!next && existingRecord?._id) {
      await onDelete(section, existingRecord._id);
      return;
    }

    const payload = {
      studentId: student.studentId,
      studentName: student.fullName,
      department: student.department,
      semester: student.semester,
      section: student.section,
      date: day.iso,
      monthLabel: selectedMonth,
      status: next,
      teacherUsername: existingRecord?.teacherUsername || session?.username || "",
      teacherName: existingRecord?.teacherName || session?.displayName || "",
      subjectCode: existingRecord?.subjectCode || "",
      subjectName: existingRecord?.subjectName || "",
      notes: next === "holiday" ? "Marked holiday by teacher" : "",
    };

    if (existingRecord?._id) {
      await onUpdate(section, existingRecord._id, payload);
      return;
    }

    await onCreate(section, payload);
  }

  async function markHolidayForSelectedDate() {
    if (!canEdit || !activeRange.start || activeRange.start > todayKey) {
      return;
    }

    const targetDay = monthDays.find((item) => item.iso === activeRange.start);
    if (!targetDay) {
      return;
    }

    for (const student of visibleStudents) {
      const existingRecord = recordsByStudentAndDate[`${student.studentId}-${targetDay.iso}`];
      const payload = {
        studentId: student.studentId,
        studentName: student.fullName,
        department: student.department,
        semester: student.semester,
        section: student.section,
        date: targetDay.iso,
        monthLabel: selectedMonth,
        status: "holiday",
        teacherUsername: existingRecord?.teacherUsername || session?.username || "",
        teacherName: existingRecord?.teacherName || session?.displayName || "",
        subjectCode: existingRecord?.subjectCode || "",
        subjectName: existingRecord?.subjectName || "",
        notes: "Marked as holiday for the class",
      };

      if (existingRecord?._id) {
        // eslint-disable-next-line no-await-in-loop
        await onUpdate(section, existingRecord._id, payload);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await onCreate(section, payload);
      }
    }
  }

  return (
    <section
      id={section.key}
      className={`rounded-[28px] border bg-white/85 p-6 shadow-lg shadow-slate-200/60 transition ${
        active ? "border-teal-300 ring-2 ring-teal-100" : "border-white/70"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-950">{section.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{section.description}</p>
          {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {session?.role !== "student" ? (
            <TextField
              select
              label="Semester Sheet"
              size="small"
              sx={{ minWidth: 150 }}
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
            >
              {semesterOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  Semester {option}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          {session?.role !== "student" ? (
            <TextField
              select
              label="Section Sheet"
              size="small"
              sx={{ minWidth: 140 }}
              value={selectedSection}
              onChange={(event) => setSelectedSection(event.target.value)}
            >
              {sectionOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  Section {option}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField
            select
            label="Month"
            size="small"
            sx={{ minWidth: 200 }}
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {monthOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="From"
            size="small"
            value={activeRange.start}
            onChange={(event) => setRangeStart(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: monthDays[0]?.iso || "",
              max: monthDays[monthDays.length - 1]?.iso || "",
            }}
          />
          <TextField
            type="date"
            label="To"
            size="small"
            value={activeRange.end}
            onChange={(event) => setRangeEnd(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: monthDays[0]?.iso || "",
              max: monthDays[monthDays.length - 1]?.iso || "",
            }}
          />
          <Button variant="outlined" onClick={() => onRefresh(section)}>
            Refresh
          </Button>
          {canEdit ? (
            <Button variant="contained" onClick={markHolidayForSelectedDate}>
              Mark Selected Day as Holiday
            </Button>
          ) : null}
        </div>
      </div>

      <div ref={tableContainerRef} className="mt-6 overflow-x-auto scroll-smooth">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Attendance register: Semester {selectedSemester || "-"} | Section {selectedSection || "-"}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {visibleStudents.length} students in current sheet
          </p>
        </div>
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="sticky left-0 z-10 rounded-l-2xl bg-slate-50 px-4 py-3">Student</th>
              <th className="bg-slate-50 px-4 py-3">Summary</th>
              {visibleDays.map((day) => (
                <th key={day.iso} data-day-key={day.iso} className="bg-slate-50 px-2 py-3 text-center">
                  <div>{day.label}</div>
                  <div className="text-[10px] font-normal">{day.weekday}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleDays.length + 2} className="py-6 text-slate-500">
                  Loading attendance records...
                </td>
              </tr>
            ) : null}

            {!loading && !visibleDays.length ? (
              <tr>
                <td colSpan={3} className="py-6 text-slate-500">
                  Select a valid date range within the chosen month to view attendance.
                </td>
              </tr>
            ) : null}

            {!loading &&
              visibleStudents.map((student) => {
                const studentRecords = filteredItems.filter((item) => item.studentId === student.studentId);
                const summary = calculatePercentage(studentRecords, activeRange.start, activeRange.end);

                return (
                  <tr key={student.studentId}>
                    <td className="sticky left-0 z-10 rounded-l-2xl bg-white px-4 py-3 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setSelectedProfile(student)}
                        className="text-left font-semibold text-slate-900 transition hover:text-teal-700"
                      >
                        {student.fullName}
                      </button>
                      <p className="text-xs text-slate-500">
                        {student.studentId} | Sem {student.semester} | Sec {student.section}
                      </p>
                    </td>
                    <td className="bg-white px-4 py-3 shadow-sm">
                      <p className="font-semibold text-slate-900">{summary.percentage}% present</p>
                      <p className="text-xs text-slate-500">
                        {summary.presentDays} / {summary.workingDays} working days
                      </p>
                    </td>
                    {visibleDays.map((day) => {
                      const record = recordsByStudentAndDate[`${student.studentId}-${day.iso}`];
                      const status = record?.status || (day.isSunday ? "holiday" : "");
                      const isFuture = day.iso > todayKey;
                      const canEditDay = canEdit && !isFuture;

                      return (
                        <td key={day.iso} className="bg-white px-1 py-2 text-center shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleCellClick(student, day)}
                            className={`h-8 w-8 rounded-full text-xs font-bold transition ${getStatusStyles(status)} ${
                              canEditDay ? "hover:scale-105" : "cursor-default opacity-70"
                            }`}
                            disabled={!canEditDay}
                            title={isFuture ? "Future date is locked" : status || "No status"}
                          >
                            {status === "present" ? "P" : status === "absent" ? "A" : status === "holiday" ? "H" : "-"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(selectedProfile)} onClose={() => setSelectedProfile(null)} fullWidth maxWidth="sm">
        <DialogTitle>Student Profile</DialogTitle>
        <DialogContent>
          {selectedProfile ? (
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {[
                ["Full Name", selectedProfile.fullName],
                ["Student ID", selectedProfile.studentId],
                ["Department", selectedProfile.department],
                ["Semester", selectedProfile.semester],
                ["Section", selectedProfile.section],
                ["Email", selectedProfile.email],
                ["Phone", selectedProfile.phone],
                ["SGPA", selectedProfile.sgpa],
                ["CGPA", selectedProfile.cgpa],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{value || "-"}</p>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSelectedProfile(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
