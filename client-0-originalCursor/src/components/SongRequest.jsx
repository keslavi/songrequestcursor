import { useFormValidation } from '../validations/useFormValidation';
import { requestSchema } from '../validations/schemas';
import { requestStore } from '../stores/request/store';
import { TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Controller } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const SongRequest = ({ showId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue
  } = useFormValidation(requestSchema, {
    songs: [{ songId: '', name: '', artist: '' }],
    requester: {
      name: '',
      email: '',
      venmoUsername: ''
    },
    tip: 0,
    notes: ''
  });

  const songs = watch('songs');

  const addSong = () => {
    if (songs.length < 3) {
      setValue('songs', [...songs, { songId: '', name: '', artist: '' }]);
    }
  };

  const removeSong = (index) => {
    if (songs.length > 1) {
      setValue('songs', songs.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data) => {
    const response = await requestStore.createRequest(showId, data);
    if (response?.venmoLink) {
      window.location.href = response.venmoLink;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        Song Requests (Max 3)
      </Typography>

      {songs.map((_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Controller
            name={`songs.${index}`}
            control={control}
            render={({ field }) => (
              <Box sx={{ flex: 1 }}>
                <TextField
                  {...register(`songs.${index}.songId`)}
                  margin="normal"
                  required
                  fullWidth
                  label="Song ID"
                  error={!!errors.songs?.[index]?.songId}
                  helperText={errors.songs?.[index]?.songId?.message}
                />
                <TextField
                  {...register(`songs.${index}.name`)}
                  margin="normal"
                  fullWidth
                  label="Song Name"
                  error={!!errors.songs?.[index]?.name}
                  helperText={errors.songs?.[index]?.name?.message}
                />
                <TextField
                  {...register(`songs.${index}.artist`)}
                  margin="normal"
                  fullWidth
                  label="Artist"
                  error={!!errors.songs?.[index]?.artist}
                  helperText={errors.songs?.[index]?.artist?.message}
                />
              </Box>
            )}
          />
          {songs.length > 1 && (
            <IconButton onClick={() => removeSong(index)} sx={{ mt: 2 }}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}

      {songs.length < 3 && (
        <Button
          startIcon={<AddIcon />}
          onClick={addSong}
          sx={{ mt: 1 }}
        >
          Add Song
        </Button>
      )}

      <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
        Your Information
      </Typography>

      <TextField
        {...register('requester.name')}
        margin="normal"
        required
        fullWidth
        label="Your Name"
        error={!!errors.requester?.name}
        helperText={errors.requester?.name?.message}
      />

      <TextField
        {...register('requester.email')}
        margin="normal"
        required
        fullWidth
        label="Email Address"
        type="email"
        error={!!errors.requester?.email}
        helperText={errors.requester?.email?.message}
      />

      <TextField
        {...register('requester.venmoUsername')}
        margin="normal"
        required
        fullWidth
        label="Venmo Username"
        placeholder="@username"
        error={!!errors.requester?.venmoUsername}
        helperText={errors.requester?.venmoUsername?.message}
      />

      <TextField
        {...register('tip')}
        margin="normal"
        required
        fullWidth
        label="Tip Amount"
        type="number"
        inputProps={{ min: 0, step: 0.01 }}
        error={!!errors.tip}
        helperText={errors.tip?.message}
      />

      <TextField
        {...register('notes')}
        margin="normal"
        fullWidth
        label="Notes (Optional)"
        multiline
        rows={3}
        error={!!errors.notes}
        helperText={errors.notes?.message}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </Box>
  );
};

export default SongRequest; 