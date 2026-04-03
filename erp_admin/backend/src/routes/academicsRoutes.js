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
  createStudentRegistryEntry,
  updateStudentRegistry,
  getTeacherRegistry,
  getEnrollmentPrograms,
  validateEnrollmentRollNumber,
  getEnrollmentDraft,
  saveEnrollmentDraft,
  createEnrollmentStudent,
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

const enrollmentDraftValidation = [
  body('personalDetails').isObject().withMessage('Personal details are required'),
  body('academicInfo').isObject().withMessage('Academic information is required'),
];

const enrollmentValidation = [
  body('personalDetails.fullLegalName').trim().notEmpty().withMessage('Full legal name is required'),
  body('personalDetails.rollNumber').trim().matches(/^[A-Z0-9-]{5,20}$/i).withMessage('Roll number format is invalid'),
  body('personalDetails.dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('personalDetails.email').trim().isEmail().withMessage('Valid email is required'),
  body('personalDetails.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('personalDetails.gender').optional({ values: 'falsy' }).isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender'),
  body('academicInfo.programName').trim().notEmpty().withMessage('Program is required'),
  body('academicInfo.department').trim().notEmpty().withMessage('Department is required'),
  body('academicInfo.year').isIn(['1st Year', '2nd Year', '3rd Year', '4th Year']).withMessage('Year is required'),
  body('academicInfo.semester').isInt({ min: 1, max: 8 }).withMessage('Semester is required'),
  body('academicInfo.section').trim().notEmpty().withMessage('Section is required'),
  body('academicInfo.admissionDate').isISO8601().withMessage('Valid admission date is required'),
  body('contactInfo.guardianName').trim().notEmpty().withMessage('Guardian name is required'),
  body('contactInfo.guardianPhone').trim().notEmpty().withMessage('Guardian phone is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
];

router.get('/overview', getAcademicsOverview);
router.get('/registries/summary', getRegistrySummary);
router.get('/registries/students', getStudentRegistry);
router.post('/registries/students', createStudentRegistryEntry);
router.put('/registries/students/:id', updateStudentRegistry);
router.get('/registries/teachers', getTeacherRegistry);
router.get('/enrollment/programs', getEnrollmentPrograms);
router.get('/enrollment/validate-roll', validateEnrollmentRollNumber);
router.route('/enrollment/draft')
  .get(getEnrollmentDraft)
  .post(enrollmentDraftValidation, validate, saveEnrollmentDraft);
router.post('/enrollment/students', enrollmentValidation, validate, createEnrollmentStudent);

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
