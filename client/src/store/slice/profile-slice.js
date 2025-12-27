import api from "@/store/api";
import { toast } from "react-toastify";

const EMPTY_PROFILE = {
  stageName: "",
  venmoHandle: "",
  venmoConfirmDigits: "",
  contactEmail: "",
  contactPhone: "",
  description: "",
  headshotUrl: "",
};

const normalizeString = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length ? trimmed : "";
};

const mapUserToProfile = (user = {}) => {
  const profile = user.profile || {};
  return {
    stageName: normalizeString(profile.stageName || profile.name || ""),
    venmoHandle: normalizeString(profile.venmoHandle || ""),
    venmoConfirmDigits: normalizeString(profile.venmoConfirmDigits || ""),
    contactEmail: normalizeString(profile.contactEmail || ""),
    contactPhone: normalizeString(profile.contactPhone || user.phoneNumber || ""),
    description: normalizeString(profile.description || profile.bio || ""),
    headshotUrl: normalizeString(profile.headshotUrl || profile.picture || ""),
  };
};

export const profileSlice = (set, get) => ({
  performerProfile: { ...EMPTY_PROFILE },
  profileLoading: false,

  profileRetrieve: async () => {
    const url = "profile";
    set({ profileLoading: true });
    try {
      const res = await api.get(url);
      const user = res.data;
      const performerProfile = mapUserToProfile(user);
      set({
        performerProfile,
        user,
        profileLoading: false,
      }, undefined, "profileRetrieve");
      return performerProfile;
    } catch (e) {
      set({ profileLoading: false });
      toast.error(`Failed to load profile: ${e.message}`);
      return null;
    }
  },

  profileUpsert: async (profilePayload) => {
    const url = "profile";
    try {
      const res = await api.put(url, profilePayload);
      const user = res.data;
      const performerProfile = mapUserToProfile(user);
      set({
        performerProfile,
        user,
      }, undefined, "profileUpsert");
      toast.success("Profile saved");
      return performerProfile;
    } catch (e) {
      toast.error(`Failed to save profile: ${e.message}`);
      return null;
    }
  },

  profileReset: () => {
    set({ performerProfile: { ...EMPTY_PROFILE } });
  }
});

export default profileSlice;
