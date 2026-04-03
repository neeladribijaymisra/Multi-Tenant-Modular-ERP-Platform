import AcademicApproval from "../models/AcademicApproval.js";
import AcademicRecord from "../models/AcademicRecord.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import CurriculumPlan from "../models/CurriculumPlan.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Student from "../models/Student.js";
import TeacherAlert from "../models/TeacherAlert.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import { sendAlertMail } from "../utils/mailer.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";
import { generatePassword } from "../utils/password.js";

export const listCurriculumPlans = listDocuments(CurriculumPlan);
export const createCurriculumPlan = createDocument(CurriculumPlan);
export const updateCurriculumPlan = updateDocument(CurriculumPlan);
export const deleteCurriculumPlan = deleteDocument(CurriculumPlan);

export const listTimetables = listDocuments(Timetable);
export const createTimetable = createDocument(Timetable);
export const updateTimetable = updateDocument(Timetable);
export const deleteTimetable = deleteDocument(Timetable);

export const listApprovals = listDocuments(AcademicApproval);
export const createApproval = createDocument(AcademicApproval);
export const updateApproval = updateDocument(AcademicApproval);
export const deleteApproval = deleteDocument(AcademicApproval);

export const listRecords = listDocuments(AcademicRecord);
export const createRecord = createDocument(AcademicRecord);
export const updateRecord = updateDocument(AcademicRecord);
export const deleteRecord = deleteDocument(AcademicRecord);

export const listAcademicStudents = listDocuments(Student);
export const updateAcademicStudent = updateDocument(Student);
export const deleteAcademicStudent = deleteDocument(Student);
export const listTeacherAssignments = listDocuments(TeacherAssignment);
export const createTeacherAssignment = createDocument(TeacherAssignment);
export const updateTeacherAssignment = updateDocument(TeacherAssignment);
export const deleteTeacherAssignment = deleteDocument(TeacherAssignment);
export const listAttendanceRecords = listDocuments(AttendanceRecord);

export const listAcademicLeaveRequests = listDocuments(LeaveRequest);
export const listAcademicAlerts = listDocuments(TeacherAlert);

function buildAlertAudienceLabel(audienceType, audienceValue) {
  if (audienceType === "department" && audienceValue) {
    return `Department: ${audienceValue}`;
  }

  if (audienceType === "semester" && audienceValue) {
    return `Semester: ${audienceValue}`;
  }

  if (audienceType === "section" && audienceValue) {
    return `Section: ${audienceValue}`;
  }

  if (audienceType === "specific-emails" && audienceValue) {
    const emails = audienceValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return `Selected Students: ${emails.length}`;
  }

  return "All Students";
}

