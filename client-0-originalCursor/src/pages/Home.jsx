import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import { LocationOn, CalendarToday } from '@mui/icons-material';
import showsStore from '../stores/shows/store';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

const Home = () => {
  const [locationError, setLocationError] = useState(null);
  const { shows, isLoading, error, fetchNearbyShows, setCurrentLocation } = showsStore(
    (state) => ({
      shows: state.shows,
      isLoading: state.isLoading,
      error: state.error,
      fetchNearbyShows: state.fetchNearbyShows,
      setCurrentLocation: state.setCurrentLocation,
    })
  );

  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          await fetchNearbyShows(position.coords);
        },
        (error) => {
          setLocationError('Unable to retrieve your location');
          console.error('Geolocation error:', error);
        }
      );
    };

    getLocation();
  }, [fetchNearbyShows, setCurrentLocation]);

  if (locationError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {locationError}
        </Alert>
        <Typography variant="body1">
          Please enable location services to see shows in your area.
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Shows Near You
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {shows.map((show) => (
          <Grid item xs={12} sm={6} md={4} key={show._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {show.performer.profile.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {show.venue.name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {dayjs(show.dateTime).format('lll')}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {show.settings.requireTip && (
                    <Chip 
                      label={`Min. Tip: $${show.settings.suggestedTipAmount}`} 
                      size="small" 
                      color="primary" 
                    />
                  )}
                  <Chip 
                    label={`${show.stats.totalRequests} requests`} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth 
                  href={`/shows/${show._id}`}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {shows.length === 0 && !error && (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" align="center">
              No shows found in your area. Try expanding your search radius.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Home; 