import mongoose from 'mongoose';

const allowancesSchema = new mongoose.Schema(
  {
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    travelAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    extraShiftPay: { type: Number, default: 0 },
  },
  { _id: false }
);

const deductionsSchema = new mongoose.Schema(
  {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    lossOfPayAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    totalWorkingDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 30 },
    leaveTaken: { type: Number, default: 0 },
    lossOfPay: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    extraShiftPay: { type: Number, default: 0 },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    preparedBy: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    approvedBy: { type: String, default: '' },
    approvalDate: { type: Date, default: null },
    remarks: { type: String, default: '' },
    rejectedBy: { type: String, default: '' },
    rejectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const payslipSchema = new mongoose.Schema(
  {
    generated: { type: Boolean, default: false },
    generatedAt: { type: Date, default: null },
    emailedAt: { type: Date, default: null },
    downloadCount: { type: Number, default: 0 },
    lastGeneratedBy: { type: String, default: '' },
  },
  { _id: false }
);

const payrollSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    employeeEmail: { type: String, trim: true, lowercase: true, default: '' },
    department: { type: String, required: [true, 'Department is required'], trim: true, index: true },
    designation: { type: String, required: [true, 'Designation is required'], trim: true },
    avatar: { type: String, default: null },
    salaryType: {
      type: String,
      enum: ['Monthly', 'Hourly', 'Contract'],
      default: 'Monthly',
      index: true,
    },
    basicSalary: { type: Number, default: 0 },
    allowances: { type: allowancesSchema, default: () => ({}) },
    deductions: { type: deductionsSchema, default: () => ({}) },
    attendance: { type: attendanceSchema, default: () => ({}) },
    grossSalary: { type: Number, default: 0 },
    totalAllowances: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    payrollStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Processed', 'Paid', 'Failed', 'On Hold'],
      default: 'Draft',
      index: true,
    },
    month: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, index: true },
    effectiveFromDate: { type: Date, default: Date.now },
    paymentDate: { type: Date, default: null },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    bankAccountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    approval: { type: approvalSchema, default: () => ({}) },
    remarks: { type: String, default: '' },
    payslip: { type: payslipSchema, default: () => ({}) },
    lastProcessedAt: { type: Date, default: null },
    timeline: {
      type: [
        {
          label: String,
          by: String,
          at: Date,
          note: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employeeName: 'text', employeeId: 'text', department: 'text', designation: 'text' });
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
