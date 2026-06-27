import { assignmentRepository } from '../repository/assignment.repository.js';
import { submissionRepository } from '../repository/submission.repository.js';
import { courseRepository } from '../repository/course.repository.js';
import { enrollmentRepository } from '../repository/enrollment.repository.js';
import { quizRepository } from '../repository/quiz.repository.js';
import { quizAttemptRepository } from '../repository/quizAttempt.repository.js';
import { aiService } from './ai.service.js';
import { getIO } from '../config/socket.js';

export const assignmentService = {
  createAssignment: async (data, user) => {
    const course = await courseRepository.findById(data.courseId);
    if (!course) throw new Error('Course not found');
    
    // Get teacher ID (handles both populated object and raw ObjectId)
    const courseTeacherId =
      course.teacherId._id?.toString() || course.teacherId?.toString();

    if (
      courseTeacherId !== user._id.toString() &&
      user.role !== 'ADMIN' &&
      user.role !== 'INSTRUCTOR' &&
      user.role !== 'TEACHER'
    ) {
      throw new Error('Not authorized to add assignments to this course');
    }

    // Map frontend fields to backend model
    const assignmentData = {
      ...data,
      instructions: data.instructions || data.description,
      deadline: data.deadline || data.dueDate,
      teacherId: user._id
    };

    // Remove frontend fields if they exist
    delete assignmentData.description;
    delete assignmentData.dueDate;

    const assignment = await assignmentRepository.create(assignmentData);
    
    // Emit socket event to update all course members
    try {
      const io = getIO();
      if (io) {
        io.to(`course:${data.courseId}`).emit('assignment:created', assignment);
      }
    } catch (err) {
      console.error('[Socket] Error emitting assignment:created event:', err);
    }

    return assignment;
  },

  getAssignmentsByCourse: async (courseId) => {
    return await assignmentRepository.findAllByCourse(courseId);
  },

  getAllAssignments: async () => {
    const assignments = await assignmentRepository.findAll();
    return assignments;
  },

  getMySubmission: async (assignmentId, studentId) => {
    const submission = await submissionRepository.findByAssignmentAndStudent(assignmentId, studentId);
    return submission || null;
  },

  submitAssignment: async (assignmentId, studentId, { fileUrl, content }) => {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    let enrollment = await enrollmentRepository.findByUserAndCourse(studentId, assignment.courseId);
    if (!enrollment) {
      enrollment = await enrollmentRepository.create({
        studentId,
        courseId: assignment.courseId,
        enrolledAt: new Date(),
        status: 'active',
        progress: 0
      });
    }

    const existing = await submissionRepository.findByAssignmentAndStudent(assignmentId, studentId);
    if (existing) throw new Error('Assignment already submitted');

    const isLate = new Date() > new Date(assignment.deadline);

    const submissionData = {
      assignmentId,
      studentId,
      isLate,
      status: 'submitted'
    };

    if (fileUrl) submissionData.fileUrl = fileUrl;
    if (content) submissionData.content = content;

    const submission = await submissionRepository.create(submissionData);

    // Emit socket event for submission created
    try {
      const io = getIO();
      if (io) {
        io.to(`course:${assignment.courseId}`).emit('submission:updated', {
          type: 'created',
          submission,
          assignmentId
        });
      }
    } catch (err) {
      console.error('[Socket] Error emitting submission:updated event:', err);
    }

    // Auto-compute and update overall course progress
    try {
      const [totalQuizzes, totalAssignments, allAttempts, allSubmissions] = await Promise.all([
        quizRepository.countByCourse ? quizRepository.countByCourse(assignment.courseId) : 0,
        assignmentRepository.countByCourse ? assignmentRepository.countByCourse(assignment.courseId) : 0,
        quizAttemptRepository.countAttemptedQuizzes ? quizAttemptRepository.countAttemptedQuizzes(studentId, assignment.courseId) : 0,
        submissionRepository.countByStudentAndCourse ? submissionRepository.countByStudentAndCourse(studentId, assignment.courseId) : 0
      ]);
      const totalItems = (totalQuizzes || 0) + (totalAssignments || 0);
      const completedItems = (allAttempts || 0) + (allSubmissions || 0);
      const newProgress = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;
      await enrollmentRepository.updateProgress(studentId, assignment.courseId, { progress: newProgress });
    } catch (progressErr) {
      console.warn('[AssignmentService] Could not update progress:', progressErr.message);
    }

    return submission;
  },

  getSubmissionsByAssignment: async (assignmentId, user, query) => {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    // Get teacher ID (handles both populated object and raw ObjectId)
    const assignmentTeacherId =
      assignment.teacherId._id?.toString() || assignment.teacherId?.toString();

    const isTeacherOrAdmin = 
      assignmentTeacherId === user._id.toString() ||
      user.role === 'ADMIN' ||
      user.role === 'INSTRUCTOR' ||
      user.role === 'TEACHER';

    if (!isTeacherOrAdmin && user.role === 'STUDENT') {
      // Students only see their own submission
      const studentSubmission = await submissionRepository.findByAssignmentAndStudent(assignmentId, user._id);
      return studentSubmission ? [studentSubmission] : [];
    }

    if (!isTeacherOrAdmin) {
      throw new Error('Not authorized to view these submissions');
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const submissions = await submissionRepository.findAllByAssignment(assignmentId, skip, limit);
    
    // Return just the submissions array for frontend compatibility
    return submissions;
  },

  evaluateSubmission: async (submissionId, data, user) => {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) throw new Error('Submission not found');

    const assignment = await assignmentRepository.findById(submission.assignmentId);
    // Get teacher ID (handles both populated object and raw ObjectId)
    const assignmentTeacherId =
      assignment.teacherId._id?.toString() || assignment.teacherId?.toString();

    if (
      assignmentTeacherId !== user._id.toString() &&
      user.role !== 'ADMIN' &&
      user.role !== 'INSTRUCTOR' &&
      user.role !== 'TEACHER'
    ) {
      throw new Error('Not authorized to evaluate this submission');
    }

    if (data.marks > assignment.maxMarks) {
      throw new Error(`Marks cannot exceed the maximum of ${assignment.maxMarks}`);
    }

    const evaluated = await submissionRepository.updateEvaluation(submissionId, {
      marks: data.marks,
      teacherFeedback: data.teacherFeedback,
      status: 'graded'
    });

    // Emit socket event for submission graded
    try {
      const io = getIO();
      if (io) {
        io.to(`course:${assignment.courseId}`).emit('submission:updated', {
          type: 'graded',
          submission: evaluated,
          assignmentId: assignment.id || assignment._id
        });
      }
    } catch (err) {
      console.error('[Socket] Error emitting submission:updated event:', err);
    }

    // Update overall course assignment score logic could go here

    return evaluated;
  },

  generateAIFeedback: async (submissionId, textContent, user) => {
    // This is an advanced feature where a teacher can request AI to draft feedback based on extracted text from the file
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) throw new Error('Submission not found');
    const assignment = await assignmentRepository.findById(submission.assignmentId);

    // Get teacher ID (handles both populated object and raw ObjectId)
    const assignmentTeacherId =
      assignment.teacherId._id?.toString() || assignment.teacherId?.toString();

    if (
      assignmentTeacherId !== user._id.toString() &&
      user.role !== 'ADMIN' &&
      user.role !== 'INSTRUCTOR' &&
      user.role !== 'TEACHER'
    ) {
      throw new Error('Not authorized to generate AI feedback');
    }

    const prompt = `You are an expert Teacher's Assistant. Evaluate this student submission for the assignment titled "${assignment.title}".
    Instructions given: "${assignment.instructions}".
    Student's work: "${textContent}".
    Provide constructive feedback and suggest a score out of ${assignment.maxMarks}.`;

    // Using the aiService we built previously
    // Generate a custom cache key or pass directly to OpenAI
    const feedbackResponse = await aiService.generateSummary(user._id, prompt); // Reuse logic structure

    const updated = await submissionRepository.updateEvaluation(submissionId, {
      aiFeedback: feedbackResponse
    });

    return updated;
  }
};
