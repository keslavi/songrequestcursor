import { create } from 'zustand';
import axios from 'axios';
import QRCode from 'qrcode';

const showStore = create((set, get) => ({
  shows: [],
  currentShow: null,
  nearbyShow: null,
  isLoading: false,
  error: null,

  // Create a new show
  createShow: async (showData) => {
    set({ isLoading: true, error: null });
    try {
      // Generate QR code for the show URL
      const showUrl = `${window.location.origin}/show/${showData.id}`;
      const qrCode = await QRCode.toDataURL(showUrl);
      
      const response = await axios.post('/api/public/shows', {
        ...showData,
        qrCode
      });

      set(state => ({ 
        shows: [...state.shows, response.data],
        currentShow: response.data,
        isLoading: false 
      }));
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create show',
        isLoading: false 
      });
      return null;
    }
  },

  // Fetch shows for a performer
  fetchPerformerShows: async (performerId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/api/public/performers/${performerId}/shows`);
      set({ 
        shows: response.data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch shows',
        isLoading: false 
      });
    }
  },

  // Fetch a specific show
  fetchShow: async (showId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/api/public/shows/${showId}`);
      set({ 
        currentShow: response.data,
        isLoading: false 
      });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch show',
        isLoading: false 
      });
      return null;
    }
  },

  // Check for nearby shows based on location
  checkNearbyShows: async (coordinates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/public/shows/nearby', {
        params: {
          lat: coordinates.latitude,
          lng: coordinates.longitude
        }
      });
      
      // If a show is found nearby and it's currently active
      if (response.data && response.data.status === 'active') {
        set({ 
          nearbyShow: response.data,
          isLoading: false 
        });
        return response.data;
      }
      
      set({ isLoading: false });
      return null;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to check nearby shows',
        isLoading: false 
      });
      return null;
    }
  },

  // Update show status
  updateShowStatus: async (showId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch(`/api/shows/${showId}/status`, { status });
      set(state => ({
        shows: state.shows.map(show => 
          show.id === showId ? { ...show, status: response.data.status } : show
        ),
        currentShow: state.currentShow?.id === showId ? 
          { ...state.currentShow, status: response.data.status } : 
          state.currentShow,
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update show status',
        isLoading: false 
      });
      return false;
    }
  },

  // Get user's current location
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error)
      );
    });
  },

  // Clear current show
  clearCurrentShow: () => {
    set({ currentShow: null });
  },

  // Clear nearby show
  clearNearbyShow: () => {
    set({ nearbyShow: null });
  },

  // Clear errors
  clearError: () => set({ error: null })
}));

export default showStore; 