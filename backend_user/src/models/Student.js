import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    photoDataUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accept"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Student", studentSchema);
