import { create } from 'zustand';
import axios from 'axios';

export const useAuth = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize auth state
  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user profile
      const response = await axios.get('/api/auth/me');
      set({ 
        user: response.data,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.message || 'Authentication failed'
      });
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ 
        user,
        isAuthenticated: true,
        isLoading: false 
      });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed',
        isLoading: false 
      });
      return false;
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ 
        user,
        isAuthenticated: true,
        isLoading: false 
      });
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false 
      });
      return false;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ 
      user: null,
      isAuthenticated: false,
      error: null 
    });
  },

  // Update user profile
  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch('/api/auth/profile', updates);
      set(state => ({ 
        user: { ...state.user, ...response.data },
        isLoading: false 
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Profile update failed',
        isLoading: false 
      });
      return false;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
})); 