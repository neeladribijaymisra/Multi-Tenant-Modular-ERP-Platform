import dotenv from "dotenv";

import connectDatabase from "../config/db.js";
import AcademicApproval from "../models/AcademicApproval.js";
import AcademicRecord from "../models/AcademicRecord.js";
import Advisory from "../models/Advisory.js";
import Announcement from "../models/Announcement.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import Campaign from "../models/Campaign.js";
import CampusEvent from "../models/CampusEvent.js";
import ClassSchedule from "../models/ClassSchedule.js";
import CurriculumPlan from "../models/CurriculumPlan.js";
import HostelAllocation from "../models/HostelAllocation.js";
import HostelRoom from "../models/HostelRoom.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ResponseTrack from "../models/ResponseTrack.js";
import Student from "../models/Student.js";
import StudentProgress from "../models/StudentProgress.js";
import SupportContact from "../models/SupportContact.js";
import TeacherAlert from "../models/TeacherAlert.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import TeacherSubject from "../models/TeacherSubject.js";
import Timetable from "../models/Timetable.js";
import TransportAllocation from "../models/TransportAllocation.js";
import TransportRoute from "../models/TransportRoute.js";
import User from "../models/User.js";

dotenv.config();

const tenantSlug = process.env.DEFAULT_TENANT || "cgu";
const evenSemesters = [2, 4, 6, 8];
const sections = ["A", "B", "C"];
const studentsPerSection = 50;

const teacherPools = {
  CSE: [
    { username: "teacher1", displayName: "Prof. Arjun Rao" },
    { username: "teacher5", displayName: "Dr. Niharika Sen" },
    { username: "teacher9", displayName: "Prof. Devansh Kulkarni" },
  ],
  ECE: [
    { username: "teacher2", displayName: "Prof. Kavya Iyer" },
    { username: "teacher6", displayName: "Dr. Mehul Das" },
    { username: "teacher10", displayName: "Prof. Ipsita Nayak" },
  ],
  ME: [
    { username: "teacher3", displayName: "Prof. Rohit Menon" },
    { username: "teacher7", displayName: "Dr. Tanmay Sahu" },
    { username: "teacher11", displayName: "Prof. Rakesh Mohanty" },
  ],
  CE: [
    { username: "teacher4", displayName: "Prof. Sandeep Mohanty" },
    { username: "teacher8", displayName: "Dr. Shruti Patra" },
    { username: "teacher12", displayName: "Prof. Abhishek Verma" },
  ],
};

const facultyByDepartment = Object.fromEntries(
  Object.entries(teacherPools).map(([department, teachers]) => [department, teachers[0].displayName]),
);

