import Assignment from '../models/Assignment.js';

// Helper to transform assignment for frontend
const transformAssignment = (assignment) => {
  const obj = assignment.toObject ? assignment.toObject() : assignment;
  // Extract course ID: if courseId is a populated object, use _id
  const courseId = obj.courseId?._id ? obj.courseId._id.toString() : obj.courseId;
  return {
    id: obj._id,
    _id: obj._id,
    title: obj.title,
    courseId: courseId,
    courseTitle: obj.courseId?.title || 'General',
    description: obj.instructions,
    instructions: obj.instructions,
    dueDate: obj.deadline,
    deadline: obj.deadline,
    maxMarks: obj.maxMarks,
    teacherId: obj.teacherId?._id ? obj.teacherId._id.toString() : obj.teacherId,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

export const assignmentRepository = {
  create: async (data) => {
    const assignment = await Assignment.create(data);
    return transformAssignment(assignment);
  },

  findById: async (id) => {
    const assignment = await Assignment.findById(id).populate('courseId', 'title');
    return assignment ? transformAssignment(assignment) : null;
  },

  findAllByCourse: async (courseId) => {
    const assignments = await Assignment.find({ courseId }).sort({ deadline: 1 });
    return assignments.map(transformAssignment);
  },

  findAll: async () => {
    const assignments = await Assignment.find({}).sort({ deadline: 1 }).populate('courseId', 'title');
    return assignments.map(transformAssignment);
  },

  update: async (id, updateData) => {
    const assignment = await Assignment.findByIdAndUpdate(id, updateData, { new: true });
    return assignment ? transformAssignment(assignment) : null;
  },

  delete: async (id) => {
    return await Assignment.findByIdAndDelete(id);
  },

  countByCourse: async (courseId) => {
    return await Assignment.countDocuments({ courseId });
  }
};
