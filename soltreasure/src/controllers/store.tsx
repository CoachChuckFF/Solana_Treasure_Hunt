import React from "react";
import * as STSnackbar from "../views/snackbar";
import * as STCurtains from "../views/curtains";
import { addDays } from "../models/clock";
import { Vector3 } from 'three';


export enum ST_GLOBAL_STATE {
    dev = "-2. Devmode",
    supernova = "-1. Supernova",
    notConnected = "0. Connect your wallet",
    playing = "1. Playing",
    reconstruction = "2. Reconstruction",
}
export const NULL_GLOBAL_STATE = ST_GLOBAL_STATE.notConnected;

export interface GameState {
    blue?: boolean;
    green?: boolean;
    purple?: boolean;
    broken?: boolean;
    black?: boolean;
    white?: boolean;
    regular?: boolean;
    secret?: boolean;
    replay?: boolean;
}

export const NULL_GAME_STATE: GameState = {
    blue: false,
    green: false,
    purple: false,
    broken: false,
    black: false,
    white: false,
    regular: false,
    secret: false,
    replay: false,
};

export const NULL_MINT_CODES = [-1, -1, -1, -1];
export const NULL_SUPERNOVA = addDays(5);

export enum CameraSlot {
    devSlot = -2,
    noSlot = -1,
    position0 = 0,
    position1 = 1,
    position2 = 2,
    position3 = 3,
    position4 = 4,
    position5 = 4,
    secret0 = 5,
    secret1 = 6,
    secret2 = 7,
    secret3 = 8,
    secret4 = 9,
    secret5 = 10,
}
export const NULL_CAMERA_INDEX = -1;
export const NULL_CAMERA_SLOT = CameraSlot.secret0;

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
    ],
    globalState: [
        ST_GLOBAL_STATE,
        React.Dispatch<React.SetStateAction<ST_GLOBAL_STATE>>
    ],
    gameState: [
        GameState,
        ( state: GameState, ) => void,
    ],
    mintCodes: [
        number [],
        ( state: number [], ) => void,
    ],
    supernova: [
        Date,
        React.Dispatch<React.SetStateAction<Date>>
    ],
    cameraIndex: [
        number,
        React.Dispatch<React.SetStateAction<number>>
    ],
    cameraPosition: [
        Vector3,
        ( state: Vector3, ) => void,
    ],
};

export const StoreContext = React.createContext<Store>({
    snackbar: [STSnackbar.NULL_SNACKBAR, (null as any), (null as any)],
    curtains: [STCurtains.NULL_CURTAINS, (null as any), (null as any)],
    globalState: [NULL_GLOBAL_STATE, (null as any)],
    gameState: [NULL_GAME_STATE, (null as any)],
    mintCodes: [NULL_MINT_CODES, (null as any)],
    supernova: [NULL_SUPERNOVA, (null as any)],
    cameraIndex: []
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

    // Global State
    const [globalState, setGlobalState] = React.useState(ST_GLOBAL_STATE.notConnected);

    // Game State
    const [gameState, setGameState] = React.useState(NULL_GAME_STATE);
    const changeGameState = (newState: GameState) => {
        setGameState(
            Object.assign(
                {},
                {
                    ...NULL_GAME_STATE,
                    ...newState
                }
            )
        );
    }

    // Camera 
    const [cameraIndex, setCameraIndex] = React.useState(NULL_GAME_STATE);
    const changeGameState = (newState: GameState) => {
        setGameState(
            Object.assign(
                {},
                {
                    ...NULL_GAME_STATE,
                    ...newState
                }
            )
        );
    }

    // Mint Keys
    const [mintCodes, setMintCodes] = React.useState(NULL_MINT_CODES);
    const changeMintCodes = (newState: number[]) => {
        setMintCodes(
            Object.assign([], newState)
        );
    }

    // Supernova
    const [supernova, setSupernova] = React.useState(NULL_SUPERNOVA);

    // Camera Index
    const [cameraIndex, setCameraIndex] = React.useState(NULL_SUPERNOVA);

    const store: Store = {
        snackbar: [snackbar, showSnackbar, setSnackbar],
        curtains: [curtains, drawCurtains, setCurtains],
        globalState: [globalState, setGlobalState],
        gameState: [gameState, changeGameState],
        mintCodes: [mintCodes, changeMintCodes],
        supernova: [supernova, setSupernova],
        
    }
  
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}