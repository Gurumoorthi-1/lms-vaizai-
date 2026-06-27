import mongoose from 'mongoose';

const promptHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String, // e.g., 'Summary', 'Quiz', 'Flashcards'
    required: true
  },
  promptContent: {
    type: String,
    required: true
  },
  responseContent: {
    type: String,
    required: true
  },
  promptTokens: {
    type: Number
  },
  completionTokens: {
    type: Number
  },
  tokensUsed: {
    type: Number
  },
  cost: {
    type: Number
  },
  modelUsed: {
    type: String
  }
}, { timestamps: true });

const PromptHistory = mongoose.model('PromptHistory', promptHistorySchema);

export default PromptHistory;
