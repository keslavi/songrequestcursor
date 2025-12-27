# Public View Requests Feature

## Overview
Added a tabbed header component and public "View Requests" page that shows aggregated song requests with tips and counts. This is separate from the performer's admin view.

---

## Components Created

### 1. ShowHeader Component (`client/src/components/show-header/`)

**Purpose:** Tabbed navigation header for show pages

**Features:**
- Shows show name and performer
- Two tab buttons: "Request a Song" and "View Requests"
- Active tab is highlighted (contained button style)
- Inactive tab is outlined
- Responsive navigation

**Usage:**
```jsx
<ShowHeader show={show} performer={performer} />
```

---

### 2. ShowViewRequests Page (`client/src/pages/show-view-requests/`)

**Purpose:** Public page to view all requests for a show with aggregation

**Features:**
- Shows all song requests grouped by song name
- Aggregates multiple requests for the same song
- Displays total tips per song
- Shows request count when multiple people request same song
- Sorts by tip amount (highest first), then by time (earliest first)
- Shows individual request details for grouped songs

---

## Visual Layout

### ShowHeader (Tab Navigation)

```
┌────────────────────────────────────────┐
│ Show Name                              │
│ Featuring Performer Name               │
├────────────────────────────────────────┤
│ [Request a Song] [View Requests]       │ ← Tab buttons
└────────────────────────────────────────┘
```

**Active State:**
- Contained button (filled background)
- Bold font weight (600)
- No bottom border

**Inactive State:**
- Outlined button
- Normal font weight (400)
- Bottom border

---

### View Requests Page

```
┌────────────────────────────────────────┐
│ Song Requests                          │
│ 5 unique songs • 8 total requests      │
│ • $45 in tips                          │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 🎵 Wonderwall                      │ │
│ │                    [$15] [3 reqs]  │ │
│ │ ⏰ First requested 7:30 PM         │ │
│ │                                    │ │
│ │ Individual Requests:               │ │
│ │ • $5 at 7:30 PM - "For Sarah"     │ │
│ │ • $5 at 7:45 PM                   │ │
│ │ • $5 at 8:00 PM - "Birthday!"     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 🎵 Bohemian Rhapsody               │ │
│ │                    [$10]           │ │
│ │ ⏰ First requested 7:35 PM         │ │
│ │ "For my friend John"               │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Data Aggregation Logic

### Grouping Algorithm

```javascript
// Group requests by song name
const groups = {};

requests.forEach(request => {
  const songName = request.songs?.[0]?.songname || 'Unknown Song';
  
  if (!groups[songName]) {
    groups[songName] = {
      songName,
      requests: [],
      totalTip: 0,
      count: 0,
      earliestTime: request.createdAt
    };
  }
  
  groups[songName].requests.push(request);
  groups[songName].totalTip += request.tipAmount || 0;
  groups[songName].count += 1;
  
  // Track earliest request time
  if (new Date(request.createdAt) < new Date(groups[songName].earliestTime)) {
    groups[songName].earliestTime = request.createdAt;
  }
});
```

### Sorting Logic

**Primary Sort:** Total tip amount (descending)
**Secondary Sort:** Earliest request time (ascending)

```javascript
Object.values(groups).sort((a, b) => {
  if (b.totalTip !== a.totalTip) {
    return b.totalTip - a.totalTip;  // Highest tips first
  }
  return new Date(a.earliestTime) - new Date(b.earliestTime);  // Earliest first
});
```

---

## Display Rules

### Single Request for a Song

```
┌────────────────────────────────────┐
│ 🎵 Song Name                       │
│                    [$5]            │
│ ⏰ First requested 7:30 PM         │
│ "Dedication message if present"   │
└────────────────────────────────────┘
```

**Shows:**
- Song name
- Single tip amount chip
- Request time
- Dedication (if provided)

**Does NOT show:**
- Request count chip (only 1 request)
- Individual requests section

---

### Multiple Requests for Same Song

```
┌────────────────────────────────────┐
│ 🎵 Song Name                       │
│                    [$15] [3 reqs]  │
│ ⏰ First requested 7:30 PM         │
│                                    │
│ Individual Requests:               │
│ • $5 at 7:30 PM - "For Sarah"     │
│ • $5 at 7:45 PM                   │
│ • $5 at 8:00 PM - "Birthday!"     │
└────────────────────────────────────┘
```

**Shows:**
- Song name
- Total tip amount chip (sum of all)
- Request count chip (e.g., "3 requests")
- Earliest request time
- Individual requests section with:
  - Individual tip amounts
  - Individual request times
  - Individual dedications (if provided)

---

## Chips and Icons

### Tip Amount Chip
```jsx
<Chip 
  icon={<AttachMoney />}
  label={`$${group.totalTip}`}
  color="success"
  size="small"
/>
```
- **Color:** Green (success)
- **Icon:** Dollar sign
- **Shows:** Total tips for this song

### Request Count Chip
```jsx
<Chip 
  icon={<People />}
  label={`${group.count} requests`}
  color="primary"
  size="small"
