import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Chip,
  Alert
} from "@mui/material";
import { MusicNote, AttachMoney, AccessTime, People } from "@mui/icons-material";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import api from "@/store/api";
import { Row, Col, ShowHeader, TextareaDebug } from "components";

const STATUS_PRIORITY = {
  playing: 0,
  alternate: 1,
  pending: 2,
  queued: 3,
  declined: 4,
  played: 5
};

const STATUS_COLOR_MAP = {
  playing: "success",
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
  return status.charAt(0).toUpperCase() + status.slice(1);
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
          <TextareaDebug value={{ show, performer, requests, groupedRequests, songDetails }} />
              
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
                      const lyricsUrl = group.status === 'playing' ? getLyricsLink(group) : null;
                      return (
                        <Card 
                        key={index}
                        variant="outlined"
                        sx={{ 
                          transition: 'box-shadow 0.2s, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                          bgcolor: group.status === 'playing' ? PLAYING_BG_COLOR : 'background.paper',
                          borderColor: group.status === 'playing' ? 'primary.light' : 'divider',
                          '&:hover': {
                            boxShadow: 2
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          {/* Row 1: Tip Amount | # of Requests | Time (right aligned) */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                icon={<AttachMoney />}
                                label={group.totalTip}
                                color="success"
                                size="small"
                              />
                              <Chip 
                                icon={<People />}
                                label={`${group.count} ${group.count === 1 ? 'request' : 'requests'}`}
                                color="primary"
                                size="small"
                              />
                              <Chip
                                label={formatStatusLabel(group.status)}
                                color={STATUS_COLOR_MAP[group.status] || 'default'}
                                size="small"
                                sx={{ fontWeight: group.status === 'playing' ? 600 : undefined }}
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                              <AccessTime sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {dayjs(group.earliestTime).format('h:mm A')}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Row 2: Song Name */}
                          <Typography variant="h6" sx={{ mb: lyricsUrl ? 0.5 : 1 }}>
                            {group.songName}
                          </Typography>
                          {group.status === 'playing' && lyricsUrl && (
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

                          {/* Dedications/Comments - Indented */}
                          {group.requests.some(req => req.dedication) && (
                            <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.light' }}>
                              {group.requests.filter(req => req.dedication).map((req, idx) => (
                                <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
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
    </>
  );
};

export default ShowViewRequests;

