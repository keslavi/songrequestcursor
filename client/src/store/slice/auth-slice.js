import api from "@/store/api";
import { toast } from "react-toastify";

const PERFORMER_ROLES = new Set(["performer", "admin", "organizer"]);

export const authSlice = (set, get) => {
  const maybeLoadPerformerSongs = (user) => {
    if (!user || !PERFORMER_ROLES.has(user.role)) {
      return;
    }

    const loadSongs = get().songList;
    if (typeof loadSongs === "function") {
      loadSongs().catch(() => {
        // songList already emits a toast; suppress unhandled rejection noise
      });
    }
  };

  const clearPerformerSongs = () => {
    const clearSongs = get().clearSongCollection;
    if (typeof clearSongs === "function") {
      clearSongs();
    } else {
      set({ songs: [], songsById: {} });
    }
  };

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    guestPhoneNumber: localStorage.getItem("guestPhoneNumber") || null,

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

        maybeLoadPerformerSongs(user);

        return true;
      } catch (e) {
        set({
          error: e.response?.data?.message || 'Login failed',
        });
        toast.error(e.response?.data?.message || 'Login failed');
        return false;
      }
    },

    requestPhoneCode: async (phoneNumber) => {
      try {
        const res = await api.post("public/auth/phone/request-code", { phoneNumber });
        return res.data;
      } catch (e) {
        const msg = e.response?.data?.message || 'Failed to send verification code';
        set({ error: msg });
        toast.error(msg);
        return null;
      }
    },

    loginWithPhone: async (phoneNumber) => {
      try {
        const res = await api.post("public/auth/phone/login", { phoneNumber });
        const { token, user } = res.data;

        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (user?.phoneNumber) {
          localStorage.setItem('lastPhoneNumber', user.phoneNumber);
        }

        set({
          user,
          token,
          isAuthenticated: true,
        });

        maybeLoadPerformerSongs(user);

        return true;
      } catch (e) {
        const msg = e.response?.data?.message || 'Phone login failed';
        set({ error: msg });
        toast.error(msg);
        return false;
      }
    },

    verifyPhoneCode: async (phoneNumber, code) => {
      try {
        const res = await api.post("public/auth/phone/verify", { phoneNumber, code });
        const { token, user } = res.data;

        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({
          user,
          token,
          isAuthenticated: true,
        });

        maybeLoadPerformerSongs(user);

        return true;
      } catch (e) {
        const msg = e.response?.data?.message || 'Phone verification failed';
        set({ error: msg });
        toast.error(msg);
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

        maybeLoadPerformerSongs(user);

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
            locale: userInfo.locale,
          }),
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

        maybeLoadPerformerSongs(user);

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
        error: null,
      });
      clearPerformerSongs();
    },

    setGuestPhoneNumber: (phoneNumber) => {
      const value = phoneNumber ? String(phoneNumber) : null;
      if (value) {
        localStorage.setItem("guestPhoneNumber", value);
      } else {
        localStorage.removeItem("guestPhoneNumber");
      }
      set({ guestPhoneNumber: value });
    },

    clearGuestPhoneNumber: () => {
      localStorage.removeItem("guestPhoneNumber");
      set({ guestPhoneNumber: null });
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

        maybeLoadPerformerSongs(res.data);
      } catch (e) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: e.response?.data?.message || 'Authentication failed',
        });
        clearPerformerSongs();
      }
    },
  };
};

export default authSlice;
