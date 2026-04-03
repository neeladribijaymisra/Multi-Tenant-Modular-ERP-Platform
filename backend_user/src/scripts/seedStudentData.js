import mongoose from "mongoose";
import Student from "../models/Student.js";
import User from "../models/User.js";
import StudentProgress from "../models/StudentProgress.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import ClassSchedule from "../models/ClassSchedule.js";

const TENANT_SLUG = "cgu";

const sampleStudents = [
  { studentId: "CSE001", username: "amit_patel", fullName: "Amit Patel", department: "CSE", semester: 6, section: "A", email: "amit@example.com", phone: "9876543210", cgpa: 8.5, sgpa: 8.7 },
  { studentId: "CSE002", username: "priya_sharma", fullName: "Priya Sharma", department: "CSE", semester: 6, section: "A", email: "priya@example.com", phone: "9876543211", cgpa: 7.9, sgpa: 8.1 },
  { studentId: "CSE003", username: "rohit_gupta", fullName: "Rohit Gupta", department: "CSE", semester: 6, section: "A", email: "rohit@example.com", phone: "9876543212", cgpa: 6.5, sgpa: 6.8 },
  { studentId: "CSE004", username: "neha_singh", fullName: "Neha Singh", department: "CSE", semester: 6, section: "B", email: "neha@example.com", phone: "9876543213", cgpa: 8.8, sgpa: 9.0 },
  { studentId: "CSE005", username: "arjun_das", fullName: "Arjun Das", department: "CSE", semester: 6, section: "B", email: "arjun@example.com", phone: "9876543214", cgpa: 7.2, sgpa: 7.5 },
];

const sampleProgress = [
  { studentId: "CSE001", semester: 6, subjectCode: "CS601", subjectName: "Data Structures", attendance: 85, marks: 88, grade: "A" },
  { studentId: "CSE001", semester: 6, subjectCode: "CS602", subjectName: "Operating Systems", attendance: 90, marks: 92, grade: "A" },
  { studentId: "CSE001", semester: 6, subjectCode: "CS603", subjectName: "DBMS", attendance: 80, marks: 85, grade: "A" },
  { studentId: "CSE002", semester: 6, subjectCode: "CS601", subjectName: "Data Structures", attendance: 75, marks: 78, grade: "B" },
  { studentId: "CSE002", semester: 6, subjectCode: "CS602", subjectName: "Operating Systems", attendance: 82, marks: 80, grade: "B" },
  { studentId: "CSE002", semester: 6, subjectCode: "CS603", subjectName: "DBMS", attendance: 70, marks: 75, grade: "B" },
  { studentId: "CSE003", semester: 6, subjectCode: "CS601", subjectName: "Data Structures", attendance: 60, marks: 62, grade: "C" },
  { studentId: "CSE003", semester: 6, subjectCode: "CS602", subjectName: "Operating Systems", attendance: 50, marks: 58, grade: "C" },
  { studentId: "CSE003", semester: 6, subjectCode: "CS603", subjectName: "DBMS", attendance: 55, marks: 64, grade: "B" },
  { studentId: "CSE004", semester: 6, subjectCode: "CS601", subjectName: "Data Structures", attendance: 95, marks: 95, grade: "A+" },
  { studentId: "CSE004", semester: 6, subjectCode: "CS602", subjectName: "Operating Systems", attendance: 95, marks: 94, grade: "A" },
  { studentId: "CSE004", semester: 6, subjectCode: "CS603", subjectName: "DBMS", attendance: 92, marks: 96, grade: "A+" },
  { studentId: "CSE005", semester: 6, subjectCode: "CS601", subjectName: "Data Structures", attendance: 72, marks: 71, grade: "B" },
  { studentId: "CSE005", semester: 6, subjectCode: "CS602", subjectName: "Operating Systems", attendance: 68, marks: 70, grade: "B" },
  { studentId: "CSE005", semester: 6, subjectCode: "CS603", subjectName: "DBMS", attendance: 75, marks: 76, grade: "B" },
];

