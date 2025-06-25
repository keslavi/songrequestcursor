import { Client } from '@googlemaps/google-maps-services-js';
import config from '../config.js';
import axios from 'axios';

const client = new Client({});

// Resolve shortened Google Maps URL
const resolveShortUrl = async (shortUrl) => {
  try {
    console.log('🔗 Attempting to resolve shortened URL:', shortUrl);
    
    const response = await axios.get(shortUrl, {
      maxRedirects: 5,
      validateStatus: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const finalUrl = response.request.res.responseUrl || shortUrl;
    console.log('✅ Resolved URL:', finalUrl);
    return finalUrl;
  } catch (error) {
    console.error('❌ Error resolving shortened URL:', error.message);
    throw new Error(`Failed to resolve shortened URL: ${error.message}`);
  }
};

// Extract coordinates and place name from Google Maps URL
const extractPlaceInfo = (url) => {
  console.log('🔍 Extracting place info from URL:', url);
  
  // Extract coordinates
  const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!coordsMatch) {
    console.log('❌ No coordinates found in URL');
    return null;
  }

  const lat = parseFloat(coordsMatch[1]);
  const lng = parseFloat(coordsMatch[2]);
  
  // Extract place name
  const placeMatch = url.match(/place\/([^/@]+)/);
  const placeName = placeMatch ? 
    decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : 
    null;

  console.log('📍 Found coordinates:', lat, lng);
  console.log('📍 Found place name:', placeName);

  return {
    coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
    name: placeName,
    location: { lat, lng }
  };
};

// Get address details from coordinates using OpenStreetMap's Nominatim
const getAddressFromCoordinates = async (lat, lng) => {
  try {
    console.log('🌍 Getting address details for coordinates:', lat, lng);
    
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'SongRequest/1.0'
      }
    });

    const address = response.data.address;
    const addressDetails = {
      street: `${address.house_number || ''} ${address.road || ''}`.trim(),
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      zip: address.postcode || '',
    };
    
    console.log('📍 Address details:', addressDetails);
    return addressDetails;
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
};

// Get place details from Google Maps link
export const getPlaceDetailsFromLink = async (mapsLink) => {
  try {
    console.log('🔍 Processing Google Maps link:', mapsLink);
    
    // Clean up the URL - remove any duplicates
    const cleanUrl = mapsLink.split('https://')[1];
    const properUrl = cleanUrl ? `https://${cleanUrl}` : mapsLink;

    // If it's a shortened URL or Google Share link, resolve it first
    let resolvedUrl = properUrl;
    if (properUrl.includes('maps.app.goo.gl') || properUrl.includes('share.google')) {
      console.log('🔗 Detected shortened/Share URL, resolving...');
      try {
        resolvedUrl = await resolveShortUrl(properUrl);
      } catch (resolveError) {
        throw new Error('Could not resolve Google Maps link.');
      }
    }

    // Extract basic info from resolved URL
    const placeInfo = extractPlaceInfo(resolvedUrl);
    if (!placeInfo) {
      throw new Error('Could not extract place information from URL.');
    }

    console.log('📍 Extracted place info:', placeInfo);

    // Get address details from coordinates
    let addressDetails = null;
    try {
      addressDetails = await getAddressFromCoordinates(placeInfo.location.lat, placeInfo.location.lng);
    } catch (geoError) {
      // Log but do not crash
      console.error('❌ Geocoding error:', geoError);
    }
    console.log('📍 Address details:', addressDetails);

    return {
      name: placeInfo.name,
      address: addressDetails || {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      location: {
        coordinates: placeInfo.coordinates,
        mapsLink: mapsLink
      }
    };
  } catch (error) {
    // Only throw with a clear, user-friendly message
    throw new Error(error.message || 'Failed to process Google Maps link.');
  }
}; 