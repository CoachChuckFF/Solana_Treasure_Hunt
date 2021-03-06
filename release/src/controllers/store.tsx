import React from "react";
import * as STSnackbar from "../views/snackbar";
import * as STCurtains from "../views/curtains";
import * as STWorldSpace from "../models/space";
import * as STPopup from "../views/popup";
import * as STState from "../models/state";
import * as STS from "../models/space";
import { GameAccount, PlayerAccount, STProvider } from "../models/sol-treasure";

// TODO Change to Player State
export interface Store {
    gameAccount: [
        GameAccount,
        React.Dispatch<React.SetStateAction<GameAccount>>
    ],
    playerAccount: [
        PlayerAccount,
        React.Dispatch<React.SetStateAction<PlayerAccount>>
    ],
    stProvider: [
        STProvider,
        React.Dispatch<React.SetStateAction<STProvider>>
    ],
    devMode: [
        boolean,
        React.Dispatch<React.SetStateAction<boolean>>
    ],
    isLoading: [
        boolean,
        React.Dispatch<React.SetStateAction<boolean>>
    ],
    popup: [
        STPopup.PopupInfo,
        (
            title: string,
            message: string,
            cb?: ()=>void,
        ) => void,
        React.Dispatch<React.SetStateAction<STPopup.PopupInfo>>
    ],
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
            clickToDismiss?: boolean,
            cb?: ()=>void 
        ) => void,
        React.Dispatch<React.SetStateAction<STCurtains.CurtainsInfo>>
    ],
    actionCrank: [
        number,
        ()=>void
    ],
    globalState: [
        STState.ST_GLOBAL_STATE,
        React.Dispatch<React.SetStateAction<STState.ST_GLOBAL_STATE>>
    ],
    gameState: [
        STState.GameState,
        ( state: STState.GameState, ) => void,
    ],
    puzzleState: [
        STState.ST_PUZZLE_STATE,
        React.Dispatch<React.SetStateAction<STState.ST_PUZZLE_STATE>>
    ]
    cameraSlot: [
        STS.ST_CAMERA_SLOTS,
        React.Dispatch<React.SetStateAction<STS.ST_CAMERA_SLOTS>>
    ],
    cameraPosition: [
        STWorldSpace.STSpace,
        ( state: STWorldSpace.STSpace, ) => void,
    ],
    logout: [() => void],
};

export const logoutOfStore = (store: Store) => {
    if( store.actionCrank[1] !== null) store.actionCrank[1]();
    if( store.gameAccount[1] !== null) store.gameAccount[1](STState.NULL_GAME_ACCOUNT);
    if( store.playerAccount[1] !== null) store.playerAccount[1](STState.NULL_PLAYER_ACCOUNT);
    if( store.stProvider[1] !== null) store.stProvider[1](STProvider.empty());
    if( store.devMode[1] !== null) store.devMode[1](STState.NULL_DEV_MODE);
    if( store.isLoading[1] !== null) store.isLoading[1](STState.NULL_IS_LOADING);
    if( store.popup[2] !== null) store.popup[2](STPopup.NULL_POPUP);
    if( store.snackbar[2] !== null) store.snackbar[2](STSnackbar.NULL_SNACKBAR);
    if( store.curtains[2] !== null) store.curtains[2](STCurtains.NULL_CURTAINS);
    if( store.globalState[1] !== null) store.globalState[1](STState.NULL_GLOBAL_STATE);
    if( store.puzzleState[1] !== null) store.puzzleState[1](STState.NULL_PUZZLE_STATE);
    if( store.gameState[1] !== null) store.gameState[1](STState.NULL_GAME_STATE);
    if( store.cameraSlot[1] !== null) store.cameraSlot[1](STState.NULL_CAMERA_SLOT);
    if( store.cameraPosition[1] !== null) store.cameraPosition[1](STState.NULL_CAMERA_POSITION);
}

