import mongoose from "mongoose";

const studentProgressSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    semester: { type: Number, required: true },
    subjectCode: { type: String, required: true },
    subjectName: { type: String, default: "" },
    attendance: { type: Number, required: true },
    marks: { type: Number, required: true },
    grade: { type: String, default: "" },
    projectTitle: { type: String, default: "" },
    projectType: { type: String, enum: ["Individual", "Group", ""], default: "" },
    projectScore: { type: Number, default: 0 },
    teamMembers: { type: [String], default: [] },
    remarks: { type: String, default: "" },
    advisorFlag: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("StudentProgress", studentProgressSchema);
