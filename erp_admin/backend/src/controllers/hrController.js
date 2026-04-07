import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Payroll from '../models/Payroll.js';
import { getPagination, paginationMeta, sendError, sendSuccess } from '../utils/apiResponse.js';

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const payrollStatusByEmployeeStatus = {
  Active: 'Pending Approval',
  'On Leave': 'Pending Approval',
  Inactive: 'On Hold',
  Probation: 'Draft',
  Resigned: 'On Hold',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseMonthRange = (monthInput) => {
  const current = new Date();
  const base = monthInput ? new Date(`${monthInput}-01T00:00:00`) : new Date(current.getFullYear(), current.getMonth(), 1);
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return {
    start,
    end,
    monthLabel: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`,
  };
};

const calculateWorkingHours = (checkInTime, checkOutTime, fallback = 0) => {
  if (!checkInTime || !checkOutTime) return toNumber(fallback);
  const [inHour = 0, inMinute = 0] = String(checkInTime).split(':').map(Number);
  const [outHour = 0, outMinute = 0] = String(checkOutTime).split(':').map(Number);
  const totalMinutes = (outHour * 60 + outMinute) - (inHour * 60 + inMinute);
  return totalMinutes > 0 ? Number((totalMinutes / 60).toFixed(2)) : toNumber(fallback);
};

const getCurrentPayrollCycle = () => {
  const now = new Date();
  return { month: MONTH_NAMES[now.getMonth()], year: now.getFullYear() };
};

const buildEmployeeFilters = (query = {}) => {
  const filter = { isDeleted: false };

  if (query.department) filter.department = query.department;
  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.status) filter.status = query.status;

  if (query.search?.trim()) {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { fullName: regex },
      { employeeId: regex },
      { email: regex },
      { department: regex },
      { designation: regex },
    ];
  }

  return filter;
};

const buildPayrollPayload = (employee, existingPayroll = null) => {
  const { month, year } = getCurrentPayrollCycle();
  const basicSalary = toNumber(employee.salaryCTC);
  const allowances = existingPayroll?.allowances || {
    hra: Math.round(basicSalary * 0.2),
    da: Math.round(basicSalary * 0.08),
    travelAllowance: 2500,
    medicalAllowance: 1500,
    bonus: 0,
    extraShiftPay: 0,
  };
  const deductions = existingPayroll?.deductions || {
    pf: Math.round(basicSalary * 0.12),
    esi: Math.round(basicSalary * 0.0175),
    tax: Math.round(basicSalary * 0.05),
    loanDeduction: 0,
    otherDeductions: 0,
    lossOfPayAmount: 0,
  };
  const totalAllowances = Object.values(allowances).reduce((sum, value) => sum + toNumber(value), 0);
  const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + toNumber(value), 0);
  const grossSalary = basicSalary + totalAllowances;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    employeeId: employee.employeeId,
    employeeName: employee.fullName,
    employeeEmail: employee.email,
    department: employee.department,
    designation: employee.designation,
    avatar: employee.profilePhoto || null,
    salaryType: employee.employmentType === 'Contract' ? 'Contract' : 'Monthly',
    basicSalary,
    allowances,
    deductions,
    attendance: existingPayroll?.attendance || {
      totalWorkingDays: 30,
      presentDays: employee.status === 'Active' ? 28 : 24,
      leaveTaken: employee.status === 'On Leave' ? 2 : 0,
      lossOfPay: 0,
      overtimeHours: 0,
      extraShiftPay: 0,
    },
    totalAllowances,
    totalDeductions,
    grossSalary,
    netSalary,
    payrollStatus: payrollStatusByEmployeeStatus[employee.status] || 'Draft',
    month,
    year,
    effectiveFromDate: employee.dateOfJoining,
    paymentMethod: existingPayroll?.paymentMethod || 'Bank Transfer',
    bankAccountNumber: existingPayroll?.bankAccountNumber || '',
    ifscCode: existingPayroll?.ifscCode || '',
    approval: existingPayroll?.approval || {
      preparedBy: 'HR Sync',
      reviewedBy: '',
      approvedBy: '',
      approvalDate: null,
      remarks: 'Linked from HR employee master.',
    },
    remarks: existingPayroll?.remarks || 'Payroll linked from HR employee profile.',
    timeline: existingPayroll?.timeline || [
      {
        label: 'Payroll linked',
        by: 'HR Sync',
        at: new Date(),
        note: 'Employee profile was linked to payroll.',
      },
    ],
  };
};

const syncEmployeePayroll = async (employee) => {
  if (!employee || toNumber(employee.salaryCTC) <= 0) return null;

  const { month, year } = getCurrentPayrollCycle();
  const existingPayroll = await Payroll.findOne({ employeeId: employee.employeeId, month, year });
  const payload = buildPayrollPayload(employee, existingPayroll);

  if (existingPayroll) {
    Object.assign(existingPayroll, payload);
    await existingPayroll.save();
    return existingPayroll;
  }

  return Payroll.create(payload);
};

const buildEmployeeSummary = async (employeeId) => {
  const monthRange = parseMonthRange();
  const today = normalizeDate(new Date());
  const [attendanceRecords, leaves, payrollInfo] = await Promise.all([
    Attendance.find({ employee: employeeId, date: { $gte: monthRange.start, $lte: monthRange.end } }).sort({ date: -1 }).lean(),
    Leave.find({ employee: employeeId }).sort({ createdAt: -1 }).lean(),
    Payroll.findOne({ employeeId }).sort({ year: -1, createdAt: -1 }).lean(),
  ]);

  const attendanceSummary = attendanceRecords.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    acc.workingHours += toNumber(item.workingHours);
    return acc;
  }, { total: 0, workingHours: 0, Present: 0, Absent: 0, Late: 0, 'Half Day': 0 });

  const leaveSummary = leaves.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    if (item.status === 'Approved' && normalizeDate(item.startDate) <= today && normalizeDate(item.endDate) >= today) {
      acc.onLeaveToday = true;
    }
    return acc;
  }, { total: 0, Pending: 0, Approved: 0, Rejected: 0, onLeaveToday: false });

  return {
    attendanceRecords,
    attendanceSummary: {
      ...attendanceSummary,
      averageWorkingHours: attendanceSummary.total ? Number((attendanceSummary.workingHours / attendanceSummary.total).toFixed(1)) : 0,
      monthLabel: monthRange.monthLabel,
    },
    leaveRecords: leaves,
    leaveSummary,
    payrollInfo,
  };
};

export const getHrDashboardStats = async (req, res, next) => {
  try {
    const today = normalizeDate(new Date());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAhead = new Date(today);
    thirtyDaysAhead.setDate(today.getDate() + 30);

    const [totalEmployees, activeEmployees, newJoinees, pendingLeaveRequests, resignedEmployees, employees, leavesToday] = await Promise.all([
      Employee.countDocuments({ isDeleted: false }),
      Employee.countDocuments({ isDeleted: false, status: 'Active' }),
      Employee.countDocuments({ isDeleted: false, dateOfJoining: { $gte: thirtyDaysAgo } }),
      Leave.countDocuments({ status: 'Pending' }),
      Employee.countDocuments({
        $or: [{ status: 'Resigned' }, { isDeleted: true }],
      }),
      Employee.find({ isDeleted: false }).select('employeeId dateOfBirth department status').lean(),
      Leave.find({
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).distinct('employee'),
    ]);

    const activeEmployeeIds = employees.map((employee) => employee.employeeId).filter(Boolean);
    const payrollLinkedEmployees = activeEmployeeIds.length > 0
      ? await Payroll.distinct('employeeId', { employeeId: { $in: activeEmployeeIds } })
      : [];

    const upcomingBirthdays = employees.filter((employee) => {
      if (!employee.dateOfBirth) return false;
      const birthday = new Date(employee.dateOfBirth);
      const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      return nextBirthday <= thirtyDaysAhead;
    }).length;

    const byDepartment = employees.reduce((acc, employee) => {
      acc[employee.department] = (acc[employee.department] || 0) + 1;
      return acc;
    }, {});

    return sendSuccess(res, {
      cards: {
        totalEmployees,
        activeEmployees,
        newJoinees,
        employeesOnLeaveToday: leavesToday.length,
        pendingLeaveRequests,
        payrollLinkedEmployees: payrollLinkedEmployees.length,
        upcomingBirthdays,
        attritionCount: resignedEmployees,
      },
      filters: {
        departments: Object.keys(byDepartment).sort(),
        employmentTypes: ['Full Time', 'Part Time', 'Contract', 'Intern'],
        statuses: ['Active', 'On Leave', 'Inactive', 'Probation', 'Resigned'],
      },
      byDepartment,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = buildEmployeeFilters(req.query);

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Employee.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      employees,
      pagination: paginationMeta(total, page, lim),
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const summary = await buildEmployeeSummary(employee._id);

    return sendSuccess(res, {
      employee,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create({
      ...req.body,
      employeeId: req.body.employeeId?.trim()?.toUpperCase(),
      performanceNotes: Array.isArray(req.body.performanceNotes)
        ? req.body.performanceNotes.filter((item) => item?.note)
        : [],
      documents: Array.isArray(req.body.documents)
        ? req.body.documents.filter((item) => item?.name)
        : [],
    });

    await syncEmployeePayroll(employee);
    return sendSuccess(res, { employee }, 'Employee created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        employeeId: req.body.employeeId?.trim()?.toUpperCase(),
      },
      { new: true, runValidators: true }
    );

    if (!employee) return sendError(res, 'Employee not found.', 404);
    await syncEmployeePayroll(employee);

    return sendSuccess(res, { employee }, 'Employee updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deactivateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    employee.isDeleted = true;
    employee.deletedAt = new Date();
    employee.resignationDate = new Date();
    employee.status = 'Resigned';
    await employee.save();

    await Payroll.updateMany(
      { employeeId: employee.employeeId },
      {
        $set: {
          payrollStatus: 'On Hold',
          remarks: 'Employee deactivated from HR module.',
        },
      }
    );

    return sendSuccess(res, {}, 'Employee deactivated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const { start, end, monthLabel } = parseMonthRange(req.query.month);
    const records = await Attendance.find({
      employee: employee._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 }).lean();

    const summary = records.reduce((acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      acc.workingHours += toNumber(item.workingHours);
      return acc;
    }, { total: 0, workingHours: 0, Present: 0, Absent: 0, Late: 0, 'Half Day': 0 });

    return sendSuccess(res, {
      records,
      summary: {
        ...summary,
        averageWorkingHours: summary.total ? Number((summary.workingHours / summary.total).toFixed(1)) : 0,
        monthLabel,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertAttendance = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const date = normalizeDate(req.body.date);
    const workingHours = calculateWorkingHours(req.body.checkInTime, req.body.checkOutTime, req.body.workingHours);
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employee._id, date },
      {
        employee: employee._id,
        date,
        status: req.body.status,
        checkInTime: req.body.checkInTime || '',
        checkOutTime: req.body.checkOutTime || '',
        workingHours,
        notes: req.body.notes || '',
      },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, { attendance }, 'Attendance saved successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req, res, next) => {
  try {
    const existing = await Attendance.findById(req.params.attendanceId);
    if (!existing) return sendError(res, 'Attendance record not found.', 404);

    existing.status = req.body.status || existing.status;
    existing.checkInTime = req.body.checkInTime ?? existing.checkInTime;
    existing.checkOutTime = req.body.checkOutTime ?? existing.checkOutTime;
    existing.notes = req.body.notes ?? existing.notes;
    existing.workingHours = calculateWorkingHours(existing.checkInTime, existing.checkOutTime, req.body.workingHours ?? existing.workingHours);
    await existing.save();

    return sendSuccess(res, { attendance: existing }, 'Attendance updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getLeaveRecordsByEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const records = await Leave.find({ employee: employee._id }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, { records });
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const leave = await Leave.create({
      employee: employee._id,
      leaveType: req.body.leaveType,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason || '',
      appliedDate: req.body.appliedDate || new Date(),
      status: req.body.status || 'Pending',
      reviewedBy: req.body.status === 'Pending' ? '' : (req.admin?.name || ''),
      reviewNote: req.body.reviewNote || '',
    });

    if (leave.status === 'Approved') {
      employee.status = 'On Leave';
      await employee.save();
    }

    return sendSuccess(res, { leave }, 'Leave request created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.leaveId).populate('employee');
    if (!leave) return sendError(res, 'Leave request not found.', 404);

    leave.status = req.body.status || leave.status;
    leave.reviewNote = req.body.reviewNote ?? leave.reviewNote;
    leave.reviewedBy = req.admin?.name || leave.reviewedBy;
    await leave.save();

    if (leave.employee) {
      if (leave.status === 'Approved') {
        leave.employee.status = 'On Leave';
      } else if (leave.employee.status === 'On Leave') {
        const activeApprovedLeave = await Leave.exists({
          employee: leave.employee._id,
          _id: { $ne: leave._id },
          status: 'Approved',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
        });
        leave.employee.status = activeApprovedLeave ? 'On Leave' : 'Active';
      }
      await leave.employee.save();
    }

    return sendSuccess(res, { leave }, `Leave request ${leave.status.toLowerCase()} successfully.`);
  } catch (error) {
    next(error);
  }
};

export const getHrFilters = async (req, res, next) => {
  try {
    const [departments, designations] = await Promise.all([
      Employee.distinct('department', { isDeleted: false }),
      Employee.distinct('designation', { isDeleted: false }),
    ]);

    return sendSuccess(res, {
      departments: departments.sort(),
      designations: designations.sort(),
      employmentTypes: ['Full Time', 'Part Time', 'Contract', 'Intern'],
      statuses: ['Active', 'On Leave', 'Inactive', 'Probation', 'Resigned'],
      leaveTypes: ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave', 'Work From Home'],
      attendanceStatuses: ['Present', 'Absent', 'Late', 'Half Day'],
      years: [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1],
    });
  } catch (error) {
    next(error);
  }
};