export const NULL_STORE: Store = {
    gameAccount: [STState.NULL_GAME_ACCOUNT, (null as any)],
    playerAccount: [STState.NULL_PLAYER_ACCOUNT, (null as any)],
    stProvider: [STState.NULL_PROVIDER, (null as any)],
    devMode: [STState.NULL_DEV_MODE, (null as any)],
    isLoading: [STState.NULL_IS_LOADING, (null as any)],
    snackbar: [STSnackbar.NULL_SNACKBAR, (null as any), (null as any)],
    curtains: [STCurtains.NULL_CURTAINS, (null as any), (null as any)],
    popup: [STPopup.NULL_POPUP, (null as any), (null as any)],
    actionCrank: [STState.NULL_ACTION_CRANK, (null as any)],
    globalState: [STState.NULL_GLOBAL_STATE, (null as any)],
    puzzleState: [STState.NULL_PUZZLE_STATE, (null as any)],
    gameState: [STState.NULL_GAME_STATE, (null as any)],
    cameraSlot: [STState.NULL_CAMERA_SLOT, (null as any)],
    cameraPosition: [STState.NULL_CAMERA_POSITION, (null as any)],
    logout: [(null as any)],
}

export const StoreContext = React.createContext<Store>(NULL_STORE)

export default function StoreProvider({ children }:any) {

    // Game Account
    const [gameAccount, setGameAccount] = React.useState(STState.NULL_GAME_ACCOUNT);

    // Player Account
    const [playerAccount, setPlayerAccount] = React.useState(STState.NULL_PLAYER_ACCOUNT);

    // Provider
    const [stProvider, setTreasureProvider] = React.useState(STProvider.empty());

    // Dev Mode
    const [devMode, setDevMode] = React.useState(STState.NULL_DEV_MODE);

    // Is Loading
    const [isLoading, setIsLoading] = React.useState(STState.NULL_IS_LOADING);

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
    const drawCurtains = ( message: string, clickToDismiss: boolean = false, cb?: ()=>void ) => {
        setCurtains({
            showing: true,
            clickToDismiss,
            message,
            cb,
        });
    }

    // Popup
    const [popup, setPopup] = React.useState(STPopup.NULL_POPUP);
    const showPopup = ( title: string, message: string, cb?: ()=>void ) => {
        setPopup({
            showing: true,
            title,
            message,
            cb,
        });
    }

    // Action Crank
    const [actionCrank, setActionCrank] = React.useState(STState.NULL_ACTION_CRANK);
    const crankAction = () => {setActionCrank(actionCrank+1);}

    // Global State
    const [globalState, setGlobalState] = React.useState(STState.NULL_GLOBAL_STATE);

    // Puzzle State
    const [puzzleState, setPuzzleState] = React.useState(STState.NULL_PUZZLE_STATE);

    // Game State
    const [gameState, setGameState] = React.useState(STState.NULL_GAME_STATE);
    const updateGameState = (newState: STState.GameState) => { setGameState( STState.getNewGameState( newState )); }

    // Camera Slot
    const [cameraSlot, setCameraSlot] = React.useState(STState.NULL_CAMERA_SLOT);

    // Camera Position
    const [cameraPosition, setCameraPosition] = React.useState(STState.NULL_CAMERA_POSITION);
    const updateCameraPosition = (newState: STWorldSpace.STSpace) => { setCameraPosition( STState.getNewCameraPosition(newState) );}

    const store: Store = {
        gameAccount: [gameAccount, setGameAccount], 
        playerAccount: [playerAccount, setPlayerAccount], 
        stProvider: [stProvider, setTreasureProvider],
        devMode: [devMode, setDevMode],
        isLoading: [isLoading, setIsLoading],
        snackbar: [snackbar, showSnackbar, setSnackbar],
        curtains: [curtains, drawCurtains, setCurtains],
        popup: [popup, showPopup, setPopup],
        actionCrank: [actionCrank, crankAction],
        globalState: [globalState, setGlobalState],
        puzzleState: [puzzleState, setPuzzleState],
        gameState: [gameState, updateGameState],
        cameraSlot: [cameraSlot, setCameraSlot],
        cameraPosition: [cameraPosition, updateCameraPosition],
        logout: [()=>{logoutOfStore(store);}],
    };
  
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}