import * as React from 'react';
import * as STState from '../models/state';
import * as STS from '../models/space'
import { StoreContext } from '../controllers/store';

import Button from '@mui/material/Button';
import './../App.css' 

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { ConstCode, Header } from './commons';

// Icons
import { PuzzleIcon, WalletIcon, ChestIcon, KeyIcon, LeftIcon, LogoutIcon } from './icons';
import { codeToHexString, getGuideCodes } from '../models/hashes';
import { ST_COLORS, ST_THEME_COLORS } from '../models/theme';

export default function TestButton(props:any) {
    return (
      <Button onClick={props.onClick} variant="contained">{props.children}</Button>
    );
}

function TheButton(props:any) {
    let handleClick = props.handleClick as ()=>null;
    let isLoading = props.isLoading as boolean;
    let state = props.state as HUDState;

    let themeColor = ST_THEME_COLORS.enabled;
    let textColor = ST_COLORS.enabledTextColor;

    let cb = () => {
        if(state.enabled && !isLoading){
            handleClick();
        }
    }

    if(!state.enabled || isLoading){
        themeColor = ST_THEME_COLORS.disabled;
        textColor = ST_COLORS.disabledTextColor;
    }

    if(state.overrideThemeColor){
        themeColor = state.overrideThemeColor;
    }

    if(state.overrideTextColor){
        textColor = state.overrideTextColor;
    }

    let iconDiv = (<div  className={isLoading ? 'icon-spin' : ''}>{state.icon}</div>);

    return (
        <Button
            color={themeColor as any}
            onClick={cb}
            startIcon={iconDiv}
            variant="contained"
            sx={{
                width: '100%',
                height: '5vh',
                margin: 0,
                color: textColor,
            }}
            disableElevation
        >{state.text}</Button>
    );
}

function PuzzleButton(props:any) {
    let handleClick = props.handleClick as ()=>null;
    let isLoading = props.isLoading as boolean;
    let state = props.state as HUDState;

    let cb = () => {
        if(!isLoading){
            handleClick();
        }
    }

    return (
        <Button
            color={state.puzzleThemeColor as any}
            onClick={cb}
            // startIcon={icon}
            variant="contained"
            sx={{
                width: '100%',
                height: '5vh',
                margin: 0,
            }}
            disableElevation
        >  
            <div style={{
                color: state.puzzleIconColor,
                fontSize: "1.3rem",
            }} >
                {state.puzzleIcon}
            </div>
        </Button>
    );
}

export function HudControls(props: any) {
    let bytesRef = props.bytesRef;
    let buttonsRef = props.buttonsRef;
    let hudState = props.hudState as HUDState;
    let isLoading = props.isLoading as boolean;
    let handlePuzzleClick = props.handlePuzzleClick as ()=>null;
    let handleMintClick = props.handleMintClick as ()=>null;
    return (
        <div className="hub-controls">
            <div className='puzzle-controls'>
                <div className="puzzle-controls">
                    <Box component="div" className={hudState.showingOnStart ? "puzzle-control-row" : "puzzle-control-row-blank"}></Box>
                    <Box component="div" ref={bytesRef} className={hudState.showingOnStart ? "puzzle-control-row" : "puzzle-control-row-blank"}>
                        <Grid container spacing={2}>
                            <Grid item xs={4}><Header text={hudState.title}/></Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHexString(hudState.codes[0])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHexString(hudState.codes[1])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHexString(hudState.codes[2])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHexString(hudState.codes[3])}/>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box component="div" ref={buttonsRef} className="puzzle-control-row">
                        <Grid container spacing={2}>
                            <Grid item xs={9}>
                                <TheButton handleClick={handleMintClick} isLoading={isLoading}  state={hudState}/>
                            </Grid>
                            <Grid item xs={3}>
                                <PuzzleButton handleClick={handlePuzzleClick} state={hudState}/>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            </div>
        </div>
    );
}

function OneButtonHUD(props: any) {
    let isLoading = props.isLoading as boolean;
    let icon = props.icon as JSX.Element;
    let text = props.text as string;
    let overrideThemeColor = props.overrideThemeColor as string;
    let overrideTextColor = props.overrideTextColor as string;
    let handleClick = props.handleClick as ()=>null;
    return (
        <div className="hub-controls">
            <div className='puzzle-controls'>
                <div className="puzzle-controls">
                    <Box component="div" className="puzzle-control-row-blank"></Box>
                    <Box component="div" className="puzzle-control-row-blank">
                        <Grid container spacing={2}></Grid>
                    </Box>
                    <Box component="div" className="puzzle-control-row">
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TheButton 
                                    handleClick={handleClick} 
                                    isLoading={isLoading} 
                                    state={{
                                        ...NULL_HUD_STATE,
                                        enabled: true,
                                        icon: icon,
                                        text: text,
                                        title: "",
                                        overrideThemeColor: overrideThemeColor ?? ST_THEME_COLORS.purple,
                                        overrideTextColor: overrideTextColor ?? ST_COLORS.white,
                                        iconThemeColor: ST_THEME_COLORS.purple,
                                        iconColor: ST_COLORS.white,
                                    } as HUDState}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            </div>
        </div>
    );
}

