import mongoose from "mongoose";

const academicRecordSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    recordType: { type: String, required: true },
    referenceNo: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    owner: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("AcademicRecord", academicRecordSchema);
