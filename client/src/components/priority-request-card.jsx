import PropTypes from "prop-types";
import dayjs from "dayjs";
import {
  Card,
  CardContent,
  Box,
  Chip,
  Typography,
  Button,
} from "@mui/material";
import { MusicNote, AccessTime } from "@mui/icons-material";

const ADD_TO_REQUEST_BG_COLOR = "#fff3e0";

const STATUS_COLOR_MAP = {
  playing: "success",
  add_to_request: "warning",
  alternate: "info",
  pending: "warning",
  queued: "info",
  declined: "error",
  played: "default",
};

const formatStatusLabel = (status) => {
  if (!status) {
    return "";
  }
  if (status === "add_to_request") {
    return "Add to this request";
  }
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const PriorityRequestCard = ({
  group,
  onAdd,
  helperText = "Performer alert: Prioritize this song?",
  requestLabel,
  showHelperText = true,
  showActionButton = false,
  actionText = "Add to this request",
  actionColor = "warning",
  showTime = true,
  sx = {}
}) => {
  if (!group) {
    return null;
  }

  const handleAdd = () => {
    if (typeof onAdd === "function") {
      onAdd(group);
    }
  };

  const computedRequestLabel = requestLabel
    || `${group.totalTip} ${group.totalTip === 1 ? "point" : "points"}, ${group.count} ${group.count === 1 ? "request" : "requests"}`;
  const statusLabel = formatStatusLabel(group.status);

  const hasDedications = Array.isArray(group.requests)
    && group.requests.some((req) => Boolean(req.dedication));

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: ADD_TO_REQUEST_BG_COLOR,
        borderColor: "warning.light",
        borderRadius: 2,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              icon={<MusicNote />}
              label={computedRequestLabel}
              color="success"
              size="small"
              clickable={Boolean(onAdd)}
              onClick={handleAdd}
              sx={{ fontWeight: 600, textTransform: "none" }}
            />
            {statusLabel && (
              <Chip
                label={statusLabel}
                color={STATUS_COLOR_MAP[group.status] || "default"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
            {showHelperText && helperText && (
              <Typography
                component="span"
                variant="caption"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                {helperText}
              </Typography>
            )}
          </Box>
          {showTime && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
              <AccessTime sx={{ fontSize: 14 }} />
              <Typography variant="caption">
                {dayjs(group.earliestTime).format("h:mm A")}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: hasDedications ? 1 : 0 }}>
          {group.songName}
        </Typography>

        {hasDedications && (
          <Box sx={{ pl: 2, borderLeft: 2, borderColor: "warning.light", mb: showActionButton ? 1 : 0 }}>
            {group.requests.filter((req) => req.dedication).map((req, idx) => (
              <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {`"${req.dedication}"${req.requesterName ? ` — ${req.requesterName}` : ''}`}
              </Typography>
            ))}
          </Box>
        )}

        {showActionButton && onAdd && (
          <Button
            variant="contained"
            color={actionColor}
            onClick={handleAdd}
            disableElevation
            sx={{
              mt: hasDedications ? 1 : 0.5,
              borderRadius: "999px",
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
              py: 1,
            }}
          >
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

PriorityRequestCard.propTypes = {
  group: PropTypes.shape({
    songName: PropTypes.string,
    totalTip: PropTypes.number,
    count: PropTypes.number,
    earliestTime: PropTypes.string,
    status: PropTypes.string,
    requests: PropTypes.arrayOf(PropTypes.shape({
      dedication: PropTypes.string,
      requesterName: PropTypes.string,
    })),
  }),
  onAdd: PropTypes.func,
  helperText: PropTypes.string,
  requestLabel: PropTypes.string,
  showHelperText: PropTypes.bool,
  showActionButton: PropTypes.bool,
  actionText: PropTypes.string,
  actionColor: PropTypes.oneOf(["primary", "secondary", "success", "info", "warning", "error"]),
  showTime: PropTypes.bool,
  sx: PropTypes.object,
};

export default PriorityRequestCard;
