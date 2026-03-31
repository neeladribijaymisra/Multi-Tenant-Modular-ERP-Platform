import Advisory from "../models/Advisory.js";
import ClassSchedule from "../models/ClassSchedule.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Student from "../models/Student.js";
import StudentProgress from "../models/StudentProgress.js";
import TeacherSubject from "../models/TeacherSubject.js";
import User from "../models/User.js";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../utils/crudHandlers.js";

export const listTeacherStudents = listDocuments(Student);

export async function createTeacherStudent(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const {
      studentId,
      username,
      password,
      fullName,
      department,
      semester,
      section,
      email,
      phone,
      status,
    } = req.body;

    if (!password?.trim()) {
      return res.status(400).json({ message: "Student password is required." });
    }

    const student = await Student.create({
      tenantSlug,
      studentId,
      username,
      fullName,
      department,
      semester,
      section,
      email,
      phone,
      status,
    });

    await User.create({
      tenantSlug,
      role: "student",
      username,
      password: password.trim(),
      displayName: fullName,
    });

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
}

export async function updateTeacherStudent(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const currentStudent = await Student.findOne({
      _id: req.params.id,
      tenantSlug,
    });

    if (!currentStudent) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: req.params.id, tenantSlug },
      req.body,
      { new: true, runValidators: true },
    );

    const nextUsername = req.body.username || currentStudent.username;
    const nextDisplayName = req.body.fullName || currentStudent.fullName;

    const userUpdate = {
      username: nextUsername,
      displayName: nextDisplayName,
    };

    if (req.body.password?.trim()) {
      userUpdate.password = req.body.password.trim();
    }

    await User.findOneAndUpdate(
      {
        tenantSlug,
        role: "student",
        username: currentStudent.username,
      },
      userUpdate,
      { new: true, runValidators: true },
    );

    res.json(updatedStudent);
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacherStudent(req, res, next) {
  try {
    const tenantSlug = req.params.tenant;
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      tenantSlug,
    });

    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }

    await User.findOneAndDelete({
      tenantSlug,
      role: "student",
      username: student.username,
    });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export const listSubjects = listDocuments(TeacherSubject);
export const createSubject = createDocument(TeacherSubject);
export const updateSubject = updateDocument(TeacherSubject);
export const deleteSubject = deleteDocument(TeacherSubject);

export const listClasses = listDocuments(ClassSchedule);
export const createClass = createDocument(ClassSchedule);
export const updateClass = updateDocument(ClassSchedule);
export const deleteClass = deleteDocument(ClassSchedule);

export const listAdvisories = listDocuments(Advisory);
export const createAdvisory = createDocument(Advisory);
export const updateAdvisory = updateDocument(Advisory);
export const deleteAdvisory = deleteDocument(Advisory);

export const listProgress = listDocuments(StudentProgress);
export const createProgress = createDocument(StudentProgress);
export const updateProgress = updateDocument(StudentProgress);
export const deleteProgress = deleteDocument(StudentProgress);

export const listTeacherLeaveRequests = listDocuments(LeaveRequest);
export const updateTeacherLeaveRequest = updateDocument(LeaveRequest);
