import mongoose from "mongoose";

const studentProgressSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    semester: { type: Number, required: true },
    subjectCode: { type: String, required: true },
    attendance: { type: Number, required: true },
    marks: { type: Number, required: true },
    remarks: { type: String, default: "" },
    advisorFlag: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("StudentProgress", studentProgressSchema);
