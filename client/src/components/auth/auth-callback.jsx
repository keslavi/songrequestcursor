import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { store } from '@/store/store';
import { Box, CircularProgress, Typography } from '@mui/material';

export const AuthCallback = () => {
  const { isAuthenticated, getAccessTokenSilently, user, isLoading, error } = useAuth0();
  const navigate = useNavigate();
  const socialAuth = store.use.socialAuth();

  useEffect(() => {
    const onCallback = async () => {
      if (isLoading) return;

      if (error) {
        console.error('Auth0 callback error:', error);
        navigate('/auth/login?error=auth0_error');
        return;
      }

      if (isAuthenticated && user) {
        try {
          console.log('=== AUTH0 CALLBACK SUCCESS ===');
          console.log('User authenticated:', user);
          
          const token = await getAccessTokenSilently();
          console.log('Access token obtained');
          
          await socialAuth('auth0', token, user);
          
          console.log('=== USER PROFILE INFO ===');
          console.log('Name:', user?.name);
          console.log('Email:', user?.email);
          console.log('Picture:', user?.picture);
          console.log('Phone:', user?.phone_number);
          console.log('Provider:', user?.sub?.split('|')[0]);
          console.log('Full user object:', user);
          console.log('========================');
          
          // Redirect to home page
          navigate('/');
        } catch (error) {
          console.error('Error handling auth callback:', error);
          navigate('/auth/login?error=token_error');
        }
      }
    };

    onCallback();
  }, [isAuthenticated, user, isLoading, error, getAccessTokenSilently, socialAuth, navigate]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1">
          Completing sign in...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Sign in failed
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="50vh"
      gap={2}
    >
      <CircularProgress />
      <Typography variant="body1">
        Processing authentication...
      </Typography>
    </Box>
  );
};

export default AuthCallback; 