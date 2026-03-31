import { Router } from "express";

import {
  createStudent,
  createLeaveRequest,
  deleteStudent,
  deleteLeaveRequest,
  listLeaveRequests,
  listStudents,
  updateLeaveRequest,
  updateStudent,
} from "../controllers/student.controller.js";

const router = Router({ mergeParams: true });

router.get("/", listStudents);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

router.get("/leave-requests", listLeaveRequests);
router.post("/leave-requests", createLeaveRequest);
router.put("/leave-requests/:id", updateLeaveRequest);
router.delete("/leave-requests/:id", deleteLeaveRequest);

export default router;
