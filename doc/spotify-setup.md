# Spotify API Setup for Song Autocomplete

The song editor now uses Spotify's Web API to provide autocomplete suggestions as you type song names.

## Setup Instructions

### 1. Create a Spotify Developer Account

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account (or create one)
3. Accept the Terms of Service

### 2. Create an App

1. Click **"Create app"**
2. Fill in the form:
   - **App name**: "Song Request System" (or whatever you prefer)
   - **App description**: "Song autocomplete for dueling pianist app"
   - **Redirect URIs**: Leave empty (we're using client credentials flow)
   - **Which API/SDKs are you planning to use?**: Check "Web API"
3. Click **"Save"**

### 3. Get Your Credentials

1. On your app's dashboard, you'll see:
   - **Client ID** (visible)
   - **Client Secret** (click "View client secret")
2. Copy both values

### 4. Add to Environment Variables

Add these to `server/.env.local`:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 5. Restart the Server

```powershell
cd server
npm run start
```

## How It Works

- **Type in "Song Name" field** → Spotify search triggers after 2+ characters
- **Dropdown shows**: "Song Name - Artist Name"
- **Select a song** → Auto-fills:
  - Song Name
  - Artist
  - Year (from album release date)
- **Or type manually** → freesolo still works

## Without Spotify Credentials

If you don't configure Spotify credentials:
- Autocomplete will fail silently (returns empty results)
- Manual entry still works perfectly
- No errors are thrown

## Rate Limits

Spotify free tier:
- **10,000 requests per day**
- Token caching reduces actual requests
- More than enough for typical usage

## Alternative Services

If you prefer not to use Spotify:

1. **MusicBrainz** (no key needed, open source)
2. **iTunes Search API** (no key needed, Apple)
3. **Last.fm API** (free with registration)

The service integration is in `server/src/services/spotifyService.js` if you want to swap providers.

