import { z } from 'zod';

export const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    courseId: z.string(),
    chapterId: z.string().optional(),
    instructions: z.string().min(10, 'Instructions must be detailed').optional(),
    description: z.string().min(10, 'Description must be detailed').optional(),
    deadline: z.string().optional(),
    dueDate: z.string().optional(),
    maxMarks: z.number().int().min(1).default(100)
  })
});

export const evaluateSubmissionSchema = z.object({
  body: z.object({
    marks: z.number().int().min(0),
    teacherFeedback: z.string().optional()
  }),
  params: z.object({
    submissionId: z.string()
  })
});

export const getSubmissionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional()
  }),
  params: z.object({
    assignmentId: z.string()
  })
});
