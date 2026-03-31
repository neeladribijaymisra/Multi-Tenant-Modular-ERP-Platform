import mongoose from "mongoose";

const classScheduleSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    subjectCode: { type: String, required: true },
    className: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, required: true },
    section: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("ClassSchedule", classScheduleSchema);
