import * as React from 'react';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { StoreContext } from '../controllers/store';
import TestButton from './hud';
import { ST_COLORS } from '../models/theme';

export interface SnackbarInfo {
    open: boolean;
    severity: SNACKBAR_SEVERITY;
    message: string;
    msTimeout: number | SNACKBAR_TIMEOUTS; 
    cb?: () => void,
}

export enum SNACKBAR_SEVERITY {
    info = "info",
    warning = "warning",
    error = "error",
    success = "success"
}

export enum SNACKBAR_TIMEOUTS {
    short = 3000,
    normal = 5000,
    long = 8000,
}

export const NULL_SNACKBAR:SnackbarInfo = {
    open: false,
    severity: SNACKBAR_SEVERITY.info,
    message: "",
    msTimeout: 5000,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export function TestSnackbar() {
    const {
        snackbar: [state, openSnackbar, setState],
    } = React.useContext(StoreContext)

    const error = () => {
        openSnackbar(
            "Hi mom",
            SNACKBAR_SEVERITY.error,
            undefined,
            () => { console.log("error done"); }
        );
    };
    const warning = () => {
        openSnackbar(
            "Hi mom",
            SNACKBAR_SEVERITY.warning,
        );
    };
    const info = () => {
        openSnackbar(
            "Hi mom",
            SNACKBAR_SEVERITY.info,
        );
    };
    const success = () => {
        openSnackbar(
            "Hi mom",
            SNACKBAR_SEVERITY.success,
        );
    };

    return (
        <Stack direction="row" spacing={2}>
            <TestButton onClick={info} variant="contained">Info</TestButton>
            <TestButton onClick={warning} variant="contained">Warning</TestButton>
            <TestButton onClick={error} variant="contained">Error</TestButton>
            <TestButton onClick={success} variant="contained">Success</TestButton>
        </Stack>
    );
}

export default function STSnackbar() {
    const {
        snackbar: [state, openSnackbar, setState],
    } = React.useContext(StoreContext)

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        if( state.cb ) state.cb();

        setState(
            Object.assign({},{
                ...state,
                cb: undefined,
                open: false,
            })
        );
    }

    const getColor = (severity: SNACKBAR_SEVERITY) => {
        switch(severity){
            case SNACKBAR_SEVERITY.info: return ST_COLORS.blue;
            case SNACKBAR_SEVERITY.warning: return ST_COLORS.gold;
            case SNACKBAR_SEVERITY.error: return ST_COLORS.red;
            case SNACKBAR_SEVERITY.success: return ST_COLORS.green;
        }
    }

    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
        <Snackbar open={state.open} autoHideDuration={state.msTimeout} onClose={handleClose}>
            <Alert onClose={handleClose} severity={state.severity} sx={{ width: '100%', background: getColor(state.severity), color: ST_COLORS.black, }}>
            {state.message}
            </Alert>
        </Snackbar>
        </Stack>
    );
}
