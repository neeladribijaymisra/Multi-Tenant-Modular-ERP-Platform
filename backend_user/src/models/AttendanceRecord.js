import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true, index: true },
    monthLabel: { type: String, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "holiday"],
      required: true,
    },
    teacherUsername: { type: String, default: "" },
    teacherName: { type: String, default: "" },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

attendanceRecordSchema.index({ tenantSlug: 1, studentId: 1, date: 1 }, { unique: true });

export default mongoose.model("AttendanceRecord", attendanceRecordSchema);
