import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export const useAuthToken = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const getToken = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User is not authenticated');
    }
    return await getAccessTokenSilently();
  }, [getAccessTokenSilently, isAuthenticated]);

  return {
    getToken,
    isAuthenticated
  };
};

export const useUserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const getUserInfo = useCallback(() => {
    if (!isAuthenticated || !user) {
      return null;
    }

    return {
      // Basic info
      id: user.sub,
      email: user.email,
      emailVerified: user.email_verified,
      
      // Name variations
      name: user.name,
      givenName: user.given_name,
      familyName: user.family_name,
      nickname: user.nickname,
      
      // Profile image
      picture: user.picture,
      
      // Contact info
      phoneNumber: user.phone_number,
      phoneNumberVerified: user.phone_number_verified,
      
      // Additional info
      locale: user.locale,
      updatedAt: user.updated_at,
      
      // Social provider info
      provider: user.sub?.split('|')[0], // 'google-oauth2', 'facebook', etc.
      
      // Raw user object for access to any other fields
      raw: user
    };
  }, [isAuthenticated, user]);

  return {
    user: getUserInfo(),
    isAuthenticated,
    isLoading,
    hasProfile: isAuthenticated && user !== undefined
  };
};

export const useAuthFlow = () => {
  const { loginWithPopup, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  // Detect if user is on mobile device
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }, []);

  // Smart authentication that chooses the best flow
  const smartLogin = useCallback(async (provider, onSuccess) => {
    try {
      // Use redirect flow for both mobile and desktop (more reliable)
      console.log('Using redirect flow for authentication');
      console.log('Provider:', provider);
      console.log('Auth0 configuration:', {
        domain: import.meta.env.VITE_AUTH0_DOMAIN,
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
        scope: "openid profile email phone address offline_access"
      });
      
      await loginWithRedirect({ 
        connection: provider,
        scope: "openid profile email phone address offline_access"
      });
      // User will be redirected to Auth0 and back to your app
      // The callback component will handle the success
      
      // Note: onSuccess callback won't be called with redirect flow
      // The callback component will handle the authentication success
      console.log(`${provider} redirect authentication initiated`);
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      throw error;
    }
  }, [loginWithRedirect]);

  return {
    smartLogin,
    isMobile: isMobile(),
    loginWithPopup,
    loginWithRedirect
  };
}; 