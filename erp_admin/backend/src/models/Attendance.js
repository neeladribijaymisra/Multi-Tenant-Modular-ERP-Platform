import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day'],
      default: 'Present',
    },
    checkInTime: { type: String, trim: true, default: '' },
    checkOutTime: { type: String, trim: true, default: '' },
    workingHours: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