function hashCode(value) {
  return String(value || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getTeacherForSubject(department, subjectCode, offset = 0) {
  const pool = teacherPools[department] || [];
  if (!pool.length) {
    return { username: "", displayName: "Faculty TBA" };
  }

  const index = (hashCode(subjectCode) + offset) % pool.length;
  return pool[index];
}

const branchCatalog = {
  CSE: {
    2: {
      program: "B.Tech CSE",
      subjects: [
        { code: "CSE201", name: "Data Structures", credits: 4, kind: "Theory" },
        { code: "CSE202", name: "Digital Logic Design", credits: 4, kind: "Theory" },
        { code: "CSE203", name: "Discrete Mathematics", credits: 3, kind: "Theory" },
        { code: "CSE204", name: "Engineering Economics", credits: 3, kind: "Theory" },
        { code: "CSECOM201", name: "Professional Communication", credits: 2, kind: "Theory", common: true },
        { code: "CSE251", name: "Programming Lab II", credits: 2, kind: "Lab" },
        { code: "CSE252", name: "Digital Systems Lab", credits: 2, kind: "Lab" },
        { code: "CSE253", name: "Data Structures Lab", credits: 2, kind: "Lab" },
      ],
    },
    4: {
      program: "B.Tech CSE",
      subjects: [
        { code: "CSE401", name: "Database Management Systems", credits: 4, kind: "Theory" },
        { code: "CSE402", name: "Design and Analysis of Algorithms", credits: 4, kind: "Theory" },
        { code: "CSE403", name: "Computer Networks", credits: 4, kind: "Theory" },
        { code: "CSE404", name: "Theory of Computation", credits: 3, kind: "Theory" },
        { code: "CSEMGT401", name: "Innovation and Entrepreneurship", credits: 2, kind: "Theory", common: true },
        { code: "CSE451", name: "DBMS Lab", credits: 2, kind: "Lab" },
        { code: "CSE452", name: "Networks Lab", credits: 2, kind: "Lab" },
        { code: "CSE453", name: "Algorithm Design Lab", credits: 2, kind: "Lab" },
      ],
    },
    6: {
      program: "B.Tech CSE",
      subjects: [
        { code: "CSE601", name: "Operating Systems", credits: 4, kind: "Theory" },
        { code: "CSE602", name: "Compiler Design", credits: 4, kind: "Theory" },
        { code: "CSE603", name: "Machine Learning Fundamentals", credits: 4, kind: "Theory" },
        { code: "CSE604", name: "Software Architecture", credits: 3, kind: "Theory" },
        { code: "CSEAPT601", name: "Aptitude for Engineers", credits: 2, kind: "Theory", common: true },
        { code: "CSE651", name: "Operating Systems Lab", credits: 2, kind: "Lab" },
        { code: "CSE652", name: "Compiler Design Lab", credits: 2, kind: "Lab" },
        { code: "CSE653", name: "Machine Learning Lab", credits: 2, kind: "Lab" },
      ],
    },
    8: {
      program: "B.Tech CSE",
      subjects: [
        { code: "CSE801", name: "Cloud Native Systems", credits: 4, kind: "Theory" },
        { code: "CSE802", name: "Information Retrieval", credits: 3, kind: "Theory" },
        { code: "CSE803", name: "Enterprise Application Integration", credits: 4, kind: "Theory" },
        { code: "CSE804", name: "Cyber Forensics", credits: 3, kind: "Theory" },
        { code: "CSERSH801", name: "Project and Research Methods", credits: 2, kind: "Theory", common: true },
        { code: "CSE851", name: "Cloud Systems Lab", credits: 2, kind: "Lab" },
        { code: "CSE852", name: "Capstone Lab", credits: 2, kind: "Lab" },
      ],
    },
  },
  ECE: {
    2: {
      program: "B.Tech ECE",
      subjects: [
        { code: "ECE201", name: "Signals and Systems", credits: 4, kind: "Theory" },
        { code: "ECE202", name: "Electronic Devices", credits: 4, kind: "Theory" },
        { code: "ECE203", name: "Network Theory", credits: 3, kind: "Theory" },
        { code: "ECE204", name: "Engineering Economics", credits: 3, kind: "Theory" },
        { code: "ECECOM201", name: "Professional Communication", credits: 2, kind: "Theory", common: true },
        { code: "ECE251", name: "Devices Lab", credits: 2, kind: "Lab" },
        { code: "ECE252", name: "Signals Lab", credits: 2, kind: "Lab" },
        { code: "ECE253", name: "Circuit Analysis Lab", credits: 2, kind: "Lab" },
      ],
    },
    4: {
      program: "B.Tech ECE",
      subjects: [
        { code: "ECE401", name: "Analog Communication", credits: 4, kind: "Theory" },
        { code: "ECE402", name: "Microprocessors", credits: 4, kind: "Theory" },
        { code: "ECE403", name: "Electromagnetic Waves", credits: 3, kind: "Theory" },
        { code: "ECE404", name: "Control Systems", credits: 4, kind: "Theory" },
        { code: "ECEMGT401", name: "Innovation and Entrepreneurship", credits: 2, kind: "Theory", common: true },
        { code: "ECE451", name: "Microprocessor Lab", credits: 2, kind: "Lab" },
        { code: "ECE452", name: "Communication Lab", credits: 2, kind: "Lab" },
        { code: "ECE453", name: "Control Systems Lab", credits: 2, kind: "Lab" },
      ],
    },
    6: {
      program: "B.Tech ECE",
      subjects: [
        { code: "ECE601", name: "Digital Signal Processing", credits: 4, kind: "Theory" },
        { code: "ECE602", name: "VLSI Design", credits: 4, kind: "Theory" },
        { code: "ECE603", name: "Wireless Communication", credits: 4, kind: "Theory" },
        { code: "ECE604", name: "Embedded Systems", credits: 3, kind: "Theory" },
        { code: "ECEAPT601", name: "Aptitude for Engineers", credits: 2, kind: "Theory", common: true },
        { code: "ECE651", name: "DSP Lab", credits: 2, kind: "Lab" },
        { code: "ECE652", name: "VLSI Lab", credits: 2, kind: "Lab" },
        { code: "ECE653", name: "Embedded Systems Lab", credits: 2, kind: "Lab" },
      ],
    },
    8: {
      program: "B.Tech ECE",
      subjects: [
        { code: "ECE801", name: "Satellite Communication", credits: 4, kind: "Theory" },
        { code: "ECE802", name: "IoT System Design", credits: 4, kind: "Theory" },
        { code: "ECE803", name: "Optical Communication", credits: 3, kind: "Theory" },
        { code: "ECE804", name: "Advanced Embedded Analytics", credits: 3, kind: "Theory" },
        { code: "ECERSH801", name: "Project and Research Methods", credits: 2, kind: "Theory", common: true },
        { code: "ECE851", name: "IoT Lab", credits: 2, kind: "Lab" },
        { code: "ECE852", name: "Communication Projects Lab", credits: 2, kind: "Lab" },
      ],
    },
  },
  ME: {
    2: {
      program: "B.Tech Mechanical",
      subjects: [
        { code: "MEC201", name: "Engineering Thermodynamics", credits: 4, kind: "Theory" },
        { code: "MEC202", name: "Materials Science", credits: 4, kind: "Theory" },
        { code: "MEC203", name: "Engineering Mechanics", credits: 4, kind: "Theory" },
        { code: "MEC204", name: "Manufacturing Processes I", credits: 3, kind: "Theory" },
        { code: "MECOM201", name: "Professional Communication", credits: 2, kind: "Theory", common: true },
        { code: "MEC251", name: "Workshop Practice", credits: 2, kind: "Lab" },
        { code: "MEC252", name: "Mechanics Lab", credits: 2, kind: "Lab" },
        { code: "MEC253", name: "Manufacturing Lab I", credits: 2, kind: "Lab" },
      ],
    },
    4: {
      program: "B.Tech Mechanical",
      subjects: [
        { code: "MEC401", name: "Fluid Mechanics", credits: 4, kind: "Theory" },
        { code: "MEC402", name: "Kinematics of Machines", credits: 4, kind: "Theory" },
        { code: "MEC403", name: "Heat Transfer", credits: 4, kind: "Theory" },
        { code: "MEC404", name: "Manufacturing Processes II", credits: 3, kind: "Theory" },
        { code: "MEMGT401", name: "Innovation and Entrepreneurship", credits: 2, kind: "Theory", common: true },
        { code: "MEC451", name: "Fluid Lab", credits: 2, kind: "Lab" },
        { code: "MEC452", name: "Heat Transfer Lab", credits: 2, kind: "Lab" },
        { code: "MEC453", name: "Manufacturing Lab II", credits: 2, kind: "Lab" },
      ],
    },
    6: {
      program: "B.Tech Mechanical",
      subjects: [
        { code: "MEC601", name: "Finite Element Analysis", credits: 4, kind: "Theory" },
        { code: "MEC602", name: "Automobile Engineering", credits: 4, kind: "Theory" },
        { code: "MEC603", name: "Industrial Engineering", credits: 3, kind: "Theory" },
        { code: "MEC604", name: "Refrigeration and Air Conditioning", credits: 4, kind: "Theory" },
        { code: "MEAPT601", name: "Aptitude for Engineers", credits: 2, kind: "Theory", common: true },
        { code: "MEC651", name: "CAD/CAM Lab", credits: 2, kind: "Lab" },
        { code: "MEC652", name: "Automobile Systems Lab", credits: 2, kind: "Lab" },
        { code: "MEC653", name: "Simulation Lab", credits: 2, kind: "Lab" },
      ],
    },
    8: {
      program: "B.Tech Mechanical",
      subjects: [
        { code: "MEC801", name: "Advanced Manufacturing Systems", credits: 4, kind: "Theory" },
        { code: "MEC802", name: "Robotics in Production", credits: 4, kind: "Theory" },
        { code: "MEC803", name: "Energy Management", credits: 3, kind: "Theory" },
        { code: "MEC804", name: "Plant Engineering", credits: 3, kind: "Theory" },
        { code: "MERSH801", name: "Project and Research Methods", credits: 2, kind: "Theory", common: true },
        { code: "MEC851", name: "Automation Lab", credits: 2, kind: "Lab" },
        { code: "MEC852", name: "Capstone Manufacturing Lab", credits: 2, kind: "Lab" },
      ],
    },
  },
  CE: {
    2: {
      program: "B.Tech Civil",
      subjects: [
        { code: "CE201", name: "Building Materials", credits: 4, kind: "Theory" },
        { code: "CE202", name: "Surveying", credits: 4, kind: "Theory" },
        { code: "CE203", name: "Engineering Geology", credits: 3, kind: "Theory" },
        { code: "CE204", name: "Strength of Materials", credits: 4, kind: "Theory" },
        { code: "CECOM201", name: "Professional Communication", credits: 2, kind: "Theory", common: true },
        { code: "CE251", name: "Survey Camp Lab", credits: 2, kind: "Lab" },
        { code: "CE252", name: "Materials Testing Lab", credits: 2, kind: "Lab" },
        { code: "CE253", name: "CAD for Civil Lab", credits: 2, kind: "Lab" },
      ],
    },
    4: {
      program: "B.Tech Civil",
      subjects: [
        { code: "CE401", name: "Structural Analysis", credits: 4, kind: "Theory" },
        { code: "CE402", name: "Geotechnical Engineering", credits: 4, kind: "Theory" },
        { code: "CE403", name: "Hydrology", credits: 3, kind: "Theory" },
        { code: "CE404", name: "Transportation Engineering", credits: 4, kind: "Theory" },
        { code: "CEMGT401", name: "Innovation and Entrepreneurship", credits: 2, kind: "Theory", common: true },
        { code: "CE451", name: "Geotechnical Lab", credits: 2, kind: "Lab" },
        { code: "CE452", name: "Hydrology Lab", credits: 2, kind: "Lab" },
        { code: "CE453", name: "Transportation Lab", credits: 2, kind: "Lab" },
      ],
    },
    6: {
      program: "B.Tech Civil",
      subjects: [
        { code: "CE601", name: "Design of Steel Structures", credits: 4, kind: "Theory" },
        { code: "CE602", name: "Environmental Engineering", credits: 4, kind: "Theory" },
        { code: "CE603", name: "Irrigation Engineering", credits: 3, kind: "Theory" },
        { code: "CE604", name: "Foundation Engineering", credits: 4, kind: "Theory" },
        { code: "CEAPT601", name: "Aptitude for Engineers", credits: 2, kind: "Theory", common: true },
        { code: "CE651", name: "Environmental Engineering Lab", credits: 2, kind: "Lab" },
        { code: "CE652", name: "Structural Design Lab", credits: 2, kind: "Lab" },
        { code: "CE653", name: "Irrigation Lab", credits: 2, kind: "Lab" },
      ],
    },
    8: {
      program: "B.Tech Civil",
      subjects: [
        { code: "CE801", name: "Construction Planning and Management", credits: 4, kind: "Theory" },
        { code: "CE802", name: "Earthquake Resistant Design", credits: 4, kind: "Theory" },
        { code: "CE803", name: "Urban Infrastructure Systems", credits: 3, kind: "Theory" },
        { code: "CE804", name: "Sustainable Structures", credits: 3, kind: "Theory" },
        { code: "CERSH801", name: "Project and Research Methods", credits: 2, kind: "Theory", common: true },
        { code: "CE851", name: "Project Planning Lab", credits: 2, kind: "Lab" },
        { code: "CE852", name: "Sustainable Design Studio", credits: 2, kind: "Lab" },
      ],
    },
  },
};

const supplementalLabs = {
  CSE: {
    2: [{ code: "CSE254", name: "Open Source Computing Lab", credits: 2, kind: "Lab" }],
    4: [{ code: "CSE454", name: "Full Stack Development Lab", credits: 2, kind: "Lab" }],
    6: [{ code: "CSE654", name: "Software Architecture Lab", credits: 2, kind: "Lab" }],
    8: [
      { code: "CSE853", name: "Cyber Security Practice Lab", credits: 2, kind: "Lab" },
      { code: "CSE854", name: "Enterprise Integration Lab", credits: 2, kind: "Lab" },
    ],
  },
  ECE: {
    2: [{ code: "ECE254", name: "PCB Design Practice Lab", credits: 2, kind: "Lab" }],
    4: [{ code: "ECE454", name: "Embedded Interface Lab", credits: 2, kind: "Lab" }],
    6: [{ code: "ECE654", name: "Wireless Systems Lab", credits: 2, kind: "Lab" }],
    8: [
      { code: "ECE853", name: "Optical Networks Lab", credits: 2, kind: "Lab" },
      { code: "ECE854", name: "Satellite Systems Lab", credits: 2, kind: "Lab" },
    ],
  },
  ME: {
    2: [{ code: "MEC254", name: "Thermal Measurement Lab", credits: 2, kind: "Lab" }],
    4: [{ code: "MEC454", name: "Machine Dynamics Lab", credits: 2, kind: "Lab" }],
    6: [{ code: "MEC654", name: "Industrial Systems Lab", credits: 2, kind: "Lab" }],
    8: [
      { code: "MEC853", name: "Robotics Integration Lab", credits: 2, kind: "Lab" },
      { code: "MEC854", name: "Plant Operations Lab", credits: 2, kind: "Lab" },
    ],
  },
  CE: {
    2: [{ code: "CE254", name: "Survey Data Processing Lab", credits: 2, kind: "Lab" }],
    4: [{ code: "CE454", name: "Structural Modeling Lab", credits: 2, kind: "Lab" }],
    6: [{ code: "CE654", name: "Foundation Design Lab", credits: 2, kind: "Lab" }],
    8: [
      { code: "CE853", name: "Urban Planning Studio Lab", credits: 2, kind: "Lab" },
      { code: "CE854", name: "Construction Analytics Lab", credits: 2, kind: "Lab" },
    ],
  },
};

Object.entries(supplementalLabs).forEach(([department, semesterMap]) => {
  Object.entries(semesterMap).forEach(([semester, labs]) => {
    branchCatalog[department][semester].subjects.push(...labs);
  });
});

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const earlyBreakSemesters = new Set([2, 6]);
const hostelTypeCycle = ["AC 2 Bed", "AC 4 Bed", "Non AC 2 Bed", "Non AC 4 Bed"];

function getCohortSlots(semester) {
  if (earlyBreakSemesters.has(Number(semester))) {
    return [
      { start: "09:30", end: "10:30", slot: "09:30 AM - 10:30 AM", slotType: "Theory" },
      { start: "10:30", end: "11:30", slot: "10:30 AM - 11:30 AM", slotType: "Theory" },
      { start: "11:30", end: "12:30", slot: "11:30 AM - 12:30 PM", slotType: "Theory" },
      { start: "12:30", end: "13:30", slot: "12:30 PM - 01:30 PM", slotType: "Theory" },
      { start: "13:30", end: "14:30", slot: "01:30 PM - 02:30 PM", slotType: "Break" },
      { start: "14:30", end: "15:30", slot: "02:30 PM - 03:30 PM", slotType: "Theory" },
      { start: "15:30", end: "17:30", slot: "03:30 PM - 05:30 PM", slotType: "Lab" },
    ];
  }

  return [
    { start: "09:30", end: "10:30", slot: "09:30 AM - 10:30 AM", slotType: "Theory" },
    { start: "10:30", end: "11:30", slot: "10:30 AM - 11:30 AM", slotType: "Theory" },
    { start: "11:30", end: "12:30", slot: "11:30 AM - 12:30 PM", slotType: "Theory" },
    { start: "12:30", end: "13:30", slot: "12:30 PM - 01:30 PM", slotType: "Theory" },
    { start: "13:30", end: "14:30", slot: "01:30 PM - 02:30 PM", slotType: "Theory" },
    { start: "14:30", end: "15:30", slot: "02:30 PM - 03:30 PM", slotType: "Break" },
    { start: "15:30", end: "17:30", slot: "03:30 PM - 05:30 PM", slotType: "Lab" },
  ];
}

const semesterDepartmentMap = {
  2: ["CSE", "ECE", "ME"],
  4: ["CSE", "CE", "ECE"],
  6: ["CSE", "ECE", "ME"],
  8: ["CSE", "CE", "ME"],
};

const firstNames = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavya", "Charan", "Deepika", "Divya", "Harsh",
  "Ishita", "Karan", "Kavya", "Meera", "Nandini", "Pranay", "Rohan", "Riya", "Saanvi", "Tanmay",
  "Varun", "Yash", "Zoya", "Neha", "Rahul", "Sneha", "Pallavi", "Bibek", "Sourav", "Aman",
];
const lastNames = [
  "Sharma", "Patel", "Das", "Rout", "Sen", "Nayak", "Sahu", "Pradhan", "Mishra", "Verma",
  "Kulkarni", "Iyer", "Mohanty", "Bhat", "Jain", "Rao", "Menon", "Patra", "Sethi", "Gupta",
];

const progressHistoryCatalog = {
  CSE: {
    1: ["Engineering Mathematics I", "Programming Fundamentals", "Engineering Physics", "Basic Electronics", "Communication Skills", "Programming Lab I", "Physics Lab", "Electronics Lab", "Workshop Practice"],
    3: ["Object Oriented Programming", "Computer Organization", "Probability and Statistics", "Web Technologies", "Environmental Studies", "OOP Lab", "Web Lab", "Hardware Lab", "Design Thinking Studio"],
    5: ["Artificial Intelligence", "Data Analytics", "Data Warehousing", "Software Engineering", "Universal Human Values", "AI Lab", "Analytics Lab", "Software Engineering Lab", "Mini Project Lab"],
    7: ["Deep Learning", "Natural Language Processing", "MLOps", "Big Data Systems", "Professional Ethics", "Deep Learning Lab", "MLOps Lab", "NLP Lab", "Major Project Phase I"],
  },
  ECE: {
    1: ["Engineering Mathematics I", "Programming Fundamentals", "Engineering Physics", "Basic Electronics", "Communication Skills", "Programming Lab I", "Physics Lab", "Electronics Lab", "Workshop Practice"],
    3: ["Digital Electronics", "Electronic Circuits", "Linear Algebra", "Instrumentation", "Environmental Studies", "Digital Lab", "Circuits Lab", "Instrumentation Lab", "Design Thinking Studio"],
    5: ["Digital Communication", "Antenna Theory", "Industrial Electronics", "Microcontrollers", "Universal Human Values", "Communication Lab", "Antenna Simulation Lab", "Microcontroller Lab", "Mini Project Lab"],
    7: ["Radar Engineering", "5G Communication", "Image Processing", "Biomedical Instrumentation", "Professional Ethics", "Radar Lab", "5G Systems Lab", "Image Processing Lab", "Major Project Phase I"],
  },
  ME: {
    1: ["Engineering Mathematics I", "Programming Fundamentals", "Engineering Physics", "Engineering Graphics", "Communication Skills", "Programming Lab I", "Physics Lab", "Graphics Lab", "Workshop Practice"],
    3: ["Thermal Engineering", "Solid Mechanics", "Machine Drawing", "Electrical Machines", "Environmental Studies", "Thermal Lab", "Mechanics Lab", "Drawing Lab", "Design Thinking Studio"],
    5: ["Dynamics of Machinery", "IC Engines", "Production Planning", "Metrology", "Universal Human Values", "Dynamics Lab", "IC Engine Lab", "Metrology Lab", "Mini Project Lab"],
    7: ["CNC Systems", "Mechatronics", "Renewable Energy", "Quality Engineering", "Professional Ethics", "CNC Lab", "Mechatronics Lab", "Energy Systems Lab", "Major Project Phase I"],
  },
  CE: {
    1: ["Engineering Mathematics I", "Programming Fundamentals", "Engineering Chemistry", "Engineering Graphics", "Communication Skills", "Programming Lab I", "Chemistry Lab", "Graphics Lab", "Workshop Practice"],
    3: ["Structural Mechanics", "Concrete Technology", "Fluid Mechanics", "Surveying II", "Environmental Studies", "Materials Lab", "Fluid Lab", "Survey Lab", "Design Thinking Studio"],
    5: ["Transportation Planning", "Open Channel Flow", "Estimation and Costing", "Water Resource Engineering", "Universal Human Values", "Transportation Lab", "Hydraulics Lab", "Estimation Lab", "Mini Project Lab"],
    7: ["Bridge Engineering", "Advanced Geotech", "Construction Management", "Urban Planning", "Professional Ethics", "Bridge Design Lab", "Geotech Simulation Lab", "Planning Lab", "Major Project Phase I"],
  },
};

function generateStudentId(serial) {
  return `2301020${String(serial).padStart(3, "0")}`;
}

function slugifyName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".");
}