/>
```
- **Color:** Blue (primary)
- **Icon:** People
- **Shows:** Number of requests for this song
- **Only shown when:** count > 1

### Time Icon
```jsx
<AccessTime sx={{ fontSize: 16 }} />
```
- Shows when first request was made

### Song Icon
```jsx
<MusicNote color="primary" />
```
- Appears next to song name

---

## Routes

### New Route Added

```javascript
{
  path: ":id/view-requests",
  element: <ShowViewRequests />,
}
```

**URL Pattern:** `/shows/:id/view-requests`
**Access:** Public (no authentication required)
**Example:** `/shows/694d87a0d135c0ce18382028/view-requests`

---

## Navigation Flow

### From Show Detail Page

```
User on: /shows/123
         ↓
Clicks "View Requests" tab
         ↓
Navigates to: /shows/123/view-requests
```

### From View Requests Page

```
User on: /shows/123/view-requests
         ↓
Clicks "Request a Song" tab
         ↓
Navigates to: /shows/123
```

---

## Differences: Public View vs Performer View

| Feature | Public View (`/shows/:id/view-requests`) | Performer View (`/shows/:id/requests`) |
|---------|------------------------------------------|----------------------------------------|
| **Access** | Public (anyone) | Protected (performers only) |
| **Purpose** | See what others requested | Manage requests (accept/pass) |
| **Grouping** | Groups same songs | Shows all individually |
| **Actions** | None (read-only) | Accept, Pass, Complete |
| **Sorting** | By tip amount + time | By tip + time |
| **Details** | Aggregated tips/counts | Individual performer responses |
| **Phone** | Hidden (last 4 digits) | Visible to performers |

---

## Summary Statistics

**Shown at top of View Requests page:**

```
5 unique songs • 8 total requests • $45 in tips
```

**Calculation:**
- **Unique songs:** Number of distinct song names
- **Total requests:** Total number of request documents
- **Total tips:** Sum of all tip amounts

---

## Empty State

**When no requests exist:**

```
┌────────────────────────────────────────┐
│ Song Requests                          │
├────────────────────────────────────────┤
│ ℹ️ No requests yet.                    │
│   Be the first to request a song!     │
└────────────────────────────────────────┘
```

---

## Use Cases

### Use Case 1: Guest Wants to See Popular Songs
1. Guest visits show page
2. Clicks "View Requests" tab
3. Sees "Wonderwall" has 5 requests and $25 in tips
4. Decides to request a different song to stand out

### Use Case 2: Multiple Friends Request Same Song
1. Friend A requests "Happy Birthday" at 7:00 PM ($5)
2. Friend B requests "Happy Birthday" at 7:15 PM ($10)
3. Friend C requests "Happy Birthday" at 7:30 PM ($5)
4. View Requests shows:
   - "Happy Birthday" - $20 total, 3 requests
   - Individual breakdown visible

### Use Case 3: Performer Checks Public View
1. Performer visits their own show page
2. Sees two tabs: "Request a Song" and "View Requests"
3. Also sees "Performer View" button (separate admin view)
4. Can switch between public view and admin view

---

## Technical Implementation

### Files Created

1. **`client/src/components/show-header/show-header.jsx`**
   - Tabbed header component
   - Navigation logic
   - Active state management

2. **`client/src/components/show-header/index.js`**
   - Export file

3. **`client/src/pages/show-view-requests/show-view-requests.jsx`**
   - Public view requests page
   - Aggregation logic
   - Display components

4. **`client/src/pages/show-view-requests/index.js`**
   - Export file

### Files Modified

1. **`client/src/router.jsx`**
   - Added route for `/shows/:id/view-requests`
   - Imported ShowViewRequests component

2. **`client/src/pages/show-detail/show-detail.jsx`**
   - Replaced header with ShowHeader component
   - Kept "Performer View" button for performers

3. **`client/src/components/index.js`**
   - Added export for show-header

---

## Future Enhancements

### Possible Additions

1. **Real-time updates** - Use WebSocket to update when new requests come in
2. **Filter by status** - Show only pending/accepted/completed
3. **Search** - Search for specific songs
4. **Export** - Download request list as CSV
5. **Share** - Share link to view requests page
6. **Animations** - Animate when new requests appear
7. **Trending** - Highlight songs gaining momentum

---

## Testing Checklist

### Navigation
- [ ] "Request a Song" tab navigates to show detail page
- [ ] "View Requests" tab navigates to view requests page
- [ ] Active tab is highlighted correctly
- [ ] Tab state persists on page reload

### Aggregation
- [ ] Single request shows correctly (no count chip)
- [ ] Multiple requests for same song are grouped
- [ ] Total tips calculated correctly
- [ ] Request count is accurate
- [ ] Individual requests shown in grouped view

### Sorting
- [ ] Songs sorted by tip amount (highest first)
- [ ] When tips equal, sorted by time (earliest first)
- [ ] Sorting updates when new requests added

### Display
- [ ] Song names display correctly
- [ ] Tip amounts formatted with $
- [ ] Times formatted correctly (h:mm A)
- [ ] Dedications show when present
- [ ] Empty state shows when no requests

### Responsive
- [ ] Works on mobile devices
- [ ] Chips wrap properly on small screens
- [ ] Cards stack vertically
- [ ] Tab buttons responsive

---

## Summary

**Key Features:**
- Tabbed navigation header (Request a Song / View Requests)
- Public view of all requests with aggregation
- Groups multiple requests for same song
- Shows total tips and request counts
- Sorts by popularity (tips) and recency
- Separate from performer's admin view

This provides transparency for guests while keeping the performer's management interface separate and protected! 🎵📊

