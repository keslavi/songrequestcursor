# Request Statuses and Performer Actions

## Overview
Request statuses and performer accept/pass actions are **separate concepts**. Accept/pass are coordination signals between performers, while statuses track the actual state of the request.

---

## Request Statuses

### Status Enum
```javascript
['pending', 'playing', 'alternate', 'declined']
```

### Status Flow

```
pending ────┬───→ playing ──→ (song is being played)
            │
            ├───→ alternate ──→ (backup/maybe later)
            │
            └───→ declined ──→ (won't play this)
```

### Status Descriptions

| Status | Color | Meaning | Actions Available |
|--------|-------|---------|-------------------|
| **pending** | Yellow (warning) | Just submitted, awaiting decision | Accept/Pass, Change Status |
| **playing** | Green (success) | Currently being played | Accept/Pass |
| **alternate** | Blue (info) | Backup song, might play later | Accept/Pass, Change Status |
| **declined** | Red (error) | Won't be played | None (final) |

---

## Performer Actions (Accept/Pass)

### Purpose
Accept and pass are **coordination signals** between multiple performers:
- "I'll play this" (accept)
- "Not for me" (pass)

### Key Points

✅ **Do NOT change status** - Accept/pass are independent of status  
✅ **Visible to all performers** - Everyone sees who accepted/passed  
✅ **Can be changed** - Performers can switch between accept/pass  
✅ **No automatic status change** - Status must be changed separately  

---

## Visual Layout (Performer View)

```
┌────────────────────────────────────────┐
│ 🎵 Baby Got Back                       │
│ ⏰ 4:37 PM        [$10] [2 requests]   │
│ [pending] ← Status (separate concept)  │
├────────────────────────────────────────┤
│ Performer Actions                      │
│ ┌────────────────────────────────────┐ │
│ │ You (John)      [✓] [✗]           │ │ ← Accept/Pass (coordination)
│ │ Jane Smith       Accepted          │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ [Mark as Playing] [Alternate] [Decline]│ ← Status change buttons
└────────────────────────────────────────┘
```

---

## Example Scenarios

### Scenario 1: Performer Coordination
1. Request comes in: "Baby Got Back" - Status: **pending**
2. John clicks **Accept** ✓ (just indicating interest)
3. Jane clicks **Pass** ✗ (not interested)
4. Status still **pending** (no auto-change)
5. John clicks "Mark as Playing" → Status: **playing**

### Scenario 2: Multiple Performers Accept
1. Request: "Wonderwall" - Status: **pending**
2. Both John and Jane click **Accept** ✓
3. Status still **pending**
4. They decide John will play it
5. John clicks "Mark as Playing" → Status: **playing**

### Scenario 3: Change of Mind
1. Request: "Sweet Caroline" - Status: **pending**
2. John clicks **Accept** ✓
3. Jane clicks **Accept** ✓
4. Jane changes mind, clicks **Pass** ✗
5. Status still **pending** (coordination only)
6. John clicks "Mark as Alternate" → Status: **alternate**

---

## API Endpoints

### 1. Accept/Pass Action (Coordination)
```
PATCH /public/song-requests/:id/performer-action
```

**Request:**
```json
{
  "performerId": "ObjectId",
  "action": "accept" | "pass"
}
```

**Result:**
- Updates `performerResponses` array
- **Does NOT change status**
- Returns updated request

---

### 2. Status Change (Request State)
```
PATCH /public/song-requests/:id/status
```

**Request:**
```json
{
  "status": "pending" | "playing" | "alternate" | "declined",
  "performerNotes": "Optional notes"
}
```

**Result:**
- Changes request status
- Does NOT affect accept/pass responses
- Returns updated request

---

## Database Schema

### Request Model

```javascript
{
  status: 'pending' | 'playing' | 'alternate' | 'declined',
  
  performerResponses: [{
    performer: ObjectId,
    response: 'accept' | 'pass',
    respondedAt: Date
  }],
  
  // ... other fields
}
```

**Key Point:** `status` and `performerResponses` are **separate fields**

---

## UI Behavior

### Performer Actions Section
- **Always visible** for non-declined requests
- Shows accept/pass buttons for current user
- Shows other performers' responses as chips
- Independent of status

### Status Change Buttons
- **Always visible** for non-declined requests
- "Mark as Playing" - Sets status to playing
- "Mark as Alternate" - Sets status to alternate
- "Decline" - Sets status to declined (final)

### When Status is "Declined"
- Performer actions section **hidden**
- Status change buttons **hidden**
- Request is effectively closed

---

## Summary Statistics

Shows count by status:

```
Total: 10 | Pending: 5 | Playing: 2 | Alternate: 2 | Declined: 1 | Total Tips: $75
```

---

## Benefits of This Design

### ✅ **Clear Separation**
- Status = What's happening with the request
- Accept/Pass = Who's interested in playing it

### ✅ **Flexibility**
- Multiple performers can accept same song
- Status can be changed independently
- Coordination without automatic consequences

### ✅ **Visibility**
- All performers see each other's interest level
- Status clearly shows request state
- No confusion about what actions mean

### ✅ **Workflow Support**
- Performers coordinate with accept/pass
- Lead performer makes final status decision
- Can mark as alternate for later consideration

---

## Migration Note

**Breaking Change:** Status enum changed from:
```javascript
// Old
['pending', 'approved', 'rejected', 'completed', 'cancelled']

// New
['pending', 'playing', 'alternate', 'declined']
```

**Existing Data:** If you have existing requests with old statuses:
- `approved` → map to `playing` or `pending`
- `rejected` → map to `declined`
- `completed` → map to `playing` (was played)
- `cancelled` → map to `declined`

---

## Future Enhancements

### Possible Additions
1. **Auto-suggest status** - If all performers pass, suggest declining
2. **History tracking** - Log status changes with timestamps
3. **Performance notes** - Add notes when marking as playing
4. **Set list ordering** - Reorder playing/alternate songs
5. **Batch operations** - Mark multiple as declined/alternate at once

---

## Summary

**Key Concept:** Accept/Pass = Coordination, Status = State

- **Accept/Pass** = "I'm interested" / "Not for me" (between performers)
- **Status** = "pending" / "playing" / "alternate" / "declined" (request lifecycle)
- **Independent** = Changing one doesn't affect the other
- **Flexible** = Supports various performance workflows

This design gives performers the tools to coordinate effectively while maintaining clear request state! 🎵

