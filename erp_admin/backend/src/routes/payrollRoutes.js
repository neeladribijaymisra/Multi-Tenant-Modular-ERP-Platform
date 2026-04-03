import express from 'express';
import { body } from 'express-validator';
import {
  approvePayroll,
  createSalaryStructure,
  exportPayrollReport,
  generateAllPayslips,
  generatePayslip,
  getPayrollRecord,
  getPayrollRecords,
  getPayrollSummary,
  markPayrollPaid,
  previewPayroll,
  processPayroll,
  rejectPayroll,
  updateSalaryStructure,
} from '../controllers/payrollController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

const salaryStructureValidation = [
  body('employeeName').trim().notEmpty().withMessage('Employee name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('salaryType').isIn(['Monthly', 'Hourly', 'Contract']).withMessage('Salary type must be Monthly, Hourly, or Contract'),
  body('basicSalary').isFloat({ min: 0 }).withMessage('Basic salary must be zero or more'),
];

router.get('/summary', getPayrollSummary);
router.get('/records', getPayrollRecords);
router.get('/export', exportPayrollReport);
router.get('/records/:id', getPayrollRecord);
router.post('/salary-structures', salaryStructureValidation, validate, createSalaryStructure);
router.put('/salary-structures/:id', salaryStructureValidation, validate, updateSalaryStructure);
router.post('/process', processPayroll);
router.post('/preview', previewPayroll);
router.post('/payslips/generate-all', generateAllPayslips);
router.post('/records/:id/payslip', generatePayslip);
router.patch('/records/:id/mark-paid', markPayrollPaid);
router.patch('/records/:id/approve', approvePayroll);
router.patch('/records/:id/reject', rejectPayroll);

export default router;
