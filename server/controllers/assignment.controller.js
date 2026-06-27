import { assignmentService } from '../service/assignment.service.js';
import storageManager from '../service/storage/storageManager.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const createAssignment = async (req, res) => {
  try {
    const result = await assignmentService.createAssignment(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    console.log('getAllAssignments called');
    const result = await assignmentService.getAllAssignments();
    console.log('getAllAssignments returned', result.length, 'assignments');
    res.json(result);
  } catch (error) {
    console.error('getAllAssignments error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getAssignmentsByCourse = async (req, res) => {
  try {
    const result = await assignmentService.getAssignmentsByCourse(req.params.courseId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    console.log('submitAssignment called:');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('req.params.assignmentId:', req.params.assignmentId);
    console.log('req.user:', req.user._id);

    let fileUrl = null;
    let content = req.body.content || null;

    if (req.file) {
      // Generate a unique file key and persist via configured storage provider
      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueKey = `assignments/${uuidv4()}${ext}`;
      const uploadResult = await storageManager.uploadFile(req.file.buffer, uniqueKey, req.file.mimetype);
      fileUrl = uploadResult.url;
      console.log('File uploaded successfully, url:', fileUrl);
    }

    console.log('fileUrl:', fileUrl);
    console.log('content:', content);

    if (!fileUrl && !content) {
      console.log('No file or content provided!');
      return res.status(400).json({ message: 'Either a file or content must be provided' });
    }

    const result = await assignmentService.submitAssignment(req.params.assignmentId, req.user._id, { fileUrl, content });
    console.log('Submission created successfully:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('submitAssignment error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const result = await assignmentService.getMySubmission(req.params.assignmentId, req.user._id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getSubmissionsByAssignment = async (req, res) => {
  try {
    const result = await assignmentService.getSubmissionsByAssignment(req.params.assignmentId, req.user, req.query);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const evaluateSubmission = async (req, res) => {
  try {
    const result = await assignmentService.evaluateSubmission(req.params.submissionId, req.body, req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const generateAIFeedback = async (req, res) => {
  try {
    // Expects the client to parse the text and send it in the body for MVP
    const { textContent } = req.body;
    if (!textContent) return res.status(400).json({ message: 'Missing text content' });
    const result = await assignmentService.generateAIFeedback(req.params.submissionId, textContent, req.user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