function buildStudents() {
  const students = [];
  let serial = 101;

  evenSemesters.forEach((semester) => {
    const departments = semesterDepartmentMap[semester];

    sections.forEach((section, sectionIndex) => {
      const department = departments[sectionIndex % departments.length];
      Array.from({ length: studentsPerSection }).forEach((_item, studentIndex) => {
        const studentId = generateStudentId(serial);
        const username = studentId;
        const fullName = `${firstNames[(serial + studentIndex) % firstNames.length]} ${lastNames[(serial + sectionIndex) % lastNames.length]} ${serial}`;
        const emailLocal = slugifyName(fullName);
        const cgpaBase = 7.2 + ((serial % 9) * 0.17);
        const sgpaBase = 7.4 + ((serial % 7) * 0.19);

        students.push({
          tenantSlug,
          studentId,
          username,
          fullName,
          department,
          semester,
          section,
          email: `${emailLocal}@ayraerp.edu`,
          phone: `98${String(76540000 + serial).slice(-8)}`,
          photoDataUrl: "",
          sgpa: Number(sgpaBase.toFixed(2)),
          cgpa: Number(cgpaBase.toFixed(2)),
          status: studentIndex % 13 === 0 ? "pending" : "accept",
        });

        serial += 1;
      });
    });
  });

  students.push({
    tenantSlug,
    studentId: "2301020856",
    username: "2301020856",
    fullName: "Ashutosh Pradhan",
    department: "CSE",
    semester: 6,
    section: "A",
    email: "ashupradhanctc@gmail.com",
    phone: "9876541856",
    photoDataUrl: "",
    sgpa: 8.71,
    cgpa: 8.54,
    status: "accept",
  });

  students.push(
    {
      tenantSlug,
      studentId: "2301020840",
      username: "2301020840",
      fullName: "Biswajeet Rout",
      department: "CSE",
      semester: 2,
      section: "A",
      email: "routbiswajeet12@gmail.com",
      phone: "9876501840",
      photoDataUrl: "",
      sgpa: 8.13,
      cgpa: 8.13,
      status: "accept",
    },
    {
      tenantSlug,
      studentId: "2301020846",
      username: "2301020846",
      fullName: "Neeladri Bijay Misra",
      department: "CE",
      semester: 4,
      section: "B",
      email: "neeladribijaymisra@gmail.com",
      phone: "9876501846",
      photoDataUrl: "",
      sgpa: 8.36,
      cgpa: 8.24,
      status: "accept",
    },
    {
      tenantSlug,
      studentId: "2301020784",
      username: "2301020784",
      fullName: "Monideepa Kar",
      department: "ME",
      semester: 8,
      section: "C",
      email: "monideepa3011@gmail.com",
      phone: "9876501784",
      photoDataUrl: "",
      sgpa: 8.67,
      cgpa: 8.49,
      status: "accept",
    },
  );

  return students;
}

