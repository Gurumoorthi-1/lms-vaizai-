import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    console.log('[authStore.login] called with:', email);
    set({ isLoading: true, error: null });
    try {
      const data = await api.login({ email, password });
      console.log('[authStore.login] login data:', data);
      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      console.log('[authStore.login] set user to:', data.user);
      return data.user;
    } catch (err) {
      console.error('[authStore.login] error:', err);
      set({ 
        error: err.message || 'Login failed', 
        isLoading: false,
        isAuthenticated: false 
      });
      throw err;
    }
  },

  register: async (email, password, firstName, lastName, role) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.register({ email, password, firstName, lastName, role });
      set({ isLoading: false });
      return data.user;
    } catch (err) {
      set({ 
        error: err.message || 'Registration failed', 
        isLoading: false 
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    console.log('[authStore.checkAuth] called');
    set({ isLoading: true, error: null });
    try {
      const user = await api.me();
      console.log('[authStore.checkAuth] api.me() returned:', user);
      if (user) {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (err) {
      console.warn('[authStore.checkAuth] No active session:', err.message);
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null })
}));
