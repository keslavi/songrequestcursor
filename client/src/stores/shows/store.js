import { create } from 'zustand';
import axios from 'axios';

const showsStore = create((set, get) => ({
  shows: [],
  isLoading: false,
  error: null,
  currentLocation: null,

  // Set current location
  setCurrentLocation: (location) => {
    set({ currentLocation: location });
  },

  // Fetch shows near a location
  fetchNearbyShows: async (coords, radius = 50) => { // radius in kilometers
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/public/shows/nearby', {
        params: {
          lat: coords.latitude,
          lng: coords.longitude,
          radius
        }
      });
      
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

  // Clear errors
  clearError: () => set({ error: null })
}));

export default showsStore; 