const sampleAttendance = [
  { studentId: "CSE001", studentName: "Amit Patel", department: "CSE", semester: 6, section: "A", date: "2026-04-01", monthLabel: "April 2026", status: "present", teacherName: "Prof. Mehta", subjectName: "Data Structures" },
  { studentId: "CSE001", studentName: "Amit Patel", department: "CSE", semester: 6, section: "A", date: "2026-04-02", monthLabel: "April 2026", status: "present", teacherName: "Prof. Sharma", subjectName: "Operating Systems" },
  { studentId: "CSE001", studentName: "Amit Patel", department: "CSE", semester: 6, section: "A", date: "2026-04-03", monthLabel: "April 2026", status: "present", teacherName: "Prof. Kumar", subjectName: "DBMS" },
  { studentId: "CSE002", studentName: "Priya Sharma", department: "CSE", semester: 6, section: "A", date: "2026-04-01", monthLabel: "April 2026", status: "present", teacherName: "Prof. Mehta", subjectName: "Data Structures" },
  { studentId: "CSE002", studentName: "Priya Sharma", department: "CSE", semester: 6, section: "A", date: "2026-04-02", monthLabel: "April 2026", status: "absent", teacherName: "Prof. Sharma", subjectName: "Operating Systems" },
  { studentId: "CSE003", studentName: "Rohit Gupta", department: "CSE", semester: 6, section: "A", date: "2026-04-01", monthLabel: "April 2026", status: "absent", teacherName: "Prof. Mehta", subjectName: "Data Structures" },
  { studentId: "CSE003", studentName: "Rohit Gupta", department: "CSE", semester: 6, section: "A", date: "2026-04-02", monthLabel: "April 2026", status: "absent", teacherName: "Prof. Sharma", subjectName: "Operating Systems" },
  { studentId: "CSE004", studentName: "Neha Singh", department: "CSE", semester: 6, section: "B", date: "2026-04-01", monthLabel: "April 2026", status: "present", teacherName: "Prof. Patel", subjectName: "Data Structures" },
  { studentId: "CSE004", studentName: "Neha Singh", department: "CSE", semester: 6, section: "B", date: "2026-04-02", monthLabel: "April 2026", status: "present", teacherName: "Prof. Verma", subjectName: "Operating Systems" },
];

const sampleClasses = [
  { tenantSlug: TENANT_SLUG, className: "CS601-A", subjectCode: "CS601", department: "CSE", semester: 6, section: "A", day: "Monday", startTime: "09:00", endTime: "10:30", room: "A-204", facultyName: "Prof. Mehta", kind: "Theory" },
  { tenantSlug: TENANT_SLUG, className: "CS602-A", subjectCode: "CS602", department: "CSE", semester: 6, section: "A", day: "Tuesday", startTime: "10:30", endTime: "12:00", room: "A-301", facultyName: "Prof. Sharma", kind: "Theory" },
  { tenantSlug: TENANT_SLUG, className: "CS603-A", subjectCode: "CS603", department: "CSE", semester: 6, section: "A", day: "Wednesday", startTime: "14:00", endTime: "15:30", room: "A-205", facultyName: "Prof. Kumar", kind: "Lab" },
  { tenantSlug: TENANT_SLUG, className: "CS601-B", subjectCode: "CS601", department: "CSE", semester: 6, section: "B", day: "Monday", startTime: "11:00", endTime: "12:30", room: "B-204", facultyName: "Prof. Patel", kind: "Theory" },
  { tenantSlug: TENANT_SLUG, className: "CS602-B", subjectCode: "CS602", department: "CSE", semester: 6, section: "B", day: "Wednesday", startTime: "09:00", endTime: "10:30", room: "B-301", facultyName: "Prof. Verma", kind: "Theory" },
];

async function seedDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/AYRAERP");
    console.log("Connected to MongoDB...");

    // Clear existing data
    await Student.deleteMany({ tenantSlug: TENANT_SLUG });
    await StudentProgress.deleteMany({ tenantSlug: TENANT_SLUG });
    await AttendanceRecord.deleteMany({ tenantSlug: TENANT_SLUG });
    await ClassSchedule.deleteMany({ tenantSlug: TENANT_SLUG });
    console.log("Cleared existing data...");

    // Insert sample data
    const studentsToInsert = sampleStudents.map((s) => ({ ...s, tenantSlug: TENANT_SLUG, status: "accept" }));
    await Student.insertMany(studentsToInsert);
    console.log("Inserted 5 students");

    const progressToInsert = sampleProgress.map((p) => ({ ...p, tenantSlug: TENANT_SLUG, department: "CSE" }));
    await StudentProgress.insertMany(progressToInsert);
    console.log("Inserted 15 progress records");

    const attendanceToInsert = sampleAttendance.map((a) => ({ ...a, tenantSlug: TENANT_SLUG }));
    await AttendanceRecord.insertMany(attendanceToInsert);
    console.log("Inserted 9 attendance records");

    await ClassSchedule.insertMany(sampleClasses);
    console.log("Inserted 5 class schedules");

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
