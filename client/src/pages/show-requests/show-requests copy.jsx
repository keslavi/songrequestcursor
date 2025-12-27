import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Paper, Typography, CircularProgress, IconButton, Stack, Card, CardContent } from "@mui/material";
import { ArrowBack, MusicNote, CheckCircle, Cancel, AttachMoney, AccessTime, People } from "@mui/icons-material";
import { toast } from "react-toastify";
import api from "@/store/api";
import { Row, Col } from "components";
import { store } from "@/store/store";

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
      await api.patch(`/public/song-requests/${requestId}/status`, {
        status: newStatus
      });
      
      // Refresh requests
      const requestsResponse = await api.get(`/public/song-requests/show/${showId}`);
      setRequests(requestsResponse.data);
      
      toast.success(`Request ${newStatus}`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'playing': return 'success';
      case 'alternate': return 'info';
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

  // Group requests by song name
  const groupedRequests = useMemo(() => {
    if (!requests.length) return [];

    const groups = {};
    
    requests.forEach(request => {
      const songName = request.songs?.[0]?.songname || 'Unknown Song';
      
      if (!groups[songName]) {
        groups[songName] = {
          songName,
          requests: [],
          totalTip: 0,
          count: 0,
          earliestTime: request.createdAt,
          status: request.status
        };
      }
      
      groups[songName].requests.push(request);
      groups[songName].totalTip += request.tipAmount || 0;
      groups[songName].count += 1;
      
      if (new Date(request.createdAt) < new Date(groups[songName].earliestTime)) {
        groups[songName].earliestTime = request.createdAt;
      }
    });

    return Object.values(groups).sort((a, b) => {
      if (b.totalTip !== a.totalTip) {
        return b.totalTip - a.totalTip;
      }
      return new Date(a.earliestTime) - new Date(b.earliestTime);
    });
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
            {groupedRequests.map((group, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  {/* Header Row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip 
                        icon={<AttachMoney />}
                        label={`$${group.totalTip}`}
                        color="success"
                        size="medium"
                      />                      

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MusicNote color="primary" />
                        {group.songName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mt: 0.5 }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {new Date(group.earliestTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

                      {group.count > 1 && (
                        <Chip 
                          icon={<People />}
                          label={`${group.count} requests`}
                          color="primary"
                          size="medium"
                        />
                      )}
                      <Chip 
                        label={group.status} 
                        color={getStatusColor(group.status)} 
                        size="medium"
                      />
                    </Box>
                  </Box>

                  {/* Performer Actions - Always Show for Non-Declined Requests */}
                  {group.status !== 'declined' && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: 'background.default', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        Performer Actions
                      </Typography>
                      <Stack spacing={1}>
                        {allPerformers.map(performer => {
                          const isCurrentUser = currentUserId && (currentUserId === performer.id || currentUserId.toString() === performer.id.toString());
                          // Get response from first request (they're all the same song)
                          const response = getPerformerResponse(group.requests[0], performer.id);
                          
                          // Debug logging
                          if (index === 0) {
                            console.log('Performer check:', {
                              performerId: performer.id,
                              currentUserId: currentUserId,
                              isCurrentUser: isCurrentUser,
                              match: currentUserId === performer.id,
                              stringMatch: currentUserId?.toString() === performer.id?.toString()
                            });
                          }
                          
                          return (
                            <Box 
                              key={performer.id}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1,
                                minHeight: '48px'
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  minWidth: '120px',
                                  fontWeight: isCurrentUser ? 600 : 400,
                                  color: isCurrentUser ? 'primary.main' : 'text.secondary'
                                }}
                              >
                                {performer.name}
                                {isCurrentUser && ' (You)'}
                              </Typography>
                              
                              {isCurrentUser ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="medium"
                                    color={response === 'accept' ? 'success' : 'default'}
                                    onClick={() => handlePerformerAction(group.requests[0].id, 'accept')}
                                    sx={{
                                      minWidth: '48px',
                                      minHeight: '48px',
                                      border: response === 'accept' ? 2 : 1,
                                      borderColor: response === 'accept' ? 'success.main' : 'divider',
                                      bgcolor: response === 'accept' ? 'success.light' : 'background.paper',
                                      '&:hover': {
                                        bgcolor: 'success.light',
                                        borderColor: 'success.main'
                                      }
                                    }}
                                  >
                                    <CheckCircle sx={{ fontSize: '1.5rem' }} />
                                  </IconButton>
                                  <IconButton
                                    size="medium"
                                    color={response === 'pass' ? 'error' : 'default'}
                                    onClick={() => handlePerformerAction(group.requests[0].id, 'pass')}
                                    sx={{
                                      minWidth: '48px',
                                      minHeight: '48px',
                                      border: response === 'pass' ? 2 : 1,
                                      borderColor: response === 'pass' ? 'error.main' : 'divider',
                                      bgcolor: response === 'pass' ? 'error.light' : 'background.paper',
                                      '&:hover': {
                                        bgcolor: 'error.light',
                                        borderColor: 'error.main'
                                      }
                                    }}
                                  >
                                    <Cancel sx={{ fontSize: '1.5rem' }} />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {response === 'accept' && (
                                    <Chip 
                                      icon={<CheckCircle />} 
                                      label="Accepted" 
                                      size="small" 
                                      color="success"
                                    />
                                  )}
                                  {response === 'pass' && (
                                    <Chip 
                                      icon={<Cancel />} 
                                      label="Passed" 
                                      size="small" 
                                      color="error"
                                    />
                                  )}
                                  {!response && (
                                    <Typography variant="caption" color="text.disabled">
                                      No response yet
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Status Change Buttons */}
                  {group.status !== 'declined' && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {group.status !== 'playing' && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusChange(group.requests[0].id, 'playing')}
                          fullWidth
                        >
                          Mark as Playing
                        </Button>
                      )}
                      {group.status !== 'alternate' && (
                        <Button
                          variant="outlined"
                          color="info"
                          onClick={() => handleStatusChange(group.requests[0].id, 'alternate')}
                          fullWidth
                        >
                          Mark as Alternate
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleStatusChange(group.requests[0].id, 'declined')}
                        fullWidth
                      >
                        Decline
                      </Button>
                    </Box>
                  )}

                  {/* Individual Request Details if Multiple */}
                  {group.count > 1 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Individual Requests:
                      </Typography>
                      {group.requests.map((req, idx) => (
                        <Box key={idx} sx={{ mb: 0.5, pl: 2 }}>
                          <Typography variant="body2">
                            • ${req.tipAmount} at {new Date(req.createdAt).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                            {req.dedication && ` - "${req.dedication}"`}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Single Request Dedication */}
                  {group.count === 1 && group.requests[0].dedication && (
                    <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'primary.light' }}>
                      <Typography variant="body2" color="text.secondary">
                        "{group.requests[0].dedication}"
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
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
              <Chip label={`Alternate: ${requests.filter(r => r.status === 'alternate').length}`} color="info" />
              <Chip label={`Declined: ${requests.filter(r => r.status === 'declined').length}`} color="error" />
              <Chip label={`Total Tips: $${requests.reduce((sum, r) => sum + r.tipAmount, 0)}`} color="primary" />
            </Box>
          </Box>
        </Col>
      </Row>
    </>
  );
};

export default ShowRequests;

