import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    relationship: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    type: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const performanceNoteSchema = new mongoose.Schema(
  {
    note: { type: String, trim: true, required: true },
    author: { type: String, trim: true, default: 'HR Admin' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name cannot exceed 120 characters'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    dateOfBirth: { type: Date, default: null },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract', 'Intern'],
      default: 'Full Time',
      index: true,
    },
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required'],
      default: Date.now,
    },
    managerName: { type: String, trim: true, default: '' },
    salaryCTC: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive', 'Probation', 'Resigned'],
      default: 'Active',
      index: true,
    },
    profilePhoto: { type: String, default: '' },
    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },
    notes: { type: String, trim: true, default: '' },
    documents: { type: [documentSchema], default: [] },
    performanceNotes: { type: [performanceNoteSchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    resignationDate: { type: Date, default: null },
  },
  { timestamps: true }
);

employeeSchema.index({
  fullName: 'text',
  employeeId: 'text',
  email: 'text',
  department: 'text',
  designation: 'text',
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