function buildUsers(students) {
  return [
    {
      tenantSlug,
      role: "academic",
      username: "academic",
      password: "password",
      displayName: "Academic Office",
    },
    {
      tenantSlug,
      role: "communication",
      username: "communication",
      password: "password",
      displayName: "Communication Cell",
    },
    ...Object.values(teacherPools)
      .flat()
      .map((teacher) => ({
        tenantSlug,
        role: "teacher",
        username: teacher.username,
        password: "password",
        displayName: teacher.displayName,
        managedByAcademic: true,
      })),
    ...students.map((student) => ({
      tenantSlug,
      role: "student",
      username: student.username,
      password: "password",
      displayName: student.fullName,
    })),
  ];
}

function buildSubjects() {
  return Object.entries(branchCatalog).flatMap(([department, semesterMap]) =>
    Object.entries(semesterMap).flatMap(([semester, config]) =>
      config.subjects.map((subject) => ({
        tenantSlug,
        subjectCode: subject.code,
        subjectName: subject.name,
        department,
        semester: Number(semester),
        credits: subject.credits,
        kind: subject.kind,
        facultyName: getTeacherForSubject(department, subject.code).displayName,
      })),
    ),
  );
}

function buildClasses() {
  return Object.entries(branchCatalog).flatMap(([department, semesterMap]) =>
    Object.entries(semesterMap).flatMap(([semester, config]) =>
      sections.flatMap((section, sectionIndex) => {
        const theorySubjects = config.subjects.filter((subject) => subject.kind === "Theory").slice(0, 5);
        const labSubjects = config.subjects.filter((subject) => subject.kind === "Lab").slice(0, 4);
        const slots = getCohortSlots(semester);

        return weekDays.flatMap((day, dayIndex) => {
          const labSubject = labSubjects[dayIndex % labSubjects.length];

          return [
            ...theorySubjects.map((subject, subjectIndex) => ({
              tenantSlug,
              department,
              semester: Number(semester),
              subjectCode: subject.code,
              className: `${subject.name} Theory`,
              day,
              startTime: slots.filter((slot) => slot.slotType === "Theory")[subjectIndex].start,
              endTime: slots.filter((slot) => slot.slotType === "Theory")[subjectIndex].end,
              room: `${department}-${semester}${section}-R${subjectIndex + 1}`,
              section,
              facultyName: getTeacherForSubject(department, subject.code, subjectIndex).displayName,
              kind: "Theory",
            })),
            {
              tenantSlug,
              department,
              semester: Number(semester),
              subjectCode: labSubject.code,
              className: `${labSubject.name} Lab`,
              day,
              startTime: slots.find((slot) => slot.slotType === "Lab").start,
              endTime: slots.find((slot) => slot.slotType === "Lab").end,
              room: `${department}-${semester}${section}-LAB-${sectionIndex + 1}`,
              section,
              facultyName: getTeacherForSubject(department, labSubject.code, dayIndex).displayName,
              kind: "Lab",
            },
          ];
        });
      }),
    ),
  );
}

