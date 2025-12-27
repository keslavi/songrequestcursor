import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Typography, CircularProgress, IconButton, Stack, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { CheckCircle, Cancel, AttachMoney, AccessTime, People, Close } from "@mui/icons-material";
import { toast } from "react-toastify";
import api from "@/store/api";
import { Row, Col, TextareaDebug } from "components";
import { store } from "@/store/store";

const STATUS_PRIORITY = {
  playing: 0,
  alternate: 1,
  pending: 2,
  queued: 3,
  accepted: 4,
  declined: 5,
  played: 6
};

const PLAYING_BG_COLOR = "#e3f2fd";

export const ShowRequests = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const user = store.use.user();
  const isAuthenticated = store.use.isAuthenticated();
  const [show, setShow] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allPerformers, setAllPerformers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tipsModalOpen, setTipsModalOpen] = useState(false);
  const [selectedTipsGroup, setSelectedTipsGroup] = useState(null);
  const performerSongs = store.use.songs();
  const songsById = store.use.songsById();

  // Set current user ID when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setCurrentUserId(user.id);
      console.log('🔐 Show Requests - Current user ID:', user.id);
      console.log('🔐 Show Requests - User role:', user.role);
    } else {
      setCurrentUserId(null);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch show details
        const showResponse = await api.get(`/public/shows/${showId}`);
        const showData = showResponse.data;
        setShow(showData);

        // Build list of all performers
        const performers = [];
        if (showData.performer) {
          performers.push({
            id: showData.performer._id || showData.performer,
            name: showData.performer.profile
              ? `${showData.performer.profile.firstName || ''} ${showData.performer.profile.lastName || ''}`.trim()
              : 'Performer'
          });
        }
        if (showData.additionalPerformers) {
          showData.additionalPerformers.forEach(p => {
            performers.push({
              id: p._id || p,
              name: p.profile
                ? `${p.profile.firstName || ''} ${p.profile.lastName || ''}`.trim()
                : 'Performer'
            });
          });
        }
        setAllPerformers(performers);

        // Fetch requests for this show
        const requestsResponse = await api.get(`/public/song-requests/show/${showId}`);

        // Sort by tip (descending), then by time (descending)
        const sortedRequests = requestsResponse.data.sort((a, b) => {
          if (b.tipAmount !== a.tipAmount) {
            return b.tipAmount - a.tipAmount;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching show requests:', error);
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showId]);

  useEffect(() => {
    const role = user?.role;
    const isPerformerRole = ['performer', 'admin', 'organizer'].includes(role);
    if (!isPerformerRole || !isAuthenticated) {
      return;
    }

    if (!performerSongs?.length) {
      const loadSongs = store.getState().songList;
      if (typeof loadSongs === "function") {
        loadSongs().catch(() => {});
      }
    }
  }, [performerSongs?.length, isAuthenticated, user?.role]);

  const findRequestById = (id) => requests.find((req) => req.id === id);

  const resolveSongKeyForRequest = (request) => {
    if (!request) return null;
    const primarySong = request.songs?.[0];
    if (!primarySong) return null;
    if (primarySong.key && primarySong.key.trim()) {
      return primarySong.key.trim();
    }
    if (primarySong.songId && songsById?.[primarySong.songId]?.key) {
      const key = songsById[primarySong.songId].key;
      return key ? key.trim() : null;
    }
    return null;
  };

  const handlePerformerAction = async (requestId, action) => {
    try {
      await api.patch(`/public/song-requests/${requestId}/performer-action`, {
        performerId: currentUserId,
        action: action
      });

      // Refresh requests
      const requestsResponse = await api.get(`/public/song-requests/show/${showId}`);
      const sortedRequests = requestsResponse.data.sort((a, b) => {
        if (b.tipAmount !== a.tipAmount) {
          return b.tipAmount - a.tipAmount;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setRequests(sortedRequests);

      toast.success(`Request ${action}ed`);
    } catch (error) {
      console.error('Error updating performer action:', error);
      toast.error(error.response?.data?.error || 'Failed to update request');
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      // If marking as "playing", first change all current "playing" items to "played"
      if (newStatus === 'playing') {
        const playingRequests = requests.filter(r => r.status === 'playing');
        for (const req of playingRequests) {
          await api.patch(`/public/song-requests/${req.id}/status`, {
            status: 'played'
          });
        }
      }

      const payload = { status: newStatus };

      if (newStatus === 'playing') {
        const requestForKey = findRequestById(requestId) || selectedRequest?.requests?.find(req => req.id === requestId);
        const songKey = resolveSongKeyForRequest(requestForKey);
        if (songKey) {
          payload.songKey = songKey;
        }
      }

      await api.patch(`/public/song-requests/${requestId}/status`, payload);

      // Refresh requests
      const requestsResponse = await api.get(`/public/song-requests/show/${showId}`);
      const sortedRequests = requestsResponse.data.sort((a, b) => {
        if (b.tipAmount !== a.tipAmount) {
          return b.tipAmount - a.tipAmount;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setRequests(sortedRequests);

      setStatusModalOpen(false);
      setSelectedRequest(null);
      toast.success(`Request marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    }
  };

  const openStatusModal = (group) => {
    setSelectedRequest(group);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedRequest(null);
  };

  const openTipsModal = (group) => {
    setSelectedTipsGroup(group);
    setTipsModalOpen(true);
  };

  const closeTipsModal = () => {
    setTipsModalOpen(false);
    setSelectedTipsGroup(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'playing': return 'success';
      case 'played': return 'default';
      case 'alternate': return 'info';
      case 'queued': return 'info';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  const getPerformerResponse = (request, performerId) => {
    if (!request.performerResponses) return null;
    const response = request.performerResponses.find(
      r => r.performer === performerId || r.performer?._id === performerId
    );
    return response?.response || null;
  };

  const getSongKey = (group) => {
    if (!group) {
      return null;
    }
    const requestWithSong = group.requests?.find(req => req.songs?.[0]);
    return resolveSongKeyForRequest(requestWithSong);
  };

  const getDisplaySongName = (group) => {
    if (!group) return '';
    const songKey = getSongKey(group);
    if (songKey) {
      return `${songKey} - ${group.songName}`;
    }
    return group.songName;
  };

  // Group requests by song name and separate active from played
  const { activeRequests, playedRequests } = useMemo(() => {
    if (!requests.length) return { activeRequests: [], playedRequests: [] };

    const groups = {};

    requests.forEach(request => {
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

      if (new Date(request.createdAt) < new Date(groups[songName].earliestTime)) {
        groups[songName].earliestTime = request.createdAt;
      }

      if (requestPriority < (groups[songName].statusPriority ?? Number.POSITIVE_INFINITY)) {
        groups[songName].statusPriority = requestPriority;
        groups[songName].status = requestStatus;
      }
    });

    const allGroups = Object.values(groups);
    
    // Separate active (not played/declined) from played
    const active = allGroups
      .filter(g => g.status !== 'played' && g.status !== 'declined')
      .sort((a, b) => {
        const statusDifference = (a.statusPriority ?? Number.POSITIVE_INFINITY) - (b.statusPriority ?? Number.POSITIVE_INFINITY);
        if (statusDifference !== 0) {
          return statusDifference;
        }
        if (b.totalTip !== a.totalTip) {
          return b.totalTip - a.totalTip;
        }
        return new Date(a.earliestTime) - new Date(b.earliestTime);
      });

    const played = allGroups
      .filter(g => g.status === 'played')
      .sort((a, b) => new Date(b.earliestTime) - new Date(a.earliestTime));

    return { activeRequests: active, playedRequests: played };
  }, [requests]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Row>
        <Col size={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4">
                Song Requests
              </Typography>
              {show && (
                <Typography variant="subtitle1" color="text.secondary">
                  {show.name} - {new Date(show.dateFrom).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>
        </Col>
      </Row>

      <Row>
        <Col size={12}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Active Requests */}
            {activeRequests.map((group, index) => {
              const songKey = getSongKey(group);
              return (
              <Card
                key={`active-${index}`}
                variant="outlined"
                sx={{
                  borderColor: group.status === 'playing' ? 'primary.light' : 'divider',
                  bgcolor: group.status === 'playing' ? PLAYING_BG_COLOR : 'background.paper',
                  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out'
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {/* Mobile Layout: Row 1 - Tip & Song Title */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip
                      icon={<AttachMoney />}
                      label={group.totalTip}
                      color="success"
                      size="medium"
                      onClick={() => openTipsModal(group)}
                      sx={{ fontWeight: 600, cursor: 'pointer' }}
                    />
                    <Box sx={{ flex: 1, ml: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="h6" sx={{ textAlign: 'left' }}>
                        {getDisplaySongName(group)}
                      </Typography>
                      {songKey && (
                        <Chip
                          label={`Key: ${songKey}`}
                          color="secondary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Mobile Layout: Row 2 - Request Count | Status | Your Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<People />}
                        label={`${group.count} ${group.count === 1 ? 'request' : 'requests'}`}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={group.status}
                        color={getStatusColor(group.status)}
                        size="small"
                        onClick={() => openStatusModal(group)}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      />
                    </Box>
                    
                    {/* Current User's Actions */}
                    {currentUserId && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          You:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {(() => {
                            const myResponse = getPerformerResponse(group.requests[0], currentUserId);
                            return (
                              <>
                                <IconButton
                                  size="small"
                                  color={myResponse === 'accept' ? 'success' : 'default'}
                                  onClick={() => handlePerformerAction(group.requests[0].id, 'accept')}
                                  sx={{
                                    border: 1,
                                    borderColor: myResponse === 'accept' ? 'success.main' : 'divider',
                                    bgcolor: myResponse === 'accept' ? 'success.light' : 'background.paper',
                                  }}
                                >
                                  <CheckCircle sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color={myResponse === 'pass' ? 'error' : 'default'}
                                  onClick={() => handlePerformerAction(group.requests[0].id, 'pass')}
                                  sx={{
                                    border: 1,
                                    borderColor: myResponse === 'pass' ? 'error.main' : 'divider',
                                    bgcolor: myResponse === 'pass' ? 'error.light' : 'background.paper',
                                  }}
                                >
                                  <Cancel sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Mobile Layout: Row 3 - Time (left) & Other Performers' Responses (right on same line) */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <AccessTime sx={{ fontSize: 14 }} />
                      <Typography variant="caption">
                        {new Date(group.earliestTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Typography>
                    </Box>

                    {/* Other Performers' Responses - Right side of same row */}
                    {group.requests[0].performerResponses?.filter(pr => {
                      const prPerformerId = pr.performer?._id || pr.performer;
                      return prPerformerId !== currentUserId && prPerformerId?.toString() !== currentUserId?.toString();
                    }).length > 0 && (
                      <Stack spacing={0.5} alignItems="flex-end">
                        {group.requests[0].performerResponses.filter(pr => {
                          const prPerformerId = pr.performer?._id || pr.performer;
                          return prPerformerId !== currentUserId && prPerformerId?.toString() !== currentUserId?.toString();
                        }).map((performerResponse, idx) => {
                          const performerName = performerResponse.performer?.profile 
                            ? `${performerResponse.performer.profile.firstName || ''} ${performerResponse.performer.profile.lastName || ''}`.trim()
                            : performerResponse.performer?.username || 'Performer';
                          
                          return (
                            <Box 
                              key={idx} 
                              sx={{ 
                                display: 'flex', 
                                gap: 0.5, 
                                alignItems: 'center'
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                {performerName}:
                              </Typography>
                              {performerResponse.response === 'accept' && (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Accepted"
                                  size="small"
                                  color="success"
                                  sx={{ height: 24 }}
                                />
                              )}
                              {performerResponse.response === 'pass' && (
                                <Chip
                                  icon={<Cancel />}
                                  label="Passed"
                                  size="small"
                                  color="error"
                                  sx={{ height: 24 }}
                                />
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>

                </CardContent>
              </Card>
            );
            })}

            {/* Played Requests - Different Color at Bottom */}
            {playedRequests.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>
                  Played
                </Typography>
                {playedRequests.map((group, index) => {
                  const songKey = getSongKey(group);
                  return (
                  <Card key={`played-${index}`} variant="outlined" sx={{ bgcolor: 'action.hover', opacity: 0.7 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Mobile Layout: Row 1 - Tip & Song Title */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Chip
                          icon={<AttachMoney />}
                          label={group.totalTip}
                          color="default"
                          size="medium"
                          onClick={() => openTipsModal(group)}
                          sx={{ fontWeight: 600, cursor: 'pointer' }}
                        />
                        <Box sx={{ flex: 1, ml: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6" sx={{ textAlign: 'left', color: 'text.secondary' }}>
                            {getDisplaySongName(group)}
                          </Typography>
                          {songKey && (
                            <Chip
                              label={`Key: ${songKey}`}
                              color="default"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Mobile Layout: Row 2 - Request Count */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          icon={<People />}
                          label={`${group.count} ${group.count === 1 ? 'request' : 'requests'}`}
                          color="default"
                          size="small"
                        />
                      </Box>

                      {/* Mobile Layout: Row 3 - Time */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 2 }}>
                        <AccessTime sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                          {new Date(group.earliestTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Typography>
                      </Box>

                      {/* Mobile Layout: Row 4 - Status (left aligned) */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip
                          label="played"
                          color="default"
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
                })}
              </>
            )}
          </Box>
        </Col>
      </Row>

      <Row>
        <Col size={12}>
          <TextareaDebug value={{ requests, performerSongs, songsById }} />
        </Col>
      </Row>

      <Row>
        <Col size={12}>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Request Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`Total: ${requests.length}`} />
              <Chip label={`Pending: ${requests.filter(r => r.status === 'pending').length}`} color="warning" />
              <Chip label={`Playing: ${requests.filter(r => r.status === 'playing').length}`} color="success" />
              <Chip label={`Played: ${requests.filter(r => r.status === 'played').length}`} color="default" />
              <Chip label={`Alternate: ${requests.filter(r => r.status === 'alternate').length}`} color="info" />
              <Chip label={`Declined: ${requests.filter(r => r.status === 'declined').length}`} color="error" />
              <Chip label={`Total Tips: $${requests.reduce((sum, r) => sum + r.tipAmount, 0)}`} color="primary" />
            </Box>
          </Box>
        </Col>
      </Row>

      {/* Status Change Modal */}
      <Dialog 
        open={statusModalOpen} 
        onClose={closeStatusModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6">Update Status</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={closeStatusModal}
            aria-label="close"
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                {getDisplaySongName(selectedRequest)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the new status for this request
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={() => handleStatusChange(selectedRequest.requests[0].id, 'playing')}
                  fullWidth
                >
                  Playing
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  size="large"
                  onClick={() => handleStatusChange(selectedRequest.requests[0].id, 'alternate')}
                  fullWidth
                >
                  Alternate
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  onClick={() => handleStatusChange(selectedRequest.requests[0].id, 'declined')}
                  fullWidth
                >
                  Declined
                </Button>
              </Stack>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Tips Details Modal */}
      <Dialog 
        open={tipsModalOpen} 
        onClose={closeTipsModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6">Request Details</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={closeTipsModal}
            aria-label="close"
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTipsGroup && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                {getDisplaySongName(selectedTipsGroup)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedTipsGroup.count} {selectedTipsGroup.count === 1 ? 'request' : 'requests'} • Total: ${selectedTipsGroup.totalTip}
              </Typography>
              <Stack spacing={2}>
                {selectedTipsGroup.requests.map((req, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      p: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        icon={<AttachMoney />}
                        label={req.tipAmount}
                        color="success"
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(req.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Typography>
                    </Box>
                    {req.dedication && (
                      <Box sx={{ mt: 1, pl: 1, borderLeft: 2, borderColor: 'primary.light' }}>
                        <Typography variant="body2" color="text.secondary">
                          "{req.dedication}"
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShowRequests;

