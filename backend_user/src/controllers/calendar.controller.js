import CampusEvent from "../models/CampusEvent.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listCalendarEvents = listDocuments(CampusEvent);
export const createCalendarEvent = createDocument(CampusEvent);
export const updateCalendarEvent = updateDocument(CampusEvent);
export const deleteCalendarEvent = deleteDocument(CampusEvent);