function buildProgress(students) {
  return students.flatMap((student, studentIndex) => {
    const semesterSequence = Array.from({ length: student.semester }, (_item, index) => index + 1);

    return semesterSequence.flatMap((semester) => {
      const catalog =
        branchCatalog[student.department]?.[semester]?.subjects ||
        (progressHistoryCatalog[student.department]?.[semester] || []).map((subjectName, subjectIndex) => ({
          name: subjectName,
          code: `${student.department}${semester}${String(subjectIndex + 1).padStart(2, "0")}`,
        }));

      return catalog.map((subject, subjectIndex) => {
        const marks = 61 + ((studentIndex + subjectIndex * 4 + semester) % 34);
        const attendance = 76 + ((studentIndex + subjectIndex + semester) % 19);
        const projectScore = 6 + ((studentIndex + subjectIndex + semester) % 5);
        const totalScore = marks * 0.9 + projectScore;
        const grade =
          totalScore >= 90 ? "O" : totalScore >= 80 ? "E" : totalScore >= 70 ? "A" : totalScore >= 60 ? "B" : totalScore >= 50 ? "C" : totalScore >= 40 ? "D" : "Fail";
        const projectType = (studentIndex + subjectIndex + semester) % 4 === 0 ? "Group" : "Individual";
        const teamMembers =
          projectType === "Group"
            ? [generateStudentId(Math.max(101, 101 + ((studentIndex + subjectIndex) % 40))), generateStudentId(Math.max(101, 101 + ((studentIndex + subjectIndex + 4) % 40)))]
            : [];

        return {
          tenantSlug,
          studentId: student.studentId,
          semester,
          subjectCode: subject.code,
          subjectName: subject.name,
          attendance,
          marks,
          grade,
          projectTitle: `${subject.name} Project ${semester}`,
          projectType,
          projectScore,
          teamMembers,
          remarks: grade === "O" ? "Outstanding" : grade === "E" ? "Excellent" : grade === "A" ? "Very good progress" : grade === "B" ? "Steady improvement" : grade === "C" ? "Needs guided practice" : "Academic support recommended",
          advisorFlag: marks < 70 || attendance < 80,
        };
      });
    });
  });
}

