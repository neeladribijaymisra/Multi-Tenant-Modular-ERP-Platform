import mongoose from "mongoose";

const teacherAlertSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    alertType: {
      type: String,
      enum: ["Exam", "Event", "Information", "Urgent"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    targetAudience: { type: String, required: true, trim: true },
    audienceType: {
      type: String,
      enum: ["all-students", "department", "semester", "section", "specific-emails"],
      default: "all-students",
    },
    audienceValue: { type: String, default: "", trim: true },
    teacherEmail: { type: String, required: true, trim: true },
    recipientEmails: [{ type: String, trim: true }],
    recipientCount: { type: Number, default: 0 },
    deliveryStatus: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    sentAt: { type: Date, default: Date.now },
    lastError: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("TeacherAlert", teacherAlertSchema);
