import api from "@/store/api";
import { toast } from "react-toastify";

export const songSlice = (set, get) => {
  const buildSongMap = (songs = []) => {
    const map = {};
    songs.forEach((song) => {
      const id = song.id || song._id;
      if (id) {
        map[id] = song;
      }
    });
    return map;
  };

  const updateSongsState = (songs = []) => {
    set({
      songs,
      songsById: buildSongMap(songs),
    });
  };

  return {
    songs: [],
    songsById: {},
    song: {},

    songList: async () => {
      const url = "public/songs/my-songs";
      try {
        const res = await api.get(url);
        const songs = res.data;
        updateSongsState(songs);
      } catch (e) {
        toast.error(`Failed to load songs: ${e.message}`);
      }
    },

  songRetrieve: async (id) => {
    const url = `public/songs/${id}`;
    try {
      const res = await api.get(url);
      const song = res.data;
      set({ song }, undefined, url);
    } catch (e) {
      toast.error(`Failed to load song: ${e.message}`);
    }
  },

  songCreate: async (songData) => {
    const url = "public/songs";
    try {
      const res = await api.post(url, songData);
  set({ song }, undefined, `${url}Create`);
      
  // Add to songs list
  const currentSongs = get().songs || [];
  const updatedSongs = [song, ...currentSongs];
  updateSongsState(updatedSongs);
      
      return song;
    } catch (e) {
      toast.error(`Failed to create song: ${e.message}`);
      return null;
    }
  },

  songUpdate: async (id, songData) => {
    const url = `public/songs/${id}`;
    try {
      const res = await api.put(url, songData);
  const song = res.data;
  set({ song }, undefined, `${url}Update`);
      
  // Update in songs list
  const currentSongs = get().songs || [];
  const updatedSongs = currentSongs.map(s => (s.id === id || s._id === id) ? song : s);
  updateSongsState(updatedSongs);
      
      return song;
    } catch (e) {
      toast.error(`Failed to update song: ${e.message}`);
      return null;
    }
  },

  songDelete: async (id) => {
    const url = `public/songs/${id}`;
    try {
      await api.delete(url);
      set({ song: {} }, undefined, `${url}Delete`);
      
      // Remove from songs list
      const currentSongs = get().songs || [];
  const updatedSongs = currentSongs.filter(s => (s.id || s._id) !== id);
  updateSongsState(updatedSongs);
      
      return true;
    } catch (e) {
      toast.error(`Failed to delete song: ${e.message}`);
      return false;
    }
  },

    songClear: () => {
      set({ song: {} }, undefined, "songClear");
    },

    clearSongCollection: () => {
      updateSongsState([]);
    }
  };
};

export default songSlice;

