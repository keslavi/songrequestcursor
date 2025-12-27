# Spotify Search for Songs Not in Performer's List

## Overview
Added a second dropdown field that allows guests to search for songs via Spotify that are not in the performer's list. The two fields are mutually exclusive - only one can have a value.

---

## Feature: Mutual Exclusive Song Selection

### Rule: **Either "Song from List" OR "Song Not in List" can have a value, but NOT both**

---

## Implementation

### 1. Form Fields (`client/src/pages/show-detail/show-detail.jsx`)

**Two Song Fields:**
```javascript
{
  song: '',              // From performer's list (or custom)
  songNotInList: '',     // From Spotify search
  dedication: '',
  tipAmount: 5
}
```

### 2. Field Behavior

**Song from Performer's List:**
- Shows songs from performer's repertoire
- Allows custom input (with warning)
- **Disabled when** "Song Not in List" has a value
- Clicking a song from the list populates this field and clears the other

**Song Not in List (Spotify Search):**
- Connects to Spotify API
- Searches entire Spotify catalog
- Debounced search (500ms delay)
- **Disabled when** "Song from Performer's List" has a value
- Shows formatted results: "Song Name - Artist"

---

## Visual Layout

```
┌────────────────────────────────────────┐
│ Request a Song                         │
├────────────────────────────────────────┤
│ Song from Performer's List             │
│ [Select from list below...]            │
│ ⚠️ Custom song (if not in list)       │
│                                        │
│              OR                        │
│                                        │
│ Song Not in List (Search Spotify)      │
│ [Search for any song...]               │
│ 🎵 Song from Spotify                  │
│                                        │
│ Dedication: [Optional...]              │
│                                        │
│ Tip Amount: [$5]                       │
│                                        │
│ [Request Song Button]                  │
│                                        │
│ Available Songs                        │
│ (Alphabetically sorted list...)        │
└────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: Select from Performer's List
1. User clicks on "Wonderwall" in the Available Songs list
2. "Song from Performer's List" field populates with "Wonderwall"
3. "Song Not in List" field becomes **disabled**
4. User submits request

### Flow 2: Search Spotify for Song Not in List
1. User types "Bohemian Rhapsody" in "Song Not in List" field
2. After 500ms, Spotify search triggers
3. Dropdown shows: "Bohemian Rhapsody - Queen"
4. User selects from dropdown
5. "Song from Performer's List" field becomes **disabled**
6. User submits request

### Flow 3: Custom Song from List Field
1. User types custom song name in "Song from Performer's List"
2. Warning appears: "⚠️ Custom song (not in performer's list)"
3. "Song Not in List" field becomes **disabled**
4. User submits request

---

## Validation

### Client-Side Validation (`validation.js`)

**XOR Logic (Exclusive OR):**
```javascript
.test('one-song-required', 'Please select or enter exactly one song', function(value) {
  const hasSong = value.song && value.song.trim();
  const hasSongNotInList = value.songNotInList && value.songNotInList.trim();
  
  // Must have exactly one (XOR logic)
  return (hasSong && !hasSongNotInList) || (!hasSong && hasSongNotInList);
});
```

**Validation Cases:**
| song | songNotInList | Valid? | Message |
|------|---------------|--------|---------|
| Empty | Empty | ❌ | Please select or enter exactly one song |
| "Wonderwall" | Empty | ✅ | Valid |
| Empty | "Bohemian Rhapsody" | ✅ | Valid |
| "Wonderwall" | "Bohemian Rhapsody" | ❌ | Please select only one song |

### Form Submission Validation

Additional validation in `submitRequest()`:
```javascript
const hasSong = values.song && values.song.trim();
const hasSongNotInList = values.songNotInList && values.songNotInList.trim();

if (!hasSong && !hasSongNotInList) {
  toast.error('Please select or enter a song');
  return;
}

if (hasSong && hasSongNotInList) {
  toast.error('Please select only one song (either from list or not in list)');
  return;
}

