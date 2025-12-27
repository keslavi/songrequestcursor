import api from "@/store/api";
import { toast } from "react-toastify";

export const nearbyShowsSlice = (set, get) => ({
  nearbyShows: [],
  userLocation: null,

  // Get user's current location
  getUserLocation: () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return Promise.reject('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          set({ userLocation: location });
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Try refreshing the page.';
              break;
            default:
              errorMessage = 'An unknown error occurred getting location.';
          }
          
          // Only log timeout errors, don't show toast
          if (error.code === error.TIMEOUT) {
            console.warn(errorMessage);
          } else {
            toast.error(errorMessage);
          }
          reject(error);
        },
        {
          enableHighAccuracy: false, // Faster, less accurate
          timeout: 15000, // 15 seconds
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Get shows within radius (default 100 miles = ~161 km)
  getNearbyShows: async (lat, lng, radius = 161) => {
    const url = `public/shows/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
    
    try {
      const res = await api.get(url);
      const shows = res.data;
      set({ nearbyShows: shows });
      return shows;
    } catch (e) {
      toast.error(`Failed to load nearby shows: ${e.message}`);
      return [];
    }
  },

  // Get nearby shows using current user location
  getNearbyShowsFromLocation: async (radius = 161) => {
    try {
      const location = await get().getUserLocation();
      if (location) {
        return await get().getNearbyShows(location.lat, location.lng, radius);
      }
      return [];
    } catch (error) {
      console.error('Error getting nearby shows from location:', error);
      return [];
    }
  },

  // Clear nearby shows
  clearNearbyShows: () => {
    set({ nearbyShows: [] });
  },

  // Set user location manually (for testing or user input)
  setUserLocation: (lat, lng) => {
    set({ userLocation: { lat, lng } });
  }
});

export default nearbyShowsSlice; 