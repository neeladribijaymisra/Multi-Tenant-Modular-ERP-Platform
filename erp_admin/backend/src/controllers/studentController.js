import Student from '../models/Student.js';
import { sendSuccess, sendError, getPagination, paginationMeta } from '../utils/apiResponse.js';

const normalizeStudentPayload = (payload = {}) => ({
  ...payload,
  rollNo: payload.rollNo?.trim().toUpperCase(),
  email: payload.email?.trim().toLowerCase(),
  name: payload.name?.trim(),
});

// ── @GET /api/students ──────────────────────────────────────
export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, year, status, feeStatus } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (status) filter.status = status;
    if (feeStatus) filter.feeStatus = feeStatus;
    if (search) filter.$text = { $search: search };

    const [students, total] = await Promise.all([
      Student.find(filter).skip(skip).limit(lim).sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      students,
      pagination: paginationMeta(total, page, lim),
    });
  } catch (error) {
    next(error);
  }
};

// ── @GET /api/students/:id ──────────────────────────────────
export const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, { student });
  } catch (error) {
    next(error);
  }
};

// ── @POST /api/students ─────────────────────────────────────
export const createStudent = async (req, res, next) => {
  try {
    const payload = normalizeStudentPayload(req.body);

    const [existingRollNo, existingEmail] = await Promise.all([
      payload.rollNo ? Student.findOne({ rollNo: payload.rollNo }).lean() : null,
      payload.email ? Student.findOne({ email: payload.email }).lean() : null,
    ]);

    if (existingRollNo) {
      return sendError(res, `A student with roll number ${payload.rollNo} already exists.`, 400);
    }

    if (existingEmail) {
      return sendError(res, `A student with email ${payload.email} already exists.`, 400);
    }

    const student = await Student.create(payload);
    return sendSuccess(res, { student }, 'Student created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ── @PUT /api/students/:id ──────────────────────────────────
export const updateStudent = async (req, res, next) => {
  try {
    const payload = normalizeStudentPayload(req.body);

    const [existingRollNo, existingEmail] = await Promise.all([
      payload.rollNo ? Student.findOne({ rollNo: payload.rollNo, _id: { $ne: req.params.id } }).lean() : null,
      payload.email ? Student.findOne({ email: payload.email, _id: { $ne: req.params.id } }).lean() : null,
    ]);

    if (existingRollNo) {
      return sendError(res, `A student with roll number ${payload.rollNo} already exists.`, 400);
    }

    if (existingEmail) {
      return sendError(res, `A student with email ${payload.email} already exists.`, 400);
    }

    const student = await Student.findByIdAndUpdate(req.params.id, payload, {
      new: true, runValidators: true,
    });
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, { student }, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

// ── @DELETE /api/students/:id ───────────────────────────────
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, {}, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ── @GET /api/students/stats ────────────────────────────────
export const getStudentStats = async (req, res, next) => {
  try {
    const [total, active, inactive, byDept, byYear, byFeeStatus] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Student.countDocuments({ status: 'Inactive' }),
      Student.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
      Student.aggregate([{ $group: { _id: '$year', count: { $sum: 1 } } }]),
      Student.aggregate([{ $group: { _id: '$feeStatus', count: { $sum: 1 } } }]),
    ]);

    return sendSuccess(res, {
      total, active, inactive,
      byDepartment: byDept,
      byYear,
      byFeeStatus,
    });
  } catch (error) {
    next(error);
  }
};
