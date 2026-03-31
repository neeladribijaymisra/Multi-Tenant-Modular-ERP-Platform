import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accept", "reject"],
      default: "pending",
    },
    rejectReason: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("LeaveRequest", leaveRequestSchema);