async function getSpecificEmailRecipients(tenantSlug, audienceValue) {
  const requestedEmails = [
    ...new Set(
      audienceValue
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (!requestedEmails.length) {
    return [];
  }

  const students = await Student.find({
    tenantSlug,
    status: "accept",
    email: { $in: requestedEmails },
  }).select("email");

  const matchedEmails = [...new Set(students.map((student) => student.email.trim().toLowerCase()).filter(Boolean))];
  const missingEmails = requestedEmails.filter((email) => !matchedEmails.includes(email));

  if (missingEmails.length) {
    const error = new Error(`These student emails were not found or are not approved: ${missingEmails.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return matchedEmails;
}

async function getAlertRecipients(tenantSlug, audienceType, audienceValue) {
  if (audienceType === "specific-emails" && audienceValue) {
    return getSpecificEmailRecipients(tenantSlug, audienceValue);
  }

  const query = {
    tenantSlug,
    status: "accept",
    email: { $exists: true, $ne: "" },
  };

  if (audienceType === "department" && audienceValue) {
    query.department = audienceValue.trim();
  }

  if (audienceType === "semester" && audienceValue) {
    query.semester = Number(audienceValue);
  }

  if (audienceType === "section" && audienceValue) {
    query.section = audienceValue.trim();
  }

  const students = await Student.find(query).select("email");
  return [...new Set(students.map((student) => student.email.trim()).filter(Boolean))];
}

function buildAlertHtml({ title, message, senderName, alertType, targetAudience }) {
  const safeMessage = message
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px;color:#334155;line-height:1.7;">${line}</p>`)
    .join("");

  return `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Segoe UI,Arial,sans-serif;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#0f172a 0%,#0f766e 100%);color:#ffffff;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.14);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${alertType} Alert</div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2;">${title}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">Target audience: ${targetAudience}</p>
        </div>
        <div style="padding:28px;">
          ${safeMessage}
          <div style="margin-top:24px;padding:18px 20px;border-radius:18px;background:#ecfeff;border:1px solid #a5f3fc;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0f766e;">Sent by</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${senderName}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function createAcademicAlert(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const {
      alertType,
      title,
      message,
      teacherName,
      audienceType = "all-students",
      audienceValue = "",
    } = req.body;

    if (!title?.trim() || !message?.trim() || !teacherName?.trim()) {
      return res.status(400).json({ message: "Title, message, and sender name are required." });
    }

    if (["department", "semester", "section", "specific-emails"].includes(audienceType) && !String(audienceValue).trim()) {
      return res.status(400).json({ message: "Audience value is required for the selected audience type." });
    }

    const targetAudience = buildAlertAudienceLabel(audienceType, String(audienceValue || ""));
    const recipientEmails = await getAlertRecipients(tenantSlug, audienceType, String(audienceValue || ""));

    if (!recipientEmails.length) {
      return res.status(400).json({ message: "No student email recipients were found for this alert." });
    }

    const senderEmail = process.env.MAIL_ALERT_EMAIL || "";
    const subject = `[AYRA ERP] ${alertType}: ${title.trim()}`;
    const text = `${title.trim()}\n\n${message.trim()}\n\nAudience: ${targetAudience}\nSent by: ${teacherName.trim()}`;
    const html = buildAlertHtml({
      title: title.trim(),
      message: message.trim(),
      senderName: teacherName.trim(),
      alertType,
      targetAudience,
    });

    try {
      await sendAlertMail({
        to: senderEmail,
        bcc: recipientEmails,
        replyTo: senderEmail,
        subject,
        text,
        html,
      });
    } catch (mailError) {
      const failedAlert = await TeacherAlert.create({
        tenantSlug,
        alertType,
        title: title.trim(),
        message: message.trim(),
        teacherName: teacherName.trim(),
        teacherEmail: senderEmail,
        targetAudience,
        audienceType,
        audienceValue: String(audienceValue || "").trim(),
        recipientEmails,
        recipientCount: recipientEmails.length,
        deliveryStatus: "failed",
        lastError: mailError.message,
        sentAt: new Date(),
      });

      return res.status(500).json({
        message: failedAlert.lastError || "Unable to send alert email.",
      });
    }

    const alert = await TeacherAlert.create({
      tenantSlug,
      alertType,
      title: title.trim(),
      message: message.trim(),
      teacherName: teacherName.trim(),
      teacherEmail: senderEmail,
      targetAudience,
      audienceType,
      audienceValue: String(audienceValue || "").trim(),
      recipientEmails,
      recipientCount: recipientEmails.length,
      deliveryStatus: "sent",
      sentAt: new Date(),
    });

    res.status(201).json(alert);
  } catch (error) {
    next(error);
  }
}

export const deleteAcademicAlert = deleteDocument(TeacherAlert);

export async function listTeachers(req, res, next) {
  try {
    const teachers = await User.find({
      tenantSlug: req.params.tenant,
      role: "teacher",
    }).sort({ createdAt: -1 });

    res.json(
      teachers.map((teacher) => ({
        _id: teacher._id,
        username: teacher.username,
        displayName: teacher.displayName,
        password: teacher.password,
        role: teacher.role,
      })),
    );
  } catch (error) {
    next(error);
  }
}

export async function createTeacher(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const generatedPassword = req.body.password?.trim() || generatePassword();

    const teacher = await User.create({
      tenantSlug,
      role: "teacher",
      username: req.body.username,
      password: generatedPassword,
      displayName: req.body.displayName,
      managedByAcademic: true,
    });

    res.status(201).json({
      _id: teacher._id,
      username: teacher.username,
      displayName: teacher.displayName,
      password: teacher.password,
      generatedPassword,
      role: teacher.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTeacher(req, res, next) {
  try {
    const teacher = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantSlug: req.params.tenant,
        role: "teacher",
      },
      req.body,
      { new: true, runValidators: true },
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher account not found" });
    }

    res.json({
      _id: teacher._id,
      username: teacher.username,
      displayName: teacher.displayName,
      password: teacher.password,
      role: teacher.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacher(req, res, next) {
  try {
    const teacher = await User.findOneAndDelete({
      _id: req.params.id,
      tenantSlug: req.params.tenant,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher account not found" });
    }

    res.json({ message: "Teacher account deleted" });
  } catch (error) {
    next(error);
  }
}
