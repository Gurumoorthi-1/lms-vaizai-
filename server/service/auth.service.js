import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repository/user.repository.js';
import { sessionRepository } from '../repository/session.repository.js';
import { auditRepository } from '../repository/audit.repository.js';
import { apiKeyRepository } from '../repository/apiKey.repository.js';
import { sendEmail } from './notification.service.js';

const parseDuration = (durationStr, defaultMs) => {
  if (!durationStr) return defaultMs;
  const match = durationStr.match(/^(\d+)([smhd])$/);
  if (!match) return defaultMs;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return defaultMs;
  }
};

const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' });
};

const generateRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
  });
};


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const authService = {
  register: async (userData, req) => {
    const { email } = userData;
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Set role based on email, requested body role, or default to STUDENT
    let role = userData.role || 'STUDENT';
    if (email === 'admin@gmail.com') {
      role = 'ADMIN';
    } else if (email === 'teacher@gmail.com') {
      role = 'TEACHER';
    }

    // Create user with email already verified
    const user = await userRepository.create({
      ...userData,
      role,
      emailVerified: true
    });

    await auditRepository.create({
      userId: user._id,
      action: 'REGISTER',
      resource: 'Auth',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      message: 'Registration successful.'
    };
  },

  login: async (credentials, req) => {
    const { email, password } = credentials;
    let user = await userRepository.findByEmail(email);

    if (!user) {
      // Allow mock auto-creation ONLY for demo users if they don't exist
      if (email === 'admin@gmail.com' && password === 'Password@123') {
        user = await userRepository.create({ email, password, firstName: 'Admin', lastName: 'User', role: 'ADMIN', emailVerified: true });
      } else if (email === 'teacher@gmail.com' && password === 'Password@123') {
        user = await userRepository.create({ email, password, firstName: 'Teacher', lastName: 'User', role: 'TEACHER', emailVerified: true });
      } else {
        throw new Error('Invalid credentials');
      }
    } else {
      // For existing users, verify the password properly
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Store Session
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const refreshExpiryMs = parseDuration(process.env.REFRESH_TOKEN_EXPIRY || '7d', 7 * 24 * 60 * 60 * 1000);
    await sessionRepository.create({
      userId: user._id,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + refreshExpiryMs)
    });

    // Update Device History
    await userRepository.updateDeviceHistory(user._id, { device: deviceInfo, ip: ipAddress, lastLogin: new Date() });

    await auditRepository.create({
      userId: user._id,
      action: 'LOGIN',
      resource: 'Auth',
      ipAddress
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }
    };
  },

  logout: async (refreshToken, userId, req) => {
    if (refreshToken) {
      await sessionRepository.revokeByToken(refreshToken);
    }
    await auditRepository.create({
      userId,
      action: 'LOGOUT',
      resource: 'Auth',
      ipAddress: req.ip || req.connection.remoteAddress
    });
    return { success: true };
  },

  refreshToken: async (token) => {
    const session = await sessionRepository.findByToken(token);
    if (!session || session.expiresAt < new Date()) {
      if (session) await sessionRepository.revokeByToken(token);
      throw new Error('Refresh token is invalid or expired');
    }

    const user = await userRepository.findById(session.userId);
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    // Rotate token
    await sessionRepository.revokeByToken(token);
    const refreshExpiryMs = parseDuration(process.env.REFRESH_TOKEN_EXPIRY || '7d', 7 * 24 * 60 * 60 * 1000);
    await sessionRepository.create({
      userId: user._id,
      refreshToken: newRefreshToken,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      expiresAt: new Date(Date.now() + refreshExpiryMs)
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // Forgot password flow with OTP
  sendForgotPasswordOTP: async (email) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal user existence — silently succeed
      console.log(`[ForgotPassword] No user found with email: ${email}`);
      return { success: true, message: 'If an account with that email exists, an OTP was sent.' };
    }

    const otp = generateOTP();
    user.resetPasswordOTP = {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
    };
    await user.save();
    console.log(`[ForgotPassword] OTP ${otp} generated for ${email}`);

    // Send email with OTP
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your Password - Vaizai LMS',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
          <div style="text-align:center;margin-bottom:24px">
            <h2 style="color:#1a1a2e;margin:12px 0 4px">Reset your Password</h2>
            <p style="color:#64748b;margin:0;font-size:14px">Vaizai Learning Management System</p>
          </div>
          <p style="color:#374151;font-size:15px">Hi ${user.firstName || 'there'},</p>
          <p style="color:#374151;font-size:15px">We received a request to reset your password. Use the OTP below:</p>
          <div style="background:#f1f5f9;border:2px dashed #6366f1;border-radius:12px;text-align:center;padding:24px;margin:24px 0">
            <p style="margin:0 0 4px;color:#64748b;font-size:13px;letter-spacing:1px;text-transform:uppercase">Your One-Time Password</p>
            <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;font-family:monospace">${otp}</p>
          </div>
          <p style="color:#64748b;font-size:13px;text-align:center">This OTP is valid for <strong>10 minutes</strong> only.</p>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px">
            If you didn't request this, you can safely ignore this email.<br/>Vaizai LMS — Secure Password Reset
          </p>
        </div>`
      });
      console.log(`[ForgotPassword] ✅ OTP email sent to ${email}`);
    } catch (error) {
      console.error(`[ForgotPassword] ❌ Failed to send OTP email to ${email}:`, error.message);
      // Don't block the user — OTP is already saved in DB
    }

    return { success: true, message: 'If an account with that email exists, an OTP was sent.' };
  },

  verifyForgotPasswordOTP: async (email, otp) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    if (!user.resetPasswordOTP || user.resetPasswordOTP.otp !== otp || user.resetPasswordOTP.expiresAt < new Date()) {
      throw new Error('Invalid or expired OTP');
    }

    return { success: true, message: 'OTP verified successfully.' };
  },

  resetPassword: async (email, otp, newPassword) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    if (!user.resetPasswordOTP || user.resetPasswordOTP.otp !== otp || user.resetPasswordOTP.expiresAt < new Date()) {
      throw new Error('Invalid or expired OTP');
    }

    user.password = newPassword; // Will be hashed by mongoose pre-save hook
    user.resetPasswordOTP = undefined;
    await user.save();

    // Revoke all sessions on password reset
    await sessionRepository.revokeAllForUser(user._id);

    return { success: true, message: 'Password reset successful.' };
  },

  updateSettings: async (userId, settingsData) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    if (settingsData.firstName) user.firstName = settingsData.firstName;
    if (settingsData.lastName) user.lastName = settingsData.lastName;
    if (settingsData.bio !== undefined) user.bio = settingsData.bio; // Note: we can add bio if needed, or save inside user schema
    
    // Update settings sub-document
    if (settingsData.settings) {
      user.settings = {
        ...user.settings,
        ...settingsData.settings
      };
    }

    await user.save();
    return user;
  },

  updatePassword: async (userId, currentPassword, newPassword) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) throw new Error('Incorrect current password');

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();
    return { success: true, message: 'Password updated successfully' };
  },

  getSessions: async (userId) => {
    return await sessionRepository.findActiveByUser(userId);
  },

  revokeSession: async (userId, sessionId) => {
    const result = await sessionRepository.revokeById(sessionId, userId);
    if (!result) throw new Error('Session not found or already revoked');
    return { success: true, message: 'Session revoked successfully' };
  },

  getApiKeys: async (userId) => {
    return await apiKeyRepository.findByUser(userId);
  },

  generateApiKey: async (userId, name) => {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const key = `sk_live_${randomHex}`;
    const apiKey = await apiKeyRepository.create({
      userId,
      name,
      key
    });
    return apiKey;
  },

  revokeApiKey: async (userId, keyId) => {
    const result = await apiKeyRepository.deleteById(keyId, userId);
    if (!result) throw new Error('API key not found');
    return { success: true, message: 'API key revoked successfully' };
  }
};

