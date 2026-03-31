import dotenv from "dotenv";

import connectDatabase from "../config/db.js";
import AcademicApproval from "../models/AcademicApproval.js";
import AcademicRecord from "../models/AcademicRecord.js";
import Advisory from "../models/Advisory.js";
import Announcement from "../models/Announcement.js";
import Campaign from "../models/Campaign.js";
import CampusEvent from "../models/CampusEvent.js";
import ClassSchedule from "../models/ClassSchedule.js";
import CurriculumPlan from "../models/CurriculumPlan.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ResponseTrack from "../models/ResponseTrack.js";
import Student from "../models/Student.js";
import StudentProgress from "../models/StudentProgress.js";
import TeacherSubject from "../models/TeacherSubject.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";

dotenv.config();

const tenantSlug = process.env.DEFAULT_TENANT || "cgu";

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({ tenantSlug }),
    Student.deleteMany({ tenantSlug }),
    TeacherSubject.deleteMany({ tenantSlug }),
    ClassSchedule.deleteMany({ tenantSlug }),
    Advisory.deleteMany({ tenantSlug }),
    StudentProgress.deleteMany({ tenantSlug }),
    CurriculumPlan.deleteMany({ tenantSlug }),
    LeaveRequest.deleteMany({ tenantSlug }),
    Timetable.deleteMany({ tenantSlug }),
    AcademicApproval.deleteMany({ tenantSlug }),
    AcademicRecord.deleteMany({ tenantSlug }),
    Announcement.deleteMany({ tenantSlug }),
    Campaign.deleteMany({ tenantSlug }),
    CampusEvent.deleteMany({ tenantSlug }),
    ResponseTrack.deleteMany({ tenantSlug }),
  ]);

  await User.insertMany([
    {
      tenantSlug,
      role: "academic",
      username: "academic",
      password: "password",
      displayName: "Academic Office",
    },
    {
      tenantSlug,
      role: "teacher",
      username: "teacher1",
      password: "password",
      displayName: "Prof. Arjun Rao",
      managedByAcademic: true,
    },
    {
      tenantSlug,
      role: "student",
      username: "student1",
      password: "password",
      displayName: "Riya Sharma",
    },
    {
      tenantSlug,
      role: "student",
      username: "student2",
      password: "password",
      displayName: "Aditya Verma",
    },
    {
      tenantSlug,
      role: "communication",
      username: "commdesk",
      password: "password",
      displayName: "Communication Cell",
    },
  ]);

  await Student.insertMany([
    {
      tenantSlug,
      studentId: "AYRA-STU-001",
      username: "student1",
      fullName: "Riya Sharma",
      department: "CSE",
      semester: 6,
      section: "A",
      email: "riya.sharma@ayraerp.edu",
      phone: "9876543210",
      photoDataUrl: "",
      status: "accept",
    },
    {
      tenantSlug,
      studentId: "AYRA-STU-002",
      username: "student2",
      fullName: "Aditya Verma",
      department: "CSE",
      semester: 6,
      section: "A",
      email: "aditya.verma@ayraerp.edu",
      phone: "9123456780",
      photoDataUrl: "",
      status: "pending",
    },
  ]);

  await TeacherSubject.insertMany([
    {
      tenantSlug,
      subjectCode: "CSE601",
      subjectName: "Operating Systems",
      department: "CSE",
      semester: 6,
      credits: 4,
      facultyName: "Prof. Arjun Rao",
    },
    {
      tenantSlug,
      subjectCode: "CSE603",
      subjectName: "Compiler Design",
      department: "CSE",
      semester: 6,
      credits: 3,
      facultyName: "Prof. Arjun Rao",
    },
  ]);

  await ClassSchedule.insertMany([
    {
      tenantSlug,
      subjectCode: "CSE601",
      className: "Operating Systems Lecture",
      day: "Monday",
      startTime: "10:00",
      endTime: "11:00",
      room: "B-204",
      section: "A",
    },
    {
      tenantSlug,
      subjectCode: "CSE603",
      className: "Compiler Design Lab",
      day: "Wednesday",
      startTime: "14:00",
      endTime: "16:00",
      room: "Lab-2",
      section: "A",
    },
  ]);

  await Advisory.insertMany([
    {
      tenantSlug,
      title: "Attendance Improvement",
      message: "Students below 75 percent attendance must meet the class teacher this week.",
      teacherName: "Prof. Arjun Rao",
      targetAudience: "CSE 6A",
    },
  ]);

  await StudentProgress.insertMany([
    {
      tenantSlug,
      studentId: "AYRA-STU-001",
      semester: 6,
      subjectCode: "CSE601",
      attendance: 91,
      marks: 84,
      remarks: "Consistent classroom performance",
      advisorFlag: false,
    },
    {
      tenantSlug,
      studentId: "AYRA-STU-002",
      semester: 6,
      subjectCode: "CSE603",
      attendance: 72,
      marks: 68,
      remarks: "Needs mentoring support",
      advisorFlag: true,
    },
  ]);

  await LeaveRequest.insertMany([
    {
      tenantSlug,
      studentName: "Riya Sharma",
      studentId: "AYRA-STU-001",
      fromDate: "2026-03-26",
      toDate: "2026-03-27",
      reason: "Medical rest",
      status: "pending",
      rejectReason: "",
    },
  ]);

  await CurriculumPlan.insertMany([
    {
      tenantSlug,
      program: "B.Tech CSE",
      semester: 6,
      title: "Outcome-based revision 2026",
      status: "pending",
      revision: "R2",
    },
  ]);

  await Timetable.insertMany([
    {
      tenantSlug,
      department: "CSE",
      semester: 6,
      section: "A",
      day: "Monday",
      slot: "10:00 - 11:00",
      subjectName: "Operating Systems",
      facultyName: "Prof. Arjun Rao",
      room: "B-204",
    },
  ]);

  await AcademicApproval.insertMany([
    {
      tenantSlug,
      itemType: "Curriculum Revision",
      title: "CSE Semester 6 elective basket",
      status: "pending",
      requestedBy: "Board of Studies",
    },
  ]);

  await AcademicRecord.insertMany([
    {
      tenantSlug,
      recordType: "Accreditation",
      referenceNo: "AYRA-REC-001",
      title: "NAAC Evidence Mapping",
      owner: "Academic Office",
      notes: "Updated with 2026 semester files",
    },
  ]);

  await Announcement.insertMany([
    {
      tenantSlug,
      title: "Hostel Maintenance Notice",
      content: "Water supply will be paused from 8 PM to 10 PM for maintenance.",
      audience: "Students",
      channel: "Portal + Email",
      status: "pending",
    },
  ]);

  await Campaign.insertMany([
    {
      tenantSlug,
      title: "Placement Readiness Week",
      audience: "Final Year",
      startDate: "2026-03-24",
      endDate: "2026-03-30",
      status: "accept",
    },
  ]);

  await CampusEvent.insertMany([
    {
      tenantSlug,
      year: 2026,
      eventName: "Innovation Showcase",
      eventType: "Academic",
      venue: "Main Auditorium",
      eventDate: "2026-04-05",
      coordinator: "Communication Cell",
      audience: "All Students",
    },
    {
      tenantSlug,
      year: 2027,
      eventName: "Semester Opening Assembly",
      eventType: "Communication",
      venue: "University Grounds",
      eventDate: "2027-01-12",
      coordinator: "Academic Office",
      audience: "All Students",
    },
  ]);

  await ResponseTrack.insertMany([
    {
      tenantSlug,
      sourceType: "Email Campaign",
      title: "Placement Readiness Week",
      responseRate: 74,
      escalations: 4,
      notes: "Strong response from final year students",
    },
  ]);

  console.log("AYRA ERP seed complete for tenant:", tenantSlug);
  process.exit(0);
}

seed().catch((error) => {
  console.error("AYRA ERP seed failed", error);
  process.exit(1);
});