function buildSupportContacts() {
  const allSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  return allSemesters.flatMap((semester) =>
    sections.map((section, sectionIndex) => {
      const mappedDepartments =
        semesterDepartmentMap[semester] ||
        semesterDepartmentMap[semester + 1] ||
        semesterDepartmentMap[semester - 1] ||
        ["CSE", "ECE", "ME"];
      const department = mappedDepartments[sectionIndex % mappedDepartments.length];
      const coordinator = getTeacherForSubject(department, `coordinator-${semester}-${section}`, 0);
      const mentorPool = teacherPools[department] || [];
      const coordinatorIndex = Math.max(
        mentorPool.findIndex((teacher) => teacher.username === coordinator.username),
        0,
      );
      const mentor = mentorPool[(coordinatorIndex + 1) % mentorPool.length] || coordinator;

      return {
        tenantSlug,
        department,
        semester,
        section,
        classCoordinatorName: coordinator.displayName,
        classCoordinatorEmail: `${department.toLowerCase()}.coord.${semester}${section}@ayraerp.edu`,
        classCoordinatorPhone: `97770${String(semester).padStart(2, "0")}${String(sectionIndex + 11).padStart(2, "0")}`,
        mentorName: mentor.displayName,
        mentorEmail: `${department.toLowerCase()}.mentor.${section.toLowerCase()}@ayraerp.edu`,
        mentorPhone: `96650${String(semester).padStart(2, "0")}${String(sectionIndex + 21).padStart(2, "0")}`,
        mentorRoom: `${department}-${section}-Mentor Cabin`,
      };
    }),
  );
}

function buildTimetables() {
  return Object.entries(branchCatalog).flatMap(([department, semesterMap]) =>
    Object.entries(semesterMap).flatMap(([semester, config]) =>
      sections.flatMap((section, sectionIndex) => {
        const theorySubjects = config.subjects.filter((subject) => subject.kind === "Theory").slice(0, 5);
        const labSubjects = config.subjects.filter((subject) => subject.kind === "Lab").slice(0, 4);
        const slots = getCohortSlots(semester);

        return weekDays.flatMap((day, dayIndex) => {
          const labSubject = labSubjects[dayIndex % labSubjects.length];

          return [
            ...theorySubjects.map((subject, subjectIndex) => ({
              tenantSlug,
              department,
              semester: Number(semester),
              section,
              day,
              slot: slots.filter((slot) => slot.slotType === "Theory")[subjectIndex].slot,
              slotType: "Theory",
              subjectCode: subject.code,
              subjectName: subject.name,
              facultyName: getTeacherForSubject(department, subject.code, subjectIndex).displayName,
              room: `${department}-${semester}${section}-R${subjectIndex + 1}`,
            })),
            {
              tenantSlug,
              department,
              semester: Number(semester),
              section,
              day,
              slot: slots.find((slot) => slot.slotType === "Break").slot,
              slotType: "Break",
              subjectCode: "",
              subjectName: "Lunch Break",
              facultyName: "Not Applicable",
              room: "Common Break Window",
            },
            {
              tenantSlug,
              department,
              semester: Number(semester),
              section,
              day,
              slot: slots.find((slot) => slot.slotType === "Lab").slot,
              slotType: "Lab",
              subjectCode: labSubject.code,
              subjectName: labSubject.name,
              facultyName: getTeacherForSubject(department, labSubject.code, dayIndex).displayName,
              room: `${department}-${semester}${section}-LAB-${sectionIndex + 1}`,
            },
          ];
        });
      }),
    ),
  );
}

