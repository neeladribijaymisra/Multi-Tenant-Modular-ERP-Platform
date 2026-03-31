import Course from '../models/Course.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import CurriculumPlan from '../models/CurriculumPlan.js';
import AcademicPlan from '../models/AcademicPlan.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { sendSuccess, sendError, getPagination, paginationMeta } from '../utils/apiResponse.js';

const buildTextFilter = (search) => (search ? { $text: { $search: search } } : {});

const generatePassword = (name = 'teacher') => {
  const safeName = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toLowerCase() || 'acad';
  const random = Math.random().toString(36).slice(-4).toUpperCase();
  const digits = Math.floor(100 + Math.random() * 900);
  return `${safeName}@${random}${digits}`;
};

export const getAcademicsOverview = async (req, res, next) => {
  try {
    const [teachers, students, curriculumPlans, academicPlans, leaveRequests, activeCourses, scheduledExams] = await Promise.all([
      Teacher.countDocuments(),
      Student.countDocuments(),
      CurriculumPlan.countDocuments(),
      AcademicPlan.countDocuments(),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Course.countDocuments({ status: 'Active' }),
      ExamSchedule.countDocuments({ status: 'Scheduled' }),
    ]);

    return sendSuccess(res, {
      teachers,
      students,
      curriculumPlans,
      academicPlans,
      pendingLeaveRequests: leaveRequests,
      activeCourses,
      scheduledExams,
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrySummary = async (req, res, next) => {
  try {
    const [studentDepartments, teacherDepartments, studentStatuses, teacherStatuses] = await Promise.all([
      Student.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Teacher.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Student.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Teacher.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return sendSuccess(res, {
      studentsByDepartment: studentDepartments,
      teachersByDepartment: teacherDepartments,
      studentStatuses,
      teacherStatuses,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAccounts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, status, accountStatus } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = { ...buildTextFilter(search) };
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (accountStatus) filter.accountStatus = accountStatus;

    const [teachers, total] = await Promise.all([
      Teacher.find(filter).skip(skip).limit(lim).sort({ createdAt: -1 }),
      Teacher.countDocuments(filter),
    ]);

    return sendSuccess(res, { teachers, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const createTeacherAccount = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.portalUsername && payload.email) payload.portalUsername = payload.email;
    const teacher = await Teacher.create(payload);
    return sendSuccess(res, { teacher }, 'Teacher account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTeacherAccount = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!teacher) return sendError(res, 'Teacher not found.', 404);
    return sendSuccess(res, { teacher }, 'Teacher account updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTeacherAccount = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return sendError(res, 'Teacher not found.', 404);
    return sendSuccess(res, {}, 'Teacher account deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const generateTeacherPassword = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return sendError(res, 'Teacher not found.', 404);

    const generatedPassword = generatePassword(teacher.name);
    teacher.lastPasswordGeneratedAt = new Date();
    teacher.accountStatus = 'Password Reset Required';
    if (!teacher.portalUsername) teacher.portalUsername = teacher.email;
    await teacher.save();

    return sendSuccess(res, {
      teacher,
      generatedPassword,
    }, 'Teacher password generated successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentRegistry = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, year, status } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = { ...buildTextFilter(search) };
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (status) filter.status = status;

    const [students, total] = await Promise.all([
      Student.find(filter).skip(skip).limit(lim).sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);

    return sendSuccess(res, { students, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const updateStudentRegistry = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, { student }, 'Student registry updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getTeacherRegistry = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = { ...buildTextFilter(search) };
    if (department) filter.department = department;
    if (status) filter.status = status;

    const [teachers, total] = await Promise.all([
      Teacher.find(filter).skip(skip).limit(lim).sort({ createdAt: -1 }),
      Teacher.countDocuments(filter),
    ]);

    return sendSuccess(res, { teachers, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, semester, status } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const [courses, total] = await Promise.all([
      Course.find(filter).populate('faculty', 'name email designation').skip(skip).limit(lim).sort({ createdAt: -1 }),
      Course.countDocuments(filter),
    ]);

    return sendSuccess(res, { courses, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('faculty', 'name email designation');
    if (!course) return sendError(res, 'Course not found.', 404);
    return sendSuccess(res, { course });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    return sendSuccess(res, { course }, 'Course created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return sendError(res, 'Course not found.', 404);
    return sendSuccess(res, { course }, 'Course updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return sendError(res, 'Course not found.', 404);
    return sendSuccess(res, {}, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getExamSchedules = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, examType } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (examType) filter.examType = examType;

    const [exams, total] = await Promise.all([
      ExamSchedule.find(filter)
        .populate('course', 'name code department')
        .populate('invigilators', 'name')
        .skip(skip).limit(lim).sort({ date: 1 }),
      ExamSchedule.countDocuments(filter),
    ]);

    return sendSuccess(res, { exams, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const createExamSchedule = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.create(req.body);
    return sendSuccess(res, { exam }, 'Exam scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExamSchedule = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) return sendError(res, 'Exam schedule not found.', 404);
    return sendSuccess(res, { exam }, 'Exam schedule updated');
  } catch (error) {
    next(error);
  }
};

export const deleteExamSchedule = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findByIdAndDelete(req.params.id);
    if (!exam) return sendError(res, 'Exam schedule not found.', 404);
    return sendSuccess(res, {}, 'Exam schedule deleted');
  } catch (error) {
    next(error);
  }
};

export const getCurriculumPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = { ...buildTextFilter(search) };
    if (department) filter.department = department;
    if (status) filter.status = status;

    const [plans, total] = await Promise.all([
      CurriculumPlan.find(filter).populate('owner', 'name designation').skip(skip).limit(lim).sort({ updatedAt: -1 }),
      CurriculumPlan.countDocuments(filter),
    ]);

    return sendSuccess(res, { plans, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const createCurriculumPlan = async (req, res, next) => {
  try {
    const plan = await CurriculumPlan.create(req.body);
    return sendSuccess(res, { plan }, 'Curriculum plan created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCurriculumPlan = async (req, res, next) => {
  try {
    const plan = await CurriculumPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return sendError(res, 'Curriculum plan not found.', 404);
    return sendSuccess(res, { plan }, 'Curriculum plan updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteCurriculumPlan = async (req, res, next) => {
  try {
    const plan = await CurriculumPlan.findByIdAndDelete(req.params.id);
    if (!plan) return sendError(res, 'Curriculum plan not found.', 404);
    return sendSuccess(res, {}, 'Curriculum plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getAcademicPlans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, approvalStatus, recordStatus } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = { ...buildTextFilter(search) };
    if (department) filter.department = department;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (recordStatus) filter.recordStatus = recordStatus;

    const [plans, total] = await Promise.all([
      AcademicPlan.find(filter)
        .populate('owner', 'name designation')
        .populate('approver', 'name designation')
        .skip(skip).limit(lim).sort({ updatedAt: -1 }),
      AcademicPlan.countDocuments(filter),
    ]);

    return sendSuccess(res, { plans, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const createAcademicPlan = async (req, res, next) => {
  try {
    const plan = await AcademicPlan.create(req.body);
    return sendSuccess(res, { plan }, 'Academic plan created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateAcademicPlan = async (req, res, next) => {
  try {
    const plan = await AcademicPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return sendError(res, 'Academic plan not found.', 404);
    return sendSuccess(res, { plan }, 'Academic plan updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAcademicPlan = async (req, res, next) => {
  try {
    const plan = await AcademicPlan.findByIdAndDelete(req.params.id);
    if (!plan) return sendError(res, 'Academic plan not found.', 404);
    return sendSuccess(res, {}, 'Academic plan deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, teacherId } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = {};
    if (status) filter.status = status;
    if (teacherId) filter.teacher = teacherId;

    const [requests, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('teacher', 'name facultyId department')
        .populate('reviewedBy', 'name')
        .skip(skip).limit(lim).sort({ createdAt: -1 }),
      LeaveRequest.countDocuments(filter),
    ]);

    return sendSuccess(res, { requests, pagination: paginationMeta(total, page, lim) });
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req, res, next) => {
  try {
    const request = await LeaveRequest.create(req.body);
    return sendSuccess(res, { request }, 'Leave request created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveRequest = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!request) return sendError(res, 'Leave request not found.', 404);
    return sendSuccess(res, { request }, 'Leave request updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteLeaveRequest = async (req, res, next) => {
  try {
    const request = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!request) return sendError(res, 'Leave request not found.', 404);
    return sendSuccess(res, {}, 'Leave request deleted successfully');
  } catch (error) {
    next(error);
  }
};
