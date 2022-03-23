import { useRef, useState, useEffect, useContext } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { codeToHexString, getDronieCode } from "../models/hashes";
import { TreasureProvider } from "../models/solTreasure";
import { Vector3 } from "three";
import { PuzzlePageFrame, PuzzlePageParams } from "../views/puzzleCommons";
import { ST_PUZZLE_STATE } from "../models/state";
import { StoreContext } from "../controllers/store";
import { ST_COLORS, ST_THEME_COLORS } from "../models/theme";
import * as STS from "../models/space";

const TERMINALSPLIT = '▹';
const ERRORMSG = 'ERROR. Use SOS for help.';
const NOOP = 'No operation, tap out SOS for available commands.'
const ERRORMSGSYN = 'SYNTAX ERROR.';

function morseToText(morse:string){
    switch(morse){
        case '.-': return 'A';
        case '-...': return 'B';
        case '-.-.': return 'C';
        case '-..': return 'D';
        case '.': return 'E';
        case '..-.': return 'F';
        case '--.': return 'G';
        case '....': return 'H';
        case '..': return 'I';
        case '.---': return 'J';
        case '-.-': return 'K';
        case '.-..': return 'L';
        case '--': return 'M';
        case '-.': return 'N';
        case '---': return 'O';
        case '.--.': return 'P';
        case '--.-': return 'Q';
        case '.-.': return 'R';
        case '...': return 'S';
        case '-': return 'T';
        case '..-': return 'U';
        case '...-': return 'V';
        case '.--': return 'W';
        case '-..-': return 'X';
        case '-.--': return 'Y';
        case '--..': return 'Z';

        case '.----': return '1';
        case '..---': return '2';
        case '...--': return '3';
        case '....-': return '4';
        case '.....': return '5';
        case '-....': return '6';
        case '--...': return '7';
        case '---..': return '8';
        case '----.': return '9';
        case '-----': return '0';
    }

    return `ERROR.`;
}

const FILES = [
    "F0: Chrip Chirp, I'm a bird.",
    "F1: NFKey 2 codes: RW5 ^ RW0, RW5 ^ RW1, RW5 ^ RW2, RW5 ^ RW3",
    "F2: Fun (totally unrelated) fact! ^ is the symbol for XOR",
    "F3: Melody says to ignore the red herring.",
    "46343A2031737420636F6465203D202D2E2E2D202D2D2D202E2D2E203E202E2D2E202E2D2D202E2E2E2E2E203E202E2D2E202E2D2D202D2D2D2D2D",
    "Stop. Bad. Only read files #'s 0-4",
    "463F3A20506179206E6F20617474656E74696F6E20746F20746865206D616E20626568696E6420746865206375727461696E2E",
    "463F3A20546170206F7574204E4F4F5420746F2067657420796F757220636F6465732E",
]

const ERRORS = [
    ERRORMSGSYN,
    ERRORMSGSYN + " Read File. Usage: RF#, where # = 0-4",
    ERRORMSGSYN + " Read Wallet Byte. Usage: RW#, where # = 0-9",
    ERRORMSGSYN + ` XOR Wallet Byte. Usage: XOR${TERMINALSPLIT}RW#${TERMINALSPLIT}RW#, where # = 0-9`,
    ERRORMSGSYN + ` Hex to ASCII. Usage: H2A${TERMINALSPLIT}RF#, where # = 0-4`,
];

const SOS = [
    ("Available commands: SOS [CMD], RF# (# = 0-4), RW# (# = 0-9), XOR [RW#] [RW#], H2A [RF#]"),
    ("SOS: Gives info. Uses: SOS" + TERMINALSPLIT + "CMD"),
    ("RF#: Read data file #. RF0-RF4"),
    ("RW#: Read wallet byte #. RW0-RW9"),
    ("XOR: Bitwise xor two wallet bytes. XOR" + TERMINALSPLIT + "RW#" + TERMINALSPLIT + "RW#"),
    ("H2A: Converts the input hex file to human readable ASCII. H2A" + TERMINALSPLIT + "RF#")
];

const TERMCOMMANDS = [
    "SOS", "RF#", "RW#", "XOR", "H2A"
];

