import { courseService } from '../service/course.service.js';

export const createCourse = async (req, res) => {
  try {
    const course = await courseService.createCourse(req.body, req.user, req);
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json(course);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    console.log('[courseController] getAllCourses called with query:', req.query);
    const result = await courseService.getAllCourses(req.query);
    res.json(result);
  } catch (error) {
    console.error('[courseController] Error in getAllCourses:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const updated = await courseService.updateCourse(req.params.id, req.body, req.user, req);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const result = await courseService.deleteCourse(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const publishCourse = async (req, res) => {
  try {
    const result = await courseService.publishCourse(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const archiveCourse = async (req, res) => {
  try {
    const result = await courseService.archiveCourse(req.params.id, req.user, req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createVersion = async (req, res) => {
  try {
    const result = await courseService.createVersion(req.params.id, req.user, req);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
