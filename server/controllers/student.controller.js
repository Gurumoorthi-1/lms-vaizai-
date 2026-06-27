import { studentService } from '../service/student.service.js';

export const getAllStudents = async (req, res) => {
  try {
    const result = await studentService.getAllStudents(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const staffRoles = ['ADMIN', 'INSTRUCTOR', 'TEACHER'];
    const isSelf = req.user._id.toString() === req.params.id;
    const isStaff = staffRoles.includes(req.user.role);

    if (!isSelf && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    const result = await studentService.getStudentProfile(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const result = await studentService.enrollInCourse(req.user._id, req.params.courseId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const dropCourse = async (req, res) => {
  try {
    const result = await studentService.dropCourse(req.user._id, req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const result = await studentService.updateProgress(req.user._id, req.params.courseId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getLearningHistory = async (req, res) => {
  try {
    const result = await studentService.getLearningHistory(req.user._id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addBookmark = async (req, res) => {
  try {
    const result = await studentService.addBookmark(req.user._id, req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const result = await studentService.removeBookmark(req.user._id, req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addWishlist = async (req, res) => {
  try {
    const result = await studentService.addWishlist(req.user._id, req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeWishlist = async (req, res) => {
  try {
    const result = await studentService.removeWishlist(req.user._id, req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
