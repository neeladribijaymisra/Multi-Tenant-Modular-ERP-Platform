import { Router } from "express";

import {
  getStudentRiskAnalysis,
  getDailySummary,
} from "../controllers/ai.controller.js";

const router = Router({ mergeParams: true });

router.get("/student-risk/:studentId", getStudentRiskAnalysis);
router.get("/daily-summary/:userId", getDailySummary);

export default router;