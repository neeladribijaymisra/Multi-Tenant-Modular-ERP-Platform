import Announcement from "../models/Announcement.js";
import Campaign from "../models/Campaign.js";
import CampusEvent from "../models/CampusEvent.js";
import HostelAllocation from "../models/HostelAllocation.js";
import HostelRoom from "../models/HostelRoom.js";
import ResponseTrack from "../models/ResponseTrack.js";
import Student from "../models/Student.js";
import TeacherAlert from "../models/TeacherAlert.js";
import TransportAllocation from "../models/TransportAllocation.js";
import TransportRoute from "../models/TransportRoute.js";
import { sendAlertMail } from "../utils/mailer.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listAnnouncements = listDocuments(Announcement);
export const createAnnouncement = createDocument(Announcement);
export const updateAnnouncement = updateDocument(Announcement);
export const deleteAnnouncement = deleteDocument(Announcement);

export const listCampaigns = listDocuments(Campaign);
export const createCampaign = createDocument(Campaign);
export const updateCampaign = updateDocument(Campaign);
export const deleteCampaign = deleteDocument(Campaign);

export const listEvents = listDocuments(CampusEvent);
export const createEvent = createDocument(CampusEvent);
export const updateEvent = updateDocument(CampusEvent);
export const deleteEvent = deleteDocument(CampusEvent);

export const listCommunicationStudents = listDocuments(Student);
export const listHostelRooms = listDocuments(HostelRoom);
export const createHostelRoom = createDocument(HostelRoom);
export const updateHostelRoom = updateDocument(HostelRoom);
export const deleteHostelRoom = deleteDocument(HostelRoom);
export const listHostelAllocations = listDocuments(HostelAllocation);
export const listTransportRoutes = listDocuments(TransportRoute);
export const createTransportRoute = createDocument(TransportRoute);
export const updateTransportRoute = updateDocument(TransportRoute);
export const deleteTransportRoute = deleteDocument(TransportRoute);
export const listTransportAllocations = listDocuments(TransportAllocation);

export const listResponses = listDocuments(ResponseTrack);
export const createResponse = createDocument(ResponseTrack);
export const updateResponse = updateDocument(ResponseTrack);
export const deleteResponse = deleteDocument(ResponseTrack);

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
        <div style="padding:24px 28px;background:linear-gradient(135deg,#1e293b 0%,#0284c7 100%);color:#ffffff;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.14);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${alertType} Alert</div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2;">${title}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.82);font-size:14px;">Target audience: ${targetAudience}</p>
        </div>
        <div style="padding:28px;">
          ${safeMessage}
          <div style="margin-top:24px;padding:18px 20px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0369a1;">Sent by</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${senderName}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export const listCommunicationAlerts = listDocuments(TeacherAlert);

function extractPrimaryCode(value) {
  return String(value || "")
    .split(" | ")[0]
    .trim();
}

function getNextBedLabel(room) {
  const bookedBeds = new Set((room.bookedBeds || []).map((item) => String(item)));
  for (let index = 1; index <= Number(room.totalBeds || 0); index += 1) {
    const label = `Bed ${index}`;
    if (!bookedBeds.has(label)) {
      return label;
    }
  }

  return "";
}

function getNextSeatLabel(route) {
  const takenSeats = Number(route.capacity || 0) - Number(route.availableSeats || 0);
  return `Seat ${takenSeats + 1}`;
}

export async function createHostelAllocation(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const studentId = extractPrimaryCode(req.body.studentId);
    const roomCode = extractPrimaryCode(req.body.roomCode);

    if (!studentId || !roomCode) {
      return res.status(400).json({ message: "Student ID and hostel room are required." });
    }

    const [student, room, existingAllocation] = await Promise.all([
      Student.findOne({ tenantSlug, studentId, status: "accept" }),
      HostelRoom.findOne({ tenantSlug, roomCode }),
      HostelAllocation.findOne({ tenantSlug, studentId, allocationStatus: "Active" }),
    ]);

    if (!student) {
      return res.status(404).json({ message: "Approved student record not found for this registration number." });
    }

    if (!room) {
      return res.status(404).json({ message: "Selected hostel room was not found." });
    }

    if (existingAllocation) {
      return res.status(400).json({ message: "This student already has an active hostel allocation." });
    }

    if (Number(room.availableBeds || 0) <= 0) {
      return res.status(400).json({ message: "This room is already fully booked." });
    }

    const bedNumber = getNextBedLabel(room);
    if (!bedNumber) {
      return res.status(400).json({ message: "No free bed is available in this room." });
    }

    const allocation = await HostelAllocation.create({
      tenantSlug,
      studentId: student.studentId,
      studentName: student.fullName,
      department: student.department,
      semester: student.semester,
      section: student.section,
      roomCode: room.roomCode,
      hostelName: room.hostelName,
      hostelCategory: room.hostelCategory,
      floorNumber: room.floorNumber,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      bedNumber,
      annualFee: room.annualFee,
      paymentStatus: req.body.paymentStatus || "Pending",
      allocationStatus: "Active",
    });

    const bookedBeds = [...(room.bookedBeds || []), bedNumber];
    room.bookedBeds = bookedBeds;
    room.availableBeds = Math.max(Number(room.totalBeds || 0) - bookedBeds.length, 0);
    room.availabilityStatus = room.availableBeds > 0 ? "Available" : "Full";
    await room.save();

    res.status(201).json(allocation);
  } catch (error) {
    next(error);
  }
}

