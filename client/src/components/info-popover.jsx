import { useState } from "react";
import { Popover } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";


const InfoPopover = ({ info }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const onClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  const open = Bollean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <InfoIcon
        aria-describedby={id}
        variant="contained"
        onClick={onClick}
      />Open
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div>
          {info?.header && <p>{info.header}</p>}
          {info?.content && (
            <ul style={{ listStyleType: "none", paddingLeft: "20px" }}>
              {info.content.map((item, index) => (
                <li key={index} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '-20px' }}>.</span>
                  {item}
                </li>
              ))}
            </ul>
          )

          }
        </div>
      </Popover>
    </div>
  )
}
export default InfoPopover;



