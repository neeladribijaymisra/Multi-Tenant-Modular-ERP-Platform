import Payroll from '../models/Payroll.js';
import Teacher from '../models/Teacher.js';
import FinanceTransaction from '../models/FinanceTransaction.js';
import { getPagination, paginationMeta, sendError, sendSuccess } from '../utils/apiResponse.js';

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

const SALARY_DEFAULTS = {
  Professor: 112000,
  'Associate Professor': 94000,
  'Assistant Professor': 76000,
  Lecturer: 54000,
  'Visiting Faculty': 42000,
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: MONTH_NAMES[now.getMonth()], year: now.getFullYear() };
};

const normalizeAllowances = (allowances = {}, attendance = {}) => ({
  hra: toNumber(allowances.hra),
  da: toNumber(allowances.da),
  travelAllowance: toNumber(allowances.travelAllowance),
  medicalAllowance: toNumber(allowances.medicalAllowance),
  bonus: toNumber(allowances.bonus),
  extraShiftPay: toNumber(allowances.extraShiftPay ?? attendance.extraShiftPay),
});

const normalizeDeductions = (deductions = {}) => ({
  pf: toNumber(deductions.pf),
  esi: toNumber(deductions.esi),
  tax: toNumber(deductions.tax),
  loanDeduction: toNumber(deductions.loanDeduction),
  otherDeductions: toNumber(deductions.otherDeductions),
  lossOfPayAmount: toNumber(deductions.lossOfPayAmount),
});

const normalizeAttendance = (attendance = {}) => ({
  totalWorkingDays: toNumber(attendance.totalWorkingDays, 30),
  presentDays: toNumber(attendance.presentDays, 30),
  leaveTaken: toNumber(attendance.leaveTaken),
  lossOfPay: toNumber(attendance.lossOfPay),
  overtimeHours: toNumber(attendance.overtimeHours),
  extraShiftPay: toNumber(attendance.extraShiftPay),
});

const sumValues = (record = {}) => Object.values(record).reduce((sum, value) => sum + toNumber(value), 0);

const calculatePayrollValues = ({ basicSalary, allowances, deductions, attendance }) => {
  const safeAttendance = normalizeAttendance(attendance);
  const safeAllowances = normalizeAllowances(allowances, safeAttendance);
  const safeDeductions = normalizeDeductions(deductions);
  const dailyRate = safeAttendance.totalWorkingDays > 0 ? toNumber(basicSalary) / safeAttendance.totalWorkingDays : 0;
  const lossOfPayAmount = safeDeductions.lossOfPayAmount || (safeAttendance.lossOfPay > 0 ? Math.round(dailyRate * safeAttendance.lossOfPay) : 0);
  const computedDeductions = { ...safeDeductions, lossOfPayAmount };
  const totalAllowances = sumValues(safeAllowances);
  const totalDeductions = sumValues(computedDeductions);
  const grossSalary = toNumber(basicSalary) + totalAllowances;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    attendance: safeAttendance,
    allowances: safeAllowances,
    deductions: computedDeductions,
    grossSalary,
    totalAllowances,
    totalDeductions,
    netSalary,
  };
};

const addTimelineEntry = (timeline = [], entry) => [
  {
    label: entry.label,
    by: entry.by || 'System',
    at: entry.at || new Date(),
    note: entry.note || '',
  },
  ...timeline,
].slice(0, 10);

const buildPayslip = (record) => ({
  payrollId: record._id,
  employeeDetails: {
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    employeeEmail: record.employeeEmail,
    department: record.department,
    designation: record.designation,
    salaryType: record.salaryType,
  },
  earnings: [
    ['Basic Salary', record.basicSalary],
    ['HRA', record.allowances?.hra || 0],
    ['DA', record.allowances?.da || 0],
    ['Travel Allowance', record.allowances?.travelAllowance || 0],
    ['Medical Allowance', record.allowances?.medicalAllowance || 0],
    ['Bonus', record.allowances?.bonus || 0],
    ['Extra Shift Pay', record.allowances?.extraShiftPay || 0],
  ],
  deductions: [
    ['PF', record.deductions?.pf || 0],
    ['ESI', record.deductions?.esi || 0],
    ['Tax', record.deductions?.tax || 0],
    ['Loan Deduction', record.deductions?.loanDeduction || 0],
    ['Other Deductions', record.deductions?.otherDeductions || 0],
    ['Loss of Pay', record.deductions?.lossOfPayAmount || 0],
  ],
  attendance: record.attendance,
  grossSalary: record.grossSalary,
  totalDeductions: record.totalDeductions,
  netSalary: record.netSalary,
  paymentDate: record.paymentDate,
  month: record.month,
  year: record.year,
  approval: record.approval,
  paymentMethod: record.paymentMethod,
});

