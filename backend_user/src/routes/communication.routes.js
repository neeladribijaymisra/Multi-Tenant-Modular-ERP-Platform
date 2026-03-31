import { Router } from "express";

import {
  createAnnouncement,
  createCampaign,
  createEvent,
  createResponse,
  deleteAnnouncement,
  deleteCampaign,
  deleteEvent,
  deleteResponse,
  listAnnouncements,
  listCampaigns,
  listEvents,
  listResponses,
  updateAnnouncement,
  updateCampaign,
  updateEvent,
  updateResponse,
} from "../controllers/communication.controller.js";

const router = Router({ mergeParams: true });

router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

router.get("/campaigns", listCampaigns);
router.post("/campaigns", createCampaign);
router.put("/campaigns/:id", updateCampaign);
router.delete("/campaigns/:id", deleteCampaign);

router.get("/events", listEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

router.get("/responses", listResponses);
router.post("/responses", createResponse);
router.put("/responses/:id", updateResponse);
router.delete("/responses/:id", deleteResponse);

export default router;