const DEVHELP = [
    ("Available commands: SOS [CMD], *REDACTED*, LOC[##] [##] [##] (## = 00-FF)"),
    ("SOS: Gives info. Uses: SOS" + TERMINALSPLIT + "CMD"),
    ("FK#: Mint a black key from a broken key. # = 1 to accept."),
    ("LOC: Change the [X, Y, Z] location of the camera, where X, Y, Z -> 00-FF. Uses: LOC" + TERMINALSPLIT + "XX" + TERMINALSPLIT + "YY"+ TERMINALSPLIT + "ZZ"),
];

const DEVCOMMANDS = [
    "SOS", "FK", "LOC"
];

function H2A(hexString:string){
    let output = '';

    for(var i = 0; i < (hexString.length >> 1); i++){
        let byte = parseInt(hexString.substring(i*2, i*2+2), 16);

        if( isNaN(byte) ){
            byte = 0x3F;
        }

        output += String.fromCharCode(byte);
    }

    return output;
}

function sosCode(cmd:string){

    if(cmd === ''){
        return SOS[0];
    }

    if(cmd.includes('SOS')) return SOS[1];
    if(cmd.includes('RF'))  return SOS[2];
    if(cmd.includes('RW'))  return SOS[3];
    if(cmd.includes('XOR')) return SOS[4];
    if(cmd.includes('H2A')) return SOS[5];

    return SOS[0];
}


function runEmulator(
    program:string, 
    provider:TreasureProvider, 
    byteCB:(hash:number, index:number)=>void, 
    winCB:()=>void,
){

    if(program == null || program.length <= 0){return NOOP;}
    if(program.charAt(0) == TERMINALSPLIT){return NOOP;}

    let codes = program.split(TERMINALSPLIT);
    let wallet = provider.provider.wallet.publicKey;

    if(codes[0] === 'SOS'){
        return sosCode(codes.length > 1 ? codes[1] : "");
    }

    if(codes[0].includes('RF')){
        if(codes[0].length == 3){
            let number = parseInt(codes[0].charAt(2));
            if (number < 0 ) return ERRORS[4];
            if (number > 7 ) return ERRORS[4];

            return FILES[number];
        }
        return ERRORS[1];
    }

    if(codes[0].includes('RW')){
        if(codes[0].length == 3){
            let number = parseInt(codes[0].charAt(2));
            if (isNaN(number)) return ERRORS[2];
            if (number < 0 || number > 9) return ERRORS[2];

            return `Wallet[${number}] = ` + codeToHexString(wallet.toBytes()[number]);
        }
        return ERRORS[2];
    }

    if(codes[0] === 'XOR'){
        if(codes.length >= 3){
            let index0 = 0;
            let index1 = 0;
            let realIndex0 = -1;
            let realIndex1 = -1;
            let byte0 = 0;
            let byte1 = 0;

            if(codes[1].includes('RW')){
                if(codes[1].length == 3){
                    index0 = parseInt(codes[1].charAt(2));
                    if (isNaN(index0)) return ERRORS[3];
                    if (index0 < 0 || index0 > 9) return ERRORS[3];
        
                    byte0 = wallet.toBytes()[index0];
                } else {
                    return ERRORS[3];
                }
            } else {
                return ERRORS[3];
            }

            if(codes[2].includes('RW')){
                if(codes[2].length == 3){
                    index1 = parseInt(codes[2].charAt(2));
                    if (isNaN(index1)) return ERRORS[3];
                    if (index1 < 0 || index1 > 9) return ERRORS[3];
        
                    byte1= wallet.toBytes()[index1];
                } else {
                    return ERRORS[3];
                }
            } else {
                return ERRORS[3];
            }

            realIndex0 = Math.max(index0, index1);
            realIndex1 = Math.min(index0, index1);

            let hash = byte0 ^ byte1;

            if(realIndex0 == 5 && realIndex1 < 5){
                byteCB(hash, realIndex1);
                return `You've found code ${realIndex1}: ${codeToHexString(hash)}!`
            }

            return `XOR RW${index0} RW${index1} = ` + codeToHexString(hash);
        }
        return ERRORS[3];
    }

    if(codes[0] === 'H2A'){
        if(codes.length >= 2){
            let index = 0;
            let file = "";

            if(codes[1].includes('RF')){
                if(codes[1].length == 3){
                    index = parseInt(codes[1].charAt(2));
                    if (isNaN(index)) return ERRORS[4];
                    if (index < 0 ) return ERRORS[4];
                    if (index > 7 ) return ERRORS[4];
                
                    file = FILES[index];
                } else {
                    return ERRORS[4];
                }
            } else {
                return ERRORS[4];
            }

            return H2A(file);
        }
        return ERRORS[4];
    }

    if(codes[0] === 'NOOT'){
        winCB();
        return "NFKey 2 codes unlocked.";
    }

    return ERRORS[0] + ` '${program}' is not valid`;
}

