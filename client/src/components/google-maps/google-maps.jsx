import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  LocationOn, 
  Directions, 
  Phone, 
  CalendarToday,
  AccessTime,
  Person
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

console.log('GoogleMaps component imports loaded, Loader available:', !!Loader);

const GoogleMaps = ({ shows = [], center = { lat: 40.7128, lng: -74.0060 }, zoom = 10 }) => {
  try {
    console.log('GoogleMaps component rendering with props:', { shows: shows.length, center, zoom });
    
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [selectedShow, setSelectedShow] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState(null);

    // Initialize Google Maps
    useEffect(() => {
      console.log('GoogleMaps useEffect triggered');
      
      const initMap = async () => {
        console.log('initMap function called');
        
        // Wait a bit longer for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Ensure the DOM element exists
        if (!mapRef.current) {
          console.log('Map container still not ready, retrying...');
          // Try again after a short delay
          setTimeout(() => {
            if (mapRef.current) {
              console.log('Map container now ready, initializing...');
              initMap();
            } else {
              console.error('Map container never became ready');
              setMapError('Failed to initialize map container');
              setMapLoading(false);
            }
          }, 500);
          return;
        }

        console.log('Map container is ready, proceeding with initialization');

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        console.log('Google Maps API Key available:', !!apiKey);
        
        if (!apiKey) {
          console.error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
          setMapError('Google Maps API key not configured');
          setMapLoading(false);
          return;
        }

        setMapLoading(true);

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        try {
          console.log('Loading Google Maps...');
          const google = await loader.load();
          console.log('Google Maps loaded successfully');
          
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          setMap(mapInstance);
          console.log('Map instance created');

          // Get user location if available
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userPos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setUserLocation(userPos);
                
                // Center map on user location if no shows nearby
                if (shows.length === 0) {
                  mapInstance.setCenter(userPos);
                  mapInstance.setZoom(12);
                }
              },
              (error) => {
                console.log('Geolocation error:', error);
              }
            );
          }
        } catch (error) {
          console.error('Error loading Google Maps:', error);
          setMapError('Failed to load map. Please check your internet connection and API key.');
          toast.error('Failed to load map. Please check your internet connection.');
        } finally {
          setMapLoading(false);
        }
      };

      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initMap();
      }, 100);

      return () => clearTimeout(timer);
    }, [center, zoom]);

    // Add markers when shows change
    useEffect(() => {
      if (!map || !shows.length) return;

      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));

      const newMarkers = shows.map((show, index) => {
        if (!show.venue?.location?.coordinates) return null;

        const [lng, lat] = show.venue.location.coordinates;
        
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: show.name || 'Show',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#1976d2" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #1976d2;">${show.name || 'Show'}</h3>
              <p style="margin: 4px 0;"><strong>Venue:</strong> ${show.venue?.name || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${dayjs(show.dateFrom).format('MMM DD, YYYY')}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${dayjs(show.dateFrom).format('h:mm A')}</p>
              <p style="margin: 4px 0;"><strong>Performer:</strong> ${show.performers?.[0]?.profile?.name || 'N/A'}</p>
              <div style="margin-top: 8px;">
                <button onclick="window.openMaps('${lat}', '${lng}', '${show.venue?.name || ''}')" 
                        style="background: #1976d2; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 4px;">
                  Open Maps
                </button>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          setSelectedShow(show);
          infoWindow.open(map, marker);
        });

        return marker;
      }).filter(Boolean);

      setMarkers(newMarkers);

      // Fit bounds to show all markers
      if (newMarkers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
      }
    }, [map, shows]);

    // Global function for info window buttons
    useEffect(() => {
      window.openMaps = (lat, lng, venueName) => {
        const query = encodeURIComponent(venueName || `${lat},${lng}`);
        
        // Google Maps URLs
        const googleMapsWeb = `https://maps.google.com/maps?q=${query}`;
        const googleMapsApp = `comgooglemaps://?q=${query}`;
        
        // Apple Maps URL
        const appleMaps = `http://maps.apple.com/?q=${query}`;
        
        // Try to open Google Maps app first, fallback to web
        const link = document.createElement('a');
        link.href = googleMapsApp;
        link.click();
        
        // Fallback to web after a short delay
        setTimeout(() => {
          window.open(googleMapsWeb, '_blank');
        }, 100);
      };

      return () => {
        delete window.openMaps;
      };
    }, []);

    const openMaps = (lat, lng, venueName) => {
      const query = encodeURIComponent(venueName || `${lat},${lng}`);
      
      // Google Maps URLs
      const googleMapsWeb = `https://maps.google.com/maps?q=${query}`;
      const googleMapsApp = `comgooglemaps://?q=${query}`;
      
      // Apple Maps URL
      const appleMaps = `http://maps.apple.com/?q=${query}`;
      
      // Try to open Google Maps app first, fallback to web
      const link = document.createElement('a');
      link.href = googleMapsApp;
      link.click();
      
      // Fallback to web after a short delay
      setTimeout(() => {
        window.open(googleMapsWeb, '_blank');
      }, 100);
    };

    const openAppleMaps = (lat, lng, venueName) => {
      const query = encodeURIComponent(venueName || `${lat},${lng}`);
      const appleMaps = `http://maps.apple.com/?q=${query}`;
      window.open(appleMaps, '_blank');
    };

    const getDirections = (lat, lng) => {
      if (!userLocation) {
        toast.info('Please allow location access to get directions');
        return;
      }

      const origin = `${userLocation.lat},${userLocation.lng}`;
      const destination = `${lat},${lng}`;
      
      // Google Maps directions
      const googleDirections = `https://maps.google.com/maps/dir/${origin}/${destination}`;
      const googleDirectionsApp = `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`;
      
      // Apple Maps directions
      const appleDirections = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}`;
      
      // Try Google Maps app first
      const link = document.createElement('a');
      link.href = googleDirectionsApp;
      link.click();
      
      // Fallback to web
      setTimeout(() => {
        window.open(googleDirections, '_blank');
      }, 100);
    };

    return (
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* Always render the map container */}
        <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
        
        {/* Show API key error as overlay */}
        {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.95)',
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Google Maps API Key Required
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Please set VITE_GOOGLE_MAPS_API_KEY in your .env file
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Create a .env file in the client directory with:
            </Typography>
            <Box 
              component="code" 
              sx={{ 
                bgcolor: 'grey.200', 
                p: 1, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
            </Box>
          </Box>
        )}
        
        {/* Show map error as overlay */}
        {mapError && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.95)',
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="error">
              Map Loading Error
            </Typography>
            <Typography variant="body2" color="error" align="center">
              {mapError}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
              size="small"
            >
              Retry
            </Button>
          </Box>
        )}
        
        {/* Show loading as overlay */}
        {mapLoading && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.8)',
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              flexDirection: 'column',
              gap: 2
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading Google Maps...
            </Typography>
          </Box>
        )}
        
        {selectedShow && (
          <Card 
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              maxWidth: 350,
              zIndex: 1000,
              boxShadow: 3
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedShow.name || 'Show Details'}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, fontSize: 16 }} />
                  {selectedShow.performers?.[0]?.profile?.name || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                  {selectedShow.venue?.name || 'N/A'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                  {dayjs(selectedShow.dateFrom).format('MMM DD, YYYY')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTime sx={{ mr: 1, fontSize: 16 }} />
                  {dayjs(selectedShow.dateFrom).format('h:mm A')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedShow.venue?.location?.coordinates && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Directions />}
                      onClick={() => {
                        const [lng, lat] = selectedShow.venue.location.coordinates;
                        getDirections(lat, lng);
                      }}
                    >
                      Directions
                    </Button>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={() => {
                        const [lng, lat] = selectedShow.venue.location.coordinates;
                        openMaps(lat, lng, selectedShow.venue.name);
                      }}
                    >
                      Google Maps
                    </Button>
                    
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const [lng, lat] = selectedShow.venue.location.coordinates;
                        openAppleMaps(lat, lng, selectedShow.venue.name);
                      }}
                    >
                      Apple Maps
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  } catch (error) {
    console.error('Error in GoogleMaps component:', error);
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant="h6" color="error">
          Component Error
        </Typography>
        <Typography variant="body2" color="error" align="center">
          {error.message}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
          size="small"
        >
          Retry
        </Button>
      </Box>
    );
  }
};

export { GoogleMaps }; 