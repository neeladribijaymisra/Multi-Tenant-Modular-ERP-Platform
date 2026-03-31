import mongoose from 'mongoose';

const curriculumPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    program: {
      type: String,
      required: [true, 'Program is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Archived'],
      default: 'Draft',
    },
    coursesCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    reviewCycle: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  },
  { timestamps: true }
);

curriculumPlanSchema.index({ department: 1, academicYear: 1, semester: 1 });
curriculumPlanSchema.index({ title: 'text', program: 'text', notes: 'text' });

const CurriculumPlan = mongoose.model('CurriculumPlan', curriculumPlanSchema);
export default CurriculumPlan;
