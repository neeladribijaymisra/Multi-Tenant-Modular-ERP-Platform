import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

function getInitialState() {
  return {
    title: "",
    description: "",
    classId: "",
    studentId: "",
    subjectCode: "",
    subjectName: "",
    semester: "",
    section: "",
    department: "",
    dueDate: "",
  };
}

export default function AssignmentForm({ open, onClose, onSubmit, classes, students = [] }) {
  const [formData, setFormData] = useState(getInitialState());

  const classOptions = useMemo(
    () =>
      (classes || [])
        .filter((item) => item?._id)
        .map((item) => ({
          id: item._id,
          label: `${item.subjectCode || "SUB"} | Sem ${item.semester || "-"} | Sec ${item.section || "-"} | ${item.day || ""} ${item.startTime || ""}-${item.endTime || ""}`,
          raw: item,
        })),
    [classes],
  );

  const studentOptions = useMemo(
    () =>
      (students || [])
        .filter((item) => item?._id)
        .map((item) => ({
          id: item._id,
          studentId: item.studentId,
          semester: item.semester,
          section: item.section,
          department: item.department,
          label: `${item.fullName || item.studentName || item.studentId} | ${item.studentId} | Sem ${item.semester} | Sec ${item.section}`,
        })),
    [students],
  );

  const sectionOptions = useMemo(() => {
    const selectedStudent = studentOptions.find((item) => item.studentId === formData.studentId);
    if (selectedStudent?.section) {
      return [String(selectedStudent.section).toUpperCase()];
    }

    const values = new Set(["A", "B", "C"]);
    (classes || []).forEach((item) => {
      if (item?.section) values.add(String(item.section).toUpperCase());
    });
    return [...values];
  }, [classes, formData.studentId, studentOptions]);

  const semesterOptions = useMemo(() => {
    const selectedStudent = studentOptions.find((item) => item.studentId === formData.studentId);
    if (selectedStudent?.semester) {
      return [Number(selectedStudent.semester)];
    }

    const values = new Set();
    (classes || []).forEach((item) => {
      if (item?.semester !== undefined && item?.semester !== null) {
        values.add(Number(item.semester));
      }
    });

    if (!values.size) {
      values.add(2);
      values.add(4);
      values.add(6);
      values.add(8);
    }

    return [...values].sort((a, b) => a - b);
  }, [classes, formData.studentId, studentOptions]);

  useEffect(() => {
    if (open) {
      setFormData(getInitialState());
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "classId") {
      const selected = classOptions.find((item) => item.id === value)?.raw;
      if (selected) {
        setFormData((current) => ({
          ...current,
          classId: value,
          subjectCode: selected.subjectCode || current.subjectCode,
          subjectName:
            selected.subjectName ||
            selected.className?.replace(/\s+(Theory|Lab)$/i, "") ||
            current.subjectName,
          semester: selected.semester ?? current.semester,
          section: selected.section || current.section,
          department: selected.department || current.department,
        }));
        return;
      }
    }

    if (name === "studentId") {
      const selectedStudent = studentOptions.find((item) => item.studentId === value);
      if (selectedStudent) {
        setFormData((current) => ({
          ...current,
          studentId: value,
          semester: selectedStudent.semester ?? current.semester,
          section: selectedStudent.section || current.section,
          department: selectedStudent.department || current.department,
        }));
        return;
      }
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = () => {
    if (
      !formData.title.trim() ||
      !formData.classId ||
      !formData.subjectCode.trim() ||
      !formData.subjectName.trim() ||
      !String(formData.semester).trim() ||
      !formData.section.trim() ||
      !formData.department.trim() ||
      !formData.dueDate
    ) {
      return;
    }

    onSubmit({
      ...formData,
      semester: Number(formData.semester),
      section: String(formData.section).toUpperCase(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      subjectCode: formData.subjectCode.trim(),
      subjectName: formData.subjectName.trim(),
      department: formData.department.trim().toUpperCase(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Assignment</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="dense"
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="dense"
          label="Description"
          name="description"
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
        />
        <TextField
          select
          fullWidth
          margin="dense"
          label="Class Slot"
          name="classId"
          value={formData.classId}
          onChange={handleChange}
          required
        >
          {classOptions.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          margin="dense"
          label="Student"
          name="studentId"
          value={formData.studentId}
          onChange={handleChange}
        >
          {studentOptions.map((item) => (
            <MenuItem key={item.id} value={item.studentId}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          margin="dense"
          label="Subject Code"
          name="subjectCode"
          value={formData.subjectCode}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="dense"
          label="Subject Name"
          name="subjectName"
          value={formData.subjectName}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="dense"
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        />
        <TextField
          select
          fullWidth
          margin="dense"
          label="Semester"
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          required
        >
          {semesterOptions.map((semester) => (
            <MenuItem key={semester} value={semester}>
              {semester}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          margin="dense"
          label="Section"
          name="section"
          value={formData.section}
          onChange={handleChange}
          required
        >
          {sectionOptions.map((section) => (
            <MenuItem key={section} value={section}>
              {section}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          margin="dense"
          type="datetime-local"
          label="Due Date"
          name="dueDate"
          InputLabelProps={{ shrink: true }}
          value={formData.dueDate}
          onChange={handleChange}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
