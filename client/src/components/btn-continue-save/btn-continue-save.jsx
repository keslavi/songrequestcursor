import { useEffect, useState } from "react";
import { color } from "@/theme-material"
import { toast } from "react-toastify";
import {
  AppBar,
  Button,
  Toolbar,
} from "@mui/material";

import { ModalConfirmExit } from "components";
//import { store } from '@/store';

export const BtnContinueSave = (props) => {
  /*
    we are setting an isDraft variable in global window object
    when then component is mounted, so we clean when unmounted
  */

  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    return () => {
      delete window.isDraft;
    };
  }, []);

  const { confirmExit } = props;

  const textContinue = props.textContinue || "Continue";
  const textSave = props.textSave || "Save";
  const disableButton = props.disabled || false;


  const onClickContinueSave = (e) => {
    e.preventDefault();
    const id = e.currentTarget.id;
    switch (id) {
      case "btnContinue":
        window.isDraft = false;
        break;
      case "btnSave":
        if (confirmExit && !window.isDraft) {
          toggleModal();
          return;
        }
        window.isDraft = true;
        break;
      default:
        toast.error(`onClickContinueSave ${id} not found`);
        return;
    }

    if (props.onClickContinueSave) {
      props.onClickContinueSave(e);
      return;
    }
    e.currentTarget.form.requestSubmit();
  }

  const onModalConfirm = (e) => {
    window.isDraft = true;
    if (props.onClickContinueSave) {
      props.onClickContinueSave(e);
      return;
    }
    e.currentTarget.form.requestSubmit();
  }


  return (
    <>
      <ModalConfirmExit
        isOpen={isModalOpen}
        toggle={toggleModal}
        onConfirm={onClickContinueSave}
      />
      <AppBar
        position="fixed"
        sx={{
          top: 'auto',
          bottom: 0,
          boxShadow: 'none',
          zIndex: 3000,
        }}
      >
        <Toolbar
          disableGutters
          variant="dense"
          sx={{
            px: 2,
            boxShadow: "none",
            bgcolor: color.primary.white,
            //color: color.primary.blue,
          }}>
          &nbsp;&nbsp;
          <Button
            id="btnContinue"
            variant="contained"
            disabled={disableButton}
            onClick={onClickContinueSave}
          >
            {textContinue}
          </Button>
          &nbsp;&nbsp;
          <Button
            id="btnSave"
            onClick={onClickContinueSave}
            variant="outlined"
            disabled={disableButton}
          >
            {textSave}
          </Button>
        </Toolbar>
      </AppBar>
    </>
  );
}
