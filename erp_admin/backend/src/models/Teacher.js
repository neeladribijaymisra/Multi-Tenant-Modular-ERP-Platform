import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: [true, 'Faculty ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    avatar: { type: String, default: null },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    // ── Professional ────────────────────────────────────────
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Visiting Faculty'],
      required: true,
    },
    qualification: { type: String },
    specialization: { type: String },
    subjects: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },

    // ── Stats ────────────────────────────────────────────────
    rating: { type: Number, min: 0, max: 5, default: 0 },
    totalStudents: { type: Number, default: 0 },

    // ── Status ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Retired'],
      default: 'Active',
    },
    accountStatus: {
      type: String,
      enum: ['Pending Setup', 'Active', 'Password Reset Required', 'Disabled'],
      default: 'Pending Setup',
    },
    portalUsername: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    lastPasswordGeneratedAt: {
      type: Date,
      default: null,
    },

    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  },
  { timestamps: true }
);

teacherSchema.index({ department: 1 });
teacherSchema.index({ name: 'text', email: 'text', facultyId: 'text' });

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
