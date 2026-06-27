import Quiz from '../models/Quiz.js';

// Helper to normalize MongoDB _id to id
const normalize = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id.toString();
  if (obj.questions && Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map(q => {
      q.id = q._id ? q._id.toString() : null;
      return q;
    });
  }
  return obj;
};

const normalizeAll = (docs) => docs.map(normalize);

export const quizRepository = {
  create: async (data) => {
    const doc = await Quiz.create(data);
    return normalize(doc);
  },

  findById: async (id) => {
    const doc = await Quiz.findById(id);
    return normalize(doc);
  },

  findByCourse: async (courseId, limit = 10, skip = 0) => {
    const docs = await Quiz.find({ courseId }).skip(skip).limit(limit);
    return normalizeAll(docs);
  },

  countByCourse: async (courseId) => {
    return await Quiz.countDocuments({ courseId });
  },

  findByLesson: async (lessonId) => {
    const doc = await Quiz.findOne({ lessonId });
    return normalize(doc);
  },

  updateById: async (id, data) => {
    const doc = await Quiz.findByIdAndUpdate(id, { $set: data }, { new: true });
    return normalize(doc);
  },

  deleteById: async (id) => {
    const doc = await Quiz.findByIdAndDelete(id);
    return normalize(doc);
  }
};