export async function deleteHostelAllocation(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const allocation = await HostelAllocation.findOneAndDelete({
      _id: req.params.id,
      tenantSlug,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Hostel allocation not found." });
    }

    const room = await HostelRoom.findOne({ tenantSlug, roomCode: allocation.roomCode });
    if (room) {
      room.bookedBeds = (room.bookedBeds || []).filter((item) => item !== allocation.bedNumber);
      room.availableBeds = Math.max(Number(room.totalBeds || 0) - room.bookedBeds.length, 0);
      room.availabilityStatus = room.availableBeds > 0 ? "Available" : "Full";
      await room.save();
    }

    res.json({ message: "Hostel allocation removed." });
  } catch (error) {
    next(error);
  }
}

export async function createTransportAllocation(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const studentId = extractPrimaryCode(req.body.studentId);
    const routeCode = extractPrimaryCode(req.body.routeCode);
    const pickupPoint = String(req.body.pickupPoint || "").trim();

    if (!studentId || !routeCode || !pickupPoint) {
      return res.status(400).json({ message: "Student ID, route, and pickup point are required." });
    }

    const [student, route, existingAllocation] = await Promise.all([
      Student.findOne({ tenantSlug, studentId, status: "accept" }),
      TransportRoute.findOne({ tenantSlug, routeCode }),
      TransportAllocation.findOne({ tenantSlug, studentId, allocationStatus: "Active" }),
    ]);

    if (!student) {
      return res.status(404).json({ message: "Approved student record not found for this registration number." });
    }

    if (!route) {
      return res.status(404).json({ message: "Selected transport route was not found." });
    }

    if (existingAllocation) {
      return res.status(400).json({ message: "This student already has an active transport allocation." });
    }

    if (Number(route.availableSeats || 0) <= 0) {
      return res.status(400).json({ message: "This bus is already fully booked." });
    }

    if (!(route.pickupPoints || []).includes(pickupPoint)) {
      return res.status(400).json({ message: "Pickup point is not available on the selected route." });
    }

    const seatNumber = getNextSeatLabel(route);

    const allocation = await TransportAllocation.create({
      tenantSlug,
      studentId: student.studentId,
      studentName: student.fullName,
      department: student.department,
      semester: student.semester,
      section: student.section,
      routeCode: route.routeCode,
      busNumber: route.busNumber,
      city: route.city,
      routeName: route.routeName,
      pickupPoint,
      seatNumber,
      monthlyFee: route.monthlyFee,
      paymentStatus: req.body.paymentStatus || "Pending",
      allocationStatus: "Active",
    });

    route.availableSeats = Math.max(Number(route.availableSeats || 0) - 1, 0);
    route.routeStatus = route.availableSeats > 0 ? "Active" : "Full";
    await route.save();

    res.status(201).json(allocation);
  } catch (error) {
    next(error);
  }
}

export async function deleteTransportAllocation(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const allocation = await TransportAllocation.findOneAndDelete({
      _id: req.params.id,
      tenantSlug,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Transport allocation not found." });
    }

    const route = await TransportRoute.findOne({ tenantSlug, routeCode: allocation.routeCode });
    if (route) {
      route.availableSeats = Math.min(Number(route.availableSeats || 0) + 1, Number(route.capacity || 0));
      route.routeStatus = route.availableSeats > 0 ? "Active" : "Full";
      await route.save();
    }

    res.json({ message: "Transport allocation removed." });
  } catch (error) {
    next(error);
  }
}

export async function createCommunicationAlert(req, res, next) {
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
      await TeacherAlert.create({
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
        message: mailError.message || "Unable to send communication alert email.",
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

export const deleteCommunicationAlert = deleteDocument(TeacherAlert);
