import { create } from 'zustand';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const requestStore = create((set, get) => ({
  requests: [],
  currentRequest: null,
  showQueue: [],
  isLoading: false,
  error: null,

  // Create a new song request
  createRequest: async (showId, requestData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`/api/public/shows/${showId}/requests`, requestData);
      
      // Generate Venmo deep link
      const venmoLink = `venmo://paycharge?txn=pay&recipients=${requestData.performerVenmo}&amount=${requestData.tip}&note=${encodeURIComponent(`Song Request: ${requestData.songs.map(s => s.name).join(', ')}`)}`;
      
      set(state => ({ 
        requests: [...state.requests, response.data],
        currentRequest: response.data,
        isLoading: false 
      }));

      // Return both the request data and Venmo link
      return {
        request: response.data,
        venmoLink
      };
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create request',
        isLoading: false 
      });
      return null;
    }
  },

  // Update request with Venmo receipt
  updateRequestPayment: async (requestId, venmoReceipt) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch(`/api/public/requests/${requestId}/payment`, {
        venmoReceipt
      });

      set(state => ({
        requests: state.requests.map(req => 
          req.id === requestId ? response.data : req
        ),
        currentRequest: state.currentRequest?.id === requestId ? 
          response.data : state.currentRequest,
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update payment',
        isLoading: false 
      });
      return false;
    }
  },

  // Fetch show's song queue
  fetchShowQueue: async (showId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/api/public/shows/${showId}/queue`);
      set({ 
        showQueue: response.data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch queue',
        isLoading: false 
      });
    }
  },

  // Update request status (for performers)
  updateRequestStatus: async (requestId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.patch(`/api/public/requests/${requestId}/status`, {
        status
      });

      // If cancelling, initiate Venmo refund
      if (status === 'cancelled' && response.data.venmoReceipt) {
        // Note: Implementation of Venmo refund would depend on Venmo's API capabilities
        await axios.post(`/api/public/requests/${requestId}/refund`);
      }

      set(state => ({
        showQueue: state.showQueue.map(req => 
          req.id === requestId ? response.data : req
        ),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update status',
        isLoading: false 
      });
      return false;
    }
  },

  // Sort queue by various criteria
  sortQueue: (criteria) => {
    set(state => {
      const sortedQueue = [...state.showQueue].sort((a, b) => {
        switch (criteria) {
          case 'time':
            return new Date(b.requestedAt) - new Date(a.requestedAt);
          case 'tip':
            return b.tip - a.tip;
          default:
            return 0;
        }
      });
      return { showQueue: sortedQueue };
    });
  },

  // Get time since request
  getTimeSinceRequest: (requestTime) => {
    return dayjs(requestTime).fromNow();
  },

  // Clear current request
  clearCurrentRequest: () => {
    set({ currentRequest: null });
  },

  // Clear queue
  clearQueue: () => {
    set({ showQueue: [] });
  },

  // Clear errors
  clearError: () => set({ error: null })
}));

export default requestStore; 