function sosDevCode(cmd:string){

    if(cmd == ''){
        return DEVHELP[0];
    }

    if(cmd.includes('SOS')) return DEVHELP[1];
    if(cmd.includes('FK')) return DEVHELP[2];
    if(cmd.includes('LOC')) return DEVHELP[3];

    return DEVHELP[0];
}

function runDevEmulator(
    program:string, 
    fkCB:()=>void, 
    locCB:(vec:Vector3)=>void,
){

    if(program == null || program.length <= 0){return NOOP;}
    if(program.charAt(0) == TERMINALSPLIT){return NOOP;}

    let codes = program.split(TERMINALSPLIT);

    if(codes[0] === 'SOS'){
        return sosDevCode(codes.length > 1 ? codes[1] : "");
    }

    // if(codes[0].includes('FK')){
    //     if(codes[0].length == 3){
    //         let number = parseInt(codes[0].charAt(2));
    //         if (isNaN(number)) return DEVHELP[2];
    //         if (number !== 1) return DEVHELP[2];

    //         fkCB();

    //         // if(puzzleState.broken){
    //         //     fkCB();
    //         //     return 'Fixing key...';
    //         // } else {
    //         //     return "You need a broken key to fix first...";
    //         // }
    //     }
    //     return DEVHELP[3];
    // }

    if(codes[0] === 'LOC'){
        if(codes.length >= 4){
            let x = null;
            let y = null;
            let z = null;

            if(codes[1].length === 2){
                x = parseInt(codes[1], 16);
                if (isNaN(x)) x = null;

            }

            if(codes[2].length === 2){
                y = parseInt(codes[2], 16);
                if (isNaN(y)) y = null;
            }

            if(codes[3].length === 2){
                z = parseInt(codes[3], 16);
                if (isNaN(z)) z = null;
            }

            console.log(x, y, z);

            if(x !== null && y !== null && z !== null){
                locCB(new Vector3(x, y, z));
                return "Setting camera...";
            }
        }
        return DEVHELP[3];
    }

    return ERRORS[0] + ` '${program}' is not valid`;
}

function DronieTerminal(props:any){
    const [didInit, setDidInit] = useState(false);
    const [blink, setBlink] = useState(false);
    const [tap, setTap] = useState(-5);
    const [tapTimer, setTapTimer] = useState<any>(null);
    const mounted = useRef(false);

    const blinkBlink = () => {
        setTimeout(()=>{
            if(mounted.current){
                setBlink(!blink);
            }
        }, 555)
    }

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false;};
    }, []);

    useEffect(() => {
        blinkBlink();
    }, [blink]);

    useEffect(() => {
        setTap(-3);
    }, [props.program, props.action]);

    useEffect(() => {
        if(tap < props.program.length){
            if(tapTimer === null){
                if(mounted.current){
                    setTapTimer(
                        setTimeout(()=>{
                            if(mounted.current){
                                setTapTimer(null);
                                setTap(tap + 1);
                            }
                        }, 55)
                    );
                }
            }
        }
    }, [tap]);


    let prgm = props.program;
    let color = props.omni ? '#4FA5C4' : '#9945FF';

    if(tap < 0){ 
        prgm = '';
    } else if(tap < prgm.length){
        prgm = prgm.substring(0, tap);
    } 

    return (
        <div className="dronie-terminal" style={{color: color}}>
            {'> ' + prgm + (blink ? ' ' : ' ▐')}
        </div>
    )
}

