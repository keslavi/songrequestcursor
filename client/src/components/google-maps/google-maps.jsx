import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import config from '@/config';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  CircularProgress
} from '@mui/material';
import { 
  LocationOn, 
  Directions, 
  CalendarToday,
  AccessTime,
  MusicNote
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// console.log('GoogleMaps component imports loaded, Loader available:', !!Loader);

const GoogleMaps = ({ shows = [], center = { lat: 40.7128, lng: -74.0060 }, zoom = 8, autoFitBounds = true }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [google, setGoogle] = useState(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || config.GOOGLE_MAPS_API_KEY;

  // console.log('GoogleMaps component rendering with props:', { shows: shows.length, center, zoom });

  // Initialize Google Maps
  useEffect(() => {
    // console.log('GoogleMaps useEffect triggered');
    
    let mapInstance = null;
    
    const loadMap = async () => {
      try {
        // console.log('Loading Google Maps...');
  const apiKey = googleMapsApiKey;
         // console.log('Google Maps API Key available:', !!apiKey);
        
        if (!apiKey) {
          console.error('Google Maps API key not found');
          setMapError('Google Maps API key not configured');
          return;
        }

        setMapLoading(true);
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'marker']
        });
        
        const googleInstance = await loader.load();
        
        // console.log('Google Maps loaded successfully');
        setGoogle(googleInstance);
        
        if (mapRef.current && !map) { // Only create map if it doesn't exist
            // console.log('Map container found, creating map instance...');
          //   console.log('Container dimensions:', {
          //   width: mapRef.current.offsetWidth,
          //   height: mapRef.current.offsetHeight,
          //   style: mapRef.current.style
          // });
          
          mapInstance = new googleInstance.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            mapId: 'DEMO_MAP_ID', // Required for Advanced Markers
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });
          
          setMap(mapInstance);
          // console.log('Map instance created and set:', mapInstance);
          // console.log('Map center:', center);
          // console.log('Map zoom:', zoom);
          
          // Get user location if available
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userPos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setUserLocation(userPos);
                // console.log('User location set:', userPos);
                
                // Center map on user location if no shows nearby
                if (shows.length === 0) {
                  mapInstance.setCenter(userPos);
                  mapInstance.setZoom(8); // More zoomed out for better viewing
                    // console.log('Map centered on user location');
                }
              },
              (error) => {
                console.log('Geolocation error:', error);
              }
            );
          }
        } else if (map) {
          // console.log('Map already exists, skipping initialization');
        } else {
          console.error('Map container not found!');
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Failed to load Google Maps');
        toast.error('Failed to load map. Please check your internet connection.');
      } finally {
        setMapLoading(false);
      }
    };

    loadMap();

    // Cleanup function
    return () => {
      if (mapInstance) {
        // console.log('Cleaning up map instance');
        // The map will be automatically cleaned up when the container is removed
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, zoom]); // Remove map from dependencies to prevent re-initialization

  // Handle center and zoom changes
  useEffect(() => {
    if (map && center && zoom) {
      // console.log('Updating map center and zoom:', { center, zoom });
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  // Add markers when shows change
  useEffect(() => {
    // console.log('Markers effect triggered:', { map: !!map, google: !!google, showsCount: shows.length });
    
    if (!map || !google || !shows.length) {
      // console.log('Skipping markers - missing dependencies:', { map: !!map, google: !!google, showsCount: shows.length });
      return;
    }

    console.log('Creating markers for shows:', shows.length);

    // Clear existing markers
    markers.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      } else if (marker.map !== undefined) {
        marker.map = null;
      }
    });

    const newMarkers = shows.map((show, index) => {
      if (!show.venue?.location?.coordinates) {
        // console.log('Show missing coordinates:', show.name);
        return null;
      }

      const [lng, lat] = show.venue.location.coordinates;
      // console.log('Creating marker for show:', show.name, 'at coordinates:', [lat, lng]);
      
      try {
        // Try to use AdvancedMarkerElement first
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          // console.log('Using AdvancedMarkerElement for show:', show.name);
          // Create custom marker element
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <div style="
              width: 32px; 
              height: 32px; 
              background: #1976d2; 
              border: 2px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-weight: bold; 
              font-size: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${index + 1}
            </div>
          `;
          
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng },
            map: map,
            title: show.name || 'Show',
            content: markerElement
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
                  <button onclick="window.joinShow('${show._id || ''}')" 
                          style="background: #1976d2; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 6px;">
                    Join the show!
                  </button>
                  <button onclick="window.openMaps('${lat}', '${lng}', '${show.venue?.name || ''}')" 
                          style="background: transparent; color: #1976d2; border: 1px solid #1976d2; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
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

          // console.log('Advanced marker created for show:', show.name);
          return marker;
        } else {
          // Fallback to regular Marker
          // console.log('Using regular Marker for show:', show.name);
          
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
                  <button onclick="window.joinShow('${show._id || ''}')" 
                          style="background: #1976d2; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 6px;">
                    Join the show!
                  </button>
                  <button onclick="window.openMaps('${lat}', '${lng}', '${show.venue?.name || ''}')" 
                          style="background: transparent; color: #1976d2; border: 1px solid #1976d2; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
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

          // console.log('Regular marker created for show:', show.name);
          return marker;
        }
      } catch (error) {
        console.error('Error creating marker for show:', show.name, error);
        return null;
      }
    }).filter(Boolean);

    // console.log('Created markers:', newMarkers.length);
    setMarkers(newMarkers);

    // Fit bounds to show all markers (optional)
    if (autoFitBounds && newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        // For single marker, just center on it without changing zoom
        const marker = newMarkers[0];
        if (marker.position) {
          map.setCenter(marker.position);
        } else if (marker.getPosition) {
          map.setCenter(marker.getPosition());
        }
        // console.log('Single marker - centered map without changing zoom');
      } else {
        // For multiple markers, fit bounds but respect minimum zoom
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach(marker => {
          if (marker.position) {
            bounds.extend(marker.position);
          } else if (marker.getPosition) {
            bounds.extend(marker.getPosition());
          }
        });
        
        // Fit bounds but don't zoom in too much
        map.fitBounds(bounds);
        
        // Add a listener to ensure we don't zoom in too much
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom() > 12) {
            map.setZoom(12);
          }
        });
        
        // console.log('Multiple markers - fit bounds with zoom limit');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, google, shows, autoFitBounds]);

  // Global function for info window buttons
  useEffect(() => {
    window.openMaps = (lat, lng, venueName) => {
      const query = encodeURIComponent(venueName || `${lat},${lng}`);
      
      // Google Maps URLs
      const googleMapsWeb = `https://maps.google.com/maps?q=${query}`;
      const googleMapsApp = `comgooglemaps://?q=${query}`;
      
      // Try to open Google Maps app first, fallback to web
      const link = document.createElement('a');
      link.href = googleMapsApp;
      link.click();
      
      // Fallback to web after a short delay
      setTimeout(() => {
        window.open(googleMapsWeb, '_blank');
      }, 100);
    };

    window.joinShow = (showId) => {
      if (!showId) return;
      // Use full reload-safe navigation because InfoWindow HTML isn't React-controlled.
      window.location.href = `/shows/${showId}`;
    };

    return () => {
      delete window.openMaps;
      delete window.joinShow;
    };
  }, []);

  const openMaps = (lat, lng, venueName) => {
    const query = encodeURIComponent(venueName || `${lat},${lng}`);
    
    // Google Maps URLs
    const googleMapsWeb = `https://maps.google.com/maps?q=${query}`;
    const googleMapsApp = `comgooglemaps://?q=${query}`;
    
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
    <Box sx={{ width: '100%', height: { xs: '300px', sm: '400px' }, position: 'relative' }}>
      {/* Always render the map container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          border: '2px solid #1976d2',
          borderRadius: '4px',
          backgroundColor: '#f5f5f5', // Light gray background to see the container
          minHeight: '300px'
        }} 
      />
      
      {/* Show API key error as overlay */}
  {!googleMapsApiKey && (
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
            top: { xs: 8, sm: 16 }, 
            right: { xs: 8, sm: 16 },
            left: { xs: 8, sm: 'auto' },
            maxWidth: { xs: 'calc(100% - 16px)', sm: 350 },
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
                    color="primary"
                    startIcon={<MusicNote />}
                    onClick={() => {
                      navigate(`/shows/${selectedShow._id}`);
                    }}
                  >
                    Join the show!
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
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
};

export { GoogleMaps }; 

GoogleMaps.propTypes = {
  shows: PropTypes.array,
  center: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  zoom: PropTypes.number,
  autoFitBounds: PropTypes.bool,
};