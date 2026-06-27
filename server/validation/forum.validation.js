import { z } from 'zod';

export const createQuestionSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Question title must be at least 3 characters'),
    description: z.string().min(1, 'Description is required'),
    courseId: z.string().optional(),
    categoryId: z.string().optional(),
    tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
    category: z.string().optional()
  }).passthrough()
});

export const createReplySchema = z.object({
  body: z.object({
    content: z.string().min(5, 'Reply must be at least 5 characters'),
    parentId: z.string().optional()
  }),
  params: z.object({ id: z.string() })
});

export const reportPostSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Please provide a reason for reporting')
  }),
  params: z.object({ id: z.string() })
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name required'),
    description: z.string().optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, numbers and hyphens only')
  })
});

export const forumQuerySchema = z.object({
  // passthrough() allows any extra/unrecognised query keys (e.g. from browser
  // extensions, Vite proxy, or future additions) without throwing a 400.
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    courseId: z.string().optional(),
    // Accept any string for sortBy — the service handles unknown values gracefully.
    // The strict enum was causing 400s when clients sent unsupported sort keys.
    sortBy: z.string().optional(),
    resolved: z.enum(['true', 'false']).optional()
  }).passthrough()
});
