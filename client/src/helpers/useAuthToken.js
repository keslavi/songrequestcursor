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
      if (isMobile()) {
        console.log('Mobile device detected - using redirect flow');
        await loginWithRedirect({ connection: provider });
        // User will be redirected to Auth0 and back to your app
        // The callback component will handle the success
      } else {
        console.log('Desktop device detected - using popup flow');
        await loginWithPopup({ connection: provider });
        // User stays on same page, handle success immediately
        const token = await getAccessTokenSilently();
        if (onSuccess) {
          onSuccess(token);
        }
      }
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      throw error;
    }
  }, [isMobile, loginWithPopup, loginWithRedirect, getAccessTokenSilently]);

  return {
    smartLogin,
    isMobile: isMobile(),
    loginWithPopup,
    loginWithRedirect
  };
}; 