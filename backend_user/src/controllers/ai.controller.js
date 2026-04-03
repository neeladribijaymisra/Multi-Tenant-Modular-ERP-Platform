import { analyzeStudentRisk, getStudentDataForRisk } from "../ai/riskAnalyzer.js";
import { summarizeDailyActivities, buildActivitiesText } from "../ai/summarizer.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import StudentProgress from "../models/StudentProgress.js";

// Get student risk analysis
export const getStudentRiskAnalysis = async (req, res) => {
  try {
    const { studentId } = req.params;
    const tenantSlug = req.params.tenant;

    // Fetch real data (simplified)
    const attendanceRecords = await AttendanceRecord.find({ tenantSlug, studentId });
    const progressRecords = await StudentProgress.find({ tenantSlug, studentId });

    // Calculate metrics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const attendancePercent = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    const totalMarks = progressRecords.reduce((sum, p) => sum + p.marks, 0);
    const averageMarks = progressRecords.length > 0 ? totalMarks / progressRecords.length : 0;

    const submissionCount = progressRecords.filter(p => p.projectTitle).length; // Assuming projects as submissions

    // Placeholder for engagement
    const engagementScore = 7; // Would calculate from logs

    const analysis = await analyzeStudentRisk(attendancePercent, averageMarks, submissionCount, engagementScore);

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get daily summary
export const getDailySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantSlug = req.params.tenant;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's data (simplified)
    const attendedClasses = await AttendanceRecord.find({
      tenantSlug,
      studentId: userId,
      date: { $gte: today.toISOString().split('T')[0], $lt: tomorrow.toISOString().split('T')[0] },
      status: 'present'
    }).distinct('subjectName');

    // Placeholder for other data
    const userData = {
      attendedClasses,
      completedAssignments: [], // Would fetch from Assignment model
      viewedAnnouncements: [], // Would fetch from Announcement model
      otherActivities: ['Logged in', 'Viewed dashboard'],
    };

    const activitiesText = buildActivitiesText(userData);
    const summary = await summarizeDailyActivities(activitiesText);

    res.json({ summary, activitiesText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
