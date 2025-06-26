import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider
} from "@mui/material";
import { 
  LocationOn, 
  CalendarToday,
  AccessTime,
  Person,
  MusicNote,
  AttachMoney
} from "@mui/icons-material";

//prettier-ignore
import {
  Col,
  Row,
  FormProvider,
  useFormProvider,
  Input,
} from "components";

import dayjs from "dayjs";
import api from "@/store/api";
import { resolver } from "./validation";

export const ShowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [performer, setPerformer] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver,
    defaultValues: {
      song1: '',
      song2: '',
      song3: '',
      dedication: '',
      tipAmount: 5
    }
  });

  const { watch, setValue } = formMethods;
  const tipAmount = watch('tipAmount');

  useEffect(() => {
    loadShowData();
  }, [id]);

  const loadShowData = async () => {
    try {
      setLoading(true);
      
      // Load show details
      const showResponse = await api.get(`/public/shows/${id}`);
      const showData = showResponse.data;
      setShow(showData);

      // Load performer details
      if (showData.performer) {
        try {
          const performerResponse = await api.get(`/public/users/${showData.performer}`);
          const performerData = performerResponse.data;
          setPerformer(performerData);
        } catch (error) {
          console.warn('Could not load performer details:', error);
        }
      }

      // Load songs for autocomplete
      if (showData.performer) {
        try {
          const songsResponse = await api.get(`/public/songs/performer/${showData.performer}`);
          const songsData = songsResponse.data;
          setSongs(songsData);
        } catch (error) {
          console.warn('Could not load songs:', error);
        }
      }
    } catch (error) {
      console.error('Error loading show data:', error);
      toast.error('Failed to load show details');
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelect = (selectedSong, fieldName) => {
    if (selectedSong && selectedSong.key) {
      // Selected from autocomplete
      setValue(fieldName, selectedSong.songname);
    }
  };

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);

      // Format songs for API
      const formattedSongs = [values.song1, values.song2, values.song3]
        .filter(song => song && song.trim())
        .map(songName => ({
          songname: songName.trim()
        }));

      const requestData = {
        showId: id,
        songs: formattedSongs,
        dedication: values.dedication || '',
        tipAmount: parseInt(values.tipAmount)
      };

      const response = await api.post(`/public/song-requests`, requestData);
      const result = response.data;
      
      // Open Venmo link
      if (result.venmoUrl) {
        window.open(result.venmoUrl, '_blank');
      }

      toast.success('Song request submitted successfully!');
      
      // Reset form
      setValue('song1', '');
      setValue('song2', '');
      setValue('song3', '');
      setValue('dedication', '');
      setValue('tipAmount', 5);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to submit song request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!show) {
    return (
      <Alert severity="error">
        Show not found
      </Alert>
    );
  }

  return (
    <>
      <Row>
        <Col size={12}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {show.name}
            </Typography>
            
            {performer && (
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Featuring {performer.profile?.firstName} {performer.profile?.lastName}
              </Typography>
            )}
          </Box>
        </Col>
      </Row>

      <Row>
        <Col size={6}>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
            {dayjs(show.dateFrom).format('MMM DD, YYYY')}
          </Typography>
        </Col>
        <Col size={6}>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTime sx={{ mr: 1, fontSize: 16 }} />
            {dayjs(show.dateFrom).format('h:mm A')}
          </Typography>
        </Col>
      </Row>

      <Row>
        <Col size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MusicNote sx={{ mr: 1, verticalAlign: 'middle' }} />
                Request Songs
              </Typography>

              <FormProvider 
                onSubmit={onSubmit}
                formMethods={formMethods}
              >
                <Row>
                  <Col size={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Request 3 upbeat, well known songs
                    </Typography>
                  </Col>
                </Row>

                {[1, 2, 3].map((num) => (
                  <Row key={num}>
                    <Col size={12}>
                      <Input
                        name={`song${num}`}
                        label={`Song ${num}`}
                        placeholder="Enter song name or search..."
                        options={songs}
                        allowFreeText={true}
                        onChange={(event, newValue) => handleSongSelect(newValue, `song${num}`)}
                        size={12}
                      />
                    </Col>
                  </Row>
                ))}

                <Row>
                  <Col size={12}>
                    <Input
                      name="dedication"
                      label="Dedication/Comments (optional)"
                      // placeholder="Who is this request for?"
                      size={12}
                    />
                  </Col>
                </Row>

                <Row>
                  <Col size={12}>
                    <Input
                      name="tipAmount"
                      label="Tip Amount"
                      type="number"
                      size={12}
                    />
                  </Col>
                </Row>

                <Row>
                  <Col size={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={submitting}
                      sx={{ mb: 2 }}
                    >
                      {submitting ? 'Submitting...' : 'Request Songs'}
                    </Button>
                  </Col>
                </Row>

                <Row>
                  <Col size={12}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      Clicking "Request Songs" will open Venmo to complete your payment
                    </Typography>
                  </Col>
                </Row>
              </FormProvider>
            </CardContent>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ShowDetail; 