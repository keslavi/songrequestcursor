import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { MusicNote, List } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { Fieldset } from "components";
import { PerformerModal, PerformerList, usePerformerList } from "./performer-modal";

export const ShowHeader = ({ show, performer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPerformer, setSelectedPerformer] = useState(null);
  const [performerModalOpen, setPerformerModalOpen] = useState(false);

  if (!show) return null;

  const showId = show?._id || show?.id;
  const isRequestPage = location.pathname === `/shows/${showId}`;
  const isViewRequestsPage = location.pathname === `/shows/${showId}/view-requests`;
  const performersList = usePerformerList({ show, performer });

  const handlePerformerClick = (details) => {
    if (!details) return;
    setSelectedPerformer(details);
    setPerformerModalOpen(true);
  };

  const handleCloseModal = () => {
    setPerformerModalOpen(false);
    setSelectedPerformer(null);
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <Fieldset sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            component="h1"
            noWrap
            sx={{
              width: "100%",
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {show.name}
          </Typography>

          <PerformerList performers={performersList} onSelect={handlePerformerClick} />
        </Fieldset>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            borderBottom: 2,
            borderColor: "divider"
          }}
        >
          <Button
            variant={isRequestPage ? "contained" : "outlined"}
            startIcon={<MusicNote />}
            onClick={() => navigate(`/shows/${showId}`)}
            sx={{
              borderRadius: "4px 4px 0 0",
              borderBottom: isRequestPage ? "none" : undefined,
              textTransform: "none",
              fontSize: "1rem",
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
              borderRadius: "4px 4px 0 0",
              borderBottom: isViewRequestsPage ? "none" : undefined,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: isViewRequestsPage ? 600 : 400
            }}
          >
            View Requests
          </Button>
        </Box>
      </Box>

      <PerformerModal
        open={performerModalOpen}
        performer={selectedPerformer}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default ShowHeader;

