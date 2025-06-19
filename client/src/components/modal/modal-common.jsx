import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { WidthFull } from "@mui/icons-material";
import { head, rest } from "lodash";

export const ModalCommon = ({
  children,
  isModalOpen,
  toggleModal,
  header,
  hideCloseIcon,
  titleStyle,
  width,
  height,
  ...rest
}) => {



  return (
    <Dialog
      open={isModalOpen}
      {...rest} >
      <DialogTitle
        style={titleStyle || {}}
        sx={{ m: 0, p: 2 }}
        color="primary"
      >
        {header}
        {!hideCloseIcon && (
          <IconButton
            aria-label="close"
            onClick={toggleModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              //color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export default ModalCommon;

