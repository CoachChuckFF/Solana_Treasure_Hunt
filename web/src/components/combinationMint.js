import * as React from 'react';
import PropTypes from 'prop-types';
import NumberFormat from 'react-number-format';
import { styled } from '@mui/system';
import InputUnstyled from '@mui/base/InputUnstyled';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { curtains } from './curtains';
import * as FSM from './fsm';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';

import './../App.css' 

// Icons
import { PuzzleIcon, WalletIcon, GuideIcon, ChestIcon, KeyIcon } from './icons';
import { codeToHexString, getGuideCodes } from './hashes';

const blue = {
  200: '#80BFFF',
  400: '#3399FF',
};

const grey = {
  50: '#F3F6F9',
  100: '#E7EBF0',
  200: '#E0E3E7',
  300: '#CDD2D7',
  400: '#B2BAC2',   
  500: '#A0AAB4',
  600: '#6F7E8C',
  700: '#3E5060',
  800: '#2D3843',
  900: '#1A2027',
};

const StyledInputElement = styled('input')(
  ({ theme }) => `
  font-size: 1.34rem;
  font-family: IBM Plex Sans, sans-serif;
  font-weight: 400;
  text-align: center;
  min-width: 3rem;
  height: 5vh;
  width: 100%;

  color: ${grey[300]};
  background: ${'#0D0D0D'};
  border: 1px solid ${'#171615'};
  border-radius: 8px;
  transition: all 150ms ease;

  &:hover {
    background: ${''};
    border-color: ${'#272727'};
  }

  &:focus {
    outline: 2px solid ${'#03E2FF'};
    outline-offset: 2px;
  }
`,
);

const CustomInput = React.forwardRef(function CustomInput(props, ref) {
  return (
    <InputUnstyled components={{ Input: StyledInputElement }} {...props} ref={ref} />
  );
});

function CodeInput(props) {

    return (
        <CustomInput 
            aria-label={`${props.byte}-input`}
            placeholder="0x00" 
            value={props.code} 
            onChange={props.handleChange}
            name={props.byte}
        />
    )
}

const disabledColor = "disabled";
const enabledColor = "primary";
const disabledTextColor = "#757575";
const enabledTextColor = "#CDD2D6";
function TheButton(props) {
    let text = "";
    let color = props.loading ? disabledColor : enabledColor;
    let textColor = props.loading ? disabledTextColor : enabledTextColor;
    let icon = null;

    let enabled = !props.loading;

    if(!props.hasCodes && props.state != FSM.OpenChest){
        color = disabledColor;
        textColor = disabledTextColor;
        enabled = false;     
    }

    switch(props.state) {
        case FSM.NotConnected:
            text = "Connect Wallet";
            color = enabledColor;
            textColor = enabledTextColor;
            enabled = true;  
            icon = (<WalletIcon />);
            break;
        case FSM.MintGuide:
            if(!props.hasCodes){
                text = "Find and enter Hex";
            } else {
                let rightCodes = getGuideCodes(props.wallet);
                if(
                    codeToHexString(rightCodes[0]) == props.codes.byte0 &&
                    codeToHexString(rightCodes[1]) == props.codes.byte1 &&
                    codeToHexString(rightCodes[2]) == props.codes.byte2 &&
                    codeToHexString(rightCodes[3]) == props.codes.byte3
                ) {
                    text = "Mint Guide";
                } else {
                    enabled = false;
                    color = disabledColor;
                    textColor = disabledTextColor;
                    text = "Wrong Codes";
                }
            }
            icon = (<GuideIcon />);
            break;
        case FSM.MintNFKey1:
            if(!props.hasCodes){
                text = "Solve Puzzle 1 ->";
            } else {
                text = "Mint NFKey 1";
            }

            icon = (<KeyIcon />);
            break;
        case FSM.MintNFKey2:
            if(!props.hasCodes){
                text = "Solve Puzzle 2 ->";
            } else {
                text = "Mint NFKey 2";
            }

            icon = (<KeyIcon />);
            break;
        case FSM.MintNFKey3:
            if(!props.hasCodes){
                text = "Solve Puzzle 3 ->";
            } else {
                text = "Mint NFKey 3";
            }

            icon = (<KeyIcon />);
            break;
        case FSM.OpenChest:
            text = "Open Chest!";
            icon = (<ChestIcon />);
            break;
    }
    

    let cb = () => {
        if(enabled){
            props.handleClick();
        }
    }
    let iconDiv = (<div  className={props.loading ? 'icon-spin' : ''}>{icon}</div>);

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
        >{text}</Button>
    );
}

const greenColor = "#00FFA3";
const blueColor = "#03E2FF";
const pinkColor = "#DC1FFF";
function PuzzleButton(props) {
    let color = ""
    let iconColor = ""

    switch(props.state) { 
        case FSM.MintNFKey1: 
            color = 'primary';
            iconColor = greenColor;
            break;
        case FSM.MintNFKey2:
            color = 'primary';
            iconColor = blueColor;
            break;
        case FSM.MintNFKey3:
            color = 'blue';
            iconColor = pinkColor;
            break;
    }

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
                <PuzzleIcon />
            </div>
        </Button>
    );
}

