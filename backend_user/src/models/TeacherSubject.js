import mongoose from "mongoose";

const teacherSubjectSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    credits: { type: Number, required: true },
    kind: { type: String, required: true, enum: ["Theory", "Lab"] },
    facultyName: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("TeacherSubject", teacherSubjectSchema);
