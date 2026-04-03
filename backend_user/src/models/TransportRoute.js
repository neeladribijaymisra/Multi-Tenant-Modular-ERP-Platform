import mongoose from "mongoose";

const transportRouteSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    routeCode: { type: String, required: true, unique: true },
    busNumber: { type: String, required: true },
    city: { type: String, required: true },
    routeName: { type: String, required: true },
    busType: { type: String, required: true, enum: ["AC", "Non AC"] },
    capacity: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    pickupPoints: [{ type: String }],
    monthlyFee: { type: Number, required: true },
    routeStatus: { type: String, default: "Active", enum: ["Active", "Full"] },
  },
  { timestamps: true },
);

export default mongoose.model("TransportRoute", transportRouteSchema);
