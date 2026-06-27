import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['STUDENT', 'INSTRUCTOR', 'TEACHER', 'ADMIN', 'TEACHING_ASSISTANT', 'MODERATOR'])
  })
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'suspended'])
  })
});

export const updateSettingSchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Setting key is required'),
    value: z.any()
  })
});
