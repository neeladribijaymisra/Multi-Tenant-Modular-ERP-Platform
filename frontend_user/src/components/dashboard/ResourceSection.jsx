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
          <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
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
  const [form, setForm] = useState({});
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visibleFields = useMemo(() => section.tableFields || section.fields.slice(0, 5), [section.fields, section.tableFields]);

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
    setProfileItem(item);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");

    try {
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
                            { ...field, photoFieldValue: item.photoDataUrl },
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
                            required={Boolean(field.required || (field.showWhen && shouldShowField(field, form)))}
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
                            required={Boolean(field.required || (field.showWhen && shouldShowField(field, form)))}
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
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {[
                ["Full Name", profileItem.fullName || profileItem.studentName],
                ["Student ID", profileItem.studentId],
                ["Department", profileItem.department],
                ["Semester", profileItem.semester],
                ["Section", profileItem.section],
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
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setProfileItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