function Terminal(props:any){
    const [didInit, setDidInit] = useState(false);
    const [blink, setBlink] = useState(false);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        setTimeout(()=>{
            if(mounted.current){
                setBlink(!blink);
            }
        }, 555);
    }, [blink]);


    if(!didInit){
        setTimeout(()=>{
            if(mounted.current){
                setBlink(!blink);
            }
        }, 555);
        setDidInit(true);
    }


    return (
        <div className="terminal">
            {'> ' + props.program + '' + (blink ? ' ' : ' ▐')}
        </div>
    )
}

function TerminalButton(props:any){
    const color = props.color ?? "disabled";
    const onButton = props.onButton ?? (()=>{});
    const text = props.text ?? "X";
    return (
        <Box component="div">
            <Button
                color={color as any}
                onClick={onButton}
                variant="contained"
                sx={{
                    width: '100%',
                    height: '5vh',
                    margin: 0,
                    color: "#0D0D0D",
                    fontSize: "2vh",
                    fontWeight: "Bold",
                }}
                disableElevation
            >        
            {text}  
            </Button>
        </Box>
    );
}

export function DroniesPuzzlePage(props:any){
    const [bytes, setBytes] = useState([-1,-1,-1,-1]);
    const [program, setProgram] = useState("");
    const [response, setResponseState] = useState('* Real Bird Noises *');
    const [responseColor, setResponseColor] = useState(ST_COLORS.green);
    const [crank, turnCrank] = useState(0);

    const setResponse = (resp:string) => {
        turnCrank(crank+1);
        setResponseState(resp);
    }

    const {
        treasureProvider: [treasureProvider],
        devMode: [devMode, setDevMode],
        cameraPosition: [cameraPostion, setCameraPosition],
        globalState: [globalState],
        puzzleState: [puzzleState, setPuzzleState],
        gameState: [gameState, setGameState],
    } = useContext(StoreContext)

    useEffect(() => {
        setBytes(gameState.greenMintBytes);
    }, [puzzleState]);

    useEffect(() => {

    }, []);

    const clearProgram = () => {
        setProgram('');
    }

    const handleSpace = (forEmulator:boolean) => {
        let temp = '';

        if(program.length == 0){
            return program;
        }

        if(program.charAt(program.length - 1) == TERMINALSPLIT){
            return program;
        }

        for(var i = program.length - 1; i >= 0; i--){
            let char = program.charAt(i);
            if(char === '.' || char === '-'){
                temp = char + temp;
            } else {
                break;
            }
        }

        if(temp.length > 0){
            let code = morseToText(temp);
            if(code.length > 1){
                if(forEmulator){
                    return program;
                } else {
                    return code;
                }
            } else {
                return (program.substring(0, program.length - temp.length) + code);
            }
        } else {
            return (program + TERMINALSPLIT);
        }

        return program;
    }
    const handleChar = (char:string)=> {
        if(program.toUpperCase().includes('ERROR')){
            clearProgram();
        } else {
            switch(char){
                case ' ':
                    setProgram(handleSpace(false));
                    break;
                case '-':
                case '.':

                    switch(program + char){
                        case '...---...':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("Coach Chuck here from the 4th wall! You need to BREAK inbetween charecters: [... BREAK --- BREAK ... RUN]");
                            setProgram("");
                            return;
                        case '-....----.':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("Nice.");
                            setProgram("");
                            return;
                        case '..-...--.-.-.-':
                        case '.-......':
                        case '-.....--.-.....':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("Naughty");
                            setProgram("");
                            return;
                        case '-.-------':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("NOOT NOOT! 🐧");
                            setProgram("");
                            return;
                        case '.-...-...-.....-':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("Ribbit Ribbit! 🐸");
                            setProgram("");
                            return;
                        case '.....--....-':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("Suba Suba! 🐍");
                            setProgram("");
                            return;
                        case '--.--':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("GM! ❤️");
                            setProgram("");
                            return;
                        case '--.-.':
                            setResponseColor(ST_COLORS.blue);
                            setResponse("NG! ❤️");
                            setProgram("");
                            return;
                        // case '-......-------...':
                        case '------':
                            setResponseColor(ST_COLORS.blue);
                            if(devMode){
                                setResponse("Already in Dev mode");
                                setProgram("");
                            } else {
                                setResponse("Now in Dev mode. Tap out SOS for available commands.");
                                setDevMode(true);
                                setProgram("");
                            }
                            return;
                        case '......':
                            if(devMode){
                                setResponse("Setting Camera");
                                locCB(new Vector3(0x13, 0x34, 0x55));
                                setProgram("");
                            }
                            return;  
                    }

                    if(
                        (program + char).includes('SOS.') || 
                        (program + char).includes('SOS-') ||
                        (program + char).includes('XOR.') ||
                        (program + char).includes('XOR-') ||
                        (program + char).includes('H2A.') ||
                        (program + char).includes('H2A-')
                    ){
                        setResponseColor(ST_COLORS.blue);
                        setResponse("Coach Chuck's 4th Wall Quick Tip: double BREAK after a command");
                    }

                    setProgram(program + char);
                    break;
            }
        }
    }


    const winCB = () => {
        setBytes(
            getDronieCode(treasureProvider, 5)
        );
    }
    const bytesCB = (hash:number, index:number) => {
        bytes[index] = hash;
        setBytes([...bytes]);
    }
    const fkCB = () =>{
        if(props.puzzleState.broken){
            console.log("Fix Key");
        } else {
            console.log("Could not fix key");
        }
    }
    const locCB = (pos:Vector3) =>{
        setCameraPosition({...STS.StartingCamera, pos: pos});
    }

    const runProgram = () => {
        let newResponse = "...";
        if(devMode){
            newResponse = runDevEmulator(handleSpace(true), fkCB, locCB)
        } else {
            newResponse = (runEmulator(handleSpace(true), treasureProvider, bytesCB, winCB) ?? '');
        }
        if(newResponse === response){
            // driveState();
        } else {
            // setResponseColor(props.state === FSM.DevMode);
            setResponse(newResponse);
        }
        clearProgram();
    }

    const onDronie = () => { setResponse("Chirp Chirp") }
    const addSpace = () => { handleChar(" "); console.log("space"); }
    const addDash = () => { handleChar("-"); }
    const addDot = () => { handleChar("."); }

    const params: PuzzlePageParams = {
        puzzle: ST_PUZZLE_STATE.dronies,
        currentPuzzleState: puzzleState,
        globalState: globalState,
        title: "Dronie Terminal",
        codes: bytes,
        currentCodes: gameState.greenMintBytes,
        onClose: (bytes)=>{
            setGameState({
                ...gameState,
                greenMintBytes: bytes,
            });
        },
        onClosed: ()=>{
            setPuzzleState(ST_PUZZLE_STATE.noPuzzle)
        }
    }
    

    // const color = props.color ?? "disabled";
    // const onClick = props.onClick ?? (()=>{});
    // const text = props.text ?? "X";
    return (
        <PuzzlePageFrame params={params}>
            <div className="dronie-top" onClick={onDronie}>
                <img
                    src={'/img/dronie.png'}
                    srcSet={'/img/dronie.png'}
                    alt={'Coach Chuck'}
                    loading="lazy"
                />
            </ div>
            <div className="dronie-terminal-space">
                <DronieTerminal program={response} action={crank} omni={false}/>
            </ div>
            <div className="dronie-user-terminal-space">
                <Terminal program={program}/>
            </ div>
            <div className="dronie-controls">
                <Box component="div" className="puzzle-control-row">
                    <Grid container spacing={2}>
                        <Grid item xs={3}>
                            <TerminalButton 
                                text={"RUN"}
                                color={ST_THEME_COLORS.green}
                                onButton={runProgram}
                            />
                        </Grid>
                        <Grid item xs={3}>
                        <TerminalButton 
                                text={"DASH"}
                                color={ST_THEME_COLORS.blue}
                                onButton={addDash}
                            />
                        </Grid>
                        <Grid item xs={3}>
                        <TerminalButton 
                                text={"DOT"}
                                color={ST_THEME_COLORS.blue}
                                onButton={addDot}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <TerminalButton 
                                text={"BREAK"}
                                color={ST_THEME_COLORS.blue}
                                onButton={addSpace}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </ div>
        </PuzzlePageFrame>
    );
}