function buildTeacherAssignments() {
  return Object.entries(branchCatalog).flatMap(([department, semesterMap]) =>
    Object.entries(semesterMap).flatMap(([semester, config]) =>
      sections.flatMap((section) =>
        config.subjects.map((subject, subjectIndex) => {
          const teacher = getTeacherForSubject(department, `${subject.code}-${section}`, subjectIndex);

          return {
            tenantSlug,
            teacherUsername: teacher.username,
            teacherName: teacher.displayName,
            department,
            semester: Number(semester),
            section,
            subjectCode: subject.code,
            subjectName: subject.name,
          };
        }),
      ),
    ),
  );
}

function getHostelFee(roomType) {
  if (roomType === "AC 2 Bed") return 132000;
  if (roomType === "AC 4 Bed") return 104000;
  if (roomType === "Non AC 2 Bed") return 92000;
  return 76000;
}

function getRoomCapacity(roomType) {
  return roomType.includes("4 Bed") ? 4 : 2;
}

function buildHostelRooms() {
  const hostels = [
    { prefix: "BH1", hostelName: "Boys Hostel 1", hostelCategory: "Boys" },
    { prefix: "BH2", hostelName: "Boys Hostel 2", hostelCategory: "Boys" },
    { prefix: "BH3", hostelName: "Boys Hostel 3", hostelCategory: "Boys" },
    { prefix: "GH1", hostelName: "Girls Hostel 1", hostelCategory: "Girls" },
    { prefix: "GH2", hostelName: "Girls Hostel 2", hostelCategory: "Girls" },
    { prefix: "GH3", hostelName: "Girls Hostel 3", hostelCategory: "Girls" },
  ];

  return hostels.flatMap((hostel, hostelIndex) =>
    Array.from({ length: 3 }, (_floor, floorIndex) =>
      Array.from({ length: 13 }, (_room, roomIndex) => {
        const roomType = hostelTypeCycle[(hostelIndex + floorIndex + roomIndex) % hostelTypeCycle.length];
        const roomNumber = `${floorIndex + 1}${String(roomIndex + 1).padStart(2, "0")}`;

        return {
          tenantSlug,
          roomCode: `${hostel.prefix}-F${floorIndex + 1}-R${roomNumber}`,
          hostelName: hostel.hostelName,
          hostelCategory: hostel.hostelCategory,
          floorNumber: floorIndex + 1,
          roomNumber,
          roomType,
          totalBeds: getRoomCapacity(roomType),
          availableBeds: getRoomCapacity(roomType),
          bookedBeds: [],
          annualFee: getHostelFee(roomType),
          availabilityStatus: "Available",
        };
      }),
    ).flat(),
  );
}

