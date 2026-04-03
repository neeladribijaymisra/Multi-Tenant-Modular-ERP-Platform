import { Router } from "express";

import {
  createAlert,
  createAttendanceRecord,
  createAdvisory,
  createClass,
  createProgress,
  createSubject,
  createTeacherStudent,
  deleteAlert,
  deleteAttendanceRecord,
  deleteAdvisory,
  deleteClass,
  deleteProgress,
  deleteSubject,
  deleteTeacherStudent,
  listAlerts,
  listAdvisories,
  listAttendanceRecords,
  listClasses,
  listProgress,
  listTeacherLeaveRequests,
  listTeacherAssignments,
  listSubjects,
  listTeacherStudents,
  updateAdvisory,
  updateAttendanceRecord,
  updateClass,
  updateTeacherLeaveRequest,
  updateProgress,
  updateSubject,
  updateTeacherStudent,
} from "../controllers/teacher.controller.js";

const router = Router({ mergeParams: true });

router.get("/students", listTeacherStudents);
router.post("/students", createTeacherStudent);
router.put("/students/:id", updateTeacherStudent);
router.delete("/students/:id", deleteTeacherStudent);

router.get("/subjects", listSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

router.get("/classes", listClasses);
router.post("/classes", createClass);
router.put("/classes/:id", updateClass);
router.delete("/classes/:id", deleteClass);

router.get("/advisories", listAdvisories);
router.post("/advisories", createAdvisory);
router.put("/advisories/:id", updateAdvisory);
router.delete("/advisories/:id", deleteAdvisory);

router.get("/progress", listProgress);
router.post("/progress", createProgress);
router.put("/progress/:id", updateProgress);
router.delete("/progress/:id", deleteProgress);

router.get("/teacher-assignments", listTeacherAssignments);
router.get("/attendance", listAttendanceRecords);
router.post("/attendance", createAttendanceRecord);
router.put("/attendance/:id", updateAttendanceRecord);
router.delete("/attendance/:id", deleteAttendanceRecord);

router.get("/alerts", listAlerts);
router.post("/alerts", createAlert);
router.delete("/alerts/:id", deleteAlert);

router.get("/leave-requests", listTeacherLeaveRequests);
router.put("/leave-requests/:id", updateTeacherLeaveRequest);

export default router;
