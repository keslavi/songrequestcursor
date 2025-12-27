# Concurrency Fixes Applied

## Scenario
- 50-100 users creating song requests simultaneously
- Performer editing request statuses and show details concurrently
- Individual users make 1 request at a time

## Issues Identified & Fixed

### 1. ✅ Lost Request IDs in Show.requests Array
**Problem**: Multiple concurrent request creations could overwrite each other's changes to the `show.requests[]` array.

**Original Code** (vulnerable):
```javascript
show.requests.push(request._id);
await show.save();
```

**Fixed Code** (atomic):
```javascript
await Show.findByIdAndUpdate(
  showId,
  { $push: { requests: request._id } },
  { new: true }
);
```

**File**: `server/src/routes/song-requests.js` lines 107-111

---

### 2. ✅ Request Limit Not Enforced
**Problem**: `maxRequestsPerUser` setting was never checked, allowing unlimited requests.

**Fixed**: Added validation before request creation
```javascript
const existingRequestCount = await Request.countDocuments({
  show: showId,
  requesterPhone: phoneDigits,
  status: { $nin: ['cancelled', 'passed'] }
});

if (existingRequestCount >= show.settings.maxRequestsPerUser) {
  ctx.status = 400;
  ctx.body = { 
    error: `Maximum ${show.settings.maxRequestsPerUser} requests per user reached` 
  };
  return;
}
```

**File**: `server/src/routes/song-requests.js` lines 49-65

**Note**: Small race window remains between check and save (acceptable for this use case).

---

### 3. ✅ Request Status Updates - Race Conditions
**Problem**: Performer rapidly updating statuses could cause lost updates with read-modify-write pattern.

**Original Code** (vulnerable):
```javascript
const request = await Request.findById(id);
request.status = status;
request.performerNotes = performerNotes;
if (status === 'completed') {
  request.completedAt = new Date();
}
await request.save();
```

**Fixed Code** (atomic):
```javascript
const updateFields = { status };
if (performerNotes !== undefined) {
  updateFields.performerNotes = performerNotes;
}
if (status === 'completed') {
  updateFields.completedAt = new Date();
}

const request = await Request.findByIdAndUpdate(
  id,
  { $set: updateFields },
  { new: true, runValidators: true }
).populate('show');
```

**File**: `server/src/routes/song-requests.js` lines 166-181

---

### 4. ✅ Show Updates - Race Conditions
**Problem**: Show updates used Object.assign + save pattern, vulnerable to lost updates.

**Original Code** (vulnerable):
```javascript
Object.assign(show, updates);
await show.save();
ctx.body = await Show.findById(show._id).populate(...);
```

**Fixed Code** (atomic):
```javascript
const updatedShow = await Show.findByIdAndUpdate(
  ctx.params.id,
  { $set: updates },
  { new: true, runValidators: true }
)
  .populate('createdBy', 'profile')
  .populate('performer', 'profile')
  .populate('additionalPerformers', 'profile');
```

**File**: `server/src/routes/shows.js` lines 111-119

---

## MongoDB Operations Used

All fixes use **atomic MongoDB operations**:

| Operation | Purpose | Thread-Safe |
|-----------|---------|-------------|
| `$push` | Append to array | ✅ Yes |
| `$set` | Update specific fields | ✅ Yes |
| `findByIdAndUpdate()` | Find + update atomically | ✅ Yes |

## Benefits

✅ **No lost updates** - All writes are atomic  
✅ **High throughput** - 50-100 concurrent creates handled safely  
✅ **Performer can work concurrently** - Status updates won't conflict with creates  
✅ **Request limits enforced** - Prevents spam  
✅ **Validation still runs** - `runValidators: true` option  

## Testing Recommendations

1. **Load test with ApacheBench/k6**:
   ```bash
   # Simulate 100 concurrent request creations
   ab -n 1000 -c 100 -T application/json -p request.json \
      http://localhost:3001/api/song-requests
   ```

2. **Verify all request IDs in show**:
   ```javascript
   // In Studio 3T or mongo shell
   const show = db.shows.findOne({_id: ObjectId("...")});
   const requestCount = db.requests.countDocuments({show: show._id});
   console.log(show.requests.length === requestCount); // Should be true
   ```

3. **Test concurrent status updates**:
   - Open show detail in 2 browser tabs
   - Both performers update different requests simultaneously
   - Verify no updates are lost

## Future Enhancements

For even stricter guarantees, consider:

- **MongoDB Transactions**: Wrap entire request creation in transaction
- **Optimistic Locking**: Add `__v` version field checks
- **Request Queue**: Use Redis/Bull for request processing
- **Rate Limiting**: Add per-IP rate limits (not just per-phone)

