import { ModalCommon } from './modal-common';
import { Button, Modal } from '@mui/material';
import { LabelHeading } from "@/components";

export const ModalConfirmExit = ({
  isOpen,
  toggle,
  onCancel,
  onConfirm,
}) => {

  const onClickCancel = () => {
    toggle();
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  const onClickConfirm = () => {
    toggle();
    if (typeof onConfirm === 'function') {
      onConfirm();
    } else {
      console.warn('onConfirm function is not defined');
    }
  };

  return (
    <ModalCommon
      isModalOpen={isOpen}
      header="Exit Application"
      hideCloseIcon={true}
      width="400px"
      height="200px"
    >
      <LabelHeading variant="h2">Any recent updates may not be saved. Are you sure you want to continue?</LabelHeading>
      <br /><br />
      <Button
        id="btnSave"
        variant="contained"
        onClick={() => { onClickConfirm(e) }}
      >Yes</Button>
      &nbsp;&nbsp;
      <Button
        variant="outlined"
        onClick={(e) => { onClickCancel(e) }}
      >No</Button>
    </ModalCommon>
  )

}