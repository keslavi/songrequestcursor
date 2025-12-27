import { Box, Button, Typography } from "@mui/material";
import { MusicNote, List } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export const ShowHeader = ({ show, performer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const showId = show?._id || show?.id;
  const isRequestPage = location.pathname === `/shows/${showId}`;
  const isViewRequestsPage = location.pathname === `/shows/${showId}/view-requests`;

  if (!show) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Show Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {show.name}
        </Typography>
        
        {performer && (
          <Typography variant="h6" color="text.secondary">
            Featuring {performer.profile?.firstName} {performer.profile?.lastName}
          </Typography>
        )}
      </Box>

      {/* Tab Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        borderBottom: 2,
        borderColor: 'divider'
      }}>
        <Button
          variant={isRequestPage ? "contained" : "outlined"}
          startIcon={<MusicNote />}
          onClick={() => navigate(`/shows/${showId}`)}
          sx={{
            borderRadius: '4px 4px 0 0',
            borderBottom: isRequestPage ? 'none' : undefined,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: isRequestPage ? 600 : 400
          }}
        >
          Request a Song
        </Button>
        
        <Button
          variant={isViewRequestsPage ? "contained" : "outlined"}
          startIcon={<List />}
          onClick={() => navigate(`/shows/${showId}/view-requests`)}
          sx={{
            borderRadius: '4px 4px 0 0',
            borderBottom: isViewRequestsPage ? 'none' : undefined,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: isViewRequestsPage ? 600 : 400
          }}
        >
          View Requests
        </Button>
      </Box>
    </Box>
  );
};

export default ShowHeader;

