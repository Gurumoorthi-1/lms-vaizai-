import { liveSessionService } from '../service/liveSession.service.js';

export const createSession = async (req, res) => {
  try {
    const result = await liveSessionService.createSession(req.body, req.user);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const cancelSession = async (req, res) => {
  try {
    const result = await liveSessionService.cancelSession(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const markAttendance = async (req, res) => {
  try {
    const session = await liveSessionRepository.findById(req.params.id);
    if (!session) throw new Error('Session not found');
    const attendance = await attendanceRepository.upsertJoin(req.params.id, req.user._id);
    res.json(attendance);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getSessionById = async (req, res) => {
  try {
    const result = await liveSessionService.getSessionById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Session not found' });
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getSessionsByCourse = async (req, res) => {
  try {
    const result = await liveSessionService.getSessionsByCourse(req.params.courseId, req.query);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getUpcomingSessions = async (req, res) => {
  try {
    const result = await liveSessionService.getUpcomingSessions(req.params.courseId);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const startSession = async (req, res) => {
  try {
    const result = await liveSessionService.startSession(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const endSession = async (req, res) => {
  try {
    const result = await liveSessionService.endSession(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const joinSession = async (req, res) => {
  try {
    const result = await liveSessionService.joinSession(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const leaveSession = async (req, res) => {
  try {
    const result = await liveSessionService.leaveSession(req.params.id, req.user._id);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const updateSession = async (req, res) => {
  try {
    const result = await liveSessionService.updateSession(req.params.id, req.body, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const uploadTranscript = async (req, res) => {
  try {
    const result = await liveSessionService.uploadTranscriptAndSummarize(req.params.id, req.body.transcript, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const updateRecordingMetadata = async (req, res) => {
  try {
    const result = await liveSessionService.updateRecordingMetadata(req.params.id, req.body, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getAttendance = async (req, res) => {
  try {
    const result = await liveSessionService.getAttendance(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getMyAttendance = async (req, res) => {
  try {
    const result = await liveSessionService.getMyAttendance(req.user._id);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllSessions = async (req, res) => {
  try {
    const result = await liveSessionService.getAllSessions(req.query);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
