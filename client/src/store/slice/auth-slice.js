import api from "@/store/api";
import { toast } from "react-toastify";

const PERFORMER_ROLES = new Set(["performer", "admin", "organizer"]);

const storage = typeof window !== "undefined" ? window.localStorage : null;

const getStoredItem = (key) => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read localStorage key "${key}":`, error);
    return null;
  }
};

const getStoredJSON = (key) => {
  const raw = getStoredItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to parse stored JSON for key "${key}":`, error);
    return null;
  }
};

const storedToken = getStoredItem("token");
const storedUser = getStoredJSON("user");
const storedGuestPhone = getStoredItem("guestPhoneNumber");

if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

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

  const persistSession = (token, user) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }

    if (!storage) return;

    try {
      if (token) {
        storage.setItem('token', token);
      } else {
        storage.removeItem('token');
      }

      if (user) {
        storage.setItem('user', JSON.stringify(user));
      } else {
        storage.removeItem('user');
      }
    } catch (error) {
      console.warn('Failed to persist auth session:', error);
    }
  };

  if (storedUser && storedToken) {
    setTimeout(() => {
      try {
        maybeLoadPerformerSongs(storedUser);
      } catch (error) {
        console.warn('Failed to preload performer songs from stored session:', error);
      }
    }, 0);
  }

  return {
    user: storedUser,
    token: storedToken,
    isAuthenticated: Boolean(storedToken && storedUser),
    isAuthChecking: false,
    guestPhoneNumber: storedGuestPhone || null,

    login: async (email, password) => {
      try {
        const res = await api.post("public/auth/login", { email, password });
        const { token, user } = res.data;

        persistSession(token, user);

        set({
          user,
          token,
          isAuthenticated: true,
          isAuthChecking: false,
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

        persistSession(token, user);
        if (user?.phoneNumber && storage) {
          storage.setItem('lastPhoneNumber', user.phoneNumber);
        }

        set({
          user,
          token,
          isAuthenticated: true,
          isAuthChecking: false,
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

        persistSession(token, user);

        set({
          user,
          token,
          isAuthenticated: true,
          isAuthChecking: false,
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

        persistSession(token, user);

        set({
          user,
          token,
          isAuthenticated: true,
          isAuthChecking: false,
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

        persistSession(authToken, user);

        set({
          user,
          token: authToken,
          isAuthenticated: true,
          isAuthChecking: false,
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
      persistSession(null, null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        isAuthChecking: false,
      });
      clearPerformerSongs();
    },

    setGuestPhoneNumber: (phoneNumber) => {
      const value = phoneNumber ? String(phoneNumber) : null;
      if (value) {
        if (storage) {
          storage.setItem("guestPhoneNumber", value);
        }
      } else {
        if (storage) {
          storage.removeItem("guestPhoneNumber");
        }
      }
      set({ guestPhoneNumber: value });
    },

    clearGuestPhoneNumber: () => {
      if (storage) {
        storage.removeItem("guestPhoneNumber");
      }
      set({ guestPhoneNumber: null });
    },

    checkAuth: async () => {
      const token = getStoredItem('token');
      if (!token) {
        persistSession(null, null);
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAuthChecking: false,
        });
        return;
      }

      set({ isAuthChecking: true });
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get("public/auth/me");
        persistSession(token, res.data);
        set({
          user: res.data,
          token,
          isAuthenticated: true,
          isAuthChecking: false,
          error: null,
        });

        maybeLoadPerformerSongs(res.data);
      } catch (e) {
        persistSession(null, null);
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: e.response?.data?.message || 'Authentication failed',
          isAuthChecking: false,
        });
        clearPerformerSongs();
      }
    },
  };
};

export default authSlice;
