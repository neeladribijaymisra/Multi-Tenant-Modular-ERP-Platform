// Simple rule-based risk analyzer (ML placeholder for future)
export async function analyzeStudentRisk(attendancePercent, averageMarks, submissionCount, engagementScore) {
  let riskScore = 0;

  // Simple scoring
  if (attendancePercent < 70) riskScore += 0.3;
  if (averageMarks < 50) riskScore += 0.4;
  if (submissionCount < 5) riskScore += 0.2;
  if (engagementScore < 5) riskScore += 0.1;

  let riskLevel = 'low';
  let recommendations = [];

  if (riskScore > 0.7) {
    riskLevel = 'high';
    recommendations = [
      'Schedule one-on-one mentoring sessions.',
      'Provide additional study materials and practice tests.',
      'Monitor attendance closely and offer support for absences.',
    ];
  } else if (riskScore > 0.4) {
    riskLevel = 'medium';
    recommendations = [
      'Encourage participation in group study sessions.',
      'Review recent assignments for improvement areas.',
    ];
  }

  return {
    riskScore: Math.round(riskScore * 100) / 100,
    riskLevel,
    recommendations,
    factors: {
      attendance: attendancePercent,
      marks: averageMarks,
      submissions: submissionCount,
      engagement: engagementScore,
    },
  };
}

// Function to get student data from DB (to be called from controller)
export async function getStudentDataForRisk(studentId, tenantSlug) {
  // This would query AttendanceRecord, StudentProgress, etc.
  // Placeholder: return sample data
  return {
    attendancePercent: 75,
    averageMarks: 60,
    submissionCount: 5,
    engagementScore: 6,
  };
}