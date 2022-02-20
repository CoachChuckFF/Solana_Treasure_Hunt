import { useRef, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CancelIcon, DownIcon, UpIcon } from './icons';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { codeToHexString, getDesolatesCode, getDronieCode } from "./hashes";
import { ConstCode, Header, codeToHex } from './commons';
import { Divider } from "@mui/material";


export function DesolatePuzzlePage(props){
    const refs = [useRef(), useRef()];

    const [codes, setCodes] = useState([0,0,0,0]);
    const [colorCodes, setColorCodes] = useState([0x00, 0x00, 0x00])

    const closePage = (codes) => {
        refs[0].current.className = "puzzle-page-out";
        refs[1].current.className = "puzzle-frame-out";
        setTimeout(()=>{
            props.puzzleCB(codes);
        }, 555);
    }
    const closePageWithCodes = () => {closePage([
        codes[0],
        codes[1],
        codes[2],
        codes[3],
    ]);}
    const closePageBack = () => {closePage([-1, -1, -1, -1]);}


    const PageButton = (props) => {
        let text = "Try Codes";
        let click = closePageWithCodes;
        let color = 'primary';

        if(props.colorCodes[0] == 0xAA && props.colorCodes[1] == 0xBB && props.colorCodes[2] == 0xCC){
            text = "Nice Try ;)";
            click = ()=>{};
            color = 'disabled';
        }
        return (
            <Box>
                <Button
                    color={color}
                    onClick={click}
                    variant="contained"
                    sx={{
                        width: '100%',
                        height: '5vh',
                        margin: 0,
                        color: "#CDD2D6",
                    }}
                    disableElevation
                >{text}</Button>
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

    const toDesolate = () => {
        window.open('https://www.desolate.space/planet/4615', '_blank');
    }

    const toColorCode = () => {
        let r = (colorCodes[0] & 0xFF).toString(16).toUpperCase().padStart(2, '0');
        let g = (colorCodes[1] & 0xFF).toString(16).toUpperCase().padStart(2, '0');
        let b = (colorCodes[2] & 0xFF).toString(16).toUpperCase().padStart(2, '0');

        return "#" + r + g + b;
    }

    const UpButton = (props) => {
        const cb = () => {
            let newColors = [...colorCodes];
            let color = newColors[props.index];

            if(color >= 0xFF){
                color = 0xFF;
            } else {
                color += 0x11;
            }
            newColors[props.index] = color;

            setColorCodes(newColors);
        };

        return (
            <Box>
                <Button
                    color={'disabled'}
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

    const DownButton = (props) => {
        const cb = () => {
            let newColors = [...colorCodes];
            let color = newColors[props.index];

            if(color <= 0x00){
                color = 0x00;
            } else {
                color -= 0x11;
            }
            newColors[props.index] = color;

            setColorCodes(newColors);
        };


        return (
            <Box>
                <Button
                    color={'disabled'}
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

    const ColorText = (props) => {
        return (
            <div className="color-text">
                {props.hex}
            </div>
        );
    }

    useEffect(() => {
        setCodes(getDesolatesCode(props.wallet, colorCodes[0], colorCodes[1], colorCodes[2]))
    }, [colorCodes]);

    return (
        <div ref={refs[0]} className="puzzle-page">
            <div ref={refs[1]} className="puzzle-frame"></div>
            <div className="puzzle-header">
                Enter DESOLATEs #4615 ⤵️
            </div>
            <div className="puzzle-area">
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
                                backgroundColor: toColorCode(),
                            }}
                        >
                            <div className="color-box-text">
                                <div className="color-box-text-center">
                                    {toColorCode()}
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
                                    <UpButton index={0} color={'#9945FF'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <UpButton index={1} color={'#14F195'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <UpButton index={2} color={'#4FA5C4'}/>
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
                                    <DownButton index={0} color={'#9945FF'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <DownButton index={1} color={'#14F195'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <DownButton index={2} color={'#4FA5C4'}/>
                                </Grid>
                            </Grid>
                        </div>
                    </div>
                </ div>
            </div>
            <div className="puzzle-controls">
                <div className="puzzle-controls">
                    <Box className="puzzle-control-row">
                    </Box>
                    <Box className="puzzle-control-row">
                        <Grid container spacing={2}>
                            <Grid item xs={4}><Header/></Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(codes[0])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(codes[1])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(codes[2])}/>
                            </Grid>
                            <Grid item xs={2}>
                                <ConstCode code={codeToHex(codes[3])}/>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box className="puzzle-control-row">
                        <Grid container spacing={2}>
                            <Grid item xs={9}>
                                <PageButton colorCodes={colorCodes}/>
                            </Grid>
                            <Grid item xs={3}>
                                <BackButton />
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            </div>
        </div>
    );

}
