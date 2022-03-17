import React from "react";
import * as STSnackbar from "../views/snackbar";
import * as STCurtains from "../views/curtains";


export interface Store {
    snackbar: [
        STSnackbar.SnackbarInfo, 
        (
            message: string,
            severity?: STSnackbar.SNACKBAR_SEVERITY,
            msTimeout?: STSnackbar.SNACKBAR_TIMEOUTS,
            cb?: ()=>void,
        ) => void,
        React.Dispatch<React.SetStateAction<STSnackbar.SnackbarInfo>>
    ],
    curtains: [
        STCurtains.CurtainsInfo,
        ( 
            message: string, 
            cb?: ()=>void 
        ) => void,
        React.Dispatch<React.SetStateAction<STCurtains.CurtainsInfo>>
    ]

};

export const StoreContext = React.createContext<Store>({
    snackbar: [STSnackbar.NULL_SNACKBAR, (null as any), (null as any)],
    curtains: [STCurtains.NULL_CURTAINS, (null as any), (null as any)],
})

export default function StoreProvider({ children }:any) {
    // Snackbar
    const [snackbar, setSnackbar] = React.useState(STSnackbar.NULL_SNACKBAR);
    const showSnackbar = (
        message: string,
        severity?: STSnackbar.SNACKBAR_SEVERITY,
        msTimeout?: STSnackbar.SNACKBAR_TIMEOUTS,
        cb?: ()=>void,
    ) => {
        setSnackbar({
            open: true,
            severity: severity ?? STSnackbar.SNACKBAR_SEVERITY.info,
            message: message,
            msTimeout: (msTimeout ?? STSnackbar.SNACKBAR_TIMEOUTS.normal),
            cb: cb,
        });
    }

    // Curtains
    const [curtains, setCurtains] = React.useState(STCurtains.NULL_CURTAINS);
    const drawCurtains = ( message: string, cb?: ()=>void ) => {
        setCurtains({
            showing: true,
            message: message,
            cb: cb
        });
    }

    const store: Store = {
      snackbar: [snackbar, showSnackbar, setSnackbar],
      curtains: [curtains, drawCurtains, setCurtains],
    }
  
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}