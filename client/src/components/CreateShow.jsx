import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormValidation } from '../validations/useFormValidation';
import { showSchema } from '../validations/schemas';
import { getPlaceDetailsFromLink } from '../utils/googleMaps';
import showsStore from '../stores/shows/store';
import { 
  TextField, 
  Button, 
  Box, 
  Grid,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  Divider,
  Typography,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Controller } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const CreateShow = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue
  } = useFormValidation(showSchema, {
    venue: {
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: ''
      },
      location: {
        coordinates: [0, 0],
        mapsLink: ''
      }
    },
    dateTime: dayjs(),
    duration: 180,
    managers: [],
    additionalPerformers: [],
    settings: {
      maxRequestsPerUser: 3,
      allowExplicitSongs: true
    }
  });

  // Watch the mapsLink field for changes
  const mapsLink = watch('venue.location.mapsLink');

  // Effect to handle mapsLink changes
  useEffect(() => {
    const updateVenueDetails = async () => {
      if (!mapsLink) return;
      
      setLoadingPlace(true);
      try {
        const placeDetails = await getPlaceDetailsFromLink(mapsLink);
        
        // Update form fields with place details
        setValue('venue.name', placeDetails.name);
        setValue('venue.address.street', placeDetails.address.street);
        setValue('venue.address.city', placeDetails.address.city);
        setValue('venue.address.state', placeDetails.address.state);
        setValue('venue.address.zip', placeDetails.address.zip);
        setValue('venue.location.coordinates', placeDetails.location.coordinates);
      } catch (error) {
        toast.error('Failed to get venue details from Google Maps link');
      } finally {
        setLoadingPlace(false);
      }
    };

    updateVenueDetails();
  }, [mapsLink, setValue]);

  // Fetch available managers and performers
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const [managersRes, performersRes] = await Promise.all([
          axios.get('/api/users/role/manager'),
          axios.get('/api/users/role/performer')
        ]);
        setManagers(managersRes.data);
        setPerformers(performersRes.data);
      } catch (err) {
        toast.error('Failed to load users');
      }
      setLoadingUsers(false);
    };

    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    try {
      const show = await showsStore.createShow({
        ...data,
        managers: data.managers.map(m => m._id),
        additionalPerformers: data.additionalPerformers.map(p => p._id)
      });
      if (show) {
        toast.success('Show created successfully!');
        navigate(`/shows/${show._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create show');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h6" gutterBottom>
        Venue Information
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            {...register('venue.location.mapsLink')}
            margin="dense"
            required
            fullWidth
            label="Google Maps Link"
            placeholder="Paste the venue's Google Maps share link here"
            error={!!errors.venue?.location?.mapsLink}
            helperText={errors.venue?.location?.mapsLink?.message || "Right-click the venue on Google Maps and select 'Share' to get the link"}
            InputProps={{
              endAdornment: loadingPlace && (
                <CircularProgress color="inherit" size={20} />
              )
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('venue.name')}
            margin="dense"
            required
            fullWidth
            label="Venue Name"
            error={!!errors.venue?.name}
            helperText={errors.venue?.name?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('venue.address.street')}
            margin="dense"
            required
            fullWidth
            label="Street Address"
            error={!!errors.venue?.address?.street}
            helperText={errors.venue?.address?.street?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            {...register('venue.address.city')}
            margin="dense"
            required
            fullWidth
            label="City"
            error={!!errors.venue?.address?.city}
            helperText={errors.venue?.address?.city?.message}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            {...register('venue.address.state')}
            margin="dense"
            required
            fullWidth
            label="State"
            error={!!errors.venue?.address?.state}
            helperText={errors.venue?.address?.state?.message}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            {...register('venue.address.zip')}
            margin="dense"
            required
            fullWidth
            label="ZIP Code"
            error={!!errors.venue?.address?.zip}
            helperText={errors.venue?.address?.zip?.message}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Show Details
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="dateTime"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                {...field}
                label="Show Date & Time"
                value={dayjs(field.value)}
                onChange={(newValue) => field.onChange(newValue)}
                slotProps={{
                  textField: {
                    margin: "dense",
                    required: true,
                    fullWidth: true,
                    error: !!errors.dateTime,
                    helperText: errors.dateTime?.message
                  }
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            {...register('duration')}
            margin="dense"
            required
            fullWidth
            type="number"
            label="Duration (minutes)"
            InputProps={{
              endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
            }}
            error={!!errors.duration}
            helperText={errors.duration?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="managers"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                multiple
                options={managers}
                getOptionLabel={(option) => option.profile.name}
                loading={loadingUsers}
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Managers"
                    margin="dense"
                    error={!!errors.managers}
                    helperText={errors.managers?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="additionalPerformers"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                multiple
                options={performers}
                getOptionLabel={(option) => option.profile.name}
                loading={loadingUsers}
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Additional Performers"
                    margin="dense"
                    error={!!errors.additionalPerformers}
                    helperText={errors.additionalPerformers?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Request Settings
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            {...register('settings.maxRequestsPerUser')}
            margin="dense"
            required
            fullWidth
            type="number"
            label="Max Requests per User"
            error={!!errors.settings?.maxRequestsPerUser}
            helperText={errors.settings?.maxRequestsPerUser?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Controller
                name="settings.allowExplicitSongs"
                control={control}
                render={({ field }) => (
                  <Switch
                    {...field}
                    checked={field.value}
                  />
                )}
              />
            }
            label="Allow Explicit Songs"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isSubmitting || loadingUsers}
        >
          Create Show
        </Button>
      </Box>
    </Box>
  );
};

export default CreateShow; 