import express from 'express';
import { body } from 'express-validator';
import { sendFeeReminder } from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.post(
  '/send-fee-reminder',
  [
    body('email').trim().notEmpty().withMessage('Student email is required.').isEmail().withMessage('A valid email is required.'),
    body('studentName').optional().trim(),
    body('dueAmount').optional().isNumeric().withMessage('Due amount must be numeric.'),
    body('dueDate').optional({ nullable: true }).isString().withMessage('Due date must be a string.'),
  ],
  validate,
  sendFeeReminder
);

export default router;
