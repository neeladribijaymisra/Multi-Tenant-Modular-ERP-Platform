import Course from '../models/Course.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import AcademicEnrollmentDraft from '../models/AcademicEnrollmentDraft.js';
import CurriculumPlan from '../models/CurriculumPlan.js';
import AcademicPlan from '../models/AcademicPlan.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { sendSuccess, sendError, getPagination, paginationMeta } from '../utils/apiResponse.js';

const buildTextFilter = (search) => (search ? { $text: { $search: search } } : {});
const ROLL_NUMBER_PATTERN = /^[A-Z0-9-]{5,20}$/i;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const DOCUMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const REQUIRED_DOCUMENT_TYPES = ['Previous Transcript', 'ID Proof', 'Medical Certificate'];

const PROGRAM_CATALOG = [
  { id: 'btech-cse', name: 'B.Tech Computer Science', department: 'Computer Science', durationYears: 4, feePerSemester: 85000 },
  { id: 'btech-ece', name: 'B.Tech Electronics', department: 'Electronics', durationYears: 4, feePerSemester: 80000 },
  { id: 'btech-me', name: 'B.Tech Mechanical Engineering', department: 'Mechanical Engineering', durationYears: 4, feePerSemester: 78000 },
  { id: 'btech-civil', name: 'B.Tech Civil Engineering', department: 'Civil Engineering', durationYears: 4, feePerSemester: 76000 },
  { id: 'mba', name: 'MBA', department: 'Business Administration', durationYears: 2, feePerSemester: 95000 },
];

const generatePassword = (name = 'teacher') => {
  const safeName = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toLowerCase() || 'acad';
  const random = Math.random().toString(36).slice(-4).toUpperCase();
  const digits = Math.floor(100 + Math.random() * 900);
  return `${safeName}@${random}${digits}`;
};

const sanitizeAsset = (asset = {}) => ({
  name: asset.name || '',
  mimeType: asset.mimeType || '',
  size: Number(asset.size) || 0,
  content: asset.content || '',
  width: asset.width ? Number(asset.width) : undefined,
  height: asset.height ? Number(asset.height) : undefined,
});

const validateProfilePhoto = (photo) => {
  if (!photo?.content) return null;
  const normalized = sanitizeAsset(photo);
  if (!IMAGE_TYPES.has(normalized.mimeType)) return 'Profile photo must be JPG or PNG.';
  if (normalized.size > MAX_IMAGE_SIZE) return 'Profile photo must be 2 MB or less.';
  if ((normalized.width && normalized.width < 256) || (normalized.height && normalized.height < 256)) {
    return 'Profile photo resolution must be at least 256 x 256.';
  }
  return null;
};

const validateDocuments = (documents = []) => {
  for (const document of documents) {
    if (!document?.type || !document?.file?.content) continue;
    const normalized = sanitizeAsset(document.file);
    if (!DOCUMENT_TYPES.has(normalized.mimeType)) return `${document.type} must be PDF, JPG, or PNG.`;
    if (normalized.size > MAX_DOCUMENT_SIZE) return `${document.type} must be 5 MB or less.`;
  }
  return null;
};

const findMissingRequiredDocuments = (documents = []) => REQUIRED_DOCUMENT_TYPES.filter((type) => (
  !documents.some((document) => document?.type === type && document?.file?.content)
));

