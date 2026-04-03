import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_THEME_MAP = {
  Monday: {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50",
    badge: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  },
  Tuesday: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  },
  Wednesday: {
    card: "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
    badge: "bg-violet-100 text-violet-800 ring-1 ring-violet-200",
  },
  Thursday: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50",
    badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  },
  Friday: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50",
    badge: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  },
  Saturday: {
    card: "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50",
    badge: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200",
  },
  Sunday: {
    card: "border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-50",
    badge: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
  },
};

function getInitialForm(fields, defaultValues = {}, existingItem = null) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] =
      existingItem?.[field.name] ?? defaultValues[field.name] ?? (field.type === "number" ? 0 : "");
    return accumulator;
  }, { ...defaultValues });
}

function shouldShowField(field, form) {
  if (!field.showWhen) {
    return true;
  }

  if (field.showWhen.oneOf) {
    return field.showWhen.oneOf.includes(form[field.showWhen.field]);
  }

  return form[field.showWhen.field] === field.showWhen.equals;
}

function getAudienceFieldLabel(audienceType) {
  if (audienceType === "department") {
    return "Select Department";
  }

  if (audienceType === "semester") {
    return "Select Semester";
  }

  if (audienceType === "section") {
    return "Select Section";
  }

  if (audienceType === "specific-emails") {
    return "Select Student Email(s)";
  }

  return "Audience Value";
}

function getAudienceFieldOptions(field, form) {
  if (field.name !== "audienceValue" || !field.optionGroups) {
    return field.options || [];
  }

  return field.optionGroups[form.audienceType] || [];
}

function hasRequiredValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return true;
  }

  return String(value ?? "").trim() !== "";
}

function getStatusStyles(value) {
  if (value === "accept") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (value === "sent") {
    return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
  }

  if (value === "reject") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  if (value === "failed") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }

  if (value === "pending") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function getSemesterAvatarStyles(semester) {
  const sem = Number(semester);

  if (sem === 2) return "bg-sky-100 text-sky-800 ring-2 ring-sky-200";
  if (sem === 4) return "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200";
  if (sem === 6) return "bg-violet-100 text-violet-800 ring-2 ring-violet-200";
  if (sem === 8) return "bg-rose-100 text-rose-800 ring-2 ring-rose-200";
  return "bg-slate-200 text-slate-700 ring-2 ring-slate-300";
}

function formatCellValue(field, value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (field.name === "status" || field.name === "deliveryStatus") {
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyles(value)}`}
      >
        {value || "-"}
      </span>
    );
  }

  if (field.name === "sentAt" && value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  if (field.name === "fullName" && value) {
    return (
      <div className="flex items-center gap-3">
        {field.photoFieldValue ? (
          <img
            src={field.photoFieldValue}
            alt={value}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-teal-100"
          />
        ) : (
          <div
            className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${getSemesterAvatarStyles(
              field.semesterValue,
            )}`}
          >
            {String(value)
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0] || "")
              .join("")
              .toUpperCase()}
          </div>
        )}
        <span>{value}</span>
      </div>
    );
  }

  return value ?? "-";
}

