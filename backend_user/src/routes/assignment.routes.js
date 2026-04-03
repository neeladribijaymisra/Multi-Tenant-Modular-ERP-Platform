import { Router } from "express";

import {
  createAssignment,
  listAssignments,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
} from "../controllers/assignment.controller.js";

const router = Router({ mergeParams: true });

router.get("/", listAssignments);
router.post("/", createAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

router.post("/:id/submit", submitAssignment);
router.put("/:id/grade/:studentId", gradeSubmission);

export default router;
