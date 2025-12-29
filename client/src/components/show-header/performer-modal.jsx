import PropTypes from "prop-types";
import { useMemo } from "react";
import {
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography
} from "@mui/material";
import { Close } from "@mui/icons-material";

const buildPerformerDetails = (rawPerformer) => {
  if (!rawPerformer) {
    return null;
  }

  if (typeof rawPerformer === "string") {
    return {
      id: rawPerformer,
      name: "Performer",
      image: "",
      description: "",
      key: rawPerformer,
    };
  }

  const profile = rawPerformer.profile || {};
  const id = rawPerformer._id || rawPerformer.id || rawPerformer.value || rawPerformer.userId || null;
  const nameCandidates = [
    profile.stageName,
    profile.name,
    [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    rawPerformer.username,
    rawPerformer.name,
  ].filter(Boolean);
  const name = nameCandidates[0] || "Performer";

  const image = profile.headshotUrl || profile.picture || profile.avatar || rawPerformer.picture || "";
  const description = profile.description || profile.bio || rawPerformer.description || "";

  return {
    id,
    key: id || `${name}-${Math.random().toString(36).slice(2)}`,
    name,
    image,
    description,
  };
};

export const usePerformerList = ({ show, performer }) => {
  return useMemo(() => {
    const list = [];
    const seen = new Set();

    const addPerformer = (raw) => {
      const details = buildPerformerDetails(raw);
      if (!details) return;
      const key = details.key || details.id || `${details.name}-${list.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ ...details, key });
    };

    addPerformer(performer || show?.performer);

    if (Array.isArray(show?.additionalPerformers)) {
      show.additionalPerformers.forEach((additional) => {
        addPerformer(additional);
      });
    }

    return list;
  }, [performer, show?.performer, show?.additionalPerformers]);
};

export const PerformerList = ({ performers, onSelect }) => {
  if (!Array.isArray(performers) || performers.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        rowGap: 1,
        mt: 0.5,
        width: "100%"
      }}
    >
      {performers.map((perf) => (
        <Box
          key={perf.key}
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(perf)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect?.(perf);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1,
            py: 0.75,
            borderRadius: 1,
            cursor: "pointer",
            outline: "none",
            transition: "background-color 0.2s ease-in-out",
            bgcolor: "background.paper",
            '&:hover': {
              bgcolor: "action.hover"
            },
            '&:focus-visible': {
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}40`
            }
          }}
        >
          <Avatar
            src={perf.image || undefined}
            alt={perf.name}
            sx={{ width: 48, height: 48, bgcolor: perf.image ? undefined : "primary.main" }}
          >
            {!perf.image && perf.name ? perf.name.slice(0, 1).toUpperCase() : null}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }} noWrap>
              {perf.name}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

PerformerList.propTypes = {
  performers: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
    description: PropTypes.string,
  })),
  onSelect: PropTypes.func,
};

PerformerList.defaultProps = {
  performers: [],
  onSelect: () => {},
};

export const PerformerModal = ({ open, performer, onClose }) => {
  const hasPerformer = Boolean(performer);

  return (
    <Dialog
      open={open && hasPerformer}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      {hasPerformer && (
        <>
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1
            }}
          >
            <Typography variant="h6" sx={{ pr: 2 }}>
              {performer.name || "Performer"}
            </Typography>
            <IconButton
              edge="end"
              onClick={onClose}
              aria-label="close performer details"
              size="small"
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 2,
                pt: 1,
                pb: 2
              }}
            >
              <Avatar
                src={performer.image || undefined}
                alt={performer.name}
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: performer.image ? undefined : "primary.main",
                  fontSize: "2.5rem"
                }}
              >
                {!performer.image && performer.name
                  ? performer.name.slice(0, 1).toUpperCase()
                  : null}
              </Avatar>

              <Typography
                variant="body1"
                sx={{ fontWeight: 600 }}
              >
                {performer.name || "Performer"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {performer.description?.trim()
                  ? performer.description
                  : "No description provided."}
              </Typography>
            </Box>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
};

PerformerModal.propTypes = {
  open: PropTypes.bool,
  performer: PropTypes.shape({
    name: PropTypes.string,
    image: PropTypes.string,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func,
};

PerformerModal.defaultProps = {
  open: false,
  performer: null,
  onClose: () => {},
};

export default PerformerModal;
