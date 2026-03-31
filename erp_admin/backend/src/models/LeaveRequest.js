import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required'],
    },
    leaveType: {
      type: String,
      enum: ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity Leave', 'Duty Leave'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    days: {
      type: Number,
      min: 1,
      default: 1,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: '',
    },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ teacher: 1, status: 1, startDate: 1 });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;
