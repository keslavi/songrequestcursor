import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { performerStore } from '../stores/performer/store';

const SongManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { songList, isLoading, error, fetchSongList, addSong, updateSong } = performerStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    fetchSongList();
  }, [fetchSongList]);

  const handleAddSong = async (data) => {
    const success = await addSong(data);
    if (success) {
      setIsAddDialogOpen(false);
      reset();
    }
  };

  const handleEditSong = async (data) => {
    const success = await updateSong(selectedSong._id, data);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedSong(null);
      reset();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      try {
        await performerStore.importSongsFromCSV(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const SongForm = ({ onSubmit, initialData }) => (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Song Name"
            {...register('baseInfo.name', { required: 'Song name is required' })}
            error={!!errors.baseInfo?.name}
            helperText={errors.baseInfo?.name?.message}
            defaultValue={initialData?.baseInfo.name}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Artist"
            {...register('baseInfo.artist', { required: 'Artist is required' })}
            error={!!errors.baseInfo?.artist}
            helperText={errors.baseInfo?.artist?.message}
            defaultValue={initialData?.baseInfo.artist}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Genre"
            {...register('baseInfo.genre')}
            defaultValue={initialData?.baseInfo.genre}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Year"
            type="number"
            {...register('baseInfo.year', {
              min: { value: 1900, message: 'Year must be 1900 or later' },
              max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
            })}
            error={!!errors.baseInfo?.year}
            helperText={errors.baseInfo?.year?.message}
            defaultValue={initialData?.baseInfo.year}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Key"
            {...register('performerDetails.key')}
            defaultValue={initialData?.performerDetails.key}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="BPM"
            type="number"
            {...register('performerDetails.bpm')}
            defaultValue={initialData?.performerDetails.bpm}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            {...register('performerDetails.notes')}
            defaultValue={initialData?.performerDetails.notes}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            {...register('performerDetails.tags')}
            defaultValue={initialData?.performerDetails.tags?.join(', ')}
            helperText="Enter tags separated by commas (e.g., rock, 80s, upbeat)"
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="performerDetails.isActive"
            control={control}
            defaultValue={initialData?.performerDetails.isActive ?? true}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Song is active and available for requests"
              />
            )}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="button"
          onClick={() => {
            reset();
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
          }}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="primary">
          {initialData ? 'Update Song' : 'Add Song'}
        </Button>
      </Box>
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Song Catalog</Typography>
        <Box>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-upload"
            onChange={handleFileUpload}
          />
          <label htmlFor="csv-upload">
            <Button
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mr: 1 }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Import CSV'}
            </Button>
          </label>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Song
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Artist</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {songList.map((song) => (
              <TableRow key={song._id}>
                <TableCell>{song.baseInfo.name}</TableCell>
                <TableCell>{song.baseInfo.artist}</TableCell>
                <TableCell>{song.baseInfo.genre}</TableCell>
                <TableCell>{song.performerDetails.key}</TableCell>
                <TableCell>
                  {song.performerDetails.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <Chip
                    label={song.performerDetails.isActive ? 'Active' : 'Inactive'}
                    color={song.performerDetails.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedSong(song);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this song?')) {
                        performerStore.deleteSong(song._id);
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Song Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Song</DialogTitle>
        <DialogContent>
          <SongForm onSubmit={handleAddSong} />
        </DialogContent>
      </Dialog>

      {/* Edit Song Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Song</DialogTitle>
        <DialogContent>
          <SongForm onSubmit={handleEditSong} initialData={selectedSong} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SongManagement; 