export default function ResourceSection({
  section,
  items,
  session,
  allResources,
  progressSection,
  loading,
  error,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
  active,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [profileItem, setProfileItem] = useState(null);
  const [profileForm, setProfileForm] = useState({
    subjectCode: "",
    subjectName: "",
    attendance: 0,
    marks: 0,
    grade: "",
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [form, setForm] = useState({});
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visibleFields = useMemo(() => section.tableFields || section.fields.slice(0, 5), [section.fields, section.tableFields]);
  const groupedClassItems = useMemo(() => {
    if (section.key !== "classes") {
      return [];
    }

    const grouped = DAY_ORDER.map((day) => ({
      day,
      items: items.filter((item) => item.day === day),
    }));

    return grouped
      .map((group) => {
        const aggregate = new Map();

        group.items.forEach((item) => {
          const aggregateKey = [
            item.subjectCode || "",
            item.subjectName || item.className || "",
            item.startTime || "",
            item.endTime || "",
            item.facultyName || "",
            item.kind || "",
          ].join("|");

          if (!aggregate.has(aggregateKey)) {
            aggregate.set(aggregateKey, {
              ...item,
              aggregateKey,
              sectionSet: new Set(item.section ? [item.section] : []),
              roomSet: new Set(item.room ? [item.room] : []),
            });
            return;
          }

          const existing = aggregate.get(aggregateKey);
          if (item.section) existing.sectionSet.add(item.section);
          if (item.room) existing.roomSet.add(item.room);
        });

        return {
          ...group,
          items: [...aggregate.values()].map((item) => ({
            ...item,
            sectionsMerged: [...item.sectionSet].sort(),
            roomsMerged: [...item.roomSet].sort(),
          })),
        };
      })
      .filter((group) => group.items.length > 0);
  }, [items, section.key]);

  function openCreateDialog() {
    setEditingItem(null);
    setForm(getInitialForm(section.fields, section.defaultValues));
    setActionError("");
    setDialogOpen(true);
  }

  function openEditDialog(item) {
    setEditingItem(item);
    setForm(getInitialForm(section.fields, section.defaultValues, item));
    setActionError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setActionError("");
  }

  function updateField(name, value, type) {
    setForm((current) => ({
      ...current,
      [name]: type === "number" ? Number(value) : value,
    }));
  }

  function openProfileDialog(item) {
    const studentId = item.studentId;
    const masterStudents = [
      ...(allResources?.students || []),
      ...(allResources?.studentRegistry || []),
      ...(allResources?.profile || []),
    ];
    const resolved =
      masterStudents.find((student) => student.studentId === studentId) ||
      masterStudents.find((student) => student.username && student.username === item.username) ||
      item;

    const semesterSubjects = getCurrentSemesterSubjects(resolved);
    const firstSubject = semesterSubjects[0] || null;

    setProfileForm({
      subjectCode: firstSubject?.subjectCode || "",
      subjectName: firstSubject?.subjectName || "",
      attendance: 0,
      marks: 0,
      grade: "",
    });
    setProfileMessage("");
    setProfileItem(resolved);
  }

  function getCurrentSemesterSubjects(student) {
    if (!student) {
      return [];
    }

    const semester = Number(student.semester);
    const department = String(student.department || "").toUpperCase();
    const sectionValue = String(student.section || "").toUpperCase();

    const directSubjects = (allResources?.subjects || [])
      .filter(
        (item) =>
          String(item.department || "").toUpperCase() === department &&
          Number(item.semester) === semester,
      )
      .map((item) => ({
        subjectCode: item.subjectCode,
        subjectName: item.subjectName || item.className || "",
      }));

    if (directSubjects.length) {
      return [...new Map(directSubjects.map((item) => [item.subjectCode, item])).values()];
    }

    const timetableSubjects = (allResources?.timetables || [])
      .filter(
        (item) =>
          String(item.department || "").toUpperCase() === department &&
          Number(item.semester) === semester &&
          String(item.section || "").toUpperCase() === sectionValue &&
          item.subjectCode,
      )
      .map((item) => ({
        subjectCode: item.subjectCode,
        subjectName: item.subjectName || "",
      }));

    return [...new Map(timetableSubjects.map((item) => [item.subjectCode, item])).values()];
  }

  async function handleAddProgressFromProfile() {
    if (!profileItem || !profileItem.studentId || !progressSection) {
      return;
    }

    if (!profileForm.subjectCode || !profileForm.subjectName) {
      setProfileMessage("Please choose a subject before saving marks.");
      return;
    }

    setProfileSubmitting(true);
    setProfileMessage("");

    try {
      await onCreate(progressSection, {
        studentId: profileItem.studentId,
        semester: Number(profileItem.semester),
        subjectCode: profileForm.subjectCode,
        subjectName: profileForm.subjectName,
        attendance: Number(profileForm.attendance || 0),
        marks: Number(profileForm.marks || 0),
        grade: profileForm.grade || "",
      });

      setProfileMessage("Marks added successfully.");
    } catch (submitError) {
      setProfileMessage(submitError.message || "Unable to add marks.");
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");

    try {
      const visibleRequiredFields = section.fields
        .filter((field) => field.name !== "_id")
        .filter((field) => !field.hideOnCreate || editingItem)
        .filter((field) => !field.hideOnEdit || !editingItem)
        .filter((field) => shouldShowField(field, form))
        .filter((field) => field.required || (field.showWhen && shouldShowField(field, form)));

      const missingField = visibleRequiredFields.find((field) => !hasRequiredValue(form[field.name]));
      if (missingField) {
        setActionError(`${missingField.label} is required.`);
        setSubmitting(false);
        return;
      }

      let result;

      if (editingItem) {
        result = await onUpdate(section, editingItem._id, form);
      } else {
        result = await onCreate(section, form);
      }

      if (result?.generatedPassword) {
        window.alert(`Teacher account created. Generated password: ${result.generatedPassword}`);
      }

      closeDialog();
    } catch (submitError) {
      setActionError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Delete this record from ${section.title}?`);

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(section, item._id);
    } catch (deleteError) {
      setActionError(deleteError.message);
    }
  }

  async function handlePhotoRemove(item) {
    try {
      await onUpdate(section, item._id, { photoDataUrl: "" });
    } catch (updateError) {
      setActionError(updateError.message);
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
          <Button variant="outlined" onClick={() => onRefresh(section)}>
            Refresh
          </Button>
          {section.permissions.create ? (
            <Button variant="contained" onClick={openCreateDialog}>
              {section.createLabel || "Add Record"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        {section.key === "classes" ? (
          <>
            {loading ? <p className="py-6 text-slate-500">Loading records...</p> : null}
            {!loading && !groupedClassItems.length ? <p className="py-6 text-slate-500">No records yet.</p> : null}

            {!loading && groupedClassItems.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {groupedClassItems.map((group, groupIndex) => {
                  const theme = DAY_THEME_MAP[group.day] || DAY_THEME_MAP.Sunday;

                  return (
                    <div
                      key={group.day}
                      className={`animate-card-rise rounded-[26px] border p-4 shadow-md shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
                      style={{ animationDelay: `${groupIndex * 40}ms` }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${theme.badge}`}>
                          {group.day}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{group.items.length} classes</span>
                      </div>

                      <div className="space-y-2.5">
                        {group.items.map((item) => (
                          <div
                            key={item._id || item.aggregateKey}
                            className="rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm backdrop-blur-sm transition duration-300 hover:border-teal-200 hover:bg-white"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {item.subjectName || item.className || "-"}
                                </p>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  {item.kind || "Theory"} | {item.startTime} - {item.endTime}
                                </p>
                              </div>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {(item.roomsMerged && item.roomsMerged.length ? item.roomsMerged.join(", ") : item.room) || "Room TBA"}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-xs text-slate-600">
                                {item.facultyName || "Faculty TBA"}
                                {item.sectionsMerged?.length ? ` | Sections: ${item.sectionsMerged.join(", ")}` : ""}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {section.permissions.edit ? (
                                  <Button size="small" variant="outlined" onClick={() => openEditDialog(item)}>
                                    Edit
                                  </Button>
                                ) : null}
                                {section.permissions.delete ? (
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleDelete(item)}
                                  >
                                    Delete
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-200">
                {visibleFields.map((field) => (
                  <th key={field.name} className="pb-3 pr-4 font-semibold">
                    {field.label}
                  </th>
                ))}
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleFields.length + 1} className="py-6 text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : null}

              {!loading && !items.length ? (
                <tr>
                  <td colSpan={visibleFields.length + 1} className="py-6 text-slate-500">
                    No records yet.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? items.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                      {visibleFields.map((field) => (
                        <td key={field.name} className="py-4 pr-4 text-slate-700">
                          {section.enableProfileView && ["fullName", "studentName"].includes(field.name) ? (
                            <button
                              type="button"
                              className="font-semibold text-slate-900 transition hover:text-teal-700"
                              onClick={() => openProfileDialog(item)}
                            >
                              {item[field.name] || "-"}
                            </button>
                          ) : (
                            formatCellValue(
                              { ...field, photoFieldValue: item.photoDataUrl, semesterValue: item.semester },
                              item[field.name],
                            )
                          )}
                        </td>
                      ))}
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {section.permissions.edit ? (
                            <Button size="small" variant="outlined" onClick={() => openEditDialog(item)}>
                              Edit
                            </Button>
                          ) : null}
                          {section.permissions.delete ? (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </Button>
                          ) : null}
                          {section.allowPhotoRemoval && item.photoDataUrl ? (
                            <Button
                              size="small"
                              color="warning"
                              variant="outlined"
                              onClick={() => handlePhotoRemove(item)}
                            >
                              Remove Photo
                            </Button>
                          ) : null}
                          {!section.permissions.edit && !section.permissions.delete ? (
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              View only
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingItem ? `Edit ${section.title}` : section.createLabel || section.title}</DialogTitle>
          <DialogContent>
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              {section.fields
                .filter((field) => field.name !== "_id")
                .filter((field) => !field.hideOnCreate || editingItem)
                .filter((field) => !field.hideOnEdit || !editingItem)
                .filter((field) => shouldShowField(field, form))
                .map((field) => {
                  const dynamicOptions = getAudienceFieldOptions(field, form);
                  const dynamicLabel =
                    field.name === "audienceValue" ? getAudienceFieldLabel(form.audienceType) : field.label;

                  if (field.autocompleteMultiple && form.audienceType === "specific-emails") {
                    const selectedValues = String(form[field.name] || "")
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean);

                    return (
                      <Autocomplete
                        key={field.name}
                        multiple
                        options={dynamicOptions}
                        value={selectedValues}
                        onChange={(_event, values) => updateField(field.name, values.join(", "), field.type)}
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={dynamicLabel}
                            placeholder="Search and choose email ids"
                            required={false}
                            fullWidth
                          />
                        )}
                      />
                    );
                  }

                  if (field.autocomplete) {
                    return (
                      <Autocomplete
                        key={field.name}
                        options={dynamicOptions}
                        value={form[field.name] || null}
                        onChange={(_event, value) => updateField(field.name, value || "", field.type)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={dynamicLabel}
                            placeholder={field.placeholder || "Search and select"}
                            required={false}
                            fullWidth
                          />
                        )}
                      />
                    );
                  }

                  return (
                    <TextField
                      key={field.name}
                      label={dynamicLabel}
                      select={Boolean(dynamicOptions.length)}
                      type={field.type === "date" ? "date" : field.type || "text"}
                      value={form[field.name] ?? ""}
                      required={Boolean(field.required || (field.showWhen && shouldShowField(field, form)))}
                      disabled={Boolean(field.disabled)}
                      multiline={Boolean(field.multiline)}
                      minRows={field.multiline ? 3 : undefined}
                      onChange={(event) => updateField(field.name, event.target.value, field.type)}
                      InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                      fullWidth
                    >
                      {[...dynamicOptions]
                        .concat(
                          dynamicOptions.includes(form[field.name]) || !form[field.name] ? [] : [form[field.name]],
                        )
                        .filter((option, index, options) => options.indexOf(option) === index)
                        .map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                    </TextField>
                  );
                })}
            </div>
            {actionError ? <p className="mt-4 text-sm font-semibold text-rose-600">{actionError}</p> : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : editingItem ? "Save Changes" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(profileItem)} onClose={() => setProfileItem(null)} fullWidth maxWidth="sm">
        <DialogTitle>Student Profile</DialogTitle>
        <DialogContent>
          {profileItem ? (
            <>
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {[
                  ["Full Name", profileItem.fullName || profileItem.studentName],
                  ["Student ID", profileItem.studentId],
                  ["Username", profileItem.username],
                  ["Department", profileItem.department],
                  ["Semester", profileItem.semester],
                  ["Section", profileItem.section],
                  ["Status", profileItem.status],
                  ["Email", profileItem.email],
                  ["Phone", profileItem.phone],
                  ["SGPA", profileItem.sgpa],
                  ["CGPA", profileItem.cgpa],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{value || "-"}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Current Semester Subjects
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getCurrentSemesterSubjects(profileItem).length ? (
                    getCurrentSemesterSubjects(profileItem).map((item) => (
                      <span
                        key={item.subjectCode}
                        className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800"
                      >
                        {item.subjectCode} - {item.subjectName}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-600">No subjects found for this semester.</span>
                  )}
                </div>
              </div>

              {session?.role === "teacher" && progressSection ? (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Add Marks For This Student
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <TextField
                      select
                      label="Subject"
                      value={profileForm.subjectCode}
                      onChange={(event) => {
                        const subject = getCurrentSemesterSubjects(profileItem).find(
                          (item) => item.subjectCode === event.target.value,
                        );
                        setProfileForm((current) => ({
                          ...current,
                          subjectCode: subject?.subjectCode || "",
                          subjectName: subject?.subjectName || "",
                        }));
                      }}
                      fullWidth
                    >
                      {getCurrentSemesterSubjects(profileItem).map((item) => (
                        <MenuItem key={item.subjectCode} value={item.subjectCode}>
                          {item.subjectCode} - {item.subjectName}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Marks"
                      type="number"
                      value={profileForm.marks}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, marks: Number(event.target.value) }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Attendance %"
                      type="number"
                      value={profileForm.attendance}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, attendance: Number(event.target.value) }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Grade"
                      value={profileForm.grade}
                      onChange={(event) => setProfileForm((current) => ({ ...current, grade: event.target.value }))}
                      fullWidth
                    />
                  </div>
                  {profileMessage ? <p className="mt-3 text-sm font-semibold text-teal-700">{profileMessage}</p> : null}
                  <div className="mt-3">
                    <Button variant="contained" onClick={handleAddProgressFromProfile} disabled={profileSubmitting}>
                      {profileSubmitting ? "Saving..." : "Add Marks"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setProfileItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
