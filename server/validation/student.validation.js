import { z } from 'zod';

export const updateProgressSchema = z.object({
  body: z.object({
    progress: z.number().min(0).max(100),
    completedLessons: z.array(z.string()).optional()
  }),
  params: z.object({
    courseId: z.string()
  })
});

export const courseIdParamSchema = z.object({
  params: z.object({
    courseId: z.string()
  })
});

export const querySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});
