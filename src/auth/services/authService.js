const API_URL = 'http://localhost:5000/api/auth';

const STORAGE_KEYS = {
  REMEMBER_ME: 'vaizai_remember_me',
  SESSION:     'vaizai_session_token',
  REFRESH:     'vaizai_refresh_token',
};

const getHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.SESSION);
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const authService = {
  async login({ email, password, rememberMe = false }) {
    console.log('[authService.login] email:', email);
    // Call real backend
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    console.log('[authService.login] Backend login data:', data);
    localStorage.setItem(STORAGE_KEYS.SESSION, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
    }
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }
    return data;
  },

  async register(userData) {
    console.log('[authService.register] Sending data:', userData);
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[authService.register] Error response:', error);
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    console.log('[authService.register] Success:', data);
    return data;
  },

  async logout() {
    const token = localStorage.getItem(STORAGE_KEYS.SESSION);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH);
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ refreshToken: refreshToken || token }),
      });
    } catch (e) {
      console.error('Logout API error:', e);
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.REFRESH);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    return { success: true };
  },

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH);
    if (!refreshToken) {
      console.warn('[authService.refreshAccessToken] No refresh token available');
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!response.ok) {
        console.warn('[authService.refreshAccessToken] Refresh failed, clearing tokens');
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.REFRESH);
        return null;
      }

      const data = await response.json();
      localStorage.setItem(STORAGE_KEYS.SESSION, data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
      }
      console.log('[authService.refreshAccessToken] Token refreshed successfully');
      return data.accessToken;
    } catch (err) {
      console.error('[authService.refreshAccessToken] Network error:', err.message);
      return null;
    }
  },

  async sendForgotPasswordOTP({ email }) {
    const response = await fetch(`${API_URL}/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send OTP');
    }

    return await response.json();
  },

  async verifyForgotPasswordOTP({ email, otp }) {
    const response = await fetch(`${API_URL}/forgot-password/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid or expired OTP');
    }

    return await response.json();
  },

  async resetPassword({ email, otp, password }) {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    return await response.json();
  },

  async me() {
    const token = localStorage.getItem(STORAGE_KEYS.SESSION);
    console.log('[authService.me] token:', !!token);

    // No token — return null
    if (!token) {
      console.log('[authService.me] No active session, returning null');
      return null;
    }

    // Call real backend — wrapped in try-catch so network errors
    // (server down, CORS, timeout) don't throw unhandled exceptions
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        // Token is invalid/expired — clean it up
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        console.log('[authService.me] Backend rejected token, cleared session');
        return null;
      }

      const user = await response.json();
      console.log('[authService.me] returning backend user:', user.email);
      return user;
    } catch (err) {
      // Network error (server not running, CORS, etc.)
      console.warn('[authService.me] Network error checking session:', err.message);
      return null;
    }
  },

  getRememberedEmail() {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) || '';
  },

  clearRememberedEmail() {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  },
};
