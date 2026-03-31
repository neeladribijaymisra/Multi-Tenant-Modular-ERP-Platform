import express from 'express';
import { body } from 'express-validator';
import {
  getFees,
  getFee,
  createFee,
  updateFee,
  deleteFee,
  getFinanceStats,
  getFinanceOverview,
  getTransactions,
  createTransaction,
} from '../controllers/financeController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

const feeValidation = [
  body('student').notEmpty().withMessage('Student ID is required'),
  body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
  body('feeType').notEmpty().withMessage('Fee type is required'),
];

const transactionValidation = [
  body('date').optional().isISO8601().withMessage('Date must be valid'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('status').optional().isIn(['Completed', 'Pending']).withMessage('Status must be Completed or Pending'),
  body('entityCount').optional().isInt({ min: 0 }).withMessage('Entity count must be zero or more'),
];

router.get('/overview', getFinanceOverview);
router.get('/stats', getFinanceStats);
router.route('/transactions')
  .get(getTransactions)
  .post(transactionValidation, validate, createTransaction);

router.route('/fees')
  .get(getFees)
  .post(feeValidation, validate, createFee);

router.route('/fees/:id')
  .get(getFee)
  .put(updateFee)
  .delete(deleteFee);

export default router;
