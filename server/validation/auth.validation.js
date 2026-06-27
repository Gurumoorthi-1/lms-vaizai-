import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['STUDENT', 'INSTRUCTOR', 'TEACHER', 'ADMIN', 'TEACHING_ASSISTANT', 'MODERATOR']).optional(),
  }).passthrough(), // Allow extra fields
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional()
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  })
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    settings: z.object({
      theme: z.string().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      emailNotifications: z.boolean().optional(),
    }).optional()
  })
});

export const validate = (schema) => (req, res, next) => {
  try {
    console.log('[Validation] Request body:', req.body);
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    console.error('[Validation] Error:', err);
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors ? err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : []
    });
  }
};