const buildRecordResponse = (record) => ({
  ...record,
  payslipPreview: buildPayslip(record),
});

const buildBootstrapPayload = (teacher, month, year) => {
  const basicSalary = SALARY_DEFAULTS[teacher.designation] || 50000;
  const attendance = normalizeAttendance({
    totalWorkingDays: 30,
    presentDays: 29,
    leaveTaken: 1,
    overtimeHours: 4,
    extraShiftPay: 1500,
  });

  const computed = calculatePayrollValues({
    basicSalary,
    attendance,
    allowances: {
      hra: Math.round(basicSalary * 0.24),
      da: Math.round(basicSalary * 0.12),
      travelAllowance: 3200,
      medicalAllowance: 2400,
      bonus: 3000,
      extraShiftPay: attendance.extraShiftPay,
    },
    deductions: {
      pf: Math.round(basicSalary * 0.12),
      esi: Math.round(basicSalary * 0.0175),
      tax: Math.round(basicSalary * 0.08),
      loanDeduction: 0,
      otherDeductions: 850,
    },
  });

  return {
    teacher: teacher._id,
    employeeId: teacher.facultyId,
    employeeName: teacher.name,
    employeeEmail: teacher.email,
    department: teacher.department,
    designation: teacher.designation,
    avatar: teacher.avatar || null,
    salaryType: 'Monthly',
    basicSalary,
    allowances: computed.allowances,
    deductions: computed.deductions,
    attendance: computed.attendance,
    totalAllowances: computed.totalAllowances,
    totalDeductions: computed.totalDeductions,
    grossSalary: computed.grossSalary,
    netSalary: computed.netSalary,
    payrollStatus: 'Pending Approval',
    month,
    year,
    effectiveFromDate: teacher.joiningDate || new Date(),
    paymentMethod: 'Bank Transfer',
    bankAccountNumber: `XXXXXX${String(teacher.facultyId || '').slice(-4) || '1001'}`,
    ifscCode: 'SBIN0000456',
    approval: {
      preparedBy: 'System Bootstrap',
      reviewedBy: 'Accounts Office',
      remarks: 'Initial payroll structure prepared from faculty records.',
    },
    remarks: 'Seeded from teacher records for payroll activation.',
    timeline: addTimelineEntry([], {
      label: 'Salary structure created',
      by: 'System Bootstrap',
      note: 'Initial payroll record generated automatically from faculty data.',
    }),
  };
};

const ensurePayrollBootstrap = async () => {
  const totalPayroll = await Payroll.estimatedDocumentCount();
  if (totalPayroll > 0) return;

  const teachers = await Teacher.find({ status: { $ne: 'Resigned' } })
    .sort({ createdAt: -1 })
    .limit(24)
    .lean();

  if (teachers.length === 0) return;

  const { month, year } = getCurrentMonthYear();
  const bootstrapRecords = teachers.map((teacher) => buildBootstrapPayload(teacher, month, year));
  await Payroll.insertMany(bootstrapRecords, { ordered: false });
};

const buildFilters = (query = {}) => {
  const filter = {};
  if (query.department) filter.department = query.department;
  if (query.payrollStatus) filter.payrollStatus = query.payrollStatus;
  if (query.month) filter.month = query.month;
  if (query.year) filter.year = toNumber(query.year);
  if (query.salaryType) filter.salaryType = query.salaryType;
  if (query.employeeId) filter.employeeId = query.employeeId;

  if (query.search?.trim()) {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ employeeName: regex }, { employeeId: regex }, { department: regex }, { designation: regex }];
  }

  return filter;
};

