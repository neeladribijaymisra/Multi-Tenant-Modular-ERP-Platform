import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    classId: { type: String, required: true }, // Reference to ClassSchedule or similar
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    department: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, required: true },
    attachments: [{ type: String }], // URLs or file paths
    submissions: [{
      studentId: { type: String, required: true },
      studentName: { type: String, required: true },
      content: { type: String, default: "" },
      attachments: [{ type: String }],
      submittedAt: { type: Date, default: Date.now },
      grade: { type: Number, default: null },
      feedback: { type: String, default: "" },
      aiAnalysis: { type: String, default: "" }, // AI detection results
    }],
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true },
);

assignmentSchema.index({ tenantSlug: 1, classId: 1, dueDate: 1 });

export default mongoose.model("Assignment", assignmentSchema);