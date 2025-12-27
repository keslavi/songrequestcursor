import api from "@/store/api";
import { toast } from "react-toastify";

export const showSlice = (set, get) => ({
  shows: [],
  show: {},

  showList: async () => {
    const url = "shows/user/me";
    try {
      const res = await api.get(url);
      const shows = res.data;
      set({ shows });
    } catch (e) {
      toast.error(`<>${url} <br/>${e.message}`);
    }
  },

  showRetrieve: async (id) => {
    const url = `shows/${id}/details`;
    try {
      const res = await api.get(url);
      const show = res.data;
      set({ show }, undefined, url);
    } catch (e) {
      toast.error(`<>${url} <br/>${e.message}`);
    }
  },

  showCreate: async (showData) => {
    const url = "shows";
    try {
      const res = await api.post(url, showData);
      const show = res.data;
      set({ show }, undefined, `${url}Create`);
      
      // Add to shows list
      const currentShows = get().shows || [];
      set({ shows: [show, ...currentShows] });
      
      return show;
    } catch (e) {
      const details = e.response?.data?.details;
      const detailText = Array.isArray(details)
        ? details.map((d) => `${d.field}: ${d.message}`).join('\n')
        : null;
      const msg = e.response?.data?.message || e.message || 'Create show failed';

      toast.error(detailText ? `${msg}\n${detailText}` : msg);
      return null;
    }
  },

  showUpdate: async (id, showData) => {
    const url = `shows/${id}`;
    try {
      const res = await api.patch(url, showData);
      const show = res.data;
      set({ show }, undefined, `${url}Update`);
      
      // Update in shows list
      const currentShows = get().shows || [];
      const updatedShows = currentShows.map(s => s._id === id ? show : s);
      set({ shows: updatedShows });
      
      return show;
    } catch (e) {
      toast.error(`<>${url} Update error<br/>${e.message}</>`);
      return null;
    }
  },

  showDelete: async (id) => {
    const url = `shows/${id}`;
    try {
      await api.delete(url);
      set({ show: {} }, undefined, `${url}Delete`);
      
      // Remove from shows list
      const currentShows = get().shows || [];
      const updatedShows = currentShows.filter(s => s._id !== id);
      set({ shows: updatedShows });
      
      return true;
    } catch (e) {
      toast.error(`<>${url} Delete error<br/>${e.message}</>`);
      return false;
    }
  },

  showClear: () => {
    set({ show: {} }, undefined, "showClear");
  },
});

export default showSlice; 