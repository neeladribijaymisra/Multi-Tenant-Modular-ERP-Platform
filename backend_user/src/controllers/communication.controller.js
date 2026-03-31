import Announcement from "../models/Announcement.js";
import Campaign from "../models/Campaign.js";
import CampusEvent from "../models/CampusEvent.js";
import ResponseTrack from "../models/ResponseTrack.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listAnnouncements = listDocuments(Announcement);
export const createAnnouncement = createDocument(Announcement);
export const updateAnnouncement = updateDocument(Announcement);
export const deleteAnnouncement = deleteDocument(Announcement);

export const listCampaigns = listDocuments(Campaign);
export const createCampaign = createDocument(Campaign);
export const updateCampaign = updateDocument(Campaign);
export const deleteCampaign = deleteDocument(Campaign);

export const listEvents = listDocuments(CampusEvent);
export const createEvent = createDocument(CampusEvent);
export const updateEvent = updateDocument(CampusEvent);
export const deleteEvent = deleteDocument(CampusEvent);

export const listResponses = listDocuments(ResponseTrack);
export const createResponse = createDocument(ResponseTrack);
export const updateResponse = updateDocument(ResponseTrack);
export const deleteResponse = deleteDocument(ResponseTrack);
