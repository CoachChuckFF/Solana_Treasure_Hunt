import { useRef, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CancelIcon, PlayIcon } from './icons';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { getNootCode, codeToHexString } from "./hashes";

const TERMINALSPLIT = '▹';
const ERRORMSG = 'ERROR. Use SOS for help.';
const ERRORMSGSYN = 'SYNTAX ERROR';

function morseToText(morse){
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

    return 'ERROR';
}


const TERMCOMMANDS = [
    "SOS", "RF#", "RW#", "XOR", "H2A"
]
function sosCode(cmd){
    let response = "";

    response = "Available commands: ";
    for(var i = 0; i < TERMCOMMANDS.length; i++){
        response += TERMCOMMANDS[i] + ', '
    }

    if(cmd == null || cmd == ''){
        return response.substring(0, response.length - 2);
    } else {
        switch(cmd){
            case TERMCOMMANDS[0]: return ("SOS: Gives info. Uses: SOS" + TERMINALSPLIT + "CMD");
            case TERMCOMMANDS[1].substring(0, TERMCOMMANDS[1].length - 1): 
            case TERMCOMMANDS[1]: return ("RF#: Read data file #. RF0-RF5");
            case TERMCOMMANDS[2].substring(0, TERMCOMMANDS[1].length - 1): 
            case TERMCOMMANDS[2]: return ("RW#: Read wallet byte #. RW0-RW9");
            case TERMCOMMANDS[3]: return ("XOR: Bitwise xor two bytes. RW#" + TERMINALSPLIT + "RW#");
            case TERMCOMMANDS[4]: return ("H2A: Converts the input file to human readable ASCII. RF#" + TERMINALSPLIT + "H2A");
        }
    }

    return response.substring(0, response.length - 2);
}


function runEmulator(program){
    if(program == null || program.length <= 0){return '';}
    if(program.charAt(0) == TERMINALSPLIT){return '';}

    let codes = program.split(TERMINALSPLIT);

    for(var i = 0; i < codes.length; i++){
        console.log(codes[i], " ", codes.length);
        switch(codes[i]){
            case "SOS":
                return sosCode(i < (codes.length - 1) ? codes[i + 1] : null)
        }
    }


    return ERRORMSG;
}

function DronieTerminal(props){
    const [didInit, setDidInit] = useState(false);
    const [blink, setBlink] = useState(false);
    const [program, setProgram] = useState('');
    const [tap, setTap] = useState(-5);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if(mounted.current){
            setTimeout(()=>{
                setBlink(!blink);
            }, 555)
        }
    }, [blink]);

    useEffect(() => {
        if(mounted.current){
            if(tap < program.length){
                setTimeout(()=>{
                    setTap(tap + 1);
                }, 55);
            }
        }
    }, [tap]);


    if(!didInit){
        setTimeout(()=>{
            setBlink(!blink);
        }, 555);
        setDidInit(true);
    }

    if(program != props.program){
        setTap(-3);
        setProgram(props.program);
    }

    let prgm = props.program;

    if(tap < 0){ 
        prgm = '';
    } else if(tap < prgm.length){
        prgm = prgm.substring(0, tap);
    } 

    return (
        <div className="dronie-terminal">
            {'> ' + prgm + (blink ? ' ' : ' ▐')}
        </div>
    )
}

function Terminal(props){
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
            setBlink(!blink);
        }, 555)
    }, [blink]);


    if(!didInit){
        setTimeout(()=>{
            setBlink(!blink);
        }, 555);
        setDidInit(true);
    }


    return (
        <div className="terminal">
            {'> ' + props.program + '' + (blink ? ' ' : ' ▐')}
        </div>
    )
}

