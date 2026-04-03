export const roleOptions = [
  {
    value: "student",
    label: "Student",
    subtitle: "Courses, attendance, fees, notices, and campus life.",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    value: "teacher",
    label: "Teacher",
    subtitle: "Students, subjects, classes, advisories, and progress control.",
    accent: "from-amber-500 to-orange-600",
  },
  {
    value: "academic",
    label: "Academic Office",
    subtitle: "Curriculum planning, timetables, approvals, and records.",
    accent: "from-emerald-500 to-green-600",
  },
  {
    value: "communication",
    label: "Communication",
    subtitle: "Announcements, campaigns, events, and response tracking.",
    accent: "from-indigo-500 to-sky-600",
  },
];

export const appModules = [
  "Dashboard",
  "Academics",
  "Communication",
  "Calendar",
  "Alert",
  "Support",
];

export const quickLinks = [
  { title: "Exam Schedule", description: "See upcoming internal and semester exams." },
  { title: "Fee Receipts", description: "Download invoices, receipts, and scholarship records." },
  { title: "Messages", description: "Open university notices, advisories, and conversations." },
  { title: "Attendance Trends", description: "Review class-wise engagement and risk indicators." },
];

export const roleContent = {
  student: {
    welcome: "Stay on top of classes, dues, and campus updates in one workspace.",
    modules: ["My Courses", "Attendance", "Fee Center", "Clubs & Events"],
    highlights: [
      { label: "CGPA", value: "8.74", trend: "+0.18 semester growth" },
      { label: "Attendance", value: "92%", trend: "Above university requirement" },
      { label: "Pending Dues", value: "INR 12,400", trend: "Due by 28 Mar" },
      { label: "Unread Notices", value: "07", trend: "2 urgent department notices" },
    ],
    agenda: [
      { time: "09:00", title: "Data Structures Lecture", meta: "Room B-204" },
      { time: "11:00", title: "Project Mentor Review", meta: "Innovation Lab" },
      { time: "14:00", title: "Library Book Return", meta: "Central Library" },
    ],
    actions: ["Register electives", "Pay hostel fee", "Raise leave request"],
    tableTitle: "Recent Academic Updates",
    tableRows: [
      ["Algorithms Quiz 2", "Published", "18/20", "Prof. Mehta"],
      ["DBMS Assignment", "Submitted", "Awaiting review", "Prof. Sharma"],
      ["Attendance Warning", "Cleared", "Now 92%", "Academic Office"],
    ],
  },
  teacher: {
    welcome: "Manage students, subjects, classes, timings, advisories, progress, and live email alerts from one teacher workspace.",
    modules: ["Student Control", "Subject Lists", "Class Timings", "Alert Broadcasts"],
    highlights: [
      { label: "Today’s Classes", value: "05", trend: "2 labs and 3 lectures" },
      { label: "Pending Evaluation", value: "46", trend: "Need grading before 25 Mar" },
      { label: "Advisee Alerts", value: "09", trend: "Attendance and performance flags" },
      { label: "Messages", value: "14", trend: "Department and student updates" },
    ],
    agenda: [
      { time: "08:30", title: "Faculty Briefing", meta: "Dean’s Board Room" },
      { time: "10:00", title: "Operating Systems Lecture", meta: "Seminar Hall 2" },
      { time: "15:30", title: "Project Viva Panel", meta: "Lab Complex" },
    ],
    actions: ["Add student", "Create class slot", "Send alert", "Create assignment"],
    tableTitle: "Teacher Operations",
    tableRows: [
      ["New Student Intake", "Pending", "Approve and assign section", "Teacher"],
      ["Operating Systems", "Active", "Update subject outline", "Teacher"],
      ["Mentor Alert", "Ready", "Send advisory to 4 students", "Teacher"],
    ],
  },
  academic: {
    welcome: "Coordinate curriculum planning, timetables, approvals, records, and institution-wide alert messages through one academic office login.",
    modules: ["Teacher Accounts", "Curriculum Planning", "Approvals", "Alert Messaging"],
    highlights: [
      { label: "Open Requests", value: "31", trend: "Course and timetable approvals" },
      { label: "Exam Slots", value: "128", trend: "Finalized for April cycle" },
      { label: "Curriculum Changes", value: "06", trend: "Awaiting board signoff" },
      { label: "Compliance Alerts", value: "03", trend: "Need registrar review" },
    ],
    agenda: [
      { time: "09:15", title: "Curriculum Committee Review", meta: "Academic Council Room" },
      { time: "12:00", title: "Timetable Conflict Resolution", meta: "Scheduler Desk" },
      { time: "16:00", title: "Exam Seating Freeze", meta: "Controller of Exams" },
    ],
    actions: ["Add teacher", "Generate password", "Send alert"],
    tableTitle: "Academic Operations",
    tableRows: [
      ["B.Tech Semester Plan", "Review", "Faculty feedback pending", "Engineering"],
      ["Backlog Exam Sheet", "Approved", "Ready for release", "Exam Cell"],
      ["NAAC Evidence Tracker", "Updated", "14 new uploads", "Quality Office"],
    ],
  },
  finance: {
    welcome: "Track collections, reimbursements, scholarships, and compliance-ready statements.",
    modules: ["Collections", "Scholarships", "Purchase Requests", "Audit Desk"],
    highlights: [
      { label: "Today’s Collections", value: "INR 8.2L", trend: "18% over daily target" },
      { label: "Pending Refunds", value: "17", trend: "Need bank validation" },
      { label: "Scholarship Cases", value: "42", trend: "11 awaiting documents" },
      { label: "Exceptions", value: "05", trend: "Manual verification required" },
    ],
    agenda: [
      { time: "09:00", title: "Fee Reconciliation", meta: "Accounts Office" },
      { time: "13:00", title: "Vendor Settlement Review", meta: "Procurement Desk" },
      { time: "16:30", title: "Scholarship Disbursal Check", meta: "Finance Cell" },
    ],
    actions: ["Post receipts", "Release scholarship", "Export audit summary"],
    tableTitle: "Finance Queue",
    tableRows: [
      ["Semester Fee Batch", "Processed", "214 records", "Payment Gateway"],
      ["Hostel Refund", "Pending", "Awaiting approval", "Warden Office"],
      ["Department Advance", "Flagged", "Supporting bill missing", "Mechanical Dept"],
    ],
  },
  communication: {
    welcome: "Run campus-wide communication, schedule public events, manage hostel and transport operations, and send targeted student alerts from one console.",
    modules: ["Events", "Alert Broadcasts", "Hostel Desk", "Transport Desk"],
    highlights: [
      { label: "Active Campaigns", value: "08", trend: "Admissions and fest season" },
      { label: "Notices Scheduled", value: "19", trend: "Across 5 segments" },
      { label: "Response Rate", value: "74%", trend: "Above monthly benchmark" },
      { label: "Escalations", value: "04", trend: "Need immediate reply" },
    ],
    agenda: [
      { time: "10:00", title: "Campus Notice Review", meta: "Communications Hub" },
      { time: "12:30", title: "Festival Campaign Standup", meta: "Media Team" },
      { time: "17:00", title: "Parent Outreach Digest", meta: "Publishing Queue" },
    ],
    actions: ["Schedule hackathon", "Allot hostel room", "Assign bus seat"],
    tableTitle: "Communication Pipeline",
    tableRows: [
      ["Hostel Maintenance Notice", "Queued", "Tonight 8 PM", "Students"],
      ["Placement Drive Mailer", "Live", "62% open rate", "Final Year"],
      ["Convocation FAQ", "Needs edit", "Registrar feedback", "All Graduands"],
    ],
  },
};
