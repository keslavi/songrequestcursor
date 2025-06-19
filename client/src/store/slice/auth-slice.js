import api from "@/store/api";
import { toast } from "react-toastify";

export const authSlice = (set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    try {
      const res = await api.post("public/auth/login", { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
      });
      
      return true;
    } catch (e) {
      set({ 
        error: e.response?.data?.message || 'Login failed', 
      });
      toast.error(e.response?.data?.message || 'Login failed');
      return false;
    }
  },

  register: async (userData) => {
    try {
      const res = await api.post("public/auth/register", userData);
      const { token, user } = res.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
      });
      
      return true;
    } catch (e) {
      set({ 
        error: e.response?.data?.message || 'Registration failed', 
      });
      toast.error(e.response?.data?.message || 'Registration failed');
      return false;
    }
  },

  socialAuth: async (provider, token, userInfo = null) => {
    try {
      const payload = { 
        provider, 
        token,
        ...(userInfo && {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub,
          phoneNumber: userInfo.phone_number,
          emailVerified: userInfo.email_verified,
          phoneNumberVerified: userInfo.phone_number_verified,
          givenName: userInfo.given_name,
          familyName: userInfo.family_name,
          nickname: userInfo.nickname,
          locale: userInfo.locale
        })
      };
      
      const res = await api.post("public/auth/social", payload);
      const { token: authToken, user } = res.data;
      
      localStorage.setItem('token', authToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      set({ 
        user, 
        token: authToken, 
        isAuthenticated: true,  
      });
      
      return true;
    } catch (e) {
      set({ 
        error: e.response?.data?.message || 'Social authentication failed', 
      });
      toast.error(e.response?.data?.message || 'Social authentication failed');
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      error: null
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get("public/auth/me");
      set({ 
        user: res.data,
        token,
        isAuthenticated: true,
      });
    } catch (e) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      set({ 
        user: null,
        token: null,
        isAuthenticated: false,
        error: e.response?.data?.message || 'Authentication failed'
      });
    }
  }
});

export default authSlice;
