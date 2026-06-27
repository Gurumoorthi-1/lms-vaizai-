import { z } from 'zod';

export const summarySchema = z.object({
  body: z.object({
    content: z.string().min(10, 'Content must be at least 10 characters long')
  })
});

export const quizSchema = z.object({
  body: z.object({
    topic: z.string().min(2, 'Topic is required'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    numQuestions: z.number().int().min(1).max(20).optional()
  })
});

export const flashcardSchema = z.object({
  body: z.object({
    topic: z.string().min(2, 'Topic is required'),
    numCards: z.number().int().min(1).max(50).optional()
  })
});

export const interviewSchema = z.object({
  body: z.object({
    role: z.string().min(2, 'Role is required'),
    level: z.enum(['junior', 'mid', 'senior'])
  })
});

export const assignmentSchema = z.object({
  body: z.object({
    topic: z.string().min(2, 'Topic is required'),
    level: z.enum(['beginner', 'intermediate', 'advanced'])
  })
});

export const roadmapSchema = z.object({
  body: z.object({
    skill: z.string().min(2, 'Skill is required')
  })
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required'),
    sessionId: z.string().optional()
  })
});
