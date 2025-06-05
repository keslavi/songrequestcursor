import axios from 'axios';

// Function to resolve shortened Google Maps URL
const resolveShortUrl = async (shortUrl) => {
  try {
    console.log('Attempting to resolve URL:', shortUrl);
    const response = await axios.get('/api/utils/resolve-url', {
      params: { url: shortUrl }
    });
    console.log('Resolved URL:', response.data.resolvedUrl);
    return response.data.resolvedUrl;
  } catch (error) {
    console.error('Failed to resolve shortened URL:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to resolve shortened URL');
  }
};

// Function to extract coordinates and place name from Google Maps URL
const extractPlaceInfo = (url) => {
  // Extract coordinates
  const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!coordsMatch) return null;

  const lat = parseFloat(coordsMatch[1]);
  const lng = parseFloat(coordsMatch[2]);
  
  // Extract place name
  const placeMatch = url.match(/place\/([^/@]+)/);
  const placeName = placeMatch ? 
    decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : 
    null;

  return {
    coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
    name: placeName
  };
};

// Function to get place details from Google Maps link
export const getPlaceDetailsFromLink = async (mapsLink) => {
  try {
    // If it's a shortened URL, resolve it first
    const resolvedUrl = mapsLink.includes('maps.app.goo.gl') ? 
      await resolveShortUrl(mapsLink) : 
      mapsLink;

    // Get place details from server
    const response = await axios.get('/api/utils/place-details', {
      params: { url: resolvedUrl }
    });

    return response.data;
  } catch (error) {
    console.error('Google Maps processing error:', error);
    throw new Error(error.response?.data?.message || 'Failed to process Google Maps link');
  }
}; 