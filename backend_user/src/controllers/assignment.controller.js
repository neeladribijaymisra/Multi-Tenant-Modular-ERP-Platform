import Assignment from "../models/Assignment.js";
import { detectSubmissionQuality } from "../ai/assignmentDetector.js";

// List assignments for a tenant/class
export const listAssignments = async (req, res) => {
  try {
    const tenantSlug = req.params.tenant;
    const { classId, teacherId } = req.query;

    const filter = { tenantSlug };
    if (classId) filter.classId = classId;
    if (teacherId) filter.teacherId = teacherId;

    const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create assignment
export const createAssignment = async (req, res) => {
  try {
    const tenantSlug = req.params.tenant;
    const assignmentData = { ...req.body, tenantSlug };

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    // TODO: Notify students in the class/section

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSlug = req.params.tenant;
    const updateData = req.body;

    const assignment = await Assignment.findOneAndUpdate(
      { _id: id, tenantSlug },
      updateData,
      { new: true, runValidators: true },
    );
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSlug = req.params.tenant;
    const deleted = await Assignment.findOneAndDelete({ _id: id, tenantSlug });
    if (!deleted) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Assignment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit assignment
export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSlug = req.params.tenant;
    const { studentId, studentName, content, attachments } = req.body;

    const assignment = await Assignment.findOne({ _id: id, tenantSlug });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    // AI analysis
    const aiAnalysis = await detectSubmissionQuality(content, assignment.description);

    const submission = {
      studentId,
      studentName,
      content,
      attachments: attachments || [],
      submittedAt: new Date(),
      aiAnalysis: aiAnalysis.analysis,
    };

    assignment.submissions.push(submission);
    await assignment.save();

    res.json({ message: "Submission successful", aiAnalysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Grade submission
export const gradeSubmission = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const tenantSlug = req.params.tenant;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findOne({ _id: id, tenantSlug });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const submission = assignment.submissions.find(sub => sub.studentId === studentId);
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    submission.grade = grade;
    submission.feedback = feedback;
    await assignment.save();

    res.json({ message: "Graded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