export function DroniesPuzzlePage(props){
    const ref = useRef();

    const [codes, setCodes] = useState([0,0,0,0]);
    const [program, setProgram] = useState('');
    const [response, setResponse] = useState('');
    const [blink, setBlink] = useState(true);

    const closePage = (codes) => {
        ref.current.className = "puzzle-page-out";
        setTimeout(()=>{
            props.puzzleCB(codes);
        }, 555);
    }
    const closePageWithCodes = () => {closePage([
        codeToHexString(codes[0]),
        codeToHexString(codes[1]),
        codeToHexString(codes[2]),
        codeToHexString(codes[3]),
    ]);}
    const closePageBack = () => {closePage(['','','','']);}

    const clearProgram = () => {
        setProgram('');
    }


    const handleSpace = () => {
        let temp = '';
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
            console.log(code, " ", temp);
            if(code.length > 1){
                return'ERROR';
            } else {
                console.log(morseToText(temp));
                return (program.substring(0, program.length - temp.length) + code);
            }
        } else {
            return (program + TERMINALSPLIT);
        }

        return program;
    }
    const handleChar = (char)=> {
        if(program.toUpperCase().includes('ERROR')){
            clearProgram();
        } else {
            switch(char){
                case ' ':
                    setProgram(handleSpace());
                    break;
                case '-':
                case '.':
                    setProgram(program + char);
                    break;
            }
        }
    }

    const runProgram = () => {
        setResponse(runEmulator(handleSpace()) ?? '');
        clearProgram();
    }
    const Run = () => {
        return (
            <Box>
                <Button
                    color={'green'}
                    onClick={runProgram}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#0D0D0D",
                    }}
                    disableElevation
                >          
                    <div
                        style={{
                            color: "#757575",
                            fontSize: "1.3rem",
                        }}
                    >
                        <PlayIcon />
                    </div>
                </Button>
            </Box>
        );
    }

    const addSpace = () => { handleChar(" "); }
    const Space = () => {
        return (
            <Box>
                <Button
                    color={'blue'}
                    onClick={addSpace}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#0D0D0D",
                    }}
                    disableElevation
                >SPACE</Button>
            </Box>
        );
    }

    const addDash = () => { handleChar("-"); }
    const Dash = () => {
        return (
            <Box>
                <Button
                    color={'blue'}
                    onClick={addDash}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#0D0D0D",
                    }}
                    disableElevation
                >DASH</Button>
            </Box>
        );
    }

    const addDot = () => { handleChar("."); }
    const Dot = () => {
        return (
            <Box>
                <Button
                    color={'blue'}
                    onClick={addDot}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#0D0D0D",
                    }}
                    disableElevation
                >DOT</Button>
            </Box>
        );
    }

    const PageButton = () => {
        return (
            <Box>
                <Button
                    color={'primary'}
                    onClick={closePageWithCodes}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#CDD2D6",
                    }}
                    disableElevation
                >Try Codes</Button>
            </Box>
        );
    }

    const BackButton = () => {
        return (
            <Box>
                <Button
                    color={'disabled'}
                    onClick={closePageBack}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#CDD2D6",
                    }}
                    disableElevation
                >
                <div
                    style={{
                        color: "#757575",
                        fontSize: "1.3rem",
                    }}
                >
                    <CancelIcon />
                </div>
            </Button>
            </Box>
        );
    }

    const ConstCode = (props) => {
        return (
            <div className="your-codes">
                {props.code}
            </div>
        )
    }

    const Response = (props) => {
        return (
            <div className="your-codes-header">
                Commands: H = 'help' 
            </div>
        )
    }

    const Commands = (props) => {
        return (
            <div className="your-codes-header">
                Commands: H = 'help' 
            </div>
        )
    }

    const Header = (props) => {
        return (
            <div className="your-codes-header">
                Generated:
            </div>
        )
    }


    return (
        <div ref={ref} className="puzzle-page">
            <div className="puzzle-header">
                Memory Dump
            </div>
            <div className="puzzle-content">
                <div>

                </div>
            </div>
            <div className='code-container'>
                <Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><DronieTerminal program={response}/></Grid>
                        <Grid item xs={12}><Terminal program={program}/></Grid>
                        <Grid item xs={3}>
                            <Run />
                        </Grid>
                        <Grid item xs={3}>
                            <Dot />
                        </Grid>
                        <Grid item xs={3}>
                            <Dash />
                        </Grid>
                        <Grid item xs={3}>
                            <Space />
                        </Grid>
                        <Grid item xs={4}>
                            <Header />
                        </Grid>
                        <Grid item xs={2}>
                            <ConstCode code={codeToHexString(codes[0])}/>
                        </Grid>
                        <Grid item xs={2}>
                            <ConstCode code={codeToHexString(codes[1])}/>
                        </Grid>
                        <Grid item xs={2}>
                            <ConstCode code={codeToHexString(codes[2])}/>
                        </Grid>
                        <Grid item xs={2}>
                            <ConstCode code={codeToHexString(codes[3])}/>
                        </Grid>
                        <Grid item xs={9}>
                            <PageButton />
                        </Grid>
                        <Grid item xs={3}>
                            <BackButton />
                        </Grid>
                    </Grid>
                </Box>
            </div>
        </div>
    );
}
