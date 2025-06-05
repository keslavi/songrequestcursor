import { create } from 'zustand';
import axios from 'axios';

const authStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isGuest: false,

  continueAsGuest: () => {
    set({
      user: { username: 'Guest', isGuest: true, role: 'guest' },
      isAuthenticated: true,
      isGuest: true,
      error: null
    });
    return true;
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/public/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        isGuest: false
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

  register: async (username, email, password, { firstName, lastName, phone, zipCode, comments } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/public/auth/register', {
        username,
        email,
        password,
        role: 'user',
        profile: {
          name: username,
          firstName,
          lastName,
          phone,
          zipCode,
          comments
        }
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false,
        isGuest: false
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

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isGuest: false
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ 
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: false
      });
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/auth/me');
      const user = response.data;
      
      set({ 
        user,
        token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false
      });
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      set({ 
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: false,
        error: error.response?.data?.message || 'Session expired'
      });
    }
  },

  clearError: () => set({ error: null })
}));

export default authStore; 