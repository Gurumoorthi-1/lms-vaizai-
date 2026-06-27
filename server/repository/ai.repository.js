import PromptHistory from '../models/PromptHistory.js';

export const aiRepository = {
  /**
   * Persist a new prompt/response pair to the history collection.
   */
  createHistory: async (data) => {
    return PromptHistory.create(data);
  },

  /**
   * Retrieve paginated history for a user, newest first.
   */
  getHistoryByUser: async (userId, limit = 50) => {
    return PromptHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  /**
   * Aggregate usage statistics for a specific user.
   * Returns total tokens consumed, total cost, and call count per action type.
   */
  getUsageStatsByUser: async (userId) => {
    const [summary] = await PromptHistory.aggregate([
      { $match: { userId: userId.toString?.() || userId } },
      {
        $group: {
          _id:              '$userId',
          totalCalls:       { $sum: 1 },
          totalTokens:      { $sum: '$tokensUsed' },
          totalCost:        { $sum: '$cost' },
          promptTokens:     { $sum: '$promptTokens' },
          completionTokens: { $sum: '$completionTokens' },
          firstCallAt:      { $min: '$createdAt' },
          lastCallAt:       { $max: '$createdAt' }
        }
      }
    ]);

    const byAction = await PromptHistory.aggregate([
      { $match: { userId: userId.toString?.() || userId } },
      {
        $group: {
          _id:         '$actionType',
          calls:       { $sum: 1 },
          tokens:      { $sum: '$tokensUsed' },
          cost:        { $sum: '$cost' }
        }
      },
      { $sort: { calls: -1 } }
    ]);

    return {
      summary: summary || {
        totalCalls:       0,
        totalTokens:      0,
        totalCost:        0,
        promptTokens:     0,
        completionTokens: 0,
        firstCallAt:      null,
        lastCallAt:       null
      },
      byAction
    };
  },

  /**
   * Delete all history records for a user. (GDPR / data retention)
   */
  deleteHistoryByUser: async (userId) => {
    const result = await PromptHistory.deleteMany({ userId });
    return result.deletedCount;
  }
};
