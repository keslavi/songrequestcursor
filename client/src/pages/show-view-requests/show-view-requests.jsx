import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  IconButton
} from "@mui/material";
import { MusicNote, AccessTime, People, Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import api from "@/store/api";
import config from "@/config";
import { Row, Col, ShowHeader, TextareaDebug, PriorityRequestCard } from "components";
import { store } from "@/store/store";

const STATUS_PRIORITY = {
  playing: 0,
  add_to_request: 1,
  alternate: 2,
  pending: 3,
  queued: 4,
  declined: 5,
  played: 6
};

const STATUS_COLOR_MAP = {
  playing: "success",
  add_to_request: "warning",
  alternate: "info",
  pending: "warning",
  queued: "info",
  declined: "error",
  played: "default"
};

const formatStatusLabel = (status) => {
  if (!status) {
    return "Pending";
  }
  if (status === 'add_to_request') {
    return 'Add to this request';
  }
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PLAYING_BG_COLOR = "#e3f2fd";
export const ShowViewRequests = () => {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [performer, setPerformer] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [songDetails, setSongDetails] = useState({});
  const songDetailsRef = useRef({});
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [addMeModalOpen, setAddMeModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [addMeAmount, setAddMeAmount] = useState(5);
  const [addMeDedication, setAddMeDedication] = useState('');
  const [isSubmittingAddMe, setIsSubmittingAddMe] = useState(false);

  useEffect(() => {
    songDetailsRef.current = songDetails;
  }, [songDetails]);

  const loadSongDetails = useCallback(async (requestsList = []) => {
    const idsToFetch = new Set();

    requestsList.forEach((request) => {
      (request.songs || []).forEach((song) => {
        if (song.songId && !songDetailsRef.current[song.songId]) {
          idsToFetch.add(song.songId);
        }
      });
    });

    if (idsToFetch.size === 0) {
      return;
    }

    try {
      const songResponses = await Promise.all(
        Array.from(idsToFetch).map(async (songId) => {
          try {
            const response = await api.get(`/public/songs/${songId}`);
            return { songId, data: response.data };
          } catch (error) {
            console.error('Error fetching song details:', error);
            return null;
          }
        })
      );

      const validResponses = songResponses.filter(Boolean);
      if (!validResponses.length) {
        return;
      }

      setSongDetails((prev) => {
        const next = { ...prev };
        validResponses.forEach(({ songId, data }) => {
          next[songId] = data;
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to load song details:', error);
    }
  }, []);

  const getPrimarySong = (group) => group?.requests?.[0]?.songs?.[0] || null;

  const getLyricsLink = (group) => {
    const primarySong = getPrimarySong(group);
    if (!primarySong?.songId) {
      return null;
    }
    const details = songDetails[primarySong.songId];
    if (!details) {
      return null;
    }
    return details.link1 || details.link2 || null;
  };

  const getPhoneDigits = () => {
    const state = typeof store.getState === 'function' ? store.getState() : null;
    const storedPhone = state?.guestPhoneNumber;
    const fallbackPhone = typeof window !== 'undefined' ? window.localStorage?.getItem('lastPhoneNumber') : null;
    return String(storedPhone || fallbackPhone || '').replace(/[^\d]/g, '');
  };

  const openAddMeModal = (group) => {
    if (!group) return;
    setSelectedGroup(group);
    const defaultTip = group.requests?.[0]?.tipAmount || 5;
    setAddMeAmount(defaultTip);
    setAddMeDedication('');
    setAddMeModalOpen(true);
  };

  const closeAddMeModal = () => {
    setAddMeModalOpen(false);
    setSelectedGroup(null);
    setAddMeAmount(5);
    setAddMeDedication('');
    setIsSubmittingAddMe(false);
  };

  const handleAddMeSubmit = async () => {
    if (!selectedGroup) {
      toast.error('Unable to locate request details');
      return;
    }

    const primaryRequest = selectedGroup.requests?.[0];
    if (!primaryRequest) {
      toast.error('Unable to locate request details');
      return;
    }

    const parsedAmount = Number(addMeAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 100) {
      toast.error('Tip amount must be between 1 and 100');
      return;
    }

    const phoneDigits = getPhoneDigits();
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15) {
      toast.error('Please add your phone number in the Request a Song tab first.');
      return;
    }

    const songsPayload = (primaryRequest.songs || []).map((song) => {
      const payload = {};
      if (song.songId) payload.songId = song.songId;
      if (!song.songId) payload.songname = song.songname || selectedGroup.songName;
      if (song.artist) payload.artist = song.artist;
      if (song.key) payload.key = song.key;
      if (song.isCustom) payload.isCustom = song.isCustom;
      return payload;
    });

    if (!songsPayload.length) {
      songsPayload.push({ songname: selectedGroup.songName });
    }

    setIsSubmittingAddMe(true);
    try {
      const payload = {
        showId: id,
        songs: songsPayload,
        dedication: addMeDedication || '',
        tipAmount: Math.round(parsedAmount),
        requesterPhone: phoneDigits,
      };

      const response = await api.post('/public/song-requests', payload);
      const result = response.data;

      if (result?.venmoUrl) {
        window.open(result.venmoUrl, '_blank');
      }

      if (result?.id) {
        setRequests((prev) => {
          const exists = Array.isArray(prev) && prev.some((req) => req.id === result.id);
          if (exists) {
            return prev.map((req) => (req.id === result.id ? { ...req, ...result } : req));
          }
          return [result, ...(Array.isArray(prev) ? prev : [])];
        });
      }

      toast.success('Request added!');
      closeAddMeModal();
    } catch (error) {
      console.error('Error adding request:', error);
      toast.error(error.response?.data?.error || 'Failed to add request');
      setIsSubmittingAddMe(false);
    }
  };

  useEffect(() => {
    if (requests.length) {
      loadSongDetails(requests);
    }
  }, [requests, loadSongDetails]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch show details
        const showResponse = await api.get(`/public/shows/${id}`);
        const showData = showResponse.data;
        setShow(showData);

        // Load performer details
        if (showData.performer) {
          try {
            const performerResponse = await api.get(`/public/users/${showData.performer}`);
            setPerformer(performerResponse.data);
          } catch (error) {
            console.warn('Could not load performer details:', error);
          }
        }

        // Fetch requests for this show
  const requestsResponse = await api.get(`/public/song-requests/show/${id}`);
  const requestsData = requestsResponse.data;
  setRequests(requestsData);
  loadSongDetails(requestsData);
        
      } catch (error) {
        console.error('Error fetching show requests:', error);
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, loadSongDetails]);

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let isMounted = true;

    const cleanupEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!isMounted) {
        return;
      }
      if (reconnectTimeoutRef.current) {
        return;
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, 5000);
    };

    const handlePayload = (event) => {
      try {
        const payload = JSON.parse(event.data || '{}');
        if (Array.isArray(payload.requests)) {
          setRequests(payload.requests);
        }
      } catch (error) {
        console.error('Failed to parse song request SSE payload:', error);
      }
    };

    const connect = () => {
      cleanupEventSource();

      if (!isMounted) {
        return;
      }

      try {
        const eventSource = new EventSource(`${config.api}/public/song-requests/show/${id}/events`);
        eventSourceRef.current = eventSource;
        eventSource.addEventListener('bootstrap', handlePayload);
        eventSource.addEventListener('requests', handlePayload);
        eventSource.onerror = (error) => {
          console.warn('Song request SSE error (guest view), retrying…', error);
          cleanupEventSource();
          scheduleReconnect();
        };
      } catch (error) {
        console.error('Failed to establish SSE connection (guest view):', error);
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      isMounted = false;
      cleanupEventSource();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [id]);

  // Group requests by song name and aggregate data
  const groupedRequests = useMemo(() => {
    if (!requests.length) return [];

    const groups = {};
    
    requests.forEach(request => {
      // Get the song name (first song in the array)
      const songName = request.songs?.[0]?.songname || 'Unknown Song';
      const requestStatus = request.status || 'pending';
      const requestPriority = STATUS_PRIORITY[requestStatus] ?? Number.POSITIVE_INFINITY;
      
      if (!groups[songName]) {
        groups[songName] = {
          songName,
          requests: [],
          totalTip: 0,
          count: 0,
          earliestTime: request.createdAt,
          status: requestStatus,
          statusPriority: requestPriority
        };
      }
      
      groups[songName].requests.push(request);
      groups[songName].totalTip += request.tipAmount || 0;
      groups[songName].count += 1;
      
      // Track earliest request time
      if (new Date(request.createdAt) < new Date(groups[songName].earliestTime)) {
        groups[songName].earliestTime = request.createdAt;
      }

      if (requestPriority < (groups[songName].statusPriority ?? Number.POSITIVE_INFINITY)) {
        groups[songName].statusPriority = requestPriority;
        groups[songName].status = requestStatus;
      }
    });

    // Convert to array and sort by total tip (descending), then by time (ascending)
    return Object.values(groups).sort((a, b) => {
      const statusDifference = (a.statusPriority ?? Number.POSITIVE_INFINITY) - (b.statusPriority ?? Number.POSITIVE_INFINITY);
      if (statusDifference !== 0) {
        return statusDifference;
      }
      if (b.totalTip !== a.totalTip) {
        return b.totalTip - a.totalTip;
      }
      return new Date(a.earliestTime) - new Date(b.earliestTime);
    });
  }, [requests]);

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
        </Col>
      </Row>

      <Row>
        <Col size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Song Requests
              </Typography>
          {/* <TextareaDebug value={{ show, performer, requests, groupedRequests, songDetails }} /> */}
              
              {requests.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No requests yet. Be the first to request a song!
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {groupedRequests.length} unique {groupedRequests.length === 1 ? 'song' : 'songs'} requested
                    {' • '}
                    {requests.length} total {requests.length === 1 ? 'request' : 'requests'}
                    {' • '}
                    ${requests.reduce((sum, r) => sum + (r.tipAmount || 0), 0)} in tips
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {groupedRequests.map((group, index) => {
                      const isAddToRequest = group.status === 'add_to_request';
                      if (isAddToRequest) {
                        return (
                          <PriorityRequestCard
                            key={`priority-${index}`}
                            group={group}
                            onAdd={() => openAddMeModal(group)}
                            helperText="Performer alert: Prioritize this song?"
                            showActionButton={false}
                          />
                        );
                      }

                      const isPlaying = group.status === 'playing';
                      const isPlayed = group.status === 'played';
                      const isPending = group.status === 'pending';
                      const lyricsUrl = isPlaying ? getLyricsLink(group) : null;
                      const requestCountLabel = `${group.count} ${group.count === 1 ? 'request' : 'requests'}`;

                      return (
                        <Card
                          key={`request-${index}`}
                          variant="outlined"
                          sx={{
                            transition: 'box-shadow 0.2s, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, opacity 0.2s ease-in-out',
                            bgcolor: isPlaying
                              ? PLAYING_BG_COLOR
                              : isPlayed
                                ? 'action.hover'
                                : 'background.paper',
                            borderColor: isPlaying ? 'primary.light' : 'divider',
                            opacity: isPlayed ? 0.7 : 1,
                            '&:hover': {
                              boxShadow: isPlayed ? 1 : 2,
                              bgcolor: isPlayed ? 'action.selected' : undefined
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  icon={<MusicNote />}
                                  label={group.totalTip}
                                  color={isPlayed ? 'default' : 'success'}
                                  size="small"
                                />
                                <Chip
                                  icon={<People />}
                                  label={isPending ? `${requestCountLabel}. add me!` : requestCountLabel}
                                  color={isPlayed ? 'default' : 'primary'}
                                  size="small"
                                  clickable={isPending}
                                  onClick={() => isPending && openAddMeModal(group)}
                                  sx={{ fontWeight: isPending ? 600 : undefined, textTransform: isPending ? 'none' : undefined }}
                                />
                                  {!isPending && (
                                    <Chip
                                      label={formatStatusLabel(group.status)}
                                      color={STATUS_COLOR_MAP[group.status] || 'default'}
                                      size="small"
                                      sx={{ fontWeight: isPlaying ? 600 : undefined }}
                                    />
                                  )}
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <AccessTime sx={{ fontSize: 14 }} />
                                <Typography variant="caption">
                                  {dayjs(group.earliestTime).format('h:mm A')}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography
                              variant="h6"
                              sx={{
                                mb: lyricsUrl ? 0.5 : 1,
                                color: isPlayed ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {group.songName}
                            </Typography>
                            {lyricsUrl && (
                              <Typography
                                component="a"
                                href={lyricsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                color="primary"
                                sx={{ display: 'inline-block', mb: 1 }}
                              >
                                View Lyrics
                              </Typography>
                            )}

                            {group.requests.some(req => req.dedication) && (
                              <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.light' }}>
                                {group.requests.filter(req => req.dedication).map((req, idx) => (
                                  <Typography
                                    key={idx}
                                    variant="body2"
                                    color={isPlayed ? 'text.disabled' : 'text.secondary'}
                                    sx={{ mb: 0.5 }}
                                  >
                                    "{req.dedication}"
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Col>
      </Row>

      <Dialog
        open={addMeModalOpen}
        onClose={isSubmittingAddMe ? undefined : closeAddMeModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6">I want to hear this sooner!</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={closeAddMeModal}
            aria-label="close"
            size="small"
            disabled={isSubmittingAddMe}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedGroup.songName}
                </Typography>
              </Box>
              <TextField
                label="Tip Amount"
                type="number"
                value={addMeAmount}
                onChange={(event) => setAddMeAmount(event.target.value)}
                inputProps={{ min: 1, max: 100 }}
                disabled={isSubmittingAddMe}
                fullWidth
              />
              <TextField
                label="Dedication (optional)"
                multiline
                minRows={2}
                value={addMeDedication}
                onChange={(event) => setAddMeDedication(event.target.value)}
                disabled={isSubmittingAddMe}
                fullWidth
              />
              {(() => {
                const digits = getPhoneDigits();
                if (!digits || digits.length < 4) {
                  return (
                    <Typography variant="caption" color="error.main">
                      Add your phone number from the Request a Song tab before using Add Me.
                    </Typography>
                  );
                }
                return (
                  <Typography variant="caption" color="text.secondary">
                    Using phone ending in {digits.slice(-4)} for this request.
                  </Typography>
                );
              })()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-start', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddMeSubmit}
            disabled={isSubmittingAddMe}
            startIcon={<People />}
            disableElevation
            sx={{
              borderRadius: '999px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'none',
              px: 2,
              py: 1,
              '& .MuiButton-startIcon': {
                color: 'inherit'
              }
            }}
          >
            {isSubmittingAddMe ? 'Submitting…' : 'Add My Request!'}
          </Button>
          <Button
            variant="text"
            onClick={closeAddMeModal}
            disabled={isSubmittingAddMe}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShowViewRequests;