// Use whichever field has a value
const songname = hasSong ? values.song.trim() : values.songNotInList.trim();
```

---

## Spotify Integration

### API Endpoint
```
GET /public/spotify/search?q={searchTerm}
```

### Search Implementation

**Debounced Search (500ms):**
```javascript
const handleSpotifySearch = (searchTerm) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (!searchTerm || searchTerm.length < 2) {
    setSpotifySongOptions([]);
    return;
  }

  const timeout = setTimeout(async () => {
    const res = await api.get(`/public/spotify/search?q=${encodeURIComponent(searchTerm)}`);
    const results = res.data || [];
    
    const options = results.map(item => ({
      key: item.spotifyId,
      text: item.displayText,        // "Song Name - Artist"
      songname: item.songname,
      artist: item.artist
    }));
    
    setSpotifySongOptions(options);
  }, 500);

  setSearchTimeout(timeout);
};
```

**Why Debouncing?**
- Reduces API calls (waits until user stops typing)
- Improves performance
- Reduces Spotify API rate limiting risk

---

## Field Interactions

### Clearing Behavior

**When "Song from List" is selected:**
```javascript
const handleSongClick = (song) => {
  setValue('song', song.songname);
  setValue('songNotInList', '');  // Clear the other field
};
```

**When "Song Not in List" is selected:**
```javascript
const handleSpotifySelect = (selectedSong) => {
  const displayText = `${selectedSong.songname} - ${selectedSong.artist}`;
  setValue('songNotInList', displayText);
  setValue('song', '');  // Clear the other field
};
```

### Disabled State

**Managed via `disabled` prop:**
```javascript
<Input
  name="song"
  disabled={!!currentSongNotInList}  // Disabled if other field has value
  ...
/>

<Input
  name="songNotInList"
  disabled={!!currentSong}           // Disabled if other field has value
  ...
/>
```

---

## Visual Indicators

### Song from Performer's List
```
⚠️ Custom song (not in performer's list)
```
- Color: `warning.main` (yellow/orange)
- Shows when: User types a song not in the available list

### Song Not in List (Spotify)
```
🎵 Song from Spotify (not in performer's list)
```
- Color: `info.main` (blue)
- Shows when: User selects from Spotify search

---

## Backend Processing

### Request Data Structure

**What gets sent to backend:**
```javascript
{
  showId: "...",
  songs: [{
    songname: "Bohemian Rhapsody - Queen"  // Whichever field has a value
  }],
  dedication: "For my friend!",
  tipAmount: 5,
  requesterPhone: "5551234567"
}
```

**Backend sees:**
- Single song in array
- No distinction between "from list" vs "not in list"
- Song name includes artist if from Spotify (formatted as "Song - Artist")

---

## Benefits

### ✅ **For Guests**
- Can request songs from performer's list (preferred)
- Can request ANY song from Spotify if not available
- Clear visual separation between the two options
- No confusion - can't submit both

### ✅ **For Performers**
- See clearly which songs are custom/not in their list
- Spotify songs formatted with artist name
- Can decide whether to accept/pass based on familiarity

### ✅ **For System**
- Prevents ambiguous requests
- Leverages existing Spotify integration
- Maintains data consistency
- Simple submission logic (just one song either way)

---

## Future Enhancements

### Possible Additions

1. **Auto-populate artist from Spotify** - Extract artist separately in request model
2. **Save Spotify songs to performer's list** - Option to add popular requests
3. **Show popularity indicator** - Display how many times a Spotify song was requested
4. **Smart matching** - Suggest if typed custom song matches Spotify song
5. **Recently requested** - Show recently requested songs from both sources

---

## Testing Checklist

### Validation
- [ ] Cannot submit with both fields filled
- [ ] Cannot submit with neither field filled
- [ ] Can submit with only "song" filled
- [ ] Can submit with only "songNotInList" filled

### UI Behavior
- [ ] Filling "song" disables "songNotInList"
- [ ] Filling "songNotInList" disables "song"
- [ ] Clearing one field enables the other
- [ ] Clicking list item populates "song" and clears "songNotInList"

### Spotify Search
- [ ] Search triggers after 500ms of no typing
- [ ] Minimum 2 characters required
- [ ] Results show "Song - Artist" format
- [ ] Selecting result populates field correctly
- [ ] Selecting result clears the other field

### Indicators
- [ ] Warning shows for custom songs in list field
- [ ] Info icon shows for Spotify songs
- [ ] Indicators have correct colors and emojis

---

## Summary

**Key Implementation:**
- Two mutually exclusive song input fields
- Spotify integration for songs not in performer's list
- XOR validation (exactly one field must have value)
- Clear visual indicators for song source
- Disabled state prevents confusion
- Debounced Spotify search for performance

This provides maximum flexibility for guests while maintaining data quality and clarity for performers! 🎵

