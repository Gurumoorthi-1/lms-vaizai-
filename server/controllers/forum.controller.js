import { forumService } from '../service/forum.service.js';

export const createQuestion = async (req, res) => {
  try {
    const result = await forumService.createQuestion(req.body, req.user);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getQuestions = async (req, res) => {
  try {
    const result = await forumService.getQuestions(req.query);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getPostById = async (req, res) => {
  try {
    const result = await forumService.getPostById(req.params.id);
    res.json(result);
  } catch (e) { res.status(404).json({ message: e.message }); }
};

export const createReply = async (req, res) => {
  try {
    const result = await forumService.createReply(req.params.id, req.body.content, req.user);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const toggleLike = async (req, res) => {
  try {
    const result = await forumService.toggleLike(req.params.id, req.user._id);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const toggleBookmark = async (req, res) => {
  try {
    const result = await forumService.toggleBookmark(req.params.id, req.user._id);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getMyBookmarks = async (req, res) => {
  try {
    const result = await forumService.getMyBookmarks(req.user._id, req.query);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const reportPost = async (req, res) => {
  try {
    const result = await forumService.reportPost(req.params.id, req.user._id, req.body.reason);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const deletePost = async (req, res) => {
  try {
    const result = await forumService.deletePost(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const pinPost = async (req, res) => {
  try {
    const result = await forumService.pinPost(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(403).json({ message: e.message }); }
};

export const markResolved = async (req, res) => {
  try {
    const result = await forumService.markResolved(req.params.id, req.user);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getFlaggedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const result = await forumService.getFlaggedPosts(skip, limit);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const clearFlag = async (req, res) => {
  try {
    const result = await forumService.clearFlag(req.params.id);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const createCategory = async (req, res) => {
  try {
    const result = await forumService.createCategory(req.body);
    res.status(201).json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getCategories = async (req, res) => {
  try {
    const result = await forumService.getCategories();
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
