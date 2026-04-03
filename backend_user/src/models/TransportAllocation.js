import mongoose from "mongoose";

const transportAllocationSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    routeCode: { type: String, required: true },
    busNumber: { type: String, required: true },
    city: { type: String, required: true },
    routeName: { type: String, required: true },
    pickupPoint: { type: String, required: true },
    seatNumber: { type: String, required: true },
    monthlyFee: { type: Number, required: true },
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

export default mongoose.model("TransportAllocation", transportAllocationSchema);
