import config from '../config.js';

let accessToken = null;
let tokenExpiresAt = null;

// Get Spotify access token using client credentials flow
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = config.spotify?.clientId;
  const clientSecret = config.spotify?.clientSecret;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry 1 minute before actual expiry for safety
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  
  return accessToken;
}

// Get audio features (key, BPM, etc.) for a track
async function getAudioFeatures(trackId, token) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return { key: null, bpm: null };
    }

    const data = await response.json();
    
    // Convert key number to musical key notation
    const keyMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyNotation = data.key >= 0 && data.key <= 11 
      ? `${keyMap[data.key]}${data.mode === 1 ? '' : 'm'}`
      : null;
    
    return {
      key: keyNotation,
      bpm: data.tempo ? Math.round(data.tempo) : null
    };
  } catch (error) {
    console.error('Audio features error:', error?.message);
    return { key: null, bpm: null };
  }
}

// Get artist genres (batch up to 50 artists)
async function getArtistGenres(artistIds, token) {
  try {
    // Spotify allows up to 50 artist IDs in one request
    const uniqueIds = [...new Set(artistIds)].slice(0, 50);
    const idsParam = uniqueIds.join(',');
    
    const response = await fetch(`https://api.spotify.com/v1/artists?ids=${idsParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    
    // Map artist ID to genres array
    const genresMap = {};
    data.artists.forEach(artist => {
      if (artist && artist.id) {
        genresMap[artist.id] = artist.genres || [];
      }
    });
    
    return genresMap;
  } catch (error) {
    console.error('Artist genres fetch error:', error);
    return {};
  }
}

// Search for songs on Spotify
export async function searchSongs(query) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const token = await getAccessToken();
    
    const url = new URL('https://api.spotify.com/v1/search');
    url.searchParams.set('type', 'track');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '10');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Get audio features and artist genres for all tracks in parallel (with error handling)
    const trackIds = data.tracks.items.map(t => t.id);
    const artistIds = data.tracks.items.flatMap(t => t.artists.map(a => a.id));
    
    let audioFeatures = [];
    let artistGenresMap = {};
    
    try {
      [audioFeatures, artistGenresMap] = await Promise.all([
        Promise.all(trackIds.map(id => getAudioFeatures(id, token).catch(e => ({ key: null, bpm: null })))),
        getArtistGenres(artistIds, token).catch(e => ({}))
      ]);
    } catch (error) {
      console.error('Error fetching audio features/genres:', error?.message);
      // Continue without audio features if they fail
      audioFeatures = trackIds.map(() => ({ key: null, bpm: null }));
    }
    
    // Format results for autocomplete
    return data.tracks.items.map((track, index) => {
      // Collect genres from all artists on this track
      const genres = track.artists
        .flatMap(artist => artistGenresMap[artist.id] || [])
        .filter((v, i, a) => a.indexOf(v) === i); // unique only
      
      return {
        key: track.id,
        songname: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        year: track.album?.release_date ? parseInt(track.album.release_date.split('-')[0]) : null,
        album: track.album?.name || null,
        musicalKey: audioFeatures[index]?.key || null,
        bpm: audioFeatures[index]?.bpm || null,
        // Suggest tags based on Spotify genres
        suggestedTags: genres.slice(0, 5), // Limit to top 5 genres
        spotifyId: track.id,
        previewUrl: track.preview_url,
        displayText: `${track.name} - ${track.artists.map(a => a.name).join(', ')}`
      };
    });
  } catch (error) {
    console.error('Spotify search error:', error);
    // Return empty array on error - fail gracefully
    return [];
  }
}

export default {
  searchSongs
};

