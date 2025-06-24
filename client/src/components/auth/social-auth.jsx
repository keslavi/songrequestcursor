import { Box, Divider, Typography } from "@mui/material";
import { useAuth0 } from "@auth0/auth0-react";
import { store } from "@/store/store";
import { useAuthFlow } from "@/helpers/useAuthToken";

export const SocialAuth = () => {
  const { user, isAuthenticated: auth0Authenticated } = useAuth0();
  const { smartLogin } = useAuthFlow();
  const socialAuth = store.use.socialAuth();

  // Check if Auth0 is properly configured
  const isAuth0Configured = import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID;

  // Detect if user is on mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  };

  const onSocialLogin = async (provider, event) => {
    // Prevent form submission behavior and any potential parameter leakage
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      // Only call stopImmediatePropagation if it exists
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }
    
    // Clear any potential form state that might be in the URL or global state
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('is_submitting');
    currentUrl.searchParams.delete('sso');
    window.history.replaceState({}, '', currentUrl.toString());
    
    if (!isAuth0Configured) {
      console.error('Auth0 not configured. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID environment variables.');
      return;
    }

    try {
      console.log(`Starting ${provider} authentication...`);
      console.log('Current URL before auth:', window.location.href);
      
      // Use redirect flow for all devices (more reliable)
      await smartLogin(provider, async (token) => {
        // This callback won't be called with redirect flow
        // It's kept for potential future popup implementation
        console.log(`${provider} popup authentication successful`);
        await socialAuth('auth0', token, user);
        
        // Log user profile information
        console.log('=== USER PROFILE INFO ===');
        console.log('Name:', user?.name);
        console.log('Email:', user?.email);
        console.log('Picture:', user?.picture);
        console.log('Phone:', user?.phone_number);
        console.log('Provider:', user?.sub?.split('|')[0]);
        console.log('Full user object:', user);
        console.log('========================');
      });
      
      // With redirect flow, user will be redirected to Auth0 and back
      // The callback component will handle the success
      console.log(`${provider} redirect authentication initiated`);
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      // You could show a toast notification here
    }
  };

  // Don't render social auth if Auth0 is not configured
  if (!isAuth0Configured) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <button
          type="button"
          onClick={(event) => onSocialLogin('google-oauth2', event)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px', height: '20px' }} />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={(event) => onSocialLogin('facebook', event)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#1877f2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <img src="https://www.facebook.com/favicon.ico" alt="Facebook" style={{ width: '20px', height: '20px' }} />
          Continue with Facebook
        </button>

        <button
          type="button"
          onClick={(event) => onSocialLogin('apple', event)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <img src="https://www.apple.com/favicon.ico" alt="Apple" style={{ width: '20px', height: '20px' }} />
          Continue with Apple
        </button>
      </Box>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Or use your email
        </Typography>
      </Divider>

    </Box>
  );
};

export default SocialAuth; 