function buildTransportRoutes() {
  const routes = [
    ["BUS-01", "Bhubaneswar", "Patia - KIIT Square - Campus", "AC", ["Patia", "KIIT Square", "Infocity", "Campus"], 3800],
    ["BUS-02", "Bhubaneswar", "Jaydev Vihar - Acharya Vihar - Campus", "Non AC", ["Jaydev Vihar", "Acharya Vihar", "Vani Vihar", "Campus"], 3200],
    ["BUS-03", "Bhubaneswar", "Master Canteen - Rajmahal - Campus", "Non AC", ["Master Canteen", "Rajmahal", "Rasulgarh", "Campus"], 3300],
    ["BUS-04", "Bhubaneswar", "Khandagiri - Baramunda - Campus", "AC", ["Khandagiri", "Baramunda", "Fire Station", "Campus"], 3600],
    ["BUS-05", "Bhubaneswar", "Old Town - Kalpana - Campus", "Non AC", ["Old Town", "Kalpana", "Laxmisagar", "Campus"], 3200],
    ["BUS-06", "Bhubaneswar", "Nayapalli - IRC Village - Campus", "AC", ["Nayapalli", "IRC Village", "CRP Square", "Campus"], 3500],
    ["BUS-07", "Bhubaneswar", "Sailashree Vihar - Damana - Campus", "Non AC", ["Sailashree Vihar", "Damana", "Chandrasekharpur", "Campus"], 3100],
    ["BUS-08", "Bhubaneswar", "Jharpada - Bomikhal - Campus", "Non AC", ["Jharpada", "Bomikhal", "Mancheswar", "Campus"], 3150],
    ["BUS-09", "Cuttack", "Link Road - Badambadi - Campus", "AC", ["Link Road", "Badambadi", "Phulnakhara", "Campus"], 4600],
    ["BUS-10", "Cuttack", "College Square - CDA - Campus", "AC", ["College Square", "CDA", "Trisulia", "Campus"], 4700],
  ];

  return routes.map(([busNumber, city, routeName, busType, pickupPoints, monthlyFee], index) => ({
    tenantSlug,
    routeCode: `${city.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
    busNumber,
    city,
    routeName,
    busType,
    capacity: 48,
    availableSeats: 48,
    driverName: `Driver ${index + 1}`,
    driverPhone: `94370${String(1200 + index).padStart(4, "0")}`,
    pickupPoints,
    monthlyFee,
    routeStatus: "Active",
  }));
}

function buildAttendanceRecords(students, teacherAssignments) {
  const assignmentLookup = new Map(
    teacherAssignments.map((assignment) => [
      `${assignment.department}-${assignment.semester}-${assignment.section}`,
      assignment,
    ]),
  );
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1);
  const records = [];

  for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
    const isoDate = date.toISOString().slice(0, 10);
    const monthLabel = date.toLocaleString("en-US", { month: "long", year: "numeric" });
    const isSunday = date.getDay() === 0;

    students.forEach((student, studentIndex) => {
      const assignment = assignmentLookup.get(`${student.department}-${student.semester}-${student.section}`) || null;
      const marker = (studentIndex + date.getDate() + date.getMonth()) % 11;
      const status = isSunday ? "holiday" : marker <= 1 ? "absent" : "present";

      records.push({
        tenantSlug,
        studentId: student.studentId,
        studentName: student.fullName,
        department: student.department,
        semester: student.semester,
        section: student.section,
        date: isoDate,
        monthLabel,
        status,
        teacherUsername: assignment?.teacherUsername || "",
        teacherName: assignment?.teacherName || "",
        subjectCode: assignment?.subjectCode || "",
        subjectName: assignment?.subjectName || "",
        notes: isSunday ? "Sunday holiday" : "",
      });
    });
  }

  return records;
}

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({ tenantSlug }),
    Student.deleteMany({ tenantSlug }),
    TeacherSubject.deleteMany({ tenantSlug }),
    ClassSchedule.deleteMany({ tenantSlug }),
    Advisory.deleteMany({ tenantSlug }),
    StudentProgress.deleteMany({ tenantSlug }),
    AttendanceRecord.deleteMany({ tenantSlug }),
    CurriculumPlan.deleteMany({ tenantSlug }),
    HostelAllocation.deleteMany({ tenantSlug }),
    HostelRoom.deleteMany({ tenantSlug }),
    LeaveRequest.deleteMany({ tenantSlug }),
    Timetable.deleteMany({ tenantSlug }),
    AcademicApproval.deleteMany({ tenantSlug }),
    AcademicRecord.deleteMany({ tenantSlug }),
    SupportContact.deleteMany({ tenantSlug }),
    Announcement.deleteMany({ tenantSlug }),
    Campaign.deleteMany({ tenantSlug }),
    CampusEvent.deleteMany({ tenantSlug }),
    ResponseTrack.deleteMany({ tenantSlug }),
    TeacherAlert.deleteMany({ tenantSlug }),
    TeacherAssignment.deleteMany({ tenantSlug }),
    TransportAllocation.deleteMany({ tenantSlug }),
    TransportRoute.deleteMany({ tenantSlug }),
  ]);

  const students = buildStudents();
  const users = buildUsers(students);
  const subjects = buildSubjects();
  const classes = buildClasses();
  const progress = buildProgress(students);
  const timetables = buildTimetables();
  const teacherAssignments = buildTeacherAssignments();
  const attendanceRecords = buildAttendanceRecords(students, teacherAssignments);
  const supportContacts = buildSupportContacts();
  const hostelRooms = buildHostelRooms();
  const transportRoutes = buildTransportRoutes();

  await User.insertMany(users);
  await Student.insertMany(students);
  await TeacherSubject.insertMany(subjects);
  await ClassSchedule.insertMany(classes);

  await Advisory.insertMany([
    {
      tenantSlug,
      title: "Semester Preparation Advisory",
      message: "Students should verify their section-wise timetable and complete all lab submissions before mid-semester reviews.",
      teacherName: "Prof. Arjun Rao",
      targetAudience: "All Even Semester Students",
    },
    {
      tenantSlug,
      title: "Project Readiness",
      message: "Final year students must submit project abstracts and mentor allocation forms this week.",
      teacherName: "Prof. Kavya Iyer",
      targetAudience: "Semester 8",
    },
  ]);

  await StudentProgress.insertMany(progress);
  await TeacherAssignment.insertMany(teacherAssignments);
  await AttendanceRecord.insertMany(attendanceRecords);
  await SupportContact.insertMany(supportContacts);
  await HostelRoom.insertMany(hostelRooms);
  await TransportRoute.insertMany(transportRoutes);

  await LeaveRequest.insertMany([
    {
      tenantSlug,
      studentName: students[0].fullName,
      studentId: students[0].studentId,
      fromDate: "2026-04-08",
      toDate: "2026-04-09",
      reason: "Medical consultation",
      status: "pending",
      rejectReason: "",
    },
    {
      tenantSlug,
      studentName: students[7].fullName,
      studentId: students[7].studentId,
      fromDate: "2026-04-11",
      toDate: "2026-04-12",
      reason: "Family function",
      status: "accept",
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
      owner: "Academic Office",
    },
    {
      tenantSlug,
      program: "B.Tech ECE",
      semester: 4,
      title: "Communication systems lab alignment",
      status: "accept",
      revision: "R1",
      owner: "Academic Office",
    },
  ]);

  await Timetable.insertMany(timetables);

  await AcademicApproval.insertMany([
    {
      tenantSlug,
      itemType: "Curriculum Revision",
      title: "CSE Semester 6 elective basket",
      status: "pending",
      requestedBy: "Board of Studies",
      approvedBy: "",
    },
    {
      tenantSlug,
      itemType: "Assessment Pattern",
      title: "Semester 8 capstone evaluation",
      status: "accept",
      requestedBy: "Academic Council",
      approvedBy: "Dean Academics",
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
    {
      tenantSlug,
      recordType: "Compliance",
      referenceNo: "AYRA-REC-002",
      title: "Lab Audit Summary",
      owner: "Quality Cell",
      notes: "Mechanical and ECE lab review synchronized for even semester cycle.",
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
      startDate: "2026-04-14",
      endDate: "2026-04-20",
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
      eventDate: "2026-04-21",
      coordinator: "Communication Cell",
      audience: "All Students",
    },
    {
      tenantSlug,
      year: 2026,
      eventName: "Semester 6 Hackathon",
      eventType: "Event",
      venue: "Innovation Lab",
      eventDate: "2026-04-28",
      coordinator: "Prof. Arjun Rao",
      audience: "Semester 6",
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

  console.log(`AYRA ERP seed complete for tenant ${tenantSlug}.`);
  console.log(
    `Students: ${students.length}, Subjects: ${subjects.length}, Progress rows: ${progress.length}, Attendance rows: ${attendanceRecords.length}`,
  );
  process.exit(0);
}

seed().catch((error) => {
  console.error("AYRA ERP seed failed", error);
  process.exit(1);
});
