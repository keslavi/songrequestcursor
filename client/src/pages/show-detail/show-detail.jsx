import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import { 
  CalendarToday,
  AccessTime,
  MusicNote,
  ListAlt
} from "@mui/icons-material";

//prettier-ignore
import {
  Col,
  Row,
  FormProvider,
  useFormProvider,
  Input,
  ShowHeader,
} from "components";

import dayjs from "dayjs";
import api from "@/store/api";
import { resolver } from "./validation";
import { store } from "@/store/store";

export const ShowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [performer, setPerformer] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const user = store.use.user();

  function normalizePhoneDigits(value) {
    return String(value || "").replace(/[^\d]/g, "");
  }

  function validatePhone(value) {
    const digits = normalizePhoneDigits(value);
    return digits.length >= 10 && digits.length <= 15;
  }

  const isAuthenticated = store.use.isAuthenticated();
  const guestPhoneNumber = store.use.guestPhoneNumber();
  const setGuestPhoneNumber = store.use.setGuestPhoneNumber();

  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [pendingSubmitValues, setPendingSubmitValues] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const hasAutoPromptedPhone = useRef(false);

  const defaultGuestPhone = useMemo(() => {
    return guestPhoneNumber || localStorage.getItem("lastPhoneNumber") || "";
  }, [guestPhoneNumber]);

  useEffect(() => {
    // Keep dialog input in sync with stored phone (when opening later)
    setPhoneInput(defaultGuestPhone);
  }, [defaultGuestPhone]);

  const isPhoneRequired = !isAuthenticated && !validatePhone(guestPhoneNumber);

  // If unauthenticated, prompt for phone on page entry (once)
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) return;
    if (hasAutoPromptedPhone.current) return;

    const digits = normalizePhoneDigits(guestPhoneNumber || defaultGuestPhone);
    if (!validatePhone(digits)) {
      hasAutoPromptedPhone.current = true;
      setPhoneDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, guestPhoneNumber, defaultGuestPhone]);

  // If phone is required, force dialog to stay open
  useEffect(() => {
    if (isPhoneRequired) setPhoneDialogOpen(true);
  }, [isPhoneRequired]);

  // Get max requests from show settings (default to 3)
  const maxSongsPerRequest = show?.settings?.maxRequestsPerUser || 3;

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver,
    defaultValues: {
      song: '',
      songNotInList: '',
      dedication: '',
      tipAmount: 5
    }
  });

  const { setValue, watch } = formMethods;
  const currentSong = watch('song');
  const currentSongNotInList = watch('songNotInList');
  
  // State for Spotify search
  const [spotifySongOptions, setSpotifySongOptions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const loadShowData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load show details
      const showResponse = await api.get(`/public/shows/${id}`);
      const showData = showResponse.data;
      setShow(showData);

      if (showData.performer && typeof showData.performer === 'object') {
        setPerformer(showData.performer);
      }

      const resolvePerformerId = (performerValue) => {
        if (!performerValue) {
          return null;
        }
        if (typeof performerValue === 'string') {
          return performerValue;
        }
        if (typeof performerValue === 'object') {
          return performerValue._id || performerValue.id || performerValue.value || null;
        }
        return null;
      };

      // Load performer details
      if (showData.performer) {
        try {
          const performerId = resolvePerformerId(showData.performer);
          if (performerId) {
            const performerResponse = await api.get(`/public/users/${performerId}`);
            const performerData = performerResponse.data;
            setPerformer(performerData);
          }
        } catch (error) {
          console.warn('Could not load performer details:', error);
        }
      }

      // Load songs for autocomplete
      if (showData.performer) {
        try {
          // Load songs for the whole show (deduped across performers)
          const songsResponse = await api.get(`/public/songs/show/${id}`);
          const songsData = songsResponse.data;
          
          // Sort songs alphabetically by song name
          const sortedSongs = songsData.sort((a, b) => {
            const nameA = (a.songname || '').toLowerCase();
            const nameB = (b.songname || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          
          setSongs(sortedSongs);
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
  }, [id]);

  useEffect(() => {
    loadShowData();
  }, [id, loadShowData]);
  
  // Set current user ID when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setCurrentUserId(user.id);
      console.log('🔐 Current user ID set:', user.id);
      console.log('🔐 User role:', user.role);
    } else {
      setCurrentUserId(null);
    }
  }, [isAuthenticated, user]);
  
  // Debug performer access
  useEffect(() => {
    if (currentUserId && show) {
      console.log('🎭 Checking performer access:');
      console.log('  Current user ID:', currentUserId);
      console.log('  Main performer:', show.performer);
      console.log('  Additional performers:', show.additionalPerformers);
      
      const isMainPerformer = currentUserId === (show.performer?._id || show.performer) || 
                              currentUserId.toString() === (show.performer?._id || show.performer)?.toString();
      console.log('  Is main performer?', isMainPerformer);
      
      const isAdditionalPerformer = show.additionalPerformers?.some(p => {
        const performerId = p._id || p;
        const match = currentUserId === performerId || currentUserId.toString() === performerId.toString();
        console.log(`  Checking additional performer ${performerId}:`, match);
        return match;
      });
      console.log('  Is additional performer?', isAdditionalPerformer);
    }
  }, [currentUserId, show]);

  const handleSongClick = (song) => {
    // Set song name when clicked from list, clear the other field
    setValue('song', song.songname);
    setValue('songNotInList', '');
  };

  const handleSongSelect = (selectedSong) => {
    if (selectedSong && selectedSong.key) {
      // Selected from autocomplete
      setValue('song', selectedSong.songname);
      setValue('songNotInList', '');
    }
  };

  // Spotify autocomplete search with debouncing
  const handleSpotifySearch = (searchTerm) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchTerm || searchTerm.length < 2) {
      setSpotifySongOptions([]);
      return;
    }

    // Debounce: wait 500ms after user stops typing
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/public/spotify/search?q=${encodeURIComponent(searchTerm)}`);
        const results = res.data || [];
        
        // Format for Input component (needs key + text)
        const options = results.map(item => ({
          key: item.spotifyId,
          text: item.displayText,
          songname: item.songname,
          artist: item.artist
        }));
        
        setSpotifySongOptions(options);
      } catch (error) {
        console.error('Spotify search error:', error);
        setSpotifySongOptions([]);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleSpotifySelect = (selectedSong) => {
    if (selectedSong && selectedSong.key) {
      // Selected from Spotify, clear the other field
      const displayText = selectedSong.artist 
        ? `${selectedSong.songname} - ${selectedSong.artist}`
        : selectedSong.songname;
      setValue('songNotInList', displayText);
      setValue('song', '');
    }
  };



  const submitRequest = async (values, phoneDigits) => {
    try {
      setSubmitting(true);

      // Validate that exactly one song field is provided
      const hasSong = values.song && values.song.trim();
      const hasSongNotInList = values.songNotInList && values.songNotInList.trim();
      
      if (!hasSong && !hasSongNotInList) {
        toast.error('Please select or enter a song');
        setSubmitting(false);
        return;
      }
      
      if (hasSong && hasSongNotInList) {
        toast.error('Please select only one song (either from list or not in list)');
        setSubmitting(false);
        return;
      }

      // Use whichever field has a value
      const songname = hasSong ? values.song.trim() : values.songNotInList.trim();
      
      // Format song for API - single song now
      const formattedSongs = [{
        songname: songname
      }];

      const requestData = {
        showId: id,
        songs: formattedSongs,
        dedication: values.dedication || '',
        tipAmount: parseInt(values.tipAmount),
        ...(phoneDigits ? { requesterPhone: phoneDigits } : {})
      };

      const response = await api.post(`/public/song-requests`, requestData);
      const result = response.data;
      
      // Open Venmo link
      if (result.venmoUrl) {
        window.open(result.venmoUrl, '_blank');
      }

      toast.success('Song request submitted successfully!');
      
      // Reset form
      setValue('song', '');
      setValue('songNotInList', '');
      setValue('dedication', '');
      setValue('tipAmount', 5);
      setSpotifySongOptions([]);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to submit song request');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (values) => {
    if (!isAuthenticated) {
      const digits = normalizePhoneDigits(guestPhoneNumber || phoneInput);
      if (!validatePhone(digits)) {
        setPendingSubmitValues(values);
        setPhoneDialogOpen(true);
        return;
      }
      await submitRequest(values, digits);
      return;
    }

    // Authenticated request: phone optional (server may still accept it)
    await submitRequest(values, null);
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
          <ShowHeader show={show} performer={performer} />
          
          {/* Show "Performer View Requests" button if user is the performer or an additional performer */}
          {currentUserId && show && (
            (currentUserId === (show.performer?._id || show.performer) || 
             currentUserId.toString() === (show.performer?._id || show.performer)?.toString() ||
             show.additionalPerformers?.some(p => {
               const performerId = p._id || p;
               return currentUserId === performerId || currentUserId.toString() === performerId.toString();
             })) && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ListAlt />}
                  onClick={() => navigate(`/shows/${id}/requests`)}
                  size="small"
                >
                  Performer View
                </Button>
              </Box>
            )
          )}
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
                Request a Song
              </Typography>

              <FormProvider 
                onSubmit={onSubmit}
                formMethods={formMethods}
              >
                <Row>
                  <Col size={12}>
                    <Input
                      name="song"
                      label="Song from Performer's List"
                      placeholder="Select from list below or type..."
                      options={songs}
                      allowFreeText={true}
                      onChange={(event, newValue) => handleSongSelect(newValue)}
                      disabled={!!currentSongNotInList}
                      size={12}
                    />
                    {currentSong && !songs.find(s => s.songname === currentSong) && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                        ⚠️ Custom song (not in performer's list)
                      </Typography>
                    )}
                  </Col>
                </Row>

                <Row>
                  <Col size={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 1 }}>
                      OR
                    </Typography>
                  </Col>
                </Row>

                <Row>
                  <Col size={12}>
                    <Input
                      name="songNotInList"
                      label="Song Not in List (Search Spotify)"
                      placeholder="Search for any song on Spotify..."
                      options={spotifySongOptions}
                      allowFreeText={true}
                      onChange={(event, newValue) => handleSpotifySelect(newValue)}
                      onInputChange={(event, value) => {
                        if (event && event.type === 'change') {
                          handleSpotifySearch(value);
                        }
                      }}
                      disabled={!!currentSong}
                      size={12}
                    />
                    {currentSongNotInList && (
                      <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
                        🎵 Song from Spotify (not in performer's list)
                      </Typography>
                    )}
                  </Col>
                </Row>

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
                      {submitting ? 'Submitting...' : 'Request Song'}
                    </Button>
                  </Col>
                </Row>

                <Row>
                  <Col size={12}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      Clicking &quot;Request Song&quot; will open Venmo to complete your payment
                    </Typography>
                  </Col>
                </Row>
              </FormProvider>

              {/* Song List */}
              {songs && songs.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Available Songs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click a song to add it to your request
                  </Typography>
                  <Box sx={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    {songs.map((song, index) => (
                      <Box
                        key={song._id || index}
                        onClick={() => handleSongClick(song)}
                        sx={{
                          p: 2,
                          borderBottom: index < songs.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          bgcolor: currentSong === song.songname ? 'primary.light' : 'transparent',
                          '&:hover': {
                            bgcolor: currentSong === song.songname ? 'primary.light' : 'action.hover'
                          }
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {song.songname}
                        </Typography>
                        {song.artist && (
                          <Typography variant="body2" color="text.secondary">
                            {song.artist}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Col>
      </Row>

      <Dialog
        open={phoneDialogOpen}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={isPhoneRequired}
        onClose={(_event, reason) => {
          if (isPhoneRequired) return;
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setPhoneDialogOpen(false);
        }}
      >
        <DialogTitle>Enter your phone number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We’ll use this to track your request and Venmo. No login required.
          </Typography>
          <TextField
            label="Phone number"
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            autoFocus
            fullWidth
            inputProps={{ inputMode: "tel", autoComplete: "tel", enterKeyHint: "done" }}
            error={phoneInput.length > 0 && !validatePhone(phoneInput)}
            helperText={
              phoneInput.length === 0
                ? "Required to continue"
                : (validatePhone(phoneInput) ? " " : "Enter a valid phone number")
            }
          />
        </DialogContent>
        <DialogActions>
          {!!navigator?.contacts?.select && (
            <Button
              type="button"
              variant="outlined"
              disabled={submitting}
              onClick={async () => {
                try {
                  // Contact Picker API (Chrome Android, etc). Best-effort.
                  const contacts = await navigator.contacts.select(['tel'], { multiple: false });
                  const tel = contacts?.[0]?.tel?.[0];
                  if (tel) setPhoneInput(tel);
                } catch (e) {
                  // User canceled or unsupported – ignore
                }
              }}
            >
              Use phone number
            </Button>
          )}
          <Button
            variant="contained"
            onClick={async () => {
              const digits = normalizePhoneDigits(phoneInput);
              if (!validatePhone(digits)) {
                toast.error("Please enter a valid phone number");
                return;
              }
              setGuestPhoneNumber(digits);
              setPhoneDialogOpen(false);

              if (pendingSubmitValues) {
                const values = pendingSubmitValues;
                setPendingSubmitValues(null);
                await submitRequest(values, digits);
              }
            }}
            disabled={submitting}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShowDetail; 