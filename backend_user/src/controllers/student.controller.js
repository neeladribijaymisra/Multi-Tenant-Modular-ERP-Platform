import Student from "../models/Student.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listStudents = listDocuments(Student);
export const createStudent = createDocument(Student);
export const updateStudent = updateDocument(Student);
export const deleteStudent = deleteDocument(Student);

export const listLeaveRequests = listDocuments(LeaveRequest);

export async function createLeaveRequest(req, res, next) {
  try {
    const item = await LeaveRequest.create({
      ...req.body,
      tenantSlug: req.params.tenant,
      status: "pending",
      rejectReason: "",
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateLeaveRequest(req, res, next) {
  try {
    const item = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, tenantSlug: req.params.tenant },
      {
        ...req.body,
        status: "pending",
        rejectReason: "",
      },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
}

export const deleteLeaveRequest = deleteDocument(LeaveRequest);
