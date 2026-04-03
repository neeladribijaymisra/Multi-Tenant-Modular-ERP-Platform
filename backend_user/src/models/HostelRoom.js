import mongoose from "mongoose";

const hostelRoomSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    roomCode: { type: String, required: true, unique: true },
    hostelName: { type: String, required: true },
    hostelCategory: { type: String, required: true, enum: ["Boys", "Girls"] },
    floorNumber: { type: Number, required: true },
    roomNumber: { type: String, required: true },
    roomType: {
      type: String,
      required: true,
      enum: ["AC 2 Bed", "AC 4 Bed", "Non AC 2 Bed", "Non AC 4 Bed"],
    },
    totalBeds: { type: Number, required: true },
    availableBeds: { type: Number, required: true },
    bookedBeds: [{ type: String }],
    annualFee: { type: Number, required: true },
    availabilityStatus: { type: String, default: "Available", enum: ["Available", "Full"] },
  },
  { timestamps: true },
);

export default mongoose.model("HostelRoom", hostelRoomSchema);
