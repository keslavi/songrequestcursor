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
  TextField,
  Stack,
  IconButton,
  SvgIcon,
  Chip
} from "@mui/material";
import {
  MusicNote,
  ListAlt,
  People,
  Close
} from "@mui/icons-material";

//prettier-ignore
import {
  Col,
  Row,
  FormProvider,
  useFormProvider,
  Fieldset,
  Input,
  ShowHeader,
  PriorityRequestCard,
} from "components";

import dayjs from "dayjs";
import api from "@/store/api";
import { resolver } from "./validation";
import { store } from "@/store/store";
import { color } from "@/theme-material";

const STATUS_PRIORITY = {
  playing: 0,
  add_to_request: 1,
  alternate: 2,
  pending: 3,
  queued: 4,
  declined: 5,
  played: 6
};

const VenmoIcon = (props) => (
  <SvgIcon viewBox="0 0 32 32" {...props}>
    <path fill="#FFFFFF" d="M16 2a14 14 0 1 1 0 28 14 14 0 0 1 0-28z" />
    <path
      d="M24.6 7.4c-.4 2.3-3 11.6-5.2 16.4-1.3 2.8-3 4.2-5.1 4.2-3.4 0-5.2-2.8-5.7-6.1L5.5 8.6 12 7.8l1.5 9c.3 2 .4 2.8 1.1 2.8s1.7-1.4 2.7-3.9c.8-2.3 1.4-4.4 1.4-4.4L24.6 7.4z"
      fill="#008CFF"
    />
  </SvgIcon>
);

