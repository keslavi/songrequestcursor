import { Card, CardContent, Typography, Button, Box, Avatar, Stack } from "@mui/material";
import { Person, MusicNote } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { store } from "@/store/store";
import { Row, Col } from "components";

const renderDetail = (label, value) => {
  if (!value) return null;
  return (
    <Typography variant="body2" sx={{ mb: 1 }}>
      <strong>{label}:</strong> {value}
    </Typography>
  );
};

export const Profile = () => {
  const user = store.use.user();
  const navigate = useNavigate();

  if (!user) {
    return <div>Loading...</div>;
  }

  const isPerformer = ['admin', 'performer', 'organizer'].includes(user.role);
  const profile = user.profile || {};
  const stageName = profile.stageName || profile.name || user.username;
  const primaryContact = user.email || profile.contactEmail || user.phoneNumber || profile.contactPhone;

  return (
    <>
      <Row>
        <Col size={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile
          </Typography>
        </Col>
      </Row>

      <Row>
        <Col size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={profile.picture}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5">{stageName}</Typography>
                  {primaryContact && (
                    <Typography variant="body2" color="text.secondary">
                      {primaryContact}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Role: {user.role}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/profile/edit')}>
                  Edit Performer Profile
                </Button>
              </Stack>

              {renderDetail('Username', user.username)}
              {renderDetail('Stage Name', profile.stageName)}
              {profile.firstName && renderDetail('Name', `${profile.firstName} ${profile.lastName || ''}`.trim())}
              {user.phoneNumber && renderDetail('Phone', user.phoneNumber)}
              {profile.contactPhone && profile.contactPhone !== user.phoneNumber && renderDetail('Public Phone', profile.contactPhone)}
              {profile.contactEmail && renderDetail('Public Email', profile.contactEmail)}
              {profile.venmoHandle && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Venmo:</strong> {profile.venmoHandle}
                  {profile.venmoConfirmDigits ? ` • ${profile.venmoConfirmDigits}` : ''}
                </Typography>
              )}
              {profile.headshotUrl && renderDetail('Headshot URL', profile.headshotUrl)}
              {profile.bio && renderDetail('Bio', profile.bio)}
              {profile.description && profile.description !== profile.bio && renderDetail('Description', profile.description)}
            </CardContent>
          </Card>
        </Col>

        {isPerformer && (
          <Col size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performer Tools
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage your songs and performances
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<MusicNote />}
                  onClick={() => navigate('/profile/songs')}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Manage My Songs
                </Button>
              </CardContent>
            </Card>
          </Col>
        )}
      </Row>
    </>
  );
};

export default Profile;