const normalizeDraftPayload = (payload = {}) => ({
  personalDetails: {
    fullLegalName: payload.personalDetails?.fullLegalName || '',
    preferredName: payload.personalDetails?.preferredName || '',
    rollNumber: payload.personalDetails?.rollNumber?.toUpperCase?.() || '',
    dateOfBirth: payload.personalDetails?.dateOfBirth || null,
    gender: payload.personalDetails?.gender || '',
    email: payload.personalDetails?.email || '',
    phone: payload.personalDetails?.phone || '',
  },
  academicInfo: {
    programId: payload.academicInfo?.programId || '',
    programName: payload.academicInfo?.programName || '',
    department: payload.academicInfo?.department || '',
    year: payload.academicInfo?.year || '',
    semester: payload.academicInfo?.semester ? Number(payload.academicInfo.semester) : null,
    section: payload.academicInfo?.section || 'A',
    admissionDate: payload.academicInfo?.admissionDate || null,
    feePerSemester: payload.academicInfo?.feePerSemester ? Number(payload.academicInfo.feePerSemester) : 0,
    durationYears: payload.academicInfo?.durationYears ? Number(payload.academicInfo.durationYears) : 0,
  },
  contactInfo: {
    guardianName: payload.contactInfo?.guardianName || '',
    guardianRelation: payload.contactInfo?.guardianRelation || '',
    guardianPhone: payload.contactInfo?.guardianPhone || '',
    guardianEmail: payload.contactInfo?.guardianEmail || '',
  },
  address: {
    street: payload.address?.street || '',
    city: payload.address?.city || '',
    state: payload.address?.state || '',
    pincode: payload.address?.pincode || '',
  },
  profilePhoto: payload.profilePhoto?.content ? sanitizeAsset(payload.profilePhoto) : undefined,
  documents: Array.isArray(payload.documents)
    ? payload.documents
      .filter((document) => document?.type)
      .map((document) => ({
        type: document.type,
        file: document.file?.content ? sanitizeAsset(document.file) : undefined,
      }))
    : [],
});

const buildStudentFromEnrollment = (payload, draftId = null) => {
  const normalized = normalizeDraftPayload(payload);
  return {
    rollNo: normalized.personalDetails.rollNumber,
    name: normalized.personalDetails.fullLegalName,
    email: normalized.personalDetails.email || `${normalized.personalDetails.rollNumber.toLowerCase()}@university.edu`,
    phone: normalized.personalDetails.phone,
    dateOfBirth: normalized.personalDetails.dateOfBirth,
    gender: ['Male', 'Female', 'Other'].includes(normalized.personalDetails.gender)
      ? normalized.personalDetails.gender
      : undefined,
    avatar: normalized.profilePhoto?.content || null,
    avatarMeta: normalized.profilePhoto?.content ? {
      name: normalized.profilePhoto.name,
      mimeType: normalized.profilePhoto.mimeType,
      size: normalized.profilePhoto.size,
      width: normalized.profilePhoto.width,
      height: normalized.profilePhoto.height,
    } : undefined,
    department: normalized.academicInfo.department,
    year: normalized.academicInfo.year,
    semester: normalized.academicInfo.semester,
    section: normalized.academicInfo.section || 'A',
    admissionDate: normalized.academicInfo.admissionDate || undefined,
    programId: normalized.academicInfo.programId,
    programName: normalized.academicInfo.programName,
    feePerSemester: normalized.academicInfo.feePerSemester,
    durationYears: normalized.academicInfo.durationYears,
    guardian: {
      name: normalized.contactInfo.guardianName,
      relation: normalized.contactInfo.guardianRelation,
      phone: normalized.contactInfo.guardianPhone,
      email: normalized.contactInfo.guardianEmail,
    },
    address: {
      street: normalized.address.street,
      city: normalized.address.city,
      state: normalized.address.state,
      pincode: normalized.address.pincode,
    },
    documents: normalized.documents
      .filter((document) => document.file?.content)
      .map((document) => ({
        type: document.type,
        name: document.file.name,
        mimeType: document.file.mimeType,
        size: document.file.size,
        content: document.file.content,
      })),
    enrollmentSource: 'academics-enrollment',
    enrollmentDraftId: draftId,
  };
};

