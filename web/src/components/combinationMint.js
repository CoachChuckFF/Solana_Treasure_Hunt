import { useRef, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { ConstCode, Header, codeToHex } from './commons';
import { curtains } from './curtains';
import * as FSM from './fsm';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';

import './../App.css' 

// Icons
import { WalletIcon, PuzzleIcon, ChestIcon, KeyIcon, LeftIcon } from './icons';

const disabledColor = "disabled";
const enabledColor = "primary";
const disabledTextColor = "#757575";
const enabledTextColor = "#CDD2D6";
function TheButton(props) {
    let color = enabledColor;
    let textColor = enabledTextColor;

    let cb = () => {
        if(props.info.enabled && !props.loading){
            props.handleClick();
        }
    }

    if(!props.info.enabled || props.loading){
        color = disabledColor;
        textColor = disabledTextColor;
    }

    if(props.info.overrideColor){
        color = props.info.overrideColor;
    }

    let iconDiv = (<div  className={props.loading ? 'icon-spin' : ''}>{props.info.icon}</div>);

    return (
        <Button
            color={color}
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
        >{props.info.text}</Button>
    );
}

const greenColor = "#14F195";
const blueColor = "#4FA5C4";
const purpleColor = "#9945FF";
const whiteColor = "#EAEAEA";
function PuzzleButton(props) {
    let color = props.info.iconTileColor;
    let iconColor = props.info.iconColor;
    let icon = props.info.iconButtonIcon;

    return (
        <Button
            color={color}
            onClick={props.handleClick}
            // startIcon={icon}
            variant="contained"
            sx={{
                width: '100%',
                height: '5vh',
                margin: 0,
            }}
            disableElevation
        >  
            <div
                style={{
                    color: iconColor,
                    fontSize: "1.3rem",
                }}
            >
                {icon}
            </div>
        </Button>
    );
}

export function CombinationMint(props) {
    const refs = [useRef(), useRef()];
    const [buttonInfo, setButtonInfo] = useState(
        {
            enabled: false,
            overrideColor: null,
            icon: (<WalletIcon />),
            text: "Connect Wallet",
            title: "Generated:",
            iconButtonIcon: (<WalletIcon />),
            iconTileColor: "primary",
            iconColor: "#4FA5C4",
            codes: [-1,-1,-1,-1],
            codeColor: "#EAEAEA",
            puzzle: "",
        }
    );

    const handleConnect = () => {
        props.connect();
    }
    const handleMint = () => {
        props.mint();
    }

    const puzzle = () => {
        props.puzzle(props.cameraIndex);
    }

    const ConnectWalletButton = () => {
        return (
            <div className="hub-controls">
                <div className='puzzle-controls'>
                    <div className="puzzle-controls">
                        <Box className="puzzle-control-row-blank"></Box>
                        <Box className="puzzle-control-row-blank">
                            <Grid container spacing={2}></Grid>
                        </Box>
                        <Box className="puzzle-control-row">
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TheButton 
                                        handleClick={handleConnect} 
                                        loading={false} 
                                        info={{
                                            enabled: true, 
                                            icon: (<WalletIcon />), 
                                            text: "Connect Wallet"
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </div>
                </div>
            </div>
        );
    }

    const changeButtonInfo = () => {
        let display = [false, false];
        buttonInfo.enabled = false;
        
        switch(props.cameraIndex){
            case 0:
                display = [false, true];
                buttonInfo.enabled = props.puzzleState.test
                buttonInfo.icon = (<ChestIcon />);
                buttonInfo.overrideColor = null;
                buttonInfo.text = props.puzzleState.regular ? "You did it!" : ((FSM.isCheater(props.run, props.state, props.puzzleState)) ? `Pumkin Eater...` : "Open Chest");
                buttonInfo.title = "Locks:";
                buttonInfo.iconButtonIcon = (<LeftIcon />);
                buttonInfo.iconTileColor = "primary";
                buttonInfo.iconColor = whiteColor;
                break;
            case 1:
                display = [true, true];
                buttonInfo.enabled = !props.codes.test.includes(-1);
                buttonInfo.icon = (<KeyIcon />);
                buttonInfo.overrideColor = props.puzzleState.blue ? 'disabled' : null;
                buttonInfo.text = props.puzzleState.blue ? "Mint Broken NFKey" : (buttonInfo.enabled ? "Try NFKey 0" : "Demo Puzzle ->");
                buttonInfo.title = "Codes:";
                buttonInfo.iconButtonIcon = (<PuzzleIcon />);
                buttonInfo.iconTileColor = "test";
                buttonInfo.iconColor = purpleColor;
                buttonInfo.codes = props.codes.test;
                buttonInfo.codeColor = blueColor;
                break;
        }


        if(props.activePuzzle != null){
            display[0] = false;
            display[1] = false;
        }

        if(refs[0].current){
            refs[0].current.className = display[0] ? "puzzle-control-row" : "puzzle-control-row-blank";
            refs[1].current.className = display[1] ? "puzzle-control-row" : "puzzle-control-row-blank";
        }

    }

    if(props.state === FSM.NotConnected) return <ConnectWalletButton />;

    changeButtonInfo();

    return (
        <div className="hub-controls">
            <div className='puzzle-controls'>
                <div className="puzzle-controls">
                    <Box className="puzzle-control-row-blank"></Box>
                    <Box ref={refs[0]} className="puzzle-control-row-blank">
                        <Grid container spacing={2}>
                            <Grid item xs={4}><Header text={buttonInfo.title}/></Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(buttonInfo.codes[0])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(buttonInfo.codes[1])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(buttonInfo.codes[2])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(buttonInfo.codes[3])}/>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box ref={refs[1]} className="puzzle-control-row">
                        <Grid container spacing={2}>
                            <Grid item xs={9}>
                                <TheButton handleClick={handleMint} loading={false}  info={buttonInfo}/>
                            </Grid>
                            <Grid item xs={3}>
                                <PuzzleButton handleClick={puzzle} info={buttonInfo}/>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            </div>
        </div>
    );
}



