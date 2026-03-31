import mongoose from 'mongoose';

const financeTransactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['Tuition', 'Salary', 'Maintenance', 'Research', 'Administration', 'Payroll', 'Vendor Payment', 'Grant', 'Scholarship', 'Other'],
      default: 'Other',
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Completed', 'Pending'],
      default: 'Pending',
    },
    entityCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

financeTransactionSchema.index({ date: -1 });
financeTransactionSchema.index({ category: 1, type: 1, status: 1 });

const FinanceTransaction = mongoose.model('FinanceTransaction', financeTransactionSchema);

export default FinanceTransaction;
