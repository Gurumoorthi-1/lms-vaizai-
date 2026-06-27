import { authService } from '../service/auth.service.js';

export const registerUser = async (req, res) => {
  try {
    console.log('[Register] Request body:', req.body);
    const result = await authService.register(req.body, req);
    res.status(201).json(result);
  } catch (error) {
    console.error('[Register] Error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = await authService.login(req.body, req);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken, req.user?._id, req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Refresh token is required' });
    const result = await authService.refreshToken(token);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.sendForgotPasswordOTP(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyForgotPasswordOTP(email, otp);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const result = await authService.resetPassword(email, otp, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  res.json({
    id: user._id,
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
};

export const updateSettings = async (req, res) => {
  try {
    const user = await authService.updateSettings(req.user._id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.updatePassword(req.user._id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await authService.getSessions(req.user._id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const result = await authService.revokeSession(req.user._id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getApiKeys = async (req, res) => {
  try {
    const keys = await authService.getApiKeys(req.user._id);
    res.json(keys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateApiKey = async (req, res) => {
  try {
    const { name } = req.body;
    const key = await authService.generateApiKey(req.user._id, name);
    res.status(201).json(key);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const revokeApiKey = async (req, res) => {
  try {
    const result = await authService.revokeApiKey(req.user._id, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

