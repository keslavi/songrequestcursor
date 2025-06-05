import { Client } from '@googlemaps/google-maps-services-js';
import config from '../config.js';

const client = new Client({});

// Extract coordinates and place name from Google Maps URL
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
    name: placeName,
    location: { lat, lng }
  };
};

// Get place details from Google Maps link
export const getPlaceDetailsFromLink = async (mapsLink) => {
  try {
    console.log('🔍 Processing Google Maps link:', mapsLink);
    
    // Extract basic info from URL
    const placeInfo = extractPlaceInfo(mapsLink);
    if (!placeInfo) {
      throw new Error('Could not extract place information from URL');
    }

    console.log('📍 Extracted place info:', placeInfo);

    // Search for places near the coordinates
    const searchResponse = await client.placesNearby({
      params: {
        key: config.googleMaps.apiKey,
        location: placeInfo.location,
        radius: 50, // Very small radius to get exact match
        keyword: placeInfo.name // Use the name from URL to ensure we get the right place
      }
    });

    if (!searchResponse.data.results?.length) {
      throw new Error('No places found at the specified location');
    }

    const placeId = searchResponse.data.results[0].place_id;
    console.log('🏢 Found place ID:', placeId);

    // Get detailed place information
    const detailsResponse = await client.placeDetails({
      params: {
        key: config.googleMaps.apiKey,
        place_id: placeId,
        fields: ['name', 'formatted_address', 'address_component', 'geometry', 'formatted_phone_number', 'website']
      }
    });

    const place = detailsResponse.data.result;
    console.log('📝 Retrieved place details:', place.name);

    // Extract address components
    const addressComponents = {};
    place.address_components?.forEach(component => {
      if (component.types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        addressComponents.street = component.long_name;
      }
      if (component.types.includes('locality')) {
        addressComponents.city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        addressComponents.state = component.short_name;
      }
      if (component.types.includes('postal_code')) {
        addressComponents.zip = component.long_name;
      }
    });

    // Format the street address
    const streetAddress = addressComponents.streetNumber && addressComponents.street
      ? `${addressComponents.streetNumber} ${addressComponents.street}`
      : place.formatted_address.split(',')[0];

    return {
      name: place.name,
      address: {
        street: streetAddress,
        city: addressComponents.city || '',
        state: addressComponents.state || '',
        zip: addressComponents.zip || ''
      },
      location: {
        coordinates: placeInfo.coordinates,
        mapsLink: mapsLink
      },
      phone: place.formatted_phone_number || '',
      website: place.website || ''
    };
  } catch (error) {
    console.error('❌ Google Maps processing error:', error);
    throw new Error(`Failed to process Google Maps link: ${error.message}`);
  }
}; 