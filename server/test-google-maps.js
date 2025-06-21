import { getPlaceDetailsFromLink } from './src/services/googleMaps.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGoogleMapsUrl() {
  const testUrl = 'https://maps.app.goo.gl/dMDmEKaDfHcTL5a69';
  
  console.log('🧪 Testing Google Maps URL:', testUrl);
  console.log('🔑 API Key configured:', !!process.env.GOOGLE_MAPS_API_KEY);
  
  try {
    const result = await getPlaceDetailsFromLink(testUrl);
    console.log('✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGoogleMapsUrl(); 