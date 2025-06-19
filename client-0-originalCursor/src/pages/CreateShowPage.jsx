import { useEffect } from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authStore from '../stores/auth/store';
import CreateShow from '../components/CreateShow';

const CreateShowPage = () => {
  const { user } = authStore((state) => ({
    user: state.user
  }));
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect unauthorized users to home page
    if (!user || !['admin', 'manager', 'performer'].includes(user.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || !['admin', 'manager', 'performer'].includes(user.role)) {
    return null; // Prevent flash of content during redirect
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Show
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <CreateShow />
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateShowPage; 