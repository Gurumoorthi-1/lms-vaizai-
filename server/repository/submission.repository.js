import Submission from '../models/Submission.js';

const transformSubmission = (submission) => {
  const obj = submission.toObject ? submission.toObject() : submission;
  const studentName = obj.studentId 
    ? `${obj.studentId.firstName || ''} ${obj.studentId.lastName || ''}`.trim() 
    : 'Student';
  return {
    id: obj._id,
    _id: obj._id,
    assignmentId: obj.assignmentId,
    studentId: obj.studentId._id || obj.studentId,
    studentName: studentName,
    content: obj.content || obj.fileUrl, // Use content or fileUrl
    fileUrl: obj.fileUrl,
    submittedAt: obj.submittedAt,
    isLate: obj.isLate,
    grade: obj.marks,
    marks: obj.marks,
    feedback: obj.teacherFeedback,
    teacherFeedback: obj.teacherFeedback,
    aiFeedback: obj.aiFeedback,
    status: obj.status
  };
};

export const submissionRepository = {
  create: async (data) => {
    const submission = await Submission.create(data);
    return transformSubmission(submission);
  },

  findById: async (id) => {
    const submission = await Submission.findById(id)
      .populate('studentId', 'firstName lastName email')
      .populate('assignmentId', 'title deadline maxMarks');
    return submission ? transformSubmission(submission) : null;
  },

  findByAssignmentAndStudent: async (assignmentId, studentId) => {
    const submission = await Submission.findOne({ assignmentId, studentId })
      .populate('studentId', 'firstName lastName');
    return submission ? transformSubmission(submission) : null;
  },

  findAllByAssignment: async (assignmentId, skip = 0, limit = 10) => {
    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'firstName lastName')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);
    return submissions.map(transformSubmission);
  },
  
  countByAssignment: async (assignmentId) => {
    return await Submission.countDocuments({ assignmentId });
  },

  updateEvaluation: async (id, data) => {
    const submission = await Submission.findByIdAndUpdate(id, data, { new: true })
      .populate('studentId', 'firstName lastName');
    return submission ? transformSubmission(submission) : null;
  },

  countByStudentAndCourse: async (studentId, courseId) => {
    const Assignment = (await import('../models/Assignment.js')).default;
    const courseAssignmentIds = await Assignment.find({ courseId }).distinct('_id');
    return await Submission.countDocuments({
      studentId,
      assignmentId: { $in: courseAssignmentIds }
    });
  }
};