const buildStudentFromQuickEntry = (payload = {}) => {
  const fullName = (payload.fullName || '').trim();
  const rollNumber = (payload.rollNumber || '').trim().toUpperCase();
  const programId = (payload.courseSelection || '').trim();
  const program = PROGRAM_CATALOG.find((item) => item.id === programId || item.name === programId);
  const semester = Number(payload.currentSemester) || 1;
  const derivedYear = semester <= 2 ? '1st Year' : semester <= 4 ? '2nd Year' : semester <= 6 ? '3rd Year' : '4th Year';
  const safeEmailBase = rollNumber.toLowerCase().replace(/[^a-z0-9-]/g, '');

  return {
    rollNo: rollNumber,
    name: fullName,
    email: `${safeEmailBase || 'student'}@university.edu`,
    dateOfBirth: payload.dateOfBirth || undefined,
    department: program?.department || 'Computer Science',
    year: derivedYear,
    semester,
    section: 'A',
    admissionDate: new Date(),
    programId: program?.id || programId,
    programName: program?.name || payload.courseSelection || '',
    feePerSemester: program?.feePerSemester || 0,
    durationYears: program?.durationYears || 4,
    status: 'Active',
    feeStatus: 'Pending',
    enrollmentSource: 'academics-quick-entry',
  };
};

