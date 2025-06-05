import { create } from 'zustand';
import axios from 'axios';

const songsStore = create((set, get) => ({
  songs: [],
  recentSongs: [],
  searchResults: [],
  isLoading: false,
  error: null,

  // Fetch recent song requests
  fetchRecentSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/public/songs/recent');
      set({ 
        recentSongs: response.data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch recent songs',
        isLoading: false 
      });
    }
  },

  // Search songs
  searchSongs: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/api/public/songs/search?q=${encodeURIComponent(query)}`);
      set({ 
        searchResults: response.data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Search failed',
        isLoading: false 
      });
    }
  },

  // Add new song request
  addSong: async (songData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/public/songs', songData);
      const newSong = response.data;
      
      // Update both songs and recent songs lists
      set(state => ({ 
        songs: [newSong, ...state.songs],
        recentSongs: [newSong, ...state.recentSongs].slice(0, 10), // Keep only 10 recent songs
        isLoading: false 
      }));

      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to add song',
        isLoading: false 
      });
      return false;
    }
  },

  // Clear search results
  clearSearch: () => {
    set({ searchResults: [] });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default songsStore; 