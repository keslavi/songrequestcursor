import { create } from 'zustand';
import axios from 'axios';

const performerStore = create((set, get) => ({
  performers: [],
  currentPerformer: null,
  songList: [],
  isLoading: false,
  error: null,

  // Fetch performer's songlist
  fetchSongList: async (performerId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/api/public/performers/${performerId}/songs`);
      set({ 
        songList: response.data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch songlist',
        isLoading: false 
      });
    }
  },

  // Add songs individually
  addSong: async (songData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/api/public/performers/songs', songData);
      set(state => ({ 
        songList: [...state.songList, response.data],
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

  // Bulk import songs from CSV
  importSongsFromCSV: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/public/performers/songs/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set(state => ({ 
        songList: [...state.songList, ...response.data],
        isLoading: false 
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to import songs',
        isLoading: false 
      });
      return false;
    }
  },

  // Update song details
  updateSong: async (songId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/api/performers/songs/${songId}`, updates);
      set(state => ({
        songList: state.songList.map(song => 
          song.id === songId ? response.data : song
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to update song',
        isLoading: false
      });
      return false;
    }
  },

  // Search songs by tags
  searchSongsByTags: async (tags) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/performers/songs/search', {
        params: { tags: tags.join(',') }
      });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Search failed',
        isLoading: false
      });
      return [];
    }
  },

  // Clear errors
  clearError: () => set({ error: null })
}));

export default performerStore; 