import mongoose from "mongoose";

const hostelAllocationSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    roomCode: { type: String, required: true },
    hostelName: { type: String, required: true },
    hostelCategory: { type: String, required: true },
    floorNumber: { type: Number, required: true },
    roomNumber: { type: String, required: true },
    roomType: { type: String, required: true },
    bedNumber: { type: String, required: true },
    annualFee: { type: Number, required: true },
    paymentStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Paid", "Installment"],
    },
    allocationStatus: {
      type: String,
      default: "Active",
      enum: ["Active", "Cancelled"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("HostelAllocation", hostelAllocationSchema);
