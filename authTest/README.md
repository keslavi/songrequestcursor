# Auth0 Test App

A simple Vite React application to test Auth0 authentication and retrieve user profile information.

## Features

- Auth0 authentication with redirect flow
- Display user profile information:
  - Full name
  - Email address
  - Phone number
  - Zip code
  - Profile image
- Debug view showing raw user data

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Auth0 Configuration

This app is configured with:
- **Domain**: `reconcilepro.auth0.com`
- **Client ID**: `FuHyrH98UFNo5GxLLnjiqX8sxsXo5v63`

## Required Auth0 Settings

Make sure your Auth0 application has these settings:

### Allowed Callback URLs:
```
http://localhost:3000
```

### Allowed Web Origins:
```
http://localhost:3000
```

### Allowed Origins (CORS):
```
http://localhost:3000
```

## User Profile Data

The app requests the following scopes:
- `openid` - Required for authentication
- `profile` - For name and profile picture
- `email` - For email address
- `phone` - For phone number
- `address` - For address information including zip code

## Troubleshooting

If you get a 403 error:
1. Check that your Auth0 application settings include the correct callback URLs
2. Verify the domain and client ID are correct
3. Ensure the application is configured for Single Page Application (SPA) type 