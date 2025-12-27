# Guest Users and Phone Number Handling

## Overview
Users who submit song requests with only a phone number are treated as **guests** until they create an account.

---

## Guest User Logic

### Rule: **If a phone number doesn't exist in the database, the person is a guest (role: guest)**

### Flow:

```
User submits request with phone number
         ↓
Check: Does this phone exist in Users collection?
         ↓
    ┌────┴────┐
    YES       NO
    ↓         ↓
Link to      Guest
User         (user: null)
account      Track by phone only
```

---

## Implementation

### Song Request Creation (`server/src/routes/song-requests.js`)

**When a request is submitted with a phone number:**

```javascript
// 1. Normalize phone number
const phoneDigits = String(requesterPhone || '').replace(/[^\d]/g, '');

// 2. Check if user exists with this phone
const existingUser = await User.findOne({
  $or: [
    { phoneNumber: phoneDigits },
    { 'profile.phoneNumber': phoneDigits }
  ]
});

// 3. Create request
const request = new Request({
  show: showId,
  user: existingUser ? existingUser._id : null, // Link if exists, null if guest
  requesterPhone: phoneDigits, // Always store phone
  songs: processedSongs,
  // ... other fields
});
```

---

## User States

### 1. **Guest (No Account)**
- **Status:** Phone number NOT in database
- **Role:** N/A (no user record)
- **Request.user:** `null`
- **Request.requesterPhone:** `"1234567890"`
- **Tracking:** By phone number only
- **Can do:**
  - Submit song requests
  - See Venmo payment link
- **Cannot do:**
  - View request history
  - Manage profile
  - Be a performer

### 2. **Registered Guest (Account with role: 'guest')**
- **Status:** Phone number IS in database
- **Role:** `'guest'` (default role)
- **Request.user:** `ObjectId` (linked to User)
- **Request.requesterPhone:** `"1234567890"` (still stored)
- **Tracking:** By User ID + phone
- **Can do:**
  - Submit song requests
  - View their request history
  - Login with phone (via OTP or social auth)
  - Update profile
- **Cannot do:**
  - Create shows
  - Be a performer (until role upgraded)

### 3. **Registered User (role: 'user', 'performer', 'admin', etc.)**
- **Status:** Upgraded from guest
- **Role:** `'user'`, `'performer'`, `'admin'`, or `'organizer'`
- **Request.user:** `ObjectId`
- **Additional permissions based on role**

---

## Request Count Limits

The `maxRequestsPerUser` limit is enforced differently based on user status:

### For Guests (no account):
```javascript
// Count by phone number only
Request.countDocuments({
  show: showId,
  requesterPhone: phoneDigits,
  status: { $nin: ['cancelled', 'passed'] }
})
```

### For Registered Users:
```javascript
// Count by User ID (more reliable)
Request.countDocuments({
  show: showId,
  user: userId,
  status: { $nin: ['cancelled', 'passed'] }
})
```

**Why this matters:**
- Guests can't easily circumvent limits (tracked by phone)
- Registered users have more reliable tracking (can change phone, still tracked by ID)

---

## Creating a Guest Account

### Option 1: Phone Login/Verification
```javascript
POST /api/auth/phone/verify
{
  "phoneNumber": "1234567890",
  "code": "123456"
}
```
→ Creates User with `role: 'guest'` if doesn't exist

### Option 2: Social Auth
```javascript
POST /api/auth/social-callback
// User logs in with Google/Facebook
```
→ Creates User with `role: 'guest'`, captures phone from social profile

### Option 3: Traditional Registration
```javascript
POST /api/auth/register
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "1234567890" // Optional
}
```
→ Creates User with `role: 'guest'` by default

---

## Upgrading from Guest

Admins or organizers can upgrade a guest to a different role:

```javascript
// In User model
user.role = 'performer'; // or 'user', 'organizer', 'admin'
await user.save();
```

**Role Hierarchy:**
- `guest` → Basic access, can submit requests
- `user` → Registered user, full account features
- `performer` → Can perform at shows, manage song lists
- `organizer` → Can create and manage shows
- `admin` → Full system access

---

## Benefits of This Approach

### ✅ **Low Friction**
- Users can submit requests without creating an account
- Just need a phone number (for Venmo payment tracking)

### ✅ **Seamless Upgrade Path**
- When guest creates account with same phone → requests auto-link
- No data loss, maintains history

### ✅ **Security**
- Phone tracking prevents abuse (max requests per show)
- Can't easily create multiple "accounts" to bypass limits

### ✅ **Data Integrity**
- Always store phone number (even for registered users)
- Dual tracking: by User ID (if exists) + phone (always)

---

## Database Queries

### Find all requests for a phone number (guest or registered):
```javascript
// If user exists with this phone
const user = await User.findOne({
  $or: [{ phoneNumber: phone }, { 'profile.phoneNumber': phone }]
});

if (user) {
  // Get all requests linked to this user (even before they registered)
  const requests = await Request.find({
    $or: [
      { user: user._id },
      { requesterPhone: phone }
    ]
  });
} else {
  // Guest - get by phone only
  const requests = await Request.find({ requesterPhone: phone });
}
```

### Find all guests (users with guest role):
```javascript
const guests = await User.find({ role: 'guest' });
```

### Find all true guests (requests without user accounts):
```javascript
const guestRequests = await Request.find({ user: null });
```

---

## Future Enhancements

1. **Auto-link old requests when guest registers**
   - When user creates account, find all requests with their phone
   - Update `user` field to link historical requests

2. **Guest account cleanup**
   - Delete guest accounts with no activity after X days
   - Keep requests, just unlink user reference

3. **Role promotion notifications**
   - Notify users when upgraded from guest to performer

4. **Analytics**
   - Track conversion rate: guests → registered users
   - Which shows have most guest vs registered requests

---

## Summary

**Key Rule:** If a phone number doesn't exist in the database, the person is a guest.

- **Guest with no account:** `user: null`, tracked by phone only
- **Guest with account:** `user: ObjectId`, `role: 'guest'`, tracked by both
- **Registered user:** `user: ObjectId`, `role: 'user'/'performer'/etc.`

This provides a **frictionless experience** for first-time users while maintaining **data integrity** and **security** through phone number tracking.