export interface HUDState {
    enabled: boolean,
    icon: JSX.Element,
    puzzleIcon: JSX.Element,
    text: string,
    title: string,
    codes: number[],
    puzzleIconColor: ST_COLORS,
    puzzleThemeColor: ST_THEME_COLORS,
    overrideThemeColor?: ST_THEME_COLORS,
    overrideTextColor?: ST_COLORS,
    showingOnStart?: boolean,
}
export const NULL_HUD_STATE: HUDState = {
    enabled: false,
    icon: (<KeyIcon />),
    puzzleIcon: (<PuzzleIcon />),
    text: "Connect Wallet",
    title: "Mint Bytes:",
    codes: STState.NULL_MINT_CODES,
    puzzleThemeColor: ST_THEME_COLORS.disabled,
    puzzleIconColor: ST_COLORS.enabledTextColor,
    showingOnStart: false,
} 

function getHUDState(
    cameraSlot: STS.ST_CAMERA_SLOTS,
    globalState: STState.ST_GLOBAL_STATE,
    gameState: STState.GameState,
) {
    let isCheater = false;
    let canUnlock = false;
    let didOpen = false;
    let canTryMint = false;
    let canBreak = false;

    switch(cameraSlot){
        case STS.ST_CAMERA_SLOTS.slot0:
            isCheater = STState.likesPumkins(gameState, STState.ST_CHEST_TYPES.main, globalState);
            canUnlock = STState.canUnlockChest(gameState, STState.ST_CHEST_TYPES.main, globalState);
            didOpen = STState.didUnlockChest(gameState, STState.ST_CHEST_TYPES.main);
            return {
                ...NULL_HUD_STATE,
                enabled: canUnlock,
                icon: (<ChestIcon />),
                puzzleIcon: (<LogoutIcon />),
                text: !canUnlock ? "Need Keys" : (didOpen ? "Winner!" : (isCheater ? "Pumkin Eater..." : "Open Chest")),
                title: "Locks:",
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.sslot0:
            isCheater = STState.likesPumkins(gameState, STState.ST_CHEST_TYPES.secret, globalState);
            canUnlock = STState.canUnlockChest(gameState, STState.ST_CHEST_TYPES.secret, globalState);
            didOpen = STState.didUnlockChest(gameState, STState.ST_CHEST_TYPES.secret);
            return {
                ...NULL_HUD_STATE,
                enabled: canUnlock,
                text: !canUnlock ? "Need Keys" : (didOpen ? "YES!" : (isCheater ? "Pumkin Eater..." : "Open Chest")),
                title: "Locks:",
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.sslot5:
            canTryMint = STState.canTryMint(gameState.whiteMintBytes);
            canBreak = gameState.whiteKey > 0;
            return {
                ...NULL_HUD_STATE,
                enabled: canTryMint || canBreak,
                text: !canTryMint ? "Solve White" : (canBreak ? "Break Key" : "Try Mint Bytes"),
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.sslot1:
            return {
                ...NULL_HUD_STATE,
                enabled: false,
                text: "Solve Black"
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.sslot2:
            let canForge = STState.canForgeItems(gameState, globalState);
            let canFix = STState.canFixKey(gameState, globalState);
            return {
                ...NULL_HUD_STATE,
                enabled: false,
                title: "Items: ",
                text: canForge ? ((canFix) ? "Forge Items" : "Nothing Useful") : "Enter BH Forge",
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.slot2:
            canTryMint = STState.canTryMint(gameState.blueMintBytes);
            canBreak = gameState.blueKey > 0;
            return {
                ...NULL_HUD_STATE,
                enabled: canTryMint || canBreak,
                text: !canTryMint ? "Solve Blue" : (canBreak ? "Break Key" : "Try Mint Bytes"),
                codes: gameState.blueMintBytes,
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.slot3:
            canTryMint = STState.canTryMint(gameState.greenMintBytes);
            canBreak = gameState.greenKey > 0;
            return {
                ...NULL_HUD_STATE,
                enabled: canTryMint || canBreak,
                text: !canTryMint ? "Solve Green" : (canBreak ? "Break Key" : "Try Mint Bytes"),
                codes: gameState.greenMintBytes,
            } as HUDState;
        case STS.ST_CAMERA_SLOTS.slot4:
            canTryMint = STState.canTryMint(gameState.purpleMintBytes);
            canBreak = gameState.purpleKey > 0;
            return {
                ...NULL_HUD_STATE,
                enabled: canTryMint || canBreak,
                text: !canTryMint ? "Solve Purple" : (canBreak ? "Break Key" : "Try Mint Bytes"),
                codes: gameState.purpleMintBytes,
            } as HUDState;
    }

    return null;
}

export function STHUD(props: any) {
    const bytesRef = React.useRef<HTMLDivElement>(null);
    const buttonsRef = React.useRef<HTMLDivElement>(null);

    const {
        devMode: [devMode],
        isLoading: [isLoading],
        globalState: [globalState],
        gameState: [gameState],
        cameraSlot: [cameraSlot],
        puzzleState: [puzzleState],
    } = React.useContext(StoreContext)

    const [hudState, setHUDState] = React.useState(NULL_HUD_STATE);

    React.useEffect(() => {
        let shouldHideBytes = false;
        let shouldHideButtons = false;

        // Check new camera slot
        switch(cameraSlot){
            case STS.ST_CAMERA_SLOTS.slot0: 
            case STS.ST_CAMERA_SLOTS.sslot0: 
            case STS.ST_CAMERA_SLOTS.sslot3:
                shouldHideBytes = true; 
                break;
            case STS.ST_CAMERA_SLOTS.slot1:
            case STS.ST_CAMERA_SLOTS.slot5:
                shouldHideBytes = true;
                shouldHideButtons = true;
                break;
        }

        // Check null slot
        if(cameraSlot === STS.ST_CAMERA_SLOTS.nullSlot) {
            if(!shouldHideBytes) {shouldHideBytes = true;}
            if(!shouldHideButtons) {shouldHideButtons = true;}
        }

        // Check active Puzzle
        // if(puzzleState !== STState.NULL_PUZZLE_STATE){
        //     shouldHideBytes = true;
        //     shouldHideButtons = true; 
        // }

        // Set visability
        if(bytesRef.current){ bytesRef.current.className = shouldHideBytes ? "puzzle-control-row-blank" : "puzzle-control-row";}
        if(buttonsRef.current){ buttonsRef.current.className = shouldHideButtons ? "puzzle-control-row-blank" : "puzzle-control-row";}

        // Update State
        let newHUDState = getHUDState(
            cameraSlot,
            globalState,
            gameState,
        );

        // console.log(newHUDState + " " +shouldHideBytes +  " " + shouldHideButtons + " " + cameraSlot);

        if(newHUDState !== null){
            setHUDState(
                Object.assign(
                    {},
                    {
                        ...newHUDState,
                    }
                ) as HUDState
            );
        } 

        return () => {}; //On Unmount
    }, [cameraSlot, globalState, gameState, puzzleState]);

    const connectWallet = () => { props.connectWallet(); }
    const startMint = () => { props.startMint(cameraSlot); }
    const openPuzzle = () => { props.openPuzzle(cameraSlot); }
    const leaveDevMode = () => { props.leaveDevMode(); }

    if(globalState === STState.ST_GLOBAL_STATE.notConnected) return <OneButtonHUD isLoading={isLoading} icon={(<WalletIcon/>)} text={"Connect Wallet"} handleClick={connectWallet}/>;
    if(cameraSlot === STS.ST_CAMERA_SLOTS.devSlot) return <OneButtonHUD isLoading={isLoading} icon={(<WalletIcon/>)} text={"Leave Dev Mode"} handleClick={leaveDevMode} overrideTextColor={ST_COLORS.enabledTextColor} overrideThemeColor={ST_THEME_COLORS.grey}/>;
    if((cameraSlot === STS.ST_CAMERA_SLOTS.slot3 && devMode) || (cameraSlot === STS.ST_CAMERA_SLOTS.sslot3)) 
        return <OneButtonHUD isLoading={isLoading} icon={(<WalletIcon/>)} text={"Enter Terminal"} handleClick={openPuzzle}/>;


    return <HudControls 
        bytesRef={bytesRef}
        buttonsRef={buttonsRef}
        hudState={hudState}
        isLoading={isLoading}
        handleMintClick={startMint}
        handlePuzzleClick={openPuzzle}
    />
}



