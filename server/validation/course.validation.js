import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.string().min(2, 'Category is required'),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    duration: z.string().optional(),
    thumbnail: z.string().url('Must be a valid URL').optional(),
    tags: z.array(z.string()).optional(),
  })
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(10).optional(),
    category: z.string().min(2).optional(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    duration: z.string().optional(),
    thumbnail: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
  }),
  params: z.object({
    id: z.string()
  })
});

export const addChapterSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Chapter title is required'),
    description: z.string().optional(),
    order: z.number().int().min(0)
  }),
  params: z.object({
    id: z.string()
  })
});

export const addLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Lesson title is required'),
    description: z.string().optional(),
    type: z.enum(['video', 'reading', 'quiz', 'assignment']),
    contentUrl: z.string().url('Must be a valid URL').optional(),
    videoMetadata: z.object({
      durationSeconds: z.number().int().optional(),
      resolution: z.string().optional(),
      provider: z.string().optional()
    }).optional(),
    order: z.number().int().min(0)
  }),
  params: z.object({
    id: z.string(),
    chapterId: z.string()
  })
});
