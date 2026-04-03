import mongoose from "mongoose";

const teacherAssignmentSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    teacherUsername: { type: String, required: true, index: true },
    teacherName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true },
  },
  { timestamps: true },
);

teacherAssignmentSchema.index(
  { tenantSlug: 1, teacherUsername: 1, semester: 1, section: 1, subjectCode: 1 },
  { unique: true },
);

export default mongoose.model("TeacherAssignment", teacherAssignmentSchema);
