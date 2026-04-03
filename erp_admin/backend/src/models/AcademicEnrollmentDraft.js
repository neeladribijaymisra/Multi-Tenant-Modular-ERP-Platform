import mongoose from 'mongoose';

const uploadedAssetSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
    content: { type: String, default: '' },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  { _id: false }
);

const documentAssetSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Previous Transcript', 'ID Proof', 'Medical Certificate'],
      required: true,
    },
    file: uploadedAssetSchema,
  },
  { _id: false }
);

const academicEnrollmentDraftSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    personalDetails: {
      fullLegalName: { type: String, trim: true, default: '' },
      preferredName: { type: String, trim: true, default: '' },
      rollNumber: { type: String, trim: true, uppercase: true, default: '' },
      dateOfBirth: { type: Date, default: null },
      gender: { type: String, enum: ['', 'Male', 'Female', 'Other', 'Prefer not to say'], default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    academicInfo: {
      programId: { type: String, trim: true, default: '' },
      programName: { type: String, trim: true, default: '' },
      department: { type: String, trim: true, default: '' },
      year: { type: String, trim: true, default: '' },
      semester: { type: Number, min: 1, max: 8, default: null },
      section: { type: String, trim: true, default: 'A' },
      admissionDate: { type: Date, default: null },
      feePerSemester: { type: Number, min: 0, default: 0 },
      durationYears: { type: Number, min: 0, default: 0 },
    },
    contactInfo: {
      guardianName: { type: String, trim: true, default: '' },
      guardianRelation: { type: String, trim: true, default: '' },
      guardianPhone: { type: String, trim: true, default: '' },
      guardianEmail: { type: String, trim: true, lowercase: true, default: '' },
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    profilePhoto: uploadedAssetSchema,
    documents: [documentAssetSchema],
  },
  { timestamps: true }
);

const AcademicEnrollmentDraft = mongoose.model('AcademicEnrollmentDraft', academicEnrollmentDraftSchema);

export default AcademicEnrollmentDraft;
