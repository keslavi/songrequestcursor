import { useState } from "react";
import { isEmpty } from "lodash";
import {
  IconButton,
  InputAdornment,
  Popover,
  Typography,
} from "@mui/material";

import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import { Clear, Help/*HelpOutline*/ as IconMui } from '@mui/icons-material';
import { color } from "@/theme-material";

export const Info = ({ id, info }) => {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  let infoHeader = null;
  let infoSubject = info;

  if (info && typeof info == 'string' && info.indexOf("|") > 0) {
    const arInfo = info.split("|");
    infoHeader = arInfo[0];
    infoSubject = arInfo[1];
  }

  const onClickIcon = e => {
    setAnchor(e.currentTarget);
  };

  const onClosePopover = e => {
    setAnchor(null);
  };

  return (
    <div style={{
      position: 'absolute',
      right: 10,
      top: 8,
      zIndex: 1
    }}>
      <HelpRoundedIcon
        sx={{ 
          color: color.primary.blue,
          cursor: 'pointer',
          fontSize: '1.2rem'
        }}
        onClick={onClickIcon} 
      />
      <Popover
        id={id}
        open={open}
        anchorEl={anchor}
        onClose={onClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          style: {
            width: "400px"
          }
        }}
      >
        {infoHeader &&
          <Typography variant="h5" gutterBottom>
            {infoHeader}
          </Typography>
        }
        {infoSubject ? String(infoSubject) : ""}
      </Popover>
    </div>
  );
};

export const InfoIcon = (props) => {
  const { id, info, label } = props;
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  let infoHeader = null;
  let infoSubject = info;

  if (typeof info === 'string') {
    if (info.indexOf("|") > 0) {
      const arInfo = info.split("|");
      infoHeader = arInfo[0];
      infoSubject = arInfo[1];
    }
  }

  const onTogglePopover = (e) => {
    const el = isEmpty(anchor) ? e.currentTarget : null;
    setAnchor(e.currentTarget);
  };

  const onClosePopover = (e) => {
    setAnchor(null);
  };

  const ret = (
    <>
      <IconMui
        color="primary"
        fontSize="small"
        onClick={onTogglePopover}
        sx={{
          color: color.cobe1.blue,
          position: 'absolute',
          top: 0,
          right: 0,
          transform: 'translate(-10%,50%)',
          cursor: "pointer"
        }}
      />

      {label}

      <Popover
        id={id}
        open={open}
        anchorEl={anchor}
        aria-hidden="false"
        onClose={onClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        slotProps={{ style: { width: "400px" } }}
      >
        <IconButton edge="start" aria-label="close" onClick={onClosePopover} style={{ position: 'absolute', top: '5px', right: '5px' }}>
          <Clear fontSize='small' className="clear-icon" />
        </IconButton>
        {infoHeader && (
          <Typography variant="h5" gutterBottom>
            {infoHeader}
          </Typography>
        )}
        {infoSubject}
      </Popover>
    </>
  );
  return ret;
};

export default Info;

