import { GoogleGenerativeAI } from "@google/generative-ai";

import AttendanceRecord from "../models/AttendanceRecord.js";
import ClassSchedule from "../models/ClassSchedule.js";
import Student from "../models/Student.js";
import StudentProgress from "../models/StudentProgress.js";
import TeacherAssignment from "../models/TeacherAssignment.js";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function getTodayLabel() {
  const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return dayMap[new Date().getDay()];
}

function buildStudentFallbackResponse({ query, student, attendancePercentage, presentCount, totalAttendance, progress, today, todayClasses }) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const gradePreview = progress
    .slice(0, 5)
    .map((item) => `${item.subjectName || item.subjectCode}: ${item.marks}% (${item.grade || "N/A"})`)
    .join(", ");
  const classesPreview = todayClasses
    .slice(0, 4)
    .map((item) => `${item.className || item.subjectCode} ${item.startTime}-${item.endTime}`)
    .join(", ");

  if (/^(hi|hello|hey)\b/.test(normalizedQuery)) {
    return `Hi ${student.fullName}. Ask me about today's classes, attendance, CGPA, or grades.`;
  }

  if (normalizedQuery.includes("today") && normalizedQuery.includes("class")) {
    return todayClasses.length
      ? `Today's classes (${today}): ${classesPreview}.`
      : `No classes are scheduled for ${today}.`;
  }

  if (normalizedQuery.includes("attendance")) {
    return `Your attendance is ${attendancePercentage}% (${presentCount}/${totalAttendance} classes present).`;
  }

  if (normalizedQuery.includes("cgpa") || normalizedQuery.includes("sgpa") || normalizedQuery.includes("gpa")) {
    return `CGPA: ${student.cgpa ?? "N/A"}, SGPA: ${student.sgpa ?? "N/A"}.`;
  }

  if (normalizedQuery.includes("grade") || normalizedQuery.includes("marks") || normalizedQuery.includes("score")) {
    return progress.length ? `Recent grades: ${gradePreview}.` : "No grade records are available yet.";
  }

  return "I can help with today's classes, attendance, CGPA/SGPA, and recent grades.";
}

function buildTeacherFallbackResponse({ query, displayName, today, assignments, todayClasses }) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const sectionSet = new Set(assignments.map((item) => `${item.department}-${item.semester}-${item.section}`));
  const subjectSet = new Set(assignments.map((item) => item.subjectCode));
  const classesPreview = todayClasses
    .slice(0, 5)
    .map((item) => `${item.subjectCode} ${item.startTime}-${item.endTime} (${item.section})`)
    .join(", ");

  if (/^(hi|hello|hey)\b/.test(normalizedQuery)) {
    return `Hi ${displayName || "Professor"}. Ask about today's schedule, assigned sections, or subject load.`;
  }

  if (normalizedQuery.includes("today") && normalizedQuery.includes("class")) {
    return todayClasses.length
      ? `Today's teaching schedule (${today}): ${classesPreview}.`
      : `No classes are mapped for you on ${today}.`;
  }

  if (normalizedQuery.includes("section") || normalizedQuery.includes("cohort")) {
    return `You are assigned to ${sectionSet.size} cohort sections across ${subjectSet.size} subjects.`;
  }

  if (normalizedQuery.includes("subject") || normalizedQuery.includes("load")) {
    return `Current load: ${subjectSet.size} unique subjects and ${todayClasses.length} classes scheduled today.`;
  }

  return `Today you have ${todayClasses.length} classes, with ${subjectSet.size} subjects across ${sectionSet.size} sections.`;
}

