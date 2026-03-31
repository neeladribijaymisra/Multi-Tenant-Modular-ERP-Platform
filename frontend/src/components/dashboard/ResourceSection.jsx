import {
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
  }, {});
}

function formatCellValue(value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
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
  const [form, setForm] = useState({});
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visibleFields = useMemo(() => section.fields.slice(0, 5), [section.fields]);

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
                        {formatCellValue(item[field.name])}
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
                .map((field) => (
                  <TextField
                    key={field.name}
                    label={field.label}
                    select={Boolean(field.options)}
                    type={field.type === "date" ? "date" : field.type || "text"}
                    value={form[field.name] ?? ""}
                    required={field.required}
                    disabled={Boolean(field.disabled)}
                    multiline={Boolean(field.multiline)}
                    minRows={field.multiline ? 3 : undefined}
                    onChange={(event) => updateField(field.name, event.target.value, field.type)}
                    InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                    fullWidth
                  >
                    {field.options?.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
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
    </section>
  );
}
