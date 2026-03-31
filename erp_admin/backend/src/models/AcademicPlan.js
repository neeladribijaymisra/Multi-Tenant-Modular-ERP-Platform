import mongoose from 'mongoose';

const academicPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    planType: {
      type: String,
      enum: ['Academic Calendar', 'Assessment Plan', 'Program Review', 'Department Plan', 'Record Update'],
      required: [true, 'Plan type is required'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    recordStatus: {
      type: String,
      enum: ['Pending Update', 'In Review', 'Recorded', 'Archived'],
      default: 'Pending Update',
    },
    effectiveDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  },
  { timestamps: true }
);

academicPlanSchema.index({ department: 1, academicYear: 1, approvalStatus: 1 });
academicPlanSchema.index({ title: 'text', notes: 'text', planType: 'text' });

const AcademicPlan = mongoose.model('AcademicPlan', academicPlanSchema);
export default AcademicPlan;
