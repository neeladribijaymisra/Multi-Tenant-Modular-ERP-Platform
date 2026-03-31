import Student from "../models/Student.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listStudents = listDocuments(Student);
export const createStudent = createDocument(Student);
export const updateStudent = updateDocument(Student);
export const deleteStudent = deleteDocument(Student);

export const listLeaveRequests = listDocuments(LeaveRequest);
export const createLeaveRequest = createDocument(LeaveRequest);
export const updateLeaveRequest = updateDocument(LeaveRequest);
export const deleteLeaveRequest = deleteDocument(LeaveRequest);