export function CombinationMint(props) {
    const byte0 = "byte0";
    const byte1 = "byte1";
    const byte2 = "byte2";
    const byte3 = "byte3";

    const [isWorking, setIsWorking] = React.useState(false);
    const [state, setState] = React.useState(null);
    const [action, setAction] = React.useState(0);
    const [subAction, setSubAction] = React.useState(0);
    const [codes, setCodes] = React.useState({
        [byte0]: '',
        [byte1]: '',
        [byte2]: '',
        [byte3]: '',
    });


    if(state != props.state){
        setAction(props.action);
        setState(props.state);
        setIsWorking(false);
        setCodes({
            [byte0]: props.codes[0],
            [byte1]: props.codes[1],
            [byte2]: props.codes[2],
            [byte3]: props.codes[3],
        });
    } else if(action != props.action || subAction != props.subAction) {

        if(
            props.codes[0] != '' &&
            props.codes[1] != '' &&
            props.codes[2] != '' &&
            props.codes[3] != ''
        ) {
            setCodes({
                [byte0]: props.codes[0],
                [byte1]: props.codes[1],
                [byte2]: props.codes[2],
                [byte3]: props.codes[3],
            }); 
        }
        
        setAction(props.action);
        setSubAction(props.subAction);
        setIsWorking(false);
    }

    const checkChar = (char) => {
        switch(char.toUpperCase()){
            case '0': 
            case '1': 
            case '2':
            case '3':
            case '4':
            case '5': 
            case '6': 
            case '7': 
            case '8': 
            case '9':
            case 'A':
            case 'B':
            case 'C':
            case 'D':
            case 'E':
            case 'F':
            case '':
                return char;
        }

        alert('Only Valid Hex');
        return '';
    }
  
    const handleChange = (event) => {
        let lastCode = codes[event.target.name];
        let input = event.target.value;
        let nibble0 = "";
        let nibble1 = "";

        if(input.length < 5){
            let split = (input ?? '').split('0x');
            if(lastCode !== '0x' && split.length === 1){
                nibble0 = input[0] ?? '';
                nibble1 = input[1] ?? '';
            } else if(split.length === 2){
                nibble0 = split[1][0] ?? '';
                nibble1 = split[1][1] ?? '';
            }

            nibble0 = checkChar(nibble0.toUpperCase());
            nibble1 = checkChar(nibble1.toUpperCase());
        } else {
            nibble0 = checkChar(input[3]);
        }

        nibble0 = checkChar(nibble0.toUpperCase());

        setCodes({
            ...codes,
            [event.target.name]: '0x' + nibble0 + nibble1,
        });
    };

    const checkCodes = () => {
        return codes.byte0.length == 4 &&
            codes.byte1.length == 4 &&
            codes.byte2.length == 4 &&
            codes.byte3.length == 4;
    }

    const handleMint = () => {
        if(props.wallet == null){
            setIsWorking(true);
            props.connect();
        } else if(!isWorking && checkCodes()){
            props.mint([
                parseInt(codes.byte0.substring(2), 16) ?? 0,
                parseInt(codes.byte1.substring(2), 16) ?? 0,
                parseInt(codes.byte2.substring(2), 16) ?? 0,
                parseInt(codes.byte3.substring(2), 16) ?? 0
            ]);
            setIsWorking(true);
        } else if(props.state == FSM.OpenChest){
            props.mint([0,0,0,0]);
            setIsWorking(true);
        }
    }

    const puzzle = () => {
        props.puzzle(state);
    }


    switch(state) {
        case FSM.NotConnected: 
            return (
                <div className='code-container'>
                    <Box>
                        <TheButton handleClick={handleMint} loading={isWorking} state={props.state}/>
                    </Box>
                </div>
            )
        case FSM.MintGuide:
            return (
                <div className='code-container'>
                    <Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte0} byte={byte0} wallet={props.wallet} p/>
                            </Grid>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte1} byte={byte1} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte2} byte={byte2} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte3} byte={byte3} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={12}>
                                <TheButton handleClick={handleMint} loading={isWorking} codes={codes} state={props.state} hasCodes={checkCodes()} wallet={props.wallet}/>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            );
        case FSM.MintNFKey1:
        case FSM.MintNFKey2:
        case FSM.MintNFKey3:
            return (
                <div className='code-container'>
                    <Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte0} byte={byte0} wallet={props.wallet} p/>
                            </Grid>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte1} byte={byte1} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte2} byte={byte2} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={6}>
                                <CodeInput handleChange={handleChange} code={codes.byte3} byte={byte3} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={9}>
                                <TheButton handleClick={handleMint} loading={isWorking} codes={codes} state={props.state} hasCodes={checkCodes()} wallet={props.wallet}/>
                            </Grid>
                            <Grid item xs={3}>
                                <PuzzleButton handleClick={puzzle} state={props.state}/>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            );
        case FSM.OpenChest:
            return (
                <div className='code-container'>
                    <Box>
                        <TheButton handleClick={handleMint} loading={isWorking} state={props.state}/>
                    </Box>
                </div>
            );
    }

    return (<div></div>);
 
}



