import express from 'express';
import { body } from 'express-validator';
import {
  createEmployee,
  createLeaveRequest,
  deactivateEmployee,
  getAttendanceByEmployee,
  getEmployeeById,
  getEmployees,
  getHrDashboardStats,
  getHrFilters,
  getLeaveRecordsByEmployee,
  updateAttendance,
  updateEmployee,
  updateLeaveStatus,
  upsertAttendance,
} from '../controllers/hrController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

const employeeValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('employmentType').isIn(['Full Time', 'Part Time', 'Contract', 'Intern']).withMessage('Employment type is invalid'),
  body('dateOfJoining').notEmpty().withMessage('Date of joining is required'),
  body('status').optional().isIn(['Active', 'On Leave', 'Inactive', 'Probation', 'Resigned']).withMessage('Status is invalid'),
  body('salaryCTC').optional().isFloat({ min: 0 }).withMessage('Salary / CTC must be zero or more'),
];

const attendanceValidation = [
  body('date').notEmpty().withMessage('Attendance date is required'),
  body('status').isIn(['Present', 'Absent', 'Late', 'Half Day']).withMessage('Attendance status is invalid'),
];

const leaveValidation = [
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
  body('status').optional().isIn(['Pending', 'Approved', 'Rejected']).withMessage('Leave status is invalid'),
];

router.get('/dashboard', getHrDashboardStats);
router.get('/filters', getHrFilters);

router.route('/employees')
  .get(getEmployees)
  .post(employeeValidation, validate, createEmployee);

router.route('/employees/:id')
  .get(getEmployeeById)
  .put(employeeValidation, validate, updateEmployee)
  .delete(deactivateEmployee);

router.route('/employees/:id/attendance')
  .get(getAttendanceByEmployee)
  .post(attendanceValidation, validate, upsertAttendance);

router.put('/attendance/:attendanceId', attendanceValidation, validate, updateAttendance);

router.route('/employees/:id/leaves')
  .get(getLeaveRecordsByEmployee)
  .post(leaveValidation, validate, createLeaveRequest);

router.patch('/leaves/:leaveId/status', [
  body('status').isIn(['Approved', 'Rejected']).withMessage('Leave status must be Approved or Rejected'),
], validate, updateLeaveStatus);

export default router;
