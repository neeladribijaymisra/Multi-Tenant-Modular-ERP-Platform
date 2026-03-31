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
      existingItem?.[field.name] ?? defaultValues[field.name] ?? "";
    return accumulator;
  }, {});
}

export default function CalendarSection({
  section,
  items,
  loading,
  error,
  active,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [activeYear, setActiveYear] = useState(2026);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [actionError, setActionError] = useState("");

  const yearItems = useMemo(
    () =>
      items
        .filter((item) => Number(item.year) === activeYear)
        .sort((left, right) => new Date(left.eventDate) - new Date(right.eventDate)),
    [activeYear, items],
  );

  function openCreateDialog() {
    setEditingItem(null);
    setForm(getInitialForm(section.fields, { year: activeYear }, null));
    setActionError("");
    setDialogOpen(true);
  }

  function openEditDialog(item) {
    setEditingItem(item);
    setForm(getInitialForm(section.fields, {}, item));
    setActionError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setActionError("");
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingItem) {
        await onUpdate(section, editingItem._id, form);
      } else {
        await onCreate(section, form);
      }

      closeDialog();
    } catch (submitError) {
      setActionError(submitError.message);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Delete "${item.eventName}" from the calendar?`);

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
          {[2026, 2027].map((year) => (
            <Button
              key={year}
              variant={activeYear === year ? "contained" : "outlined"}
              onClick={() => setActiveYear(year)}
            >
              {year}
            </Button>
          ))}
          <Button variant="outlined" onClick={() => onRefresh(section)}>
            Refresh
          </Button>
          {section.permissions.create ? (
            <Button variant="contained" color="primary" onClick={openCreateDialog}>
              {section.createLabel || "Add Event"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-sm text-slate-500">Loading calendar events...</p> : null}

        {!loading && !yearItems.length ? (
          <p className="text-sm text-slate-500">No events planned for {activeYear} yet.</p>
        ) : null}

        {!loading
          ? yearItems.map((item) => (
              <div
                key={item._id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                  {item.eventDate}
                </p>
                <h4 className="mt-3 text-lg font-extrabold text-slate-950">{item.eventName}</h4>
                <p className="mt-2 text-sm text-slate-600">{item.eventType}</p>
                <p className="mt-1 text-sm text-slate-600">{item.venue}</p>
                <p className="mt-1 text-sm text-slate-600">Coordinator: {item.coordinator}</p>
                <p className="mt-1 text-sm text-slate-600">Audience: {item.audience}</p>
                {section.permissions.edit || section.permissions.delete ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.permissions.edit ? (
                      <Button size="small" variant="outlined" onClick={() => openEditDialog(item)}>
                        Edit
                      </Button>
                    ) : null}
                    {section.permissions.delete ? (
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(item)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          : null}
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingItem ? `Edit ${section.title}` : section.createLabel || section.title}</DialogTitle>
          <DialogContent>
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              {section.fields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  select={Boolean(field.options)}
                  type={field.type === "date" ? "date" : field.type || "text"}
                  value={form[field.name] ?? ""}
                  required={field.required}
                  onChange={(event) => updateField(field.name, event.target.value)}
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
            <Button type="submit" variant="contained">
              {editingItem ? "Save Changes" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </section>
  );
}
