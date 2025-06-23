import { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from "@mui/material";
import { 
  LocationOn, 
  MyLocation, 
  Refresh, 
  CalendarToday,
  AccessTime,
  Person,
  Directions,
  Phone
} from "@mui/icons-material";
import { store } from "store";

//prettier-ignore
import {
  Col,
  Row,
  GoogleMaps,
} from "components";

import dayjs from "dayjs";

export const Home = () => {
  const nearbyShows = store.use.nearbyShows();
  const userLocation = store.use.userLocation();
  const isAuthenticated = store.use.isAuthenticated();

  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC

  useEffect(() => {
    // Load nearby shows on component mount
    loadNearbyShows();
  }, []);

  useEffect(() => {
    // Update map center when user location changes
    if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  const loadNearbyShows = async () => {
    try {
      await store.getState().getNearbyShowsFromLocation(161); // 100 miles = ~161 km
    } catch (error) {
      console.error('Error loading nearby shows:', error);
    }
  };

  const handleLocationPermission = async () => {
    try {
      await store.getState().getUserLocation();
      await loadNearbyShows();
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

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

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatDate = (dateTime) => {
    const now = dayjs();
    const showDate = dayjs(dateTime);
    const diffDays = showDate.diff(now, 'day');
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays < 7) {
      return showDate.format('dddd');
    } else {
      return showDate.format('MMM DD');
    }
  };

  return (
    <>
      <Row>
        <Col xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Upcoming Shows Near You
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh shows">
                <IconButton onClick={loadNearbyShows}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Use my location">
                <IconButton onClick={handleLocationPermission}>
                  <MyLocation />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Col>
      </Row>

      {!userLocation && (
        <Row>
          <Col xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Allow location access to see shows within 100 miles of your current location.
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleLocationPermission}
                sx={{ mt: 1 }}
              >
                Enable Location
              </Button>
            </Alert>
          </Col>
        </Row>
      )}

      {userLocation && (
        <Row>
          <Col xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing shows within 100 miles of your location
            </Typography>
          </Col>
        </Row>
      )}

      <Row>
        <Col xs={12} md={8}>
          <GoogleMaps 
            shows={nearbyShows} 
            center={mapCenter}
            zoom={10}
          />
        </Col>
        
        <Col xs={12} md={4}>
          <Box sx={{ height: '400px', overflowY: 'auto' }}>
            {isEmpty(nearbyShows) ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" align="center">
                    No upcoming shows found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    {userLocation 
                      ? "No shows scheduled within 100 miles of your location."
                      : "Enable location access to see nearby shows."
                    }
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              nearbyShows.map((show, index) => (
                <Card key={show._id || index} sx={{ mb: 2, cursor: 'pointer' }} 
                      onClick={() => navigate(`/shows/${show._id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                        {show.name || 'Show'}
                      </Typography>
                      <Chip 
                        label={formatDate(show.dateFrom)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Person sx={{ mr: 1, fontSize: 16 }} />
                        {show.performers?.[0]?.profile?.name || 'N/A'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                        {show.venue?.name || 'N/A'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                        {dayjs(show.dateFrom).format('MMM DD, YYYY')}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime sx={{ mr: 1, fontSize: 16 }} />
                        {dayjs(show.dateFrom).format('h:mm A')}
                      </Typography>
                    </Box>

                    {show.venue?.location?.coordinates && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Directions />}
                          onClick={(e) => {
                            e.stopPropagation();
                            const [lng, lat] = show.venue.location.coordinates;
                            getDirections(lat, lng);
                          }}
                        >
                          Directions
                        </Button>
                        
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LocationOn />}
                          onClick={(e) => {
                            e.stopPropagation();
                            const [lng, lat] = show.venue.location.coordinates;
                            openMaps(lat, lng, show.venue.name);
                          }}
                        >
                          Google Maps
                        </Button>
                        
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            const [lng, lat] = show.venue.location.coordinates;
                            openAppleMaps(lat, lng, show.venue.name);
                          }}
                        >
                          Apple Maps
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Col>
      </Row>

      {!isAuthenticated && (
        <Row>
          <Col xs={12}>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Join SongRequest
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create an account to request songs at shows, track your requests, and get notified about upcoming events.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={() => navigate('/signup')}>
                    Sign Up
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/login')}>
                    Log In
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default Home;