const validateEnrollmentPayload = async (payload) => {
  const normalized = normalizeDraftPayload(payload);
  const errors = {};

  if (!normalized.personalDetails.fullLegalName.trim()) errors.fullLegalName = 'Full legal name is required.';
  if (!normalized.personalDetails.rollNumber.trim()) errors.rollNumber = 'Roll number is required.';
  else if (!ROLL_NUMBER_PATTERN.test(normalized.personalDetails.rollNumber)) errors.rollNumber = 'Use 5-20 letters, numbers, or dashes.';

  if (!normalized.personalDetails.dateOfBirth || Number.isNaN(new Date(normalized.personalDetails.dateOfBirth).getTime())) {
    errors.dateOfBirth = 'Valid date of birth is required.';
  }
  if (!normalized.personalDetails.email.trim()) errors.email = 'Email is required.';
  if (normalized.personalDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.personalDetails.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!normalized.personalDetails.phone.trim()) errors.phone = 'Phone number is required.';

  if (!normalized.academicInfo.programName.trim()) errors.programName = 'Program selection is required.';
  if (!normalized.academicInfo.department.trim()) errors.department = 'Department is required.';
  if (!normalized.academicInfo.year) errors.year = 'Academic year is required.';
  if (!normalized.academicInfo.semester) errors.semester = 'Semester selection is required.';
  if (!normalized.academicInfo.section.trim()) errors.section = 'Section is required.';
  if (!normalized.academicInfo.admissionDate || Number.isNaN(new Date(normalized.academicInfo.admissionDate).getTime())) {
    errors.admissionDate = 'Valid admission date is required.';
  }

  if (!normalized.contactInfo.guardianName.trim()) errors.guardianName = 'Guardian name is required.';
  if (!normalized.contactInfo.guardianPhone.trim()) errors.guardianPhone = 'Guardian phone is required.';
  if (!normalized.address.city.trim()) errors.city = 'City is required.';
  if (!normalized.address.state.trim()) errors.state = 'State is required.';

  const profilePhotoError = validateProfilePhoto(normalized.profilePhoto);
  if (profilePhotoError) errors.profilePhoto = profilePhotoError;

  const documentError = validateDocuments(normalized.documents);
  if (documentError) errors.documents = documentError;
  const missingDocuments = findMissingRequiredDocuments(normalized.documents);
  if (!errors.documents && missingDocuments.length > 0) {
    errors.documents = `Upload all required documents: ${missingDocuments.join(', ')}.`;
  }

  if (!errors.rollNumber) {
    const existingRoll = await Student.findOne({ rollNo: normalized.personalDetails.rollNumber }).lean();
    if (existingRoll) errors.rollNumber = 'Roll number already exists.';
  }

  if (!errors.email) {
    const existingEmail = await Student.findOne({ email: normalized.personalDetails.email.toLowerCase() }).lean();
    if (existingEmail) errors.email = 'Email already exists.';
  }

  return { normalized, errors };
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

export const createStudentRegistryEntry = async (req, res, next) => {
  try {
    const fullName = (req.body.fullName || '').trim();
    const rollNumber = (req.body.rollNumber || '').trim().toUpperCase();
    const dateOfBirth = req.body.dateOfBirth;
    const courseSelection = (req.body.courseSelection || '').trim();
    const currentSemester = Number(req.body.currentSemester);

    if (!fullName) return sendError(res, 'Full name is required.', 400);
    if (!rollNumber) return sendError(res, 'Roll number is required.', 400);
    if (!ROLL_NUMBER_PATTERN.test(rollNumber)) return sendError(res, 'Roll number format is invalid.', 400);
    if (!dateOfBirth || Number.isNaN(new Date(dateOfBirth).getTime())) return sendError(res, 'Valid date of birth is required.', 400);
    if (!courseSelection) return sendError(res, 'Course selection is required.', 400);
    if (!Number.isInteger(currentSemester) || currentSemester < 1 || currentSemester > 8) {
      return sendError(res, 'Current semester must be between 1 and 8.', 400);
    }

    const existingStudent = await Student.findOne({ rollNo: rollNumber }).lean();
    if (existingStudent) return sendError(res, 'Roll number already exists.', 400, { rollNumber: 'Roll number already exists.' });

    const student = await Student.create(buildStudentFromQuickEntry({
      fullName,
      rollNumber,
      dateOfBirth,
      courseSelection,
      currentSemester,
    }));

    return sendSuccess(res, { student }, 'Student created successfully from academics.', 201);
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

export const getEnrollmentPrograms = async (req, res, next) => {
  try {
    const activeCourses = await Course.find({ status: 'Active' })
      .select('name department academicYear semester')
      .sort({ name: 1 })
      .lean();

    const programs = PROGRAM_CATALOG.map((program) => ({
      ...program,
      courseCount: activeCourses.filter((course) => course.department === program.department).length,
    }));

    return sendSuccess(res, { programs });
  } catch (error) {
    next(error);
  }
};

export const validateEnrollmentRollNumber = async (req, res, next) => {
  try {
    const rollNumber = (req.query.rollNumber || '').trim().toUpperCase();
    if (!rollNumber) return sendError(res, 'Roll number is required.', 400);
    if (!ROLL_NUMBER_PATTERN.test(rollNumber)) {
      return sendError(res, 'Roll number format is invalid.', 400);
    }

    const exists = await Student.exists({ rollNo: rollNumber });
    return sendSuccess(res, { rollNumber, available: !exists });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentDraft = async (req, res, next) => {
  try {
    const draft = await AcademicEnrollmentDraft.findOne({ createdBy: req.admin._id }).sort({ updatedAt: -1 }).lean();
    return sendSuccess(res, { draft });
  } catch (error) {
    next(error);
  }
};

export const saveEnrollmentDraft = async (req, res, next) => {
  try {
    const normalized = normalizeDraftPayload(req.body);
    const profilePhotoError = validateProfilePhoto(normalized.profilePhoto);
    const documentError = validateDocuments(normalized.documents);
    if (profilePhotoError) return sendError(res, profilePhotoError, 400);
    if (documentError) return sendError(res, documentError, 400);

    const draft = await AcademicEnrollmentDraft.findOneAndUpdate(
      { createdBy: req.admin._id },
      normalized,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return sendSuccess(res, { draft }, 'Enrollment draft saved successfully');
  } catch (error) {
    next(error);
  }
};

export const createEnrollmentStudent = async (req, res, next) => {
  try {
    const { normalized, errors } = await validateEnrollmentPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return sendError(res, 'Enrollment validation failed.', 400, errors);
    }

    const draft = await AcademicEnrollmentDraft.findOne({ createdBy: req.admin._id }).sort({ updatedAt: -1 });
    const student = await Student.create(buildStudentFromEnrollment(normalized, draft?._id || null));

    if (draft) await draft.deleteOne();

    return sendSuccess(res, { student }, 'Student enrolled successfully', 201);
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
