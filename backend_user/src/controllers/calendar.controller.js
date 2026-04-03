import CampusEvent from "../models/CampusEvent.js";
import Student from "../models/Student.js";
import TeacherAlert from "../models/TeacherAlert.js";
import { sendAlertMail } from "../utils/mailer.js";
import { deleteDocument, listDocuments } from "../utils/crudHandlers.js";

export const listCalendarEvents = listDocuments(CampusEvent);

function buildEventAudience(audience) {
  const normalized = String(audience || "").trim();

  if (!normalized || /all students/i.test(normalized)) {
    return {
      audienceType: "all-students",
      audienceValue: "",
      targetAudience: "All Students",
      query: {},
    };
  }

  const semesterMatch = normalized.match(/semester\s*(\d+)/i);
  if (semesterMatch) {
    const semester = Number(semesterMatch[1]);
    return {
      audienceType: "semester",
      audienceValue: String(semester),
      targetAudience: `Semester: ${semester}`,
      query: { semester },
    };
  }

  const sectionMatch = normalized.match(/section\s*([A-Z])/i);
  if (sectionMatch) {
    const section = sectionMatch[1].toUpperCase();
    return {
      audienceType: "section",
      audienceValue: section,
      targetAudience: `Section: ${section}`,
      query: { section },
    };
  }

  return {
    audienceType: "department",
    audienceValue: normalized,
    targetAudience: `Department: ${normalized}`,
    query: { department: normalized },
  };
}

async function sendEventAlert(tenantSlug, eventItem) {
  const audience = buildEventAudience(eventItem.audience);
  const students = await Student.find({
    tenantSlug,
    status: "accept",
    email: { $exists: true, $ne: "" },
    ...audience.query,
  }).select("email");

  const recipientEmails = [...new Set(students.map((student) => student.email.trim()).filter(Boolean))];

  if (!recipientEmails.length) {
    return;
  }

  const senderEmail = process.env.MAIL_ALERT_EMAIL || "";
  const subject = `[AYRA ERP] Event Scheduled: ${eventItem.eventName}`;
  const text = [
    `Event: ${eventItem.eventName}`,
    `Type: ${eventItem.eventType}`,
    `Date: ${eventItem.eventDate}`,
    `Venue: ${eventItem.venue}`,
    `Coordinator: ${eventItem.coordinator}`,
    `Audience: ${eventItem.audience}`,
  ].join("\n");

  const html = `
    <div style="background:#f8fafc;padding:32px 16px;font-family:Segoe UI,Arial,sans-serif;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;border:1px solid #dbeafe;overflow:hidden;">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#082f49 0%,#0f766e 70%,#d97706 100%);color:#ffffff;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.16);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Event Alert</div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2;">${eventItem.eventName}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.82);font-size:14px;">Scheduled for ${eventItem.eventDate}</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 10px;color:#334155;"><strong>Type:</strong> ${eventItem.eventType}</p>
          <p style="margin:0 0 10px;color:#334155;"><strong>Venue:</strong> ${eventItem.venue}</p>
          <p style="margin:0 0 10px;color:#334155;"><strong>Coordinator:</strong> ${eventItem.coordinator}</p>
          <p style="margin:0;color:#334155;"><strong>Audience:</strong> ${eventItem.audience}</p>
        </div>
      </div>
    </div>
  `;

  await sendAlertMail({
    to: senderEmail,
    bcc: recipientEmails,
    replyTo: senderEmail,
    subject,
    text,
    html,
  });

  await TeacherAlert.create({
    tenantSlug,
    alertType: "Event",
    title: eventItem.eventName,
    message: `Scheduled on ${eventItem.eventDate} at ${eventItem.venue}. Coordinator: ${eventItem.coordinator}.`,
    teacherName: eventItem.coordinator,
    targetAudience: audience.targetAudience,
    audienceType: audience.audienceType,
    audienceValue: audience.audienceValue,
    teacherEmail: senderEmail,
    recipientEmails,
    recipientCount: recipientEmails.length,
    deliveryStatus: "sent",
    sentAt: new Date(),
    lastError: "",
  });
}

export async function createCalendarEvent(req, res, next) {
  try {
    const item = await CampusEvent.create({
      ...req.body,
      tenantSlug: req.params.tenant,
    });

    try {
      await sendEventAlert(req.params.tenant, item);
    } catch (alertError) {
      console.error("Calendar event alert send failed:", alertError.message);
    }

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateCalendarEvent(req, res, next) {
  try {
    const item = await CampusEvent.findOneAndUpdate(
      { _id: req.params.id, tenantSlug: req.params.tenant },
      req.body,
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(404).json({ message: "Record not found" });
    }

    try {
      await sendEventAlert(req.params.tenant, item);
    } catch (alertError) {
      console.error("Calendar event update alert send failed:", alertError.message);
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
}

export const deleteCalendarEvent = deleteDocument(CampusEvent);
