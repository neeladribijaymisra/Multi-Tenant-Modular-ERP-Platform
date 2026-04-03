import Student from "../models/Student.js";
import LeaveRequest from "../models/LeaveRequest.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import StudentProgress from "../models/StudentProgress.js";
import SupportContact from "../models/SupportContact.js";
import TeacherAlert from "../models/TeacherAlert.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listStudents = listDocuments(Student);
export const createStudent = createDocument(Student);
export const updateStudent = updateDocument(Student);
export const deleteStudent = deleteDocument(Student);

export const listLeaveRequests = listDocuments(LeaveRequest);
export const listAttendanceRecords = listDocuments(AttendanceRecord);
export const listSupportContacts = listDocuments(SupportContact);
export const listStudentProgress = listDocuments(StudentProgress);

export async function listStudentAlerts(req, res, next) {
  try {
    const { username } = req.query;

    if (!username?.trim()) {
      return res.status(400).json({ message: "Student username is required to fetch alerts." });
    }

    const student = await Student.findOne({
      tenantSlug: req.params.tenant,
      username: username.trim(),
    }).lean();

    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const alerts = await TeacherAlert.find({ tenantSlug: req.params.tenant }).sort({ createdAt: -1 }).lean();
    const matchedAlerts = alerts.filter((alert) => {
      if (alert.audienceType === "all-students") {
        return true;
      }

      if (alert.audienceType === "department") {
        return String(alert.audienceValue || "").trim().toUpperCase() === String(student.department || "").trim().toUpperCase();
      }

      if (alert.audienceType === "semester") {
        return Number(alert.audienceValue) === Number(student.semester);
      }

      if (alert.audienceType === "section") {
        return String(alert.audienceValue || "").trim().toUpperCase() === String(student.section || "").trim().toUpperCase();
      }

      if (alert.audienceType === "specific-emails") {
        return (alert.recipientEmails || []).some(
          (email) => String(email || "").trim().toLowerCase() === String(student.email || "").trim().toLowerCase(),
        );
      }

      return false;
    });

    res.json(matchedAlerts);
  } catch (error) {
    next(error);
  }
}

export async function createLeaveRequest(req, res, next) {
  try {
    const item = await LeaveRequest.create({
      ...req.body,
      tenantSlug: req.params.tenant,
      status: "pending",
      rejectReason: "",
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateLeaveRequest(req, res, next) {
  try {
    const item = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, tenantSlug: req.params.tenant },
      {
        ...req.body,
        status: "pending",
        rejectReason: "",
      },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
}

export const deleteLeaveRequest = deleteDocument(LeaveRequest);
