# Auth0 Setup Guide

## Current Configuration Issue

Your Auth0 application is rejecting the redirect URI: `http://localhost:3000`

## Required Auth0 Dashboard Settings

### 1. Go to Auth0 Dashboard
- Navigate to: https://manage.auth0.com/
- Select your tenant: `reconcilepro`
- Go to **Applications** → **Applications**

### 2. Find Your Application
- Look for the application with Client ID: `FuHyrH98UFNo5GxLLnjiqX8sxsXo5v63`
- Click on the application name

### 3. Update Application Settings

#### **Allowed Callback URLs**
Add this URL (one per line):
```
http://localhost:3000
```

#### **Allowed Logout URLs**
Add this URL:
```
http://localhost:3000
```

#### **Allowed Web Origins**
Add this URL:
```
http://localhost:3000
```

#### **Allowed Origins (CORS)**
Add this URL:
```
http://localhost:3000
```

### 4. Application Type
Make sure the application is set to:
- **Application Type**: Single Page Application (SPA)

### 5. Save Changes
Click **Save Changes** at the bottom of the page.

## Alternative: Use a Different Port

If you continue having issues, you can modify the app to use a different port:

### Option A: Use Port 3001
1. Update `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true
  }
})
```

2. Update Auth0 settings to include:
```
http://localhost:3001
```

### Option B: Use Port 8080
1. Update `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true
  }
})
```

2. Update Auth0 settings to include:
```
http://localhost:8080
```

## Testing the Configuration

1. After updating Auth0 settings, wait 1-2 minutes for changes to propagate
2. Clear your browser cache
3. Restart the development server:
   ```bash
   npm run dev
   ```
4. Try logging in again

## Common Issues

### Issue: "redirect_uri is not in the list of allowed callback urls"
**Solution**: Add the exact redirect URI to Auth0 allowed callback URLs

### Issue: CORS errors
**Solution**: Add the URL to "Allowed Web Origins" and "Allowed Origins (CORS)"

### Issue: Logout redirects to wrong page
**Solution**: Add the URL to "Allowed Logout URLs"

## Debug Information

The app logs the following information to help debug:
- Domain: `reconcilepro.auth0.com`
- Client ID: `FuHyrH98UFNo5GxLLnjiqX8sxsXo5v63`
- Redirect URI: `http://localhost:3000`
- Scopes: `openid profile email phone address` 