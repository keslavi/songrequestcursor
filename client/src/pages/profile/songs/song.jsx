import { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Box, Typography, CircularProgress } from "@mui/material";
import { AttachFile, Link as LinkIcon } from "@mui/icons-material";
import { store } from "store";
import api from "@/store/api";

//prettier-ignore
import {
  Col,
  FormProvider,
  useFormProvider,
  Input,
  Row,
  Fieldset,
  BtnContinueSave,
  TextareaDebug,
} from "components";

import { SelectAutocompleteFreesolo } from "@/components/formhelper/select-autocomplete-freesolo";
import { SelectMulti } from "@/components/formhelper/select-multi";

//prettier-ignore
import {
  resolver,
} from "./validation";

export const Song = () => {
  const song = store.use.song();
  const songRetrieve = store.use.songRetrieve();
  const songCreate = store.use.songCreate();
  const songUpdate = store.use.songUpdate();
  const songClear = store.use.songClear();
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [songOptions, setSongOptions] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [lastSelectedSong, setLastSelectedSong] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) {
      songClear();
    } else {
      songRetrieve(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver,
    defaultValues: {
      songname: '',
      artist: '',
      year: new Date().getFullYear(),
      tags: [],
      key: '',
      bpm: '',
      notes: '',
      link1: '',
      link2: ''
    },
  });
  const { reset } = formMethods;

  useEffect(() => {
    if (!isEmpty(song) && !isNew) {
      reset({
        songname: song.songname || '',
        artist: song.artist || '',
        year: song.year || new Date().getFullYear(),
        tags: song.tags || [],
        key: song.key || '',
        bpm: song.bpm || '',
        notes: song.notes || '',
        link1: song.link1 || '',
        link2: song.link2 || ''
      });
      
      // Set uploaded file info if exists
      if (song.attachmentUrl) {
        setUploadedFile({
          url: song.attachmentUrl,
          filename: song.attachmentFilename
        });
      }
    }
  }, [song, isNew, reset]);

  const onClickContinueSave = (e) => {
    const btnId = e.currentTarget.id;
    switch (btnId) {
      case "btnContinue":
        e.currentTarget.form.requestSubmit();
        break;
      case "btnSave":
        alert("btnSave. additional logic here if needed");
        break;
      default:
        toast.error(`onClickContinueSave: unknown id: ${btnId}`);
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const res = await api.post('/public/songs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedFile(res.data);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values) => {
    // Include uploaded file info if available
    const submitData = {
      ...values,
      ...(uploadedFile && {
        attachmentUrl: uploadedFile.url,
        attachmentFilename: uploadedFile.filename
      })
    };

    let result;
    if (isNew) {
      result = await songCreate(submitData);
      if (result) {
        toast.success("Song created successfully!");
        navigate("/profile/songs");
      }
    } else {
      result = await songUpdate(id, submitData);
      if (result) {
        toast.success("Song updated successfully!");
        navigate("/profile/songs");
      }
    }
  };

  const onCancel = () => {
    navigate("/profile/songs");
  };

  // Spotify autocomplete search with debouncing
  const handleSongSearch = (searchTerm) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchTerm || searchTerm.length < 2) {
      setSongOptions([]);
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
        artist: item.artist,
        year: item.year,
        album: item.album,
        musicalKey: item.musicalKey,
        bpm: item.bpm,
        suggestedTags: item.suggestedTags
      }));
        
        setSongOptions(options);
      } catch (error) {
        console.error('Spotify search error:', error);
        setSongOptions([]);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  // Handle song selection from Spotify
  const handleSongSelect = (event, value) => {
    if (value && typeof value === 'object') {
      console.log('Selected song data:', value);
      setLastSelectedSong(value);
      
      // User selected from dropdown
      formMethods.setValue('songname', value.songname);
      formMethods.setValue('artist', value.artist);
      
      if (value.year) {
        console.log('Setting year:', value.year);
        formMethods.setValue('year', value.year);
      }
      
      if (value.musicalKey) {
        console.log('Setting key:', value.musicalKey);
        formMethods.setValue('key', value.musicalKey);
      }
      
      if (value.bpm) {
        console.log('Setting bpm:', value.bpm);
        formMethods.setValue('bpm', value.bpm);
      }
      
      // Pre-fill tags with genres
      if (value.suggestedTags && value.suggestedTags.length > 0) {
        console.log('Setting tags:', value.suggestedTags);
        formMethods.setValue('tags', value.suggestedTags);
      }
      
      toast.success('Song details auto-filled from Spotify!');
    } else if (typeof value === 'string') {
      // User typed free text
      formMethods.setValue('songname', value);
    }
  };

  if (!isNew && isEmpty(song)) return <div>Loading...</div>;

  return (
    <>
      <Row>
        <Col size={12}>
          <h2>{isNew ? 'Add Song' : 'Edit Song'}</h2>
        </Col>
      </Row>
      <FormProvider
        onSubmit={onSubmit}
        formMethods={formMethods}
      >
        <BtnContinueSave
          onClickContinueSave={onClickContinueSave}
          textContinue={isNew ? "Create" : "Update"}
        />
        <Fieldset legend="Song Details">
          <Row>
            <SelectAutocompleteFreesolo
              size={{ xs: 12, xm: 6 }}
              name="songname"
              label="Song Name"
              options={songOptions}
              onInputChange={(event, value) => {
                console.log('onInputChange triggered:', value);
                handleSongSearch(value);
              }}
              onChange={handleSongSelect}
              info="Start typing to search Spotify, or enter manually"
            />
            <Input
              size={{ xs: 12, xm: 6 }}
              name="artist"
              label="Artist"
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 12, xm: 4 }}
              name="year"
              label="Year"
              type="number"
            />
            <Input
              size={{ xs: 12, xm: 4 }}
              name="key"
              label="Key"
              info="Musical key (e.g., C, Am, F#)"
            />
            <Input
              size={{ xs: 12, xm: 4 }}
              name="bpm"
              label="BPM"
              type="number"
              info="Beats per minute"
            />
          </Row>
          <Row>
            <SelectMulti
              size={{ xs: 12 }}
              name="tags"
              label="Tags"
              optionsMulti={[
                { key: '80s', text: '80s' },
                { key: '90s', text: '90s' },
                { key: '00s', text: '00s' },
                { key: 'pop', text: 'Pop' },
                { key: 'rock', text: 'Rock' },
                { key: 'country', text: 'Country' },
                { key: 'jazz', text: 'Jazz' },
                { key: 'blues', text: 'Blues' },
                { key: 'novelty', text: 'Novelty' },
                { key: 'ballad', text: 'Ballad' },
                { key: 'upbeat', text: 'Upbeat' },
                { key: 'slow', text: 'Slow' },
              ]}
              allowFreeText={true}
              info="Genre, mood, decade, etc."
            />
          </Row>
          <Row>
            <Input
              size={{ xs: 12 }}
              name="notes"
              label="Notes"
              textarea
              info="Internal notes for yourself or other performers"
            />
          </Row>
        </Fieldset>

        <br />
        <Fieldset legend="Links & Attachments">
          <Row>
            <Input
              size={{ xs: 12, xm: 6 }}
              name="link1"
              label="Link 1"
              placeholder="https://..."
              info="YouTube, Spotify, or other reference link"
            />
            <Input
              size={{ xs: 12, xm: 6 }}
              name="link2"
              label="Link 2"
              placeholder="https://..."
              info="Additional reference link"
            />
          </Row>
          <Row>
            <Col size={{ xs: 12 }}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <AttachFile sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Attachment (Sheet Music, Audio, etc.)
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.mp3,.xls,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'block', marginBottom: 8 }}
                />
                {uploading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="caption">Uploading...</Typography>
                  </Box>
                )}
                {uploadedFile && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <LinkIcon sx={{ verticalAlign: 'middle', fontSize: 16, mr: 0.5 }} />
                      {uploadedFile.filename || uploadedFile.originalName}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setUploadedFile(null)}
                      sx={{ mt: 0.5 }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Max 10MB. Allowed: PDF, JPG, PNG, MP3, Excel
                </Typography>
              </Box>
            </Col>
          </Row>
        </Fieldset>

        <Row>
          <Col size={12}>
            <button type="button" onClick={onCancel} style={{ marginLeft: 10 }}>
              Cancel
            </button>
          </Col>
        </Row>
      </FormProvider>
      
      <br />
      <TextareaDebug value={{ 
        lastSelectedSong,
        currentFormValues: formMethods.watch(),
        songOptions: songOptions.length > 0 ? `${songOptions.length} options available` : 'No options'
      }} />
    </>
  );
};

export default Song;

