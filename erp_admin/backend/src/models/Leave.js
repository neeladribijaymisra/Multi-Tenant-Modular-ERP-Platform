import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave', 'Work From Home'],
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
    reason: { type: String, trim: true, default: '' },
    appliedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: { type: String, trim: true, default: '' },
    reviewNote: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, status: 1, startDate: 1 });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
