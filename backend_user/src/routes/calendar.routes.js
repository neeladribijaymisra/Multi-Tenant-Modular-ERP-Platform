import { Router } from "express";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from "../controllers/calendar.controller.js";

const router = Router({ mergeParams: true });

router.get("/events", listCalendarEvents);
router.post("/events", createCalendarEvent);
router.put("/events/:id", updateCalendarEvent);
router.delete("/events/:id", deleteCalendarEvent);

export default router;
