import AcademicApproval from "../models/AcademicApproval.js";
import AcademicRecord from "../models/AcademicRecord.js";
import CurriculumPlan from "../models/CurriculumPlan.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Student from "../models/Student.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";
import { generatePassword } from "../utils/password.js";

export const listCurriculumPlans = listDocuments(CurriculumPlan);
export const createCurriculumPlan = createDocument(CurriculumPlan);
export const updateCurriculumPlan = updateDocument(CurriculumPlan);
export const deleteCurriculumPlan = deleteDocument(CurriculumPlan);

export const listTimetables = listDocuments(Timetable);
export const createTimetable = createDocument(Timetable);
export const updateTimetable = updateDocument(Timetable);
export const deleteTimetable = deleteDocument(Timetable);

export const listApprovals = listDocuments(AcademicApproval);
export const createApproval = createDocument(AcademicApproval);
export const updateApproval = updateDocument(AcademicApproval);
export const deleteApproval = deleteDocument(AcademicApproval);

export const listRecords = listDocuments(AcademicRecord);
export const createRecord = createDocument(AcademicRecord);
export const updateRecord = updateDocument(AcademicRecord);
export const deleteRecord = deleteDocument(AcademicRecord);

export const listAcademicStudents = listDocuments(Student);
export const updateAcademicStudent = updateDocument(Student);
export const deleteAcademicStudent = deleteDocument(Student);

export const listAcademicLeaveRequests = listDocuments(LeaveRequest);

export async function listTeachers(req, res, next) {
  try {
    const teachers = await User.find({
      tenantSlug: req.params.tenant,
      role: "teacher",
    }).sort({ createdAt: -1 });

    res.json(
      teachers.map((teacher) => ({
        _id: teacher._id,
        username: teacher.username,
        displayName: teacher.displayName,
        password: teacher.password,
        role: teacher.role,
      })),
    );
  } catch (error) {
    next(error);
  }
}

export async function createTeacher(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const generatedPassword = req.body.password?.trim() || generatePassword();

    const teacher = await User.create({
      tenantSlug,
      role: "teacher",
      username: req.body.username,
      password: generatedPassword,
      displayName: req.body.displayName,
      managedByAcademic: true,
    });

    res.status(201).json({
      _id: teacher._id,
      username: teacher.username,
      displayName: teacher.displayName,
      password: teacher.password,
      generatedPassword,
      role: teacher.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTeacher(req, res, next) {
  try {
    const teacher = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantSlug: req.params.tenant,
        role: "teacher",
      },
      req.body,
      { new: true, runValidators: true },
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher account not found" });
    }

    res.json({
      _id: teacher._id,
      username: teacher.username,
      displayName: teacher.displayName,
      password: teacher.password,
      role: teacher.role,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacher(req, res, next) {
  try {
    const teacher = await User.findOneAndDelete({
      _id: req.params.id,
      tenantSlug: req.params.tenant,
      role: "teacher",
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher account not found" });
    }

    res.json({ message: "Teacher account deleted" });
  } catch (error) {
    next(error);
  }
}