const saveFinanceTransaction = async (record, adminName, description) => {
  await FinanceTransaction.create({
    date: record.paymentDate || new Date(),
    description,
    details: `${record.employeeName} (${record.employeeId})`,
    category: 'Payroll',
    type: 'expense',
    amount: record.netSalary,
    status: 'Completed',
    entityCount: 1,
    reference: `${record.employeeId}-${record.month}-${record.year}`,
    createdBy: adminName,
  });
};

export const getPayrollSummary = async (req, res, next) => {
  try {
    await ensurePayrollBootstrap();

    const { month, year } = req.query.month && req.query.year
      ? { month: req.query.month, year: toNumber(req.query.year) }
      : getCurrentMonthYear();

    const records = await Payroll.find({ month, year }).sort({ employeeName: 1 }).lean();
    const totalEmployees = records.length;
    const payrollThisMonth = records.reduce((sum, record) => sum + toNumber(record.netSalary), 0);
    const pendingApprovals = records.filter((record) => record.payrollStatus === 'Pending Approval').length;
    const totalDeductions = records.reduce((sum, record) => sum + toNumber(record.totalDeductions), 0);
    const payslipsGenerated = records.filter((record) => record.payslip?.generated).length;
    const failedPayments = records.filter((record) => record.payrollStatus === 'Failed').length;

    const departments = await Payroll.distinct('department');
    const months = await Payroll.distinct('month');
    const recentActivity = records
      .flatMap((record) => (record.timeline || []).map((entry) => ({
        ...entry,
        employeeName: record.employeeName,
        employeeId: record.employeeId,
      })))
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6);

    return sendSuccess(res, {
      cards: {
        totalEmployees,
        payrollThisMonth,
        pendingApprovals,
        totalDeductions,
        payslipsGenerated,
        failedPayments,
      },
      filters: {
        departments,
        months,
        salaryTypes: ['Monthly', 'Hourly', 'Contract'],
        statuses: ['Draft', 'Pending Approval', 'Approved', 'Processed', 'Paid', 'Failed', 'On Hold'],
      },
      recentActivity,
      month,
      year,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRecords = async (req, res, next) => {
  try {
    await ensurePayrollBootstrap();

    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);
    const filter = buildFilters(req.query);

    const [records, total] = await Promise.all([
      Payroll.find(filter).sort({ year: -1, month: -1, employeeName: 1 }).skip(skip).limit(lim).lean(),
      Payroll.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      records: records.map(buildRecordResponse),
      pagination: paginationMeta(total, page, lim),
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRecord = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id).lean();
    if (!record) return sendError(res, 'Payroll record not found.', 404);
    return sendSuccess(res, { record: buildRecordResponse(record) });
  } catch (error) {
    next(error);
  }
};

export const createSalaryStructure = async (req, res, next) => {
  try {
    const computed = calculatePayrollValues(req.body);
    const adminName = req.admin?.name || 'Accounts Admin';
    const payroll = await Payroll.create({
      ...req.body,
      employeeId: req.body.employeeId?.trim()?.toUpperCase(),
      month: req.body.month || getCurrentMonthYear().month,
      year: toNumber(req.body.year, getCurrentMonthYear().year),
      ...computed,
      approval: {
        preparedBy: req.body.approval?.preparedBy || adminName,
        reviewedBy: req.body.approval?.reviewedBy || '',
        approvedBy: req.body.approval?.approvedBy || '',
        approvalDate: req.body.approval?.approvalDate || null,
        remarks: req.body.approval?.remarks || '',
      },
      timeline: addTimelineEntry([], {
        label: 'Salary structure created',
        by: adminName,
        note: 'Payroll salary structure has been created.',
      }),
    });

    return sendSuccess(res, { payroll }, 'Salary structure created.', 201);
  } catch (error) {
    next(error);
  }
};

export const updateSalaryStructure = async (req, res, next) => {
  try {
    const existing = await Payroll.findById(req.params.id);
    if (!existing) return sendError(res, 'Payroll record not found.', 404);

    const computed = calculatePayrollValues({
      basicSalary: req.body.basicSalary ?? existing.basicSalary,
      allowances: { ...existing.allowances?.toObject?.(), ...req.body.allowances },
      deductions: { ...existing.deductions?.toObject?.(), ...req.body.deductions },
      attendance: { ...existing.attendance?.toObject?.(), ...req.body.attendance },
    });

    const updated = await Payroll.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        employeeId: req.body.employeeId ? req.body.employeeId.trim().toUpperCase() : existing.employeeId,
        basicSalary: req.body.basicSalary ?? existing.basicSalary,
        allowances: computed.allowances,
        deductions: computed.deductions,
        attendance: computed.attendance,
        totalAllowances: computed.totalAllowances,
        totalDeductions: computed.totalDeductions,
        grossSalary: computed.grossSalary,
        netSalary: computed.netSalary,
        timeline: addTimelineEntry(existing.timeline, {
          label: 'Salary structure updated',
          by: req.admin?.name || 'Accounts Admin',
          note: 'Payroll details were updated.',
        }),
      },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, { payroll: updated }, 'Salary structure updated.');
  } catch (error) {
    next(error);
  }
};

export const processPayroll = async (req, res, next) => {
  try {
    await ensurePayrollBootstrap();

    const month = req.body.month || getCurrentMonthYear().month;
    const year = toNumber(req.body.year, getCurrentMonthYear().year);
    const filter = buildFilters({ ...req.body, month, year });
    const records = await Payroll.find(filter);

    if (records.length === 0) {
      return sendError(res, 'No payroll records found for the selected criteria.', 404);
    }

    const adminName = req.admin?.name || 'Accounts Admin';
    const processed = await Promise.all(records.map(async (record) => {
      record.payrollStatus = record.payrollStatus === 'Paid' ? 'Paid' : 'Processed';
      record.lastProcessedAt = new Date();
      record.paymentDate = record.paymentDate || new Date();
      record.approval.preparedBy = record.approval.preparedBy || adminName;
      record.timeline = addTimelineEntry(record.timeline, {
        label: 'Payroll processed',
        by: adminName,
        note: `Processed for ${month} ${year}.`,
      });
      await record.save();
      return record;
    }));

    return sendSuccess(res, {
      processedCount: processed.length,
      totalNetPay: processed.reduce((sum, record) => sum + toNumber(record.netSalary), 0),
      records: processed.map((record) => buildRecordResponse(record.toObject())),
    }, 'Payroll processed successfully.');
  } catch (error) {
    next(error);
  }
};

export const previewPayroll = async (req, res, next) => {
  try {
    await ensurePayrollBootstrap();

    const month = req.body.month || req.query.month || getCurrentMonthYear().month;
    const year = toNumber(req.body.year || req.query.year, getCurrentMonthYear().year);
    const filter = buildFilters({ ...req.query, ...req.body, month, year });
    const records = await Payroll.find(filter).sort({ employeeName: 1 }).lean();

    const totals = records.reduce((acc, record) => ({
      employees: acc.employees + 1,
      grossSalary: acc.grossSalary + toNumber(record.grossSalary),
      deductions: acc.deductions + toNumber(record.totalDeductions),
      netSalary: acc.netSalary + toNumber(record.netSalary),
    }), { employees: 0, grossSalary: 0, deductions: 0, netSalary: 0 });

    return sendSuccess(res, {
      month,
      year,
      totals,
      records: records.map(buildRecordResponse),
    });
  } catch (error) {
    next(error);
  }
};

export const generatePayslip = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return sendError(res, 'Payroll record not found.', 404);

    const delivery = req.body.delivery || 'download';
    record.payslip.generated = true;
    record.payslip.generatedAt = new Date();
    record.payslip.lastGeneratedBy = req.admin?.name || 'Accounts Admin';
    if (delivery === 'email') {
      record.payslip.emailedAt = new Date();
    } else {
      record.payslip.downloadCount = toNumber(record.payslip.downloadCount) + 1;
    }
    record.timeline = addTimelineEntry(record.timeline, {
      label: delivery === 'email' ? 'Payslip emailed' : 'Payslip generated',
      by: req.admin?.name || 'Accounts Admin',
      note: delivery === 'email' ? 'Payslip email was queued for delivery.' : 'Payslip was prepared for download.',
    });
    await record.save();

    return sendSuccess(res, {
      payslip: buildPayslip(record.toObject()),
      record: buildRecordResponse(record.toObject()),
    }, delivery === 'email' ? 'Payslip email queued.' : 'Payslip generated.');
  } catch (error) {
    next(error);
  }
};