export const ShowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [performer, setPerformer] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [priorityGroups, setPriorityGroups] = useState([]);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [prioritySelection, setPrioritySelection] = useState(null);
  const [priorityAmount, setPriorityAmount] = useState(5);
  const [priorityDedication, setPriorityDedication] = useState('');
  const [isSubmittingPriority, setIsSubmittingPriority] = useState(false);
  const [currentPlayingGroup, setCurrentPlayingGroup] = useState(null);
  const [guestPoints, setGuestPoints] = useState(null);
  const [isFetchingPoints, setIsFetchingPoints] = useState(false);

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
  const guestName = store.use.guestName();
  const setGuestPhoneNumber = store.use.setGuestPhoneNumber();

  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [guestNameInput, setGuestNameInput] = useState("");
  const [pendingSubmitValues, setPendingSubmitValues] = useState(null);
  const [pendingUsePoints, setPendingUsePoints] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const hasAutoPromptedPhone = useRef(false);
  const lastFetchedPointsRef = useRef(null);

  const defaultGuestPhone = useMemo(() => {
    return guestPhoneNumber || localStorage.getItem("lastPhoneNumber") || "";
  }, [guestPhoneNumber]);

  const defaultGuestName = useMemo(() => {
    return guestName || localStorage.getItem("lastGuestName") || "";
  }, [guestName]);

  useEffect(() => {
    // Keep dialog input in sync with stored phone (when opening later)
    setPhoneInput(defaultGuestPhone);
    setGuestNameInput(defaultGuestName);
  }, [defaultGuestPhone, defaultGuestName]);

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

  const { setValue, watch, setFocus, getValues } = formMethods;
  const currentSong = watch('song');
  const currentSongNotInList = watch('songNotInList');
  const tipAmountValue = watch('tipAmount');

  const clearPerformerSongSelection = useCallback(() => {
    if (!currentSong) {
      return;
    }

    setValue('song', '', { shouldDirty: true, shouldValidate: true });
  }, [currentSong, setValue]);

  const clearSongNotInList = useCallback(() => {
    if (!currentSongNotInList) {
      return;
    }

    setValue('songNotInList', '', { shouldDirty: true, shouldValidate: true });
  }, [currentSongNotInList, setValue]);

  // State for Spotify search
  const [spotifySongOptions, setSpotifySongOptions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSongFieldFocus = useCallback(() => {
    clearSongNotInList();
    setSpotifySongOptions([]);
  }, [clearSongNotInList]);

  const handleSongNotInListFocus = useCallback(() => {
    clearPerformerSongSelection();
  }, [clearPerformerSongSelection]);

  const groupRequestsBySong = useCallback((requestList = []) => {
    if (!Array.isArray(requestList) || !requestList.length) {
      return [];
    }

    const groups = {};

    requestList.forEach((request) => {
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

      const group = groups[songName];
      group.requests.push(request);
      group.totalTip += request.tipAmount || 0;
      group.count += 1;

      if (new Date(request.createdAt) < new Date(group.earliestTime)) {
        group.earliestTime = request.createdAt;
      }

      if (requestPriority < (group.statusPriority ?? Number.POSITIVE_INFINITY)) {
        group.statusPriority = requestPriority;
        group.status = requestStatus;
      }
    });

    return Object.values(groups).sort((a, b) => {
      const statusDifference = (a.statusPriority ?? Number.POSITIVE_INFINITY) - (b.statusPriority ?? Number.POSITIVE_INFINITY);
      if (statusDifference !== 0) {
        return statusDifference;
      }
      if ((b.totalTip || 0) !== (a.totalTip || 0)) {
        return (b.totalTip || 0) - (a.totalTip || 0);
      }
      return new Date(a.earliestTime) - new Date(b.earliestTime);
    });
  }, []);

  const updatePriorityGroups = useCallback((requestList = []) => {
    const grouped = groupRequestsBySong(requestList);
    setPriorityGroups(grouped.filter((group) => group.status === 'add_to_request'));
    const playingGroup = grouped.find((group) => group.status === 'playing');
    setCurrentPlayingGroup(playingGroup || null);
  }, [groupRequestsBySong]);

  const refreshPriorityRequests = useCallback(async () => {
    try {
      const response = await api.get(`/public/song-requests/show/${id}`);
      const requests = response?.data?.requests || response?.data || [];
      updatePriorityGroups(requests);
    } catch (error) {
      console.error('Failed to load priority requests:', error);
    }
  }, [id, updatePriorityGroups]);

  const playingPrimarySong = useMemo(() => {
    if (!currentPlayingGroup?.requests?.length) {
      return null;
    }

    let latestWithSongId = null;
    let fallbackSong = null;

    currentPlayingGroup.requests.forEach((request, index) => {
      const requestSongs = request.songs || [];
      if (index === 0 && requestSongs[0]) {
        fallbackSong = requestSongs[0];
      }
      const matchWithId = requestSongs.find((song) => song.songId);
      if (matchWithId) {
        latestWithSongId = matchWithId;
      }
    });

    return latestWithSongId || fallbackSong || null;
  }, [currentPlayingGroup]);

  const playingLyricsLink = useMemo(() => {
    if (!playingPrimarySong) {
      return null;
    }
    return playingPrimarySong.link2 || playingPrimarySong.link1 || null;
  }, [playingPrimarySong]);

  const playingSongLabel = useMemo(() => {
    if (!playingPrimarySong) {
      return null;
    }

    const name = playingPrimarySong.songname || '';
    if (!name) {
      return null;
    }

    const artistSuffix = playingPrimarySong.artist ? ` - ${playingPrimarySong.artist}` : '';
    return `${name}${artistSuffix}`;
  }, [playingPrimarySong]);

  const getStoredPhoneDigits = useCallback(() => {
    const fallback = typeof window !== 'undefined' ? window.localStorage?.getItem('lastPhoneNumber') : '';
    return normalizePhoneDigits(guestPhoneNumber || fallback || '');
  }, [guestPhoneNumber]);

  const getStoredGuestName = useCallback(() => {
    const fallback = typeof window !== 'undefined'
      ? window.localStorage?.getItem('lastGuestName') || window.localStorage?.getItem('guestName')
      : '';
    const nameSource = guestName || fallback || '';
    return String(nameSource).trim();
  }, [guestName]);

  const fetchGuestPoints = useCallback(async (digits, nameValue = '') => {
    if (!show || show.showType !== 'private') {
      return null;
    }

    if (!digits || digits.length < 10 || digits.length > 15) {
      return null;
    }

    const showKey = show._id || show.id;
    if (!showKey) {
      return null;
    }

    if (lastFetchedPointsRef.current === `${showKey}-${digits}` && guestPoints !== null) {
      return guestPoints;
    }

    try {
      setIsFetchingPoints(true);

      const payload = { phoneNumber: digits };
      if (nameValue) {
        payload.guestName = nameValue;
      }

      const response = await api.post(`/public/shows/${id}/points`, payload);
      const pointsValue = response?.data?.points ?? null;
      setGuestPoints(pointsValue);
  lastFetchedPointsRef.current = `${showKey}-${digits}`;
      return pointsValue;
    } catch (error) {
      console.error('Failed to load guest points:', error);
      toast.error(error.response?.data?.message || 'Unable to load point balance');
      return null;
    } finally {
      setIsFetchingPoints(false);
    }
  }, [guestPoints, id, show]);

  useEffect(() => {
    if (!show || show.showType !== 'private') {
      setGuestPoints(null);
      lastFetchedPointsRef.current = null;
      return;
    }

    const digits = getStoredPhoneDigits();
    if (!digits || digits.length < 10 || digits.length > 15) {
      setGuestPoints(null);
      lastFetchedPointsRef.current = null;
      return;
    }

    const storedName = getStoredGuestName();
    fetchGuestPoints(digits, storedName);
  }, [fetchGuestPoints, getStoredGuestName, getStoredPhoneDigits, show]);

  const openPriorityModal = (group) => {
    if (!group) return;
    setPrioritySelection(group);
    const defaultTip = group.requests?.[0]?.tipAmount || 5;
    setPriorityAmount(defaultTip);
    setPriorityDedication('');
    setPriorityModalOpen(true);
  };

  const closePriorityModal = () => {
    setPriorityModalOpen(false);
    setPrioritySelection(null);
    setPriorityAmount(5);
    setPriorityDedication('');
    setIsSubmittingPriority(false);
  };

  const handlePrioritySubmit = async () => {
    if (!prioritySelection) {
      toast.error('Unable to locate request details');
      return;
    }

    const primaryRequest = prioritySelection.requests?.[0];
    if (!primaryRequest) {
      toast.error('Unable to locate request details');
      return;
    }

    const parsedAmount = Number(priorityAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 100) {
      toast.error('Tip amount must be between 1 and 100');
      return;
    }

    const phoneDigits = getStoredPhoneDigits();
    if (!validatePhone(phoneDigits)) {
      toast.error('Please add your phone number before contributing.');
      setPhoneDialogOpen(true);
      return;
    }

    const songsPayload = (primaryRequest.songs || []).map((song) => {
      const payload = {};
      if (song.songId) payload.songId = song.songId;
      if (!song.songId) payload.songname = song.songname || prioritySelection.songName;
      if (song.artist) payload.artist = song.artist;
      if (song.key) payload.key = song.key;
      if (song.isCustom) payload.isCustom = song.isCustom;
      return payload;
    });

    if (!songsPayload.length) {
      songsPayload.push({ songname: prioritySelection.songName });
    }

    setIsSubmittingPriority(true);
    try {
      const guestNameForRequest = getStoredGuestName();

      const payload = {
        showId: id,
        songs: songsPayload,
        dedication: priorityDedication || '',
        tipAmount: Math.round(parsedAmount),
        requesterPhone: phoneDigits,
        ...(guestNameForRequest ? { requesterName: guestNameForRequest } : {})
      };

      const response = await api.post('/public/song-requests', payload);
      const result = response.data;

      if (result?.venmoUrl) {
        window.open(result.venmoUrl, '_blank');
      }

      await refreshPriorityRequests();
      toast.success('Request added!');
      closePriorityModal();
    } catch (error) {
      console.error('Error adding request:', error);
      toast.error(error.response?.data?.error || 'Failed to add request');
      setIsSubmittingPriority(false);
    }
  };

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

  useEffect(() => {
    refreshPriorityRequests();
  }, [refreshPriorityRequests]);

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

  const focusTipAmount = () => {
    setTimeout(() => {
      try {
        setFocus('tipAmount');
      } catch (err) {
        console.warn('Unable to focus tip amount via setFocus:', err);
      }
      const tipElement = typeof document !== 'undefined' ? document.getElementById('tipAmount') : null;
      tipElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleSongClick = (song) => {
    if (!song) return;

    setValue('song', song.songname, { shouldDirty: true, shouldValidate: true });
    setValue('songNotInList', '', { shouldDirty: true, shouldValidate: true });
    focusTipAmount();
  };

  const handleSongSelect = (selectedSong) => {
    if (selectedSong && selectedSong.key) {
      // Selected from autocomplete
      setValue('song', selectedSong.songname, { shouldDirty: true, shouldValidate: true });
      setValue('songNotInList', '', { shouldDirty: true, shouldValidate: true });
      focusTipAmount();
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
    if (!selectedSong) {
      setValue('songNotInList', '', { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (typeof selectedSong === 'string') {
      const trimmed = selectedSong.trim();
      setValue('songNotInList', trimmed, { shouldDirty: true, shouldValidate: true });
      if (trimmed) {
        clearPerformerSongSelection();
        focusTipAmount();
      }
      return;
    }

    if (selectedSong.songname) {
      const displayText = selectedSong.artist
        ? `${selectedSong.songname} - ${selectedSong.artist}`
        : selectedSong.songname;
      setValue('songNotInList', displayText, { shouldDirty: true, shouldValidate: true });
      clearPerformerSongSelection();
      focusTipAmount();
    }
  };

  useEffect(() => {
    if (currentSongNotInList && currentSong) {
      clearPerformerSongSelection();
    }
  }, [currentSongNotInList, currentSong, clearPerformerSongSelection]);

  const submitRequest = async (values, phoneDigits, requesterNameValue = '', options = {}) => {
    const { usePoints = false } = options;
    setSubmitting(true);
    let resultData = null;
    const trimmedRequesterName = typeof requesterNameValue === 'string' ? requesterNameValue.trim() : '';

    try {
      // Validate that exactly one song field is provided
      const hasSong = values.song && values.song.trim();
      const hasSongNotInList = values.songNotInList && values.songNotInList.trim();

      if (!hasSong && !hasSongNotInList) {
        toast.error('Please select or enter a song');
        return null;
      }

      if (hasSong && hasSongNotInList) {
        toast.error('Please select only one song (either from list or not in list)');
        return null;
      }

      const parsedTipAmount = Math.round(Number(values.tipAmount));
      if (Number.isNaN(parsedTipAmount) || parsedTipAmount < 1) {
        toast.error('Enter a valid amount greater than 0');
        return null;
      }

      if (usePoints && (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15)) {
        toast.error('Add a valid phone number to use points');
        return null;
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
        tipAmount: parsedTipAmount,
        ...(phoneDigits ? { requesterPhone: phoneDigits } : {})
      };

      if (trimmedRequesterName) {
        requestData.requesterName = trimmedRequesterName;
      }

      if (usePoints) {
        requestData.usePoints = true;
      }

      const response = await api.post(`/public/song-requests`, requestData);
      resultData = response.data;

      if (usePoints) {
        if (typeof resultData?.pointsBalance === 'number') {
          setGuestPoints(resultData.pointsBalance);
        }
        toast.success('Song request submitted with points!');
      } else {
        if (resultData?.venmoUrl) {
          window.open(resultData.venmoUrl, '_blank');
        }
        toast.success('Song request submitted successfully!');
      }

      // Reset form
      setValue('song', '');
      setValue('songNotInList', '');
      setValue('dedication', '');
      setValue('tipAmount', 5);
      setSpotifySongOptions([]);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to submit song request');
      if (usePoints && phoneDigits && phoneDigits.length >= 10 && phoneDigits.length <= 15) {
        await fetchGuestPoints(phoneDigits, trimmedRequesterName);
      }
    } finally {
      setSubmitting(false);
    }

    return resultData;
  };

  const onSubmit = async (values) => {
    if (!isAuthenticated) {
      const digits = normalizePhoneDigits(guestPhoneNumber || phoneInput);
      if (!validatePhone(digits)) {
        setPendingSubmitValues(values);
        setPendingUsePoints(false);
        setPhoneDialogOpen(true);
        return;
      }
      const guestNameForRequest = getStoredGuestName();
      await submitRequest(values, digits, guestNameForRequest);
      return;
    }

    // Authenticated request: phone optional (server may still accept it)
    await submitRequest(values, null);
  };

  const handleRequestWithPoints = async () => {
    const formValues = getValues();
    const digits = getStoredPhoneDigits();

    if (!validatePhone(digits)) {
      setPendingSubmitValues(formValues);
      setPendingUsePoints(true);
      setPhoneDialogOpen(true);
      return;
    }

    const parsedTipAmount = Math.round(Number(formValues.tipAmount));
    if (Number.isNaN(parsedTipAmount) || parsedTipAmount < 1) {
      toast.error('Enter a valid amount of points to spend');
      return;
    }

    if (guestPoints !== null && parsedTipAmount > guestPoints) {
      toast.error('You do not have enough points for this request');
      return;
    }

    const guestNameForRequest = getStoredGuestName();
    await submitRequest(formValues, digits, guestNameForRequest, { usePoints: true });
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

  const isPrivateShow = show?.showType === 'private';
  const parsedTipAmount = Math.round(Number(tipAmountValue || 0)) || 0;
  const tipInputLabel = isPrivateShow
    ? (guestPoints !== null
      ? `Points (you have ${guestPoints} ${guestPoints === 1 ? 'point' : 'points'})`
      : (isFetchingPoints
        ? 'Points (checking balance...)'
        : 'Points (enter phone to load points)'))
    : 'Amount';
  const hasInsufficientPoints = isPrivateShow && guestPoints !== null && parsedTipAmount > guestPoints;

  return (
    <>
      <Row>
        <Col size={12}>
          <ShowHeader show={show} performer={performer} />
        </Col>
      </Row>
      <Row>
        <Col size={12}>
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
        <Col size={12}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h6"
                    component="span"
                    sx={{
                      color: playingSongLabel ? color.primary.blue : 'inherit',
                      fontWeight: playingSongLabel ? 700 : undefined
                    }}
                  >
                    {playingSongLabel ? `Playing: ${playingSongLabel}` : (<>                  <MusicNote
                      sx={{
                        verticalAlign: 'middle',
                        color: playingSongLabel ? color.primary.blue : 'inherit'
                      }}
                    />
                      Request a Song</>)
                    }
                  </Typography>
                </Box>
                {playingLyricsLink && (
                  <Chip
                    component="a"
                    href={playingLyricsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    label="Lyrics"
                    color="primary"
                    size="small"
                    clickable
                    sx={{ alignSelf: 'center' }}
                  />
                )}
              </Box>

              {priorityGroups.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Priority Requests
                  </Typography>
                  <Stack spacing={1.5}>
                    {priorityGroups.map((group, index) => (
                      <PriorityRequestCard
                        key={`${group.songName}-${index}`}
                        group={group}
                        onAdd={() => openPriorityModal(group)}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <FormProvider
                onSubmit={onSubmit}
                formMethods={formMethods}
              >
                <Fieldset>
                  <Row>
                    <Col size={12}>
                      <Input
                        name="song"
                        label="Song from Performer's List"
                        placeholder="Select from list below or type..."
                        options={songs}
                        allowFreeText={true}
                        onChange={(event, newValue) => handleSongSelect(newValue)}
                        onFocus={handleSongFieldFocus}
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
                        label="Request a Song not in the list"
                        placeholder="Search for any song on Spotify..."
                        options={spotifySongOptions}
                        allowFreeText={true}
                        onChange={(event, newValue) => handleSpotifySelect(newValue)}
                        onInputChange={(event, value) => {
                          if (event && event.type === 'change') {
                            if (value && value.trim()) {
                              clearPerformerSongSelection();
                            }
                            handleSpotifySearch(value);
                          }
                        }}
                        onFocus={handleSongNotInListFocus}
                        size={12}
                      />
                      {currentSongNotInList && (
                        <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
                          🎵 Song from Spotify (not in performer's list)
                        </Typography>
                      )}
                    </Col>
                  </Row>
                </Fieldset>
                <Fieldset>
                  <Row>
                    <Col size={12}>
                      <Input
                        name="tipAmount"
                        label={tipInputLabel}
                        type="number"
                        size={12}
                      />
                      {hasInsufficientPoints && (
                        <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                          Not enough points. You have {guestPoints}.
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
                  {isPrivateShow && (
                    <Row>
                      <Col size={12}>
                        <Button
                          type="button"
                          variant="contained"
                          color="success"
                          fullWidth
                          size="large"
                          disabled={submitting || isFetchingPoints || hasInsufficientPoints}
                          onClick={handleRequestWithPoints}
                          sx={{
                            mb: 2,
                            borderRadius: '999px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            py: 1.5,
                            px: 2
                          }}
                        >
                          {submitting ? 'Submitting...' : 'Request Song With Points'}
                        </Button>
                      </Col>
                    </Row>
                  )}
                  <Row>
                    <Col size={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={submitting}
                        disableElevation
                        startIcon={<People />}
                        endIcon={<VenmoIcon sx={{ fontSize: 20 }} />}
                        sx={{
                          mb: 2,
                          borderRadius: '999px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          py: 1.5,
                          px: 2,
                          '& .MuiButton-startIcon': {
                            mr: 1,
                            color: 'inherit'
                          }
                        }}
                      >
                        {submitting ? 'Submitting...' : 'Request Song'}
                      </Button>
                    </Col>
                  </Row>
                </Fieldset>
              </FormProvider>

              {/* Song List */}
              {songs && songs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Available Songs
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
        open={priorityModalOpen}
        onClose={isSubmittingPriority ? undefined : closePriorityModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6">Add your request?</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={closePriorityModal}
            aria-label="close"
            size="small"
            disabled={isSubmittingPriority}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {prioritySelection && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {prioritySelection.songName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current total tips: ${prioritySelection.totalTip}
                </Typography>
              </Box>
              <TextField
                label="Tip Amount"
                type="number"
                value={priorityAmount}
                onChange={(event) => setPriorityAmount(event.target.value)}
                inputProps={{ min: 1, max: 100 }}
                disabled={isSubmittingPriority}
                fullWidth
              />
              <TextField
                label="Dedication (optional)"
                multiline
                minRows={2}
                value={priorityDedication}
                onChange={(event) => setPriorityDedication(event.target.value)}
                disabled={isSubmittingPriority}
                fullWidth
              />
              {(() => {
                const digits = getStoredPhoneDigits();
                if (!digits || digits.length < 4) {
                  return (
                    <Typography variant="caption" color="error.main">
                      Add your phone number above before contributing.
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
            onClick={handlePrioritySubmit}
            disabled={isSubmittingPriority}
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
            {isSubmittingPriority ? 'Submitting…' : 'Add My Request!'}
          </Button>
          <Button
            variant="text"
            onClick={closePriorityModal}
            disabled={isSubmittingPriority}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

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
          <TextField
            label="Your name (optional)"
            value={guestNameInput}
            onChange={(event) => setGuestNameInput(event.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ autoComplete: "name" }}
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
              const trimmedName = guestNameInput.trim();
              setGuestPhoneNumber(digits, trimmedName);
              setGuestNameInput(trimmedName);
              if (show?.showType === 'private') {
                await fetchGuestPoints(digits, trimmedName);
              }
              setPhoneDialogOpen(false);

              if (pendingSubmitValues) {
                const values = pendingSubmitValues;
                setPendingSubmitValues(null);
                const usePoints = pendingUsePoints;
                setPendingUsePoints(false);
                await submitRequest(values, digits, trimmedName, { usePoints });
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