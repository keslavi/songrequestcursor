# Additional Performer Access Fix

## Problem
Additional performers on a show were being treated as guests and could not access the performer's request screen.

## Root Cause
The frontend was comparing Auth0 user IDs (e.g., "auth0|...") with MongoDB ObjectIds when checking if a user should see the "Performer View" button and have access to the performer request management screen.

## Solution

### 1. Use MongoDB User ID from Store
Instead of using Auth0's `user.id`, we now use the MongoDB `_id` that's returned from the backend's `/public/auth/me` endpoint and stored in the Zustand store.

**Files Changed:**
- `client/src/pages/show-detail/show-detail.jsx`
- `client/src/pages/show-requests/show-requests.jsx`

### 2. Changes to `show-detail.jsx`

**Added State:**
```javascript
const [currentUserId, setCurrentUserId] = useState(null);
```

**Added Effect to Set User ID:**
```javascript
useEffect(() => {
  if (isAuthenticated && user?.id) {
    setCurrentUserId(user.id);
    console.log('🔐 Current user ID set:', user.id);
    console.log('🔐 User role:', user.role);
  } else {
    setCurrentUserId(null);
  }
}, [isAuthenticated, user]);
```

**Updated Performer Access Check:**
```javascript
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
```

### 3. Changes to `show-requests.jsx`

**Replaced Auth0 Imports:**
```javascript
// OLD:
import { useAuth0 } from "@auth0/auth0-react";
import { useUserProfile } from "@/helpers/useAuthToken";
const { user: auth0User, isAuthenticated } = useAuth0();
const { user } = useUserProfile();

// NEW:
import { store } from "@/store/store";
const user = store.use.user();
const isAuthenticated = store.use.isAuthenticated();
```

**Added Effect to Set User ID:**
```javascript
useEffect(() => {
  if (isAuthenticated && user?.id) {
    setCurrentUserId(user.id);
    console.log('🔐 Show Requests - Current user ID:', user.id);
    console.log('🔐 Show Requests - User role:', user.role);
  } else {
    setCurrentUserId(null);
  }
}, [isAuthenticated, user]);
```

**Removed Redundant API Call:**
Removed the code that was fetching `/public/auth/me` again since the user data is already in the store.

## How It Works

1. When a user logs in (via email/password, phone, or social auth), the backend returns a JWT token and user profile.
2. The user profile includes `id: user._id` (the MongoDB ObjectId).
3. The frontend stores this in the Zustand store via `authSlice.checkAuth()`.
4. Both `show-detail.jsx` and `show-requests.jsx` now use `user.id` from the store.
5. The performer access check compares this MongoDB ID with:
   - `show.performer._id` (main performer)
   - `show.additionalPerformers[].id` (additional performers)

## Backend Support

The backend already properly populates `additionalPerformers` in the show data:

**In `server/src/routes/public-shows.js`:**
```javascript
const show = await Show.findById(ctx.params.id)
  .populate('performer', 'profile')
  .populate('additionalPerformers', 'profile');
```

**In `server/src/models/Show.js`:**
```javascript
additionalPerformers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
```

The `hasAccess` method on the Show model also correctly checks additional performers:
```javascript
showSchema.methods.hasAccess = function(userId, userRole) {
  // ... checks for admin, creator, main performer ...
  
  // Additional performers have access
  if (this.additionalPerformers && this.additionalPerformers.some(p => p.toString() === userId.toString())) return true;
  
  return false;
};
```

## Testing

To verify the fix:

1. Create a show with a main performer
2. Add an additional performer to the show
3. Log in as the additional performer
4. Navigate to the show detail page
5. Verify that the "Performer View" button appears
6. Click the button to access the performer request management screen
7. Verify that accept/pass icons appear for the logged-in performer

## Debug Logging

Added console logs to help diagnose issues:
- `🔐 Current user ID set: [id]` - When user ID is set
- `🔐 User role: [role]` - The user's role
- `🎭 Checking performer access:` - Detailed breakdown of performer access checks