async function handleStudentPrompt({ tenantSlug, query, studentId }) {
  const student = await Student.findOne({ tenantSlug, studentId });
  if (!student) {
    const notFoundError = new Error("Student not found");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  const progress = await StudentProgress.find({ tenantSlug, studentId }).select("subjectName subjectCode marks grade");
  const totalAttendance = await AttendanceRecord.countDocuments({ tenantSlug, studentId });
  const presentCount = await AttendanceRecord.countDocuments({
    tenantSlug,
    studentId,
    status: "present",
  });
  const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const today = getTodayLabel();
  const todayClasses = await ClassSchedule.find({
    tenantSlug,
    department: student.department,
    semester: student.semester,
    section: student.section,
    day: today,
  }).select("className subjectCode startTime endTime room facultyName");

  const fallbackResponse = buildStudentFallbackResponse({
    query,
    student,
    attendancePercentage,
    presentCount,
    totalAttendance,
    progress,
    today,
    todayClasses,
  });

  const systemPrompt = `You are Ayra, a helpful assistant for students.
Answer only what is asked in a concise way (1-3 short sentences).
Do not include unrelated details.

Student profile:
- Name: ${student.fullName}
- Department: ${student.department}
- Semester: ${student.semester}
- Section: ${student.section}
- CGPA: ${student.cgpa}
- SGPA: ${student.sgpa}
- Attendance: ${attendancePercentage}% (${presentCount}/${totalAttendance})

Grades:
${progress.length ? progress.map((item) => `- ${item.subjectName || item.subjectCode}: ${item.marks}% (${item.grade})`).join("\n") : "- No grades"}

Today's classes (${today}):
${todayClasses.length ? todayClasses.map((item) => `- ${item.className || item.subjectCode}: ${item.startTime}-${item.endTime}, ${item.room}`).join("\n") : "- No classes"}`;

  return { fallbackResponse, systemPrompt };
}

async function handleTeacherPrompt({ tenantSlug, query, userId, displayName }) {
  const today = getTodayLabel();
  const assignments = await TeacherAssignment.find({
    tenantSlug,
    teacherUsername: userId,
  }).select("teacherName teacherUsername department semester section subjectCode subjectName");

  const scheduleMatchers = assignments.map((item) => ({
    department: item.department,
    semester: item.semester,
    section: item.section,
    subjectCode: item.subjectCode,
  }));

  const todayClasses = scheduleMatchers.length
    ? await ClassSchedule.find({
        tenantSlug,
        day: today,
        $or: scheduleMatchers,
      }).select("subjectCode className day startTime endTime room section semester department facultyName")
    : await ClassSchedule.find({
        tenantSlug,
        day: today,
        facultyName: displayName,
      }).select("subjectCode className day startTime endTime room section semester department facultyName");

  const safeDisplayName = displayName || assignments[0]?.teacherName || "Professor";
  const fallbackResponse = buildTeacherFallbackResponse({
    query,
    displayName: safeDisplayName,
    today,
    assignments,
    todayClasses,
  });

  const systemPrompt = `You are Ayra, a concise assistant for teachers.
Respond in 1-3 short sentences and stay focused on the user's exact question.
Do not add unrelated summary content.

Teacher: ${safeDisplayName}
Assigned subjects: ${[...new Set(assignments.map((item) => item.subjectCode))].join(", ") || "None"}
Assigned sections: ${[...new Set(assignments.map((item) => `${item.department}-${item.semester}-${item.section}`))].join(", ") || "None"}
Today's classes (${today}):
${todayClasses.length ? todayClasses.map((item) => `- ${item.subjectCode} (${item.section}) ${item.startTime}-${item.endTime} ${item.room}`).join("\n") : "- No classes"}`;

  return { fallbackResponse, systemPrompt };
}

export const chatbotQuery = async (req, res) => {
  try {
    const tenantSlug = req.params.tenant;
    const {
      query,
      role = "student",
      userId = "",
      displayName = "",
      studentId = "",
    } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ error: "Query is required" });
    }

    const normalizedRole = String(role || "").toLowerCase();
    const promptPayload =
      normalizedRole === "teacher"
        ? await handleTeacherPrompt({ tenantSlug, query, userId, displayName })
        : await handleStudentPrompt({ tenantSlug, query, studentId: studentId || userId });

    if (!genAI) {
      return res.json({ response: promptPayload.fallbackResponse });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: query }],
          },
        ],
        systemInstruction: promptPayload.systemPrompt,
      });

      const response = result.response.text();
      return res.json({ response: response || promptPayload.fallbackResponse });
    } catch (geminiError) {
      console.error("Gemini service error:", geminiError.message);
      return res.json({ response: promptPayload.fallbackResponse });
    }
  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Chatbot service error" });
  }
};
