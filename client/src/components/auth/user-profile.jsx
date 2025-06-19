import { Box, Avatar, Typography, Chip, Divider } from '@mui/material';
import { useUserProfile } from '@/helpers/useAuthToken';

export const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading user profile...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Not authenticated</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      {/* Profile Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={user.picture}
          alt={user.name}
          sx={{ width: 80, height: 80, mr: 2 }}
        />
        <Box>
          <Typography variant="h6" component="h2">
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Chip 
            label={user.provider} 
            size="small" 
            sx={{ mt: 1 }}
            color="primary"
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* User Details */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Full Name
        </Typography>
        <Typography variant="body1">
          {user.givenName} {user.familyName}
        </Typography>
      </Box>

      {user.nickname && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Nickname
          </Typography>
          <Typography variant="body1">
            {user.nickname}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Email
        </Typography>
        <Typography variant="body1">
          {user.email}
          {user.emailVerified && (
            <Chip 
              label="Verified" 
              size="small" 
              color="success" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
      </Box>

      {user.phoneNumber && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Phone Number
          </Typography>
          <Typography variant="body1">
            {user.phoneNumber}
            {user.phoneNumberVerified && (
              <Chip 
                label="Verified" 
                size="small" 
                color="success" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
      )}

      {user.locale && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Locale
          </Typography>
          <Typography variant="body1">
            {user.locale}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          User ID
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {user.id}
        </Typography>
      </Box>

      {/* Debug Info */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Debug Info
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {JSON.stringify(user.raw, null, 2)}
        </Typography>
      </Box>
    </Box>
  );
};

export default UserProfile; 