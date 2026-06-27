import { z } from 'zod';

export const issueCertificateSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    courseId: z.string().min(1),
    score: z.number().min(0).max(100).optional(),
    grade: z.enum(['A+', 'A', 'B+', 'B', 'C', 'Pass']).optional(),
    metadata: z.object({
      instructorName: z.string().optional(),
      courseDuration: z.string().optional()
    }).optional()
  })
});

export const revokeCertificateSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Please provide a revocation reason')
  }),
  params: z.object({ certificateId: z.string() })
});

export const searchCertificateSchema = z.object({
  query: z.object({
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    status: z.enum(['active', 'revoked']).optional(),
    page: z.string().optional(),
    limit: z.string().optional()
  })
});
