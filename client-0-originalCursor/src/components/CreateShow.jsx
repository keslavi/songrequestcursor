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
  CircularProgress,
  Chip
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Controller } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const CreateShow = () => {
  const navigate = useNavigate();
  const [availableUsers, setAvailableUsers] = useState([]);
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
      phone: '',
      mapUrl: '',
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
    participants: [],
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
        setValue('venue.mapUrl', mapsLink); // Store the original maps URL
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

  // Fetch available users (both managers and performers)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const [managersRes, performersRes] = await Promise.all([
          axios.get('/api/users/role/manager'),
          axios.get('/api/users/role/performer')
        ]);
        
        // Combine and deduplicate users
        const allUsers = [...managersRes.data, ...performersRes.data];
        const uniqueUsers = Array.from(new Map(allUsers.map(user => [user._id, user])).values());
        setAvailableUsers(uniqueUsers);
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
        participants: data.participants.map(p => ({
          user: p.user._id,
          role: p.role
        }))
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
            {...register('venue.phone')}
            margin="dense"
            fullWidth
            label="Venue Phone"
            error={!!errors.venue?.phone}
            helperText={errors.venue?.phone?.message}
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
            name="participants"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <Autocomplete
                multiple
                loading={loadingUsers}
                options={availableUsers}
                getOptionLabel={(option) => `${option.profile.name} (${option.role})`}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                onChange={(_, newValue) => {
                  // Convert selected users to participants with roles
                  const participants = newValue.map(user => ({
                    user: {
                      _id: user._id,
                      profile: {
                        name: user.profile.name
                      }
                    },
                    role: user.role
                  }));
                  field.onChange(participants);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Performers/Managers"
                    error={!!errors.participants}
                    helperText={errors.participants?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      label={`${option.user.profile.name} (${option.role})`}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            )}
          />
        </Grid>

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