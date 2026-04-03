import Advisory from "../models/Advisory.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import ClassSchedule from "../models/ClassSchedule.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Student from "../models/Student.js";
import StudentProgress from "../models/StudentProgress.js";
import TeacherAlert from "../models/TeacherAlert.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import TeacherSubject from "../models/TeacherSubject.js";
import User from "../models/User.js";
import { sendAlertMail } from "../utils/mailer.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listTeacherStudents = listDocuments(Student);

export async function createTeacherStudent(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const {
      studentId,
      password,
      fullName,
      department,
      semester,
      section,
      email,
      phone,
      sgpa,
      cgpa,
      status,
    } = req.body;

    if (!password?.trim()) {
      return res.status(400).json({ message: "Student password is required." });
    }

    const student = await Student.create({
      tenantSlug,
      studentId,
      username: studentId,
      fullName,
      department,
      semester,
      section,
      email,
      phone,
      sgpa,
      cgpa,
      status,
    });

    await User.create({
      tenantSlug,
      role: "student",
      username: studentId,
      password: password.trim(),
      displayName: fullName,
    });

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
}

export async function updateTeacherStudent(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const currentStudent = await Student.findOne({
      _id: req.params.id,
      tenantSlug,
    });

    if (!currentStudent) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: req.params.id, tenantSlug },
      req.body,
      { new: true, runValidators: true },
    );

    const nextUsername = req.body.studentId || currentStudent.studentId;
    const nextDisplayName = req.body.fullName || currentStudent.fullName;

    const userUpdate = {
      username: nextUsername,
      displayName: nextDisplayName,
    };

    if (req.body.password?.trim()) {
      userUpdate.password = req.body.password.trim();
    }

    await User.findOneAndUpdate(
      {
        tenantSlug,
        role: "student",
        username: currentStudent.studentId,
      },
      userUpdate,
      { new: true, runValidators: true },
    );

    res.json(updatedStudent);
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacherStudent(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      tenantSlug,
    });

    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }

    await User.findOneAndDelete({
      tenantSlug,
      role: "student",
      username: student.username,
    });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export const listSubjects = listDocuments(TeacherSubject);
export const createSubject = createDocument(TeacherSubject);
export const updateSubject = updateDocument(TeacherSubject);
export const deleteSubject = deleteDocument(TeacherSubject);

export const listClasses = listDocuments(ClassSchedule);
export const createClass = createDocument(ClassSchedule);
export const updateClass = updateDocument(ClassSchedule);
export const deleteClass = deleteDocument(ClassSchedule);

export const listAdvisories = listDocuments(Advisory);
export const createAdvisory = createDocument(Advisory);
export const updateAdvisory = updateDocument(Advisory);
export const deleteAdvisory = deleteDocument(Advisory);

export const listProgress = listDocuments(StudentProgress);
export const createProgress = createDocument(StudentProgress);
export const updateProgress = updateDocument(StudentProgress);
export const deleteProgress = deleteDocument(StudentProgress);
export const listTeacherAssignments = listDocuments(TeacherAssignment);
export const listAttendanceRecords = listDocuments(AttendanceRecord);
export const createAttendanceRecord = createDocument(AttendanceRecord);
export const updateAttendanceRecord = updateDocument(AttendanceRecord);
export const deleteAttendanceRecord = deleteDocument(AttendanceRecord);

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

  const students = await Student.find(query).select("email fullName");
  return [...new Set(students.map((student) => student.email.trim()).filter(Boolean))];
}

function buildAlertHtml({ title, message, teacherName, alertType, targetAudience }) {
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
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export const listAlerts = listDocuments(TeacherAlert);

export async function createAlert(req, res, next) {
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
      return res.status(400).json({ message: "Title, message, and teacher name are required." });
    }

    if (["department", "semester", "section", "specific-emails"].includes(audienceType) && !String(audienceValue).trim()) {
      return res.status(400).json({ message: "Audience value is required for the selected audience type." });
    }

    const targetAudience = buildAlertAudienceLabel(audienceType, String(audienceValue || ""));
    const recipientEmails = await getAlertRecipients(tenantSlug, audienceType, String(audienceValue || ""));

    if (!recipientEmails.length) {
      return res.status(400).json({ message: "No student email recipients were found for this alert." });
    }

    const teacherEmail = process.env.MAIL_ALERT_EMAIL || "";
    const subject = `[AYRA ERP] ${alertType}: ${title.trim()}`;
    const text = `${title.trim()}\n\n${message.trim()}\n\nAudience: ${targetAudience}\nSent by: ${teacherName.trim()}`;
    const html = buildAlertHtml({
      title: title.trim(),
      message: message.trim(),
      teacherName: teacherName.trim(),
      alertType,
      targetAudience,
    });

    try {
      await sendAlertMail({
        to: teacherEmail,
        bcc: recipientEmails,
        replyTo: teacherEmail,
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
        teacherEmail,
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
      teacherEmail,
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

export const deleteAlert = deleteDocument(TeacherAlert);

export const listTeacherLeaveRequests = listDocuments(LeaveRequest);
export async function updateTeacherLeaveRequest(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const { status, rejectReason = "" } = req.body;

    if (!["accept", "reject"].includes(status)) {
      return res.status(400).json({ message: "Teachers can only set leave status to accept or reject." });
    }

    if (status === "reject" && !rejectReason.trim()) {
      return res.status(400).json({ message: "Reject reason is required when rejecting a leave request." });
    }

    const item = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, tenantSlug },
      {
        ...req.body,
        status,
        rejectReason: status === "reject" ? rejectReason.trim() : "",
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
