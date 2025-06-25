import api from "@/store/api";
import { toast } from "react-toastify";

export const userSlice = (set, get) => ({
  performers: [],

  fetchPerformers: async () => {
    const url = "users/performers";
    try {
      const res = await api.get(url);
      const performers = res.data;
      set({ performers });
      return performers;
    } catch (e) {
      toast.error(`Failed to fetch performers: ${e.message}`);
      return [];
    }
  },

  clearPerformers: () => {
    set({ performers: [] });
  },
});

export default userSlice; 