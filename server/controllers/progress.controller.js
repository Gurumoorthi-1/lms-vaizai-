import { progressService } from '../service/progress.service.js';

export const updateWatchTime = async (req, res) => {
  try {
    const { additionalSeconds } = req.body;
    if (!additionalSeconds) return res.status(400).json({ message: 'Missing additionalSeconds' });
    
    const result = await progressService.updateWatchTime(req.user._id, req.params.courseId, additionalSeconds);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnalyticsReport = async (req, res) => {
  try {
    const result = await progressService.getAnalyticsReport(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
