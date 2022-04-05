import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { StoreContext } from '../controllers/store';


export interface PopupInfo {
    showing: boolean,
    title: string,
    message: string,
    cb?: () => void,
};

export const NULL_POPUP: PopupInfo = {
    showing: false,
    title: "",
    message: "",
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function STPopup() {
  const {
    popup: [popup, showPopup, setPopup],
} = React.useContext(StoreContext)

  const handleClose = () => {
    if(popup.cb){popup.cb();}
    setPopup(NULL_POPUP);
  };

  return (
    <div>
      <Dialog
        open={popup.showing}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{popup.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            {popup.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}