export const generateAllPayslips = async (req, res, next) => {
  try {
    const month = req.body.month || getCurrentMonthYear().month;
    const year = toNumber(req.body.year, getCurrentMonthYear().year);
    const filter = buildFilters({ ...req.body, month, year });
    const records = await Payroll.find(filter);

    await Promise.all(records.map(async (record) => {
      record.payslip.generated = true;
      record.payslip.generatedAt = new Date();
      record.payslip.lastGeneratedBy = req.admin?.name || 'Accounts Admin';
      record.timeline = addTimelineEntry(record.timeline, {
        label: 'Payslip batch generated',
        by: req.admin?.name || 'Accounts Admin',
        note: `Bulk payslip generation for ${month} ${year}.`,
      });
      await record.save();
    }));

    return sendSuccess(res, { generatedCount: records.length }, 'Payslips generated.');
  } catch (error) {
    next(error);
  }
};

export const markPayrollPaid = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return sendError(res, 'Payroll record not found.', 404);

    record.payrollStatus = 'Paid';
    record.paymentDate = req.body.paymentDate || new Date();
    record.timeline = addTimelineEntry(record.timeline, {
      label: 'Salary marked as paid',
      by: req.admin?.name || 'Accounts Admin',
      note: `Paid through ${req.body.paymentMethod || record.paymentMethod}.`,
    });
    if (req.body.paymentMethod) record.paymentMethod = req.body.paymentMethod;
    await record.save();
    await saveFinanceTransaction(record, req.admin?.name || 'Accounts Admin', 'Payroll salary released');

    return sendSuccess(res, { payroll: buildRecordResponse(record.toObject()) }, 'Payroll marked as paid.');
  } catch (error) {
    next(error);
  }
};

