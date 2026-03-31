import express from 'express';
import { body } from 'express-validator';
import {
  getAcademicsOverview,
  getRegistrySummary,
  getTeacherAccounts,
  createTeacherAccount,
  updateTeacherAccount,
  deleteTeacherAccount,
  generateTeacherPassword,
  getStudentRegistry,
  updateStudentRegistry,
  getTeacherRegistry,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getExamSchedules,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
  getCurriculumPlans,
  createCurriculumPlan,
  updateCurriculumPlan,
  deleteCurriculumPlan,
  getAcademicPlans,
  createAcademicPlan,
  updateAcademicPlan,
  deleteAcademicPlan,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
} from '../controllers/academicsController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();
router.use(protect);

const teacherValidation = [
  body('facultyId').notEmpty().withMessage('Faculty ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation')
    .isIn(['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Visiting Faculty'])
    .withMessage('Invalid designation'),
];

const courseValidation = [
  body('code').notEmpty().withMessage('Course code is required'),
  body('name').notEmpty().withMessage('Course name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
  body('semester').notEmpty().withMessage('Semester is required'),
];

const examValidation = [
  body('course').notEmpty().withMessage('Course is required'),
  body('examType').notEmpty().withMessage('Exam type is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
];

const curriculumValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('program').notEmpty().withMessage('Program is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('semester').notEmpty().withMessage('Semester is required'),
];

const academicPlanValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('planType').notEmpty().withMessage('Plan type is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
];

const leaveValidation = [
  body('teacher').notEmpty().withMessage('Teacher is required'),
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
];

router.get('/overview', getAcademicsOverview);
router.get('/registries/summary', getRegistrySummary);
router.get('/registries/students', getStudentRegistry);
router.put('/registries/students/:id', updateStudentRegistry);
router.get('/registries/teachers', getTeacherRegistry);

router.route('/teacher-accounts')
  .get(getTeacherAccounts)
  .post(teacherValidation, validate, createTeacherAccount);

router.route('/teacher-accounts/:id')
  .put(updateTeacherAccount)
  .delete(deleteTeacherAccount);

router.post('/teacher-accounts/:id/generate-password', generateTeacherPassword);

router.route('/courses')
  .get(getCourses)
  .post(courseValidation, validate, createCourse);

router.route('/courses/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

router.route('/exams')
  .get(getExamSchedules)
  .post(examValidation, validate, createExamSchedule);

router.route('/exams/:id')
  .put(updateExamSchedule)
  .delete(deleteExamSchedule);

router.route('/curriculum-plans')
  .get(getCurriculumPlans)
  .post(curriculumValidation, validate, createCurriculumPlan);

router.route('/curriculum-plans/:id')
  .put(updateCurriculumPlan)
  .delete(deleteCurriculumPlan);

router.route('/academic-plans')
  .get(getAcademicPlans)
  .post(academicPlanValidation, validate, createAcademicPlan);

router.route('/academic-plans/:id')
  .put(updateAcademicPlan)
  .delete(deleteAcademicPlan);

router.route('/leave-requests')
  .get(getLeaveRequests)
  .post(leaveValidation, validate, createLeaveRequest);

router.route('/leave-requests/:id')
  .put(updateLeaveRequest)
  .delete(deleteLeaveRequest);

export default router;
