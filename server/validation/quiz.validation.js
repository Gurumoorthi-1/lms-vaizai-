import { z } from 'zod';

const questionSchema = z.object({
  type: z.enum(['mcq', 'true_false', 'text']),
  text: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).optional(),
  correctOption: z.number().int().nonnegative().optional(),
  points: z.number().int().positive().optional(),
  explanation: z.string().optional()
}).refine(data => {
  if (data.type !== 'text' && (!data.options || data.options.length < 2)) {
    return false;
  }
  if (data.type !== 'text' && typeof data.correctOption === 'undefined') {
    return false;
  }
  return true;
}, {
  message: "Non-text questions must have options and a correct option index"
});

export const createQuizSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'),
    lessonId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid lesson ID').optional(),
    questions: z.array(questionSchema).min(1, 'At least one question is required'),
    passingScore: z.number().min(0).max(100).optional(),
    durationMinutes: z.number().nonnegative().optional(),
    maxAttempts: z.number().nonnegative().optional()
  })
});

export const updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    questions: z.array(questionSchema).min(1).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    durationMinutes: z.number().nonnegative().optional(),
    maxAttempts: z.number().nonnegative().optional()
  })
});

export const submitQuizSchema = z.object({
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question ID'),
      selectedOption: z.number().int().nonnegative().optional(),
      answerText: z.string().optional()
    })).min(1, 'At least one answer must be submitted')
  })
});
