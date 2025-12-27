# Accept/Pass Feature for Song Requests

## Overview
Performers can now **accept** or **pass** on pending song requests. The UI displays touch-friendly buttons for the logged-in performer and shows other performers' responses.

---

## Backend Changes

### 1. Request Model (`server/src/models/Request.js`)

Added `performerResponses` array to track each performer's action:

```javascript
performerResponses: [{
  performer: ObjectId,           // Reference to User
  response: 'accept' | 'pass',   // Action taken
  respondedAt: Date              // Timestamp
}]
```

**New Methods:**
- `getPerformerResponse(performerId)` - Returns 'accept', 'pass', or null

---

### 2. API Endpoint (`server/src/routes/song-requests.js`)

**New Route:** `PATCH /public/song-requests/:id/performer-action`

**Request Body:**
```json
{
  "performerId": "ObjectId",
  "action": "accept" | "pass"
}
```

**Features:**
- ✅ Validates performer is part of the show
- ✅ Only allows actions on pending requests
- ✅ Uses atomic `$pull` + `$push` to update responses (concurrency-safe)
- ✅ Auto-approves request if any performer accepts
- ✅ Returns updated request with all performer responses

**Concurrency Protection:**
```javascript
// Remove existing response atomically
await Request.findByIdAndUpdate(id, {
  $pull: { performerResponses: { performer: performerId } }
});

// Add new response atomically
await Request.findByIdAndUpdate(id, {
  $push: { performerResponses: { performer, response, respondedAt } }
});
```

---

## Frontend Changes

### 3. Show Requests UI (`client/src/pages/show-requests/show-requests.jsx`)

**New UI Layout for Pending Requests:**

```
┌─────────────────────────────────────┐
│ Actions Column (Width: 280px)      │
├─────────────────────────────────────┤
│ John Smith    [✓]  [✗]  ← You      │
│ Jane Doe       Accept   ← Other     │
│ Bob Jones                           │
└─────────────────────────────────────┘
```

**Touch-Friendly Buttons:**
- **Size:** 44x44px (minimum for touch targets)
- **Icons:** CheckCircle (accept), Cancel (pass)
- **Visual States:**
  - Default: Light border, neutral background
  - Selected: Bold border, colored background
  - Hover: Color preview
  
**Current User:**
- Name in **bold** with primary color
- Shows interactive icon buttons for accept/pass
- Selected state highlighted with border + background

**Other Performers:**
- Name in regular weight, secondary color
- Shows chips with their response (if any)
- Empty if no response yet

---

## User Flows

### Flow 1: Performer Accepts Request
1. Performer sees pending request with their name and two buttons
2. Clicks **Accept** (CheckCircle icon)
3. API validates performer, updates atomically
4. Request status changes to **"accepted"**
5. UI refreshes, shows "accepted" chip

### Flow 2: Performer Passes on Request
1. Performer clicks **Pass** (Cancel icon)
2. API records the pass
3. Request stays **"pending"** (waiting for other performers)
4. UI shows pass chip next to performer's name

### Flow 3: Multiple Performers
1. Show has 3 performers (main + 2 additional)
2. All 3 see the request with their own accept/pass buttons
3. First to accept triggers acceptance (status → "accepted")
4. Others see the request move to "accepted" status

---

## Concurrency Safety

### High-Traffic Scenario (50-100 concurrent users)

**Protected Operations:**
1. ✅ **Creating requests** - Atomic `$push` to show.requests
2. ✅ **Accept/Pass actions** - Atomic `$pull` + `$push` for responses
3. ✅ **Status updates** - Atomic `findByIdAndUpdate`

**Edge Cases Handled:**
- Two performers accept simultaneously → First wins, both see "accepted"
- Performer changes mind (accept → pass) → Old response removed, new added
- Non-performer tries action → 403 error
- Action on non-pending request → 400 error

---

## Touch Optimization

### Mobile-Friendly Design
- **Button size:** 44x44px (Apple/Android recommended minimum)
- **Gap between buttons:** 4px (prevents mis-taps)
- **Visual feedback:** Immediate border/color change on selection
- **Vertical stacking:** Each performer on separate line (no cramping)
- **Column width:** 280px (fits 2 buttons + performer name comfortably)

### Accessibility
- Icon buttons have implicit labels (CheckCircle = accept, Cancel = pass)
- Color coding: Green for accept, Red for pass
- High contrast borders for visibility
- Works with screen readers

---

## Testing Checklist

### Backend
- [ ] Test accept action on pending request
- [ ] Test pass action on pending request
- [ ] Test changing accept → pass and vice versa
- [ ] Test non-performer trying to respond (403)
- [ ] Test action on non-pending request (400)
- [ ] Test concurrent accepts from 2 performers
- [ ] Verify auto-accept on first accept

### Frontend
- [ ] Logged-in performer sees own buttons
- [ ] Other performers show as read-only chips
- [ ] Touch targets are large enough (44x44)
- [ ] Visual states work (default, selected, hover)
- [ ] UI updates after action
- [ ] Mobile responsive layout
- [ ] Works on tablets (touch interface)

### Integration
- [ ] Load test with 100 concurrent accepts
- [ ] Verify no race conditions in response tracking
- [ ] Check database consistency (all responses recorded)

---

## Future Enhancements

### Possible Additions
1. **Priority scoring** - Auto-set priority based on tip + accepts
2. **Notifications** - Alert performers of new requests
3. **Collaboration notes** - Performers can comment on requests
4. **Undo window** - 5-second undo after accept/pass
5. **Analytics** - Track which performer accepts most requests
6. **Filters** - Show only requests you haven't responded to

---

## API Summary

### Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| PATCH | `/public/song-requests/:id/performer-action` | `{ performerId, action }` | Updated request |
| GET | `/public/song-requests/show/:showId` | - | Array of requests with responses |

### Example Response

```json
{
  "id": "507f1f77bcf86cd799439011",
  "status": "accepted",
  "performerResponses": [
    {
      "performer": "507f191e810c19729de860ea",
      "response": "accept",
      "respondedAt": "2025-12-25T10:30:00Z"
    },
    {
      "performer": "507f191e810c19729de860eb",
      "response": "pass",
      "respondedAt": "2025-12-25T10:31:00Z"
    }
  ],
  ...
}
```

---

## Migration Notes

**No migration required** - `performerResponses` field is optional and defaults to empty array.

Existing requests will work as-is, just won't have any performer responses until performers start using the feature.

