import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    scheduledAt: z.string().datetime('Must be a valid ISO datetime'),
    durationMinutes: z.number().int().min(10).max(60).optional(),
    meetingUrl: z.string().optional(),
    maxParticipants: z.number().int().min(1).max(1000).optional()
  })
});

export const updateSessionSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    durationMinutes: z.number().int().min(10).max(60).optional(),
    meetingUrl: z.string().optional(),
    meetingNotes: z.string().optional(),
    maxParticipants: z.number().int().min(1).optional()
  }),
  params: z.object({ id: z.string() })
});

export const uploadTranscriptSchema = z.object({
  body: z.object({
    transcript: z.string().min(10, 'Transcript content is required')
  }),
  params: z.object({ id: z.string() })
});
