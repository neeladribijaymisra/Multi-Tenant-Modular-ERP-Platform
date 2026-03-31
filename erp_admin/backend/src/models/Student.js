import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────
    rollNo: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
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
    avatarMeta: {
      name: String,
      mimeType: String,
      size: Number,
      width: Number,
      height: Number,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    // ── Academic ────────────────────────────────────────────
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      required: true,
    },
    semester: { type: Number, min: 1, max: 8 },
    programId: { type: String, trim: true },
    programName: { type: String, trim: true },
    feePerSemester: { type: Number, min: 0, default: 0 },
    durationYears: { type: Number, min: 0, default: 0 },
    section: { type: String, default: 'A' },
    admissionDate: { type: Date, default: Date.now },
    graduationYear: { type: Number },
    cgpa: { type: Number, min: 0, max: 10, default: 0 },
    attendancePercent: { type: Number, min: 0, max: 100, default: 0 },

    // ── Status ──────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Graduated'],
      default: 'Active',
    },

    // ── Fee ─────────────────────────────────────────────────
    feeStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial', 'Overdue'],
      default: 'Pending',
    },

    // ── Guardian ────────────────────────────────────────────
    guardian: {
      name: String,
      relation: String,
      phone: String,
      email: String,
    },

    // ── Multi-tenancy placeholder ────────────────────────────
    documents: [
      {
        type: {
          type: String,
          enum: ['Previous Transcript', 'ID Proof', 'Medical Certificate'],
        },
        name: String,
        mimeType: String,
        size: Number,
        content: String,
      },
    ],
    enrollmentSource: { type: String, default: 'manual' },
    enrollmentDraftId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicEnrollmentDraft', default: null },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  },
  { timestamps: true }
);

// Indexes for fast search
studentSchema.index({ department: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ name: 'text', email: 'text', rollNo: 'text' });

const Student = mongoose.model('Student', studentSchema);
export default Student;