export const approvePayroll = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return sendError(res, 'Payroll record not found.', 404);

    record.payrollStatus = 'Approved';
    record.approval.approvedBy = req.admin?.name || 'Approver';
    record.approval.reviewedBy = req.body.reviewedBy || record.approval.reviewedBy;
    record.approval.approvalDate = new Date();
    record.approval.remarks = req.body.remarks ?? record.approval.remarks;
    record.timeline = addTimelineEntry(record.timeline, {
      label: 'Payroll approved',
      by: req.admin?.name || 'Approver',
      note: req.body.remarks || 'Payroll approved for release.',
    });
    await record.save();

    return sendSuccess(res, { payroll: buildRecordResponse(record.toObject()) }, 'Payroll approved.');
  } catch (error) {
    next(error);
  }
};

export const rejectPayroll = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return sendError(res, 'Payroll record not found.', 404);

    record.payrollStatus = 'On Hold';
    record.approval.rejectedBy = req.admin?.name || 'Approver';
    record.approval.rejectedAt = new Date();
    record.approval.remarks = req.body.remarks || 'Payroll returned for correction.';
    record.timeline = addTimelineEntry(record.timeline, {
      label: 'Payroll rejected',
      by: req.admin?.name || 'Approver',
      note: req.body.remarks || 'Returned for correction.',
    });
    await record.save();

    return sendSuccess(res, { payroll: buildRecordResponse(record.toObject()) }, 'Payroll rejected.');
  } catch (error) {
    next(error);
  }
};

export const exportPayrollReport = async (req, res, next) => {
  try {
    await ensurePayrollBootstrap();
    const reportType = req.query.type || 'Monthly Payroll Report';
    const filter = buildFilters(req.query);
    const records = await Payroll.find(filter).sort({ year: -1, month: -1, employeeName: 1 }).lean();

    const rows = records.map((record) => ({
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      designation: record.designation,
      salaryType: record.salaryType,
      basicSalary: record.basicSalary,
      grossSalary: record.grossSalary,
      totalDeductions: record.totalDeductions,
      netSalary: record.netSalary,
      payrollStatus: record.payrollStatus,
      month: record.month,
      year: record.year,
      paymentDate: record.paymentDate,
      paymentMethod: record.paymentMethod,
      approvedBy: record.approval?.approvedBy || '',
    }));

    return sendSuccess(res, {
      reportType,
      exportedAt: new Date().toISOString(),
      rows,
    });
  } catch (error) {
    next(error);
  }
};
