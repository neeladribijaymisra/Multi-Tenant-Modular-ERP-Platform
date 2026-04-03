import { Router } from "express";

import {
  createAnnouncement,
  createCampaign,
  createCommunicationAlert,
  createEvent,
  createHostelAllocation,
  createHostelRoom,
  createResponse,
  createTransportAllocation,
  createTransportRoute,
  deleteAnnouncement,
  deleteCampaign,
  deleteCommunicationAlert,
  deleteEvent,
  deleteHostelAllocation,
  deleteHostelRoom,
  deleteResponse,
  deleteTransportAllocation,
  deleteTransportRoute,
  listAnnouncements,
  listCampaigns,
  listCommunicationStudents,
  listCommunicationAlerts,
  listEvents,
  listHostelAllocations,
  listHostelRooms,
  listResponses,
  listTransportAllocations,
  listTransportRoutes,
  updateAnnouncement,
  updateCampaign,
  updateEvent,
  updateHostelRoom,
  updateResponse,
  updateTransportRoute,
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

router.get("/alerts", listCommunicationAlerts);
router.post("/alerts", createCommunicationAlert);
router.delete("/alerts/:id", deleteCommunicationAlert);

router.get("/students", listCommunicationStudents);

router.get("/events", listEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

router.get("/hostel-rooms", listHostelRooms);
router.post("/hostel-rooms", createHostelRoom);
router.put("/hostel-rooms/:id", updateHostelRoom);
router.delete("/hostel-rooms/:id", deleteHostelRoom);

router.get("/hostel-allocations", listHostelAllocations);
router.post("/hostel-allocations", createHostelAllocation);
router.delete("/hostel-allocations/:id", deleteHostelAllocation);

router.get("/transport-routes", listTransportRoutes);
router.post("/transport-routes", createTransportRoute);
router.put("/transport-routes/:id", updateTransportRoute);
router.delete("/transport-routes/:id", deleteTransportRoute);

router.get("/transport-allocations", listTransportAllocations);
router.post("/transport-allocations", createTransportAllocation);
router.delete("/transport-allocations/:id", deleteTransportAllocation);

router.get("/responses", listResponses);
router.post("/responses", createResponse);
router.put("/responses/:id", updateResponse);
router.delete("/responses/:id", deleteResponse);

export default router;
