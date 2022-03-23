import { useRef, useState, useEffect, useContext } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { Divider } from "@mui/material";
import { ST_PUZZLE_STATE } from "../models/state";
import { PuzzlePageFrame, PuzzlePageParams } from "../views/puzzleCommons";
import { StoreContext } from "../controllers/store";
import { DownIcon, UpIcon } from "../views/icons";
import { AnyARecord } from "dns";
import { getDesolatesCode } from "../models/hashes";

const toColorCode = (colorCodes:number[]) => {
    let r = (colorCodes[0] & 0xFF).toString(16).toUpperCase().padStart(2, '0');
    let g = (colorCodes[1] & 0xFF).toString(16).toUpperCase().padStart(2, '0');
    let b = (colorCodes[2] & 0xFF).toString(16).toUpperCase().padStart(2, '0');

    return "#" + r + g + b;
}

function UpButton(props:any){

    const cb = () => {
        props.onUp(props.index);
    };

    return (
        <Box component="div">
            <Button
                color={'disabled' as any}
                onClick={cb}
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
                        color: props.color,
                        fontSize: "1.3rem",
                    }}
                >
                    <UpIcon />
                </div>
            </Button>
        </Box>
    );
}
function DownButton(props:any){
    const cb = () => {
        props.onDown(props.index);
    };
    return (
        <Box component="div">
            <Button
                color={'disabled' as any}
                onClick={cb}
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
                        color: props.color,
                        fontSize: "1.3rem",
                    }}
                >
                    <DownIcon />
                </div>
            </Button>
        </Box>
    );
}

function ColorText(props:any){
    return (
        <div className="color-text">
            {props.hex}
        </div>
    );
}

export function DesolatePuzzlePage(props:any){
    const refs = [useRef(), useRef()];

    const [bytes, setBytes] = useState([0,0,0,0]);
    const [colorCodes, setColorCodes] = useState([0x00, 0x00, 0x00])

    const {
        treasureProvider: [treasureProvider],
        globalState: [globalState],
        puzzleState: [puzzleState, setPuzzleState],
        gameState: [gameState, setGameState],
    } = useContext(StoreContext)

    useEffect(() => {
        setBytes(gameState.purpleMintBytes);
    }, [puzzleState]);

    useEffect(() => {
        setBytes(getDesolatesCode(treasureProvider, colorCodes[0], colorCodes[1], colorCodes[2]))
    }, [colorCodes]);

    const toDesolate = () => {
        window.open('https://www.desolate.space/planet/4615', '_blank');
    }

    const onUp = (index:number) => {
        let newColors = [...colorCodes];
        let color = newColors[index];

        if(color >= 0xFF){
            color = 0xFF;
        } else {
            color += 0x11;
        }
        newColors[index] = color;

        setColorCodes(newColors);
    };

    const onDown = (index:number) => {
        let newColors = [...colorCodes];
        let color = newColors[index];

        if(color <= 0x00){
            color = 0x00;
        } else {
            color -= 0x11;
        }
        newColors[index] = color;

        setColorCodes(newColors);
    };


    const params: PuzzlePageParams = {
        puzzle: ST_PUZZLE_STATE.desolates,
        currentPuzzleState: puzzleState,
        globalState: globalState,
        title: "Enter DESOLATEs #4615 ⤵️",
        codes: bytes,
        currentCodes: gameState.purpleMintBytes,
        onClose: (bytes)=>{
            setGameState({
                ...gameState,
                purpleMintBytes: bytes,
            });
        },
        onClosed: ()=>{
            setPuzzleState(ST_PUZZLE_STATE.noPuzzle)
        }
    }

    return (
        <PuzzlePageFrame 
            params={params}
        >
            <div className="puzzle-half" onClick={toDesolate}>
                <img
                    src={'/img/desolates.png'}
                    srcSet={'/img/desolates.png'}
                    alt={'Coach Chuck'}
                    loading="lazy"
                />
            </ div>
            <div className="puzzle-quarter">
                <div className="middle-box">
                    <div 
                        className="color-box"
                        style={{
                            backgroundColor: toColorCode(colorCodes),
                        }}
                    >
                        <div className="color-box-text">
                            <div className="color-box-text-center">
                                {toColorCode(colorCodes)}
                            </div>
                        </div>
                    </div>
                </div>
            </ div>
            <div className="puzzle-quarter">
                <div className="middle-box">
                    <div className="color-change-box">
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <UpButton index={0} color={'#9945FF'} onUp={onUp}/>
                            </Grid>
                            <Grid item xs={4}>
                                <UpButton index={1} color={'#14F195'} onUp={onUp}/>
                            </Grid>
                            <Grid item xs={4}>
                                <UpButton index={2} color={'#4FA5C4'} onUp={onUp}/>
                            </Grid>
                            <Grid item xs={4}>
                                <ColorText hex={'0x' + colorCodes[0].toString(16).toUpperCase().padStart(2, '0')}/>
                            </Grid>
                            <Grid item xs={4}>
                                <ColorText hex={'0x' + colorCodes[1].toString(16).toUpperCase().padStart(2, '0')}/>
                            </Grid>
                            <Grid item xs={4}>
                                <ColorText hex={'0x' + colorCodes[2].toString(16).toUpperCase().padStart(2, '0')}/>
                            </Grid>
                            <Grid item xs={4}>
                                <DownButton index={0} color={'#9945FF'} onDown={onDown}/>
                            </Grid>
                            <Grid item xs={4}>
                                <DownButton index={1} color={'#14F195'} onDown={onDown}/>
                            </Grid>
                            <Grid item xs={4}>
                                <DownButton index={2} color={'#4FA5C4'} onDown={onDown}/>
                            </Grid>
                        </Grid>
                    </div>
                </div>
            </ div>
        </PuzzlePageFrame>
    );
}
