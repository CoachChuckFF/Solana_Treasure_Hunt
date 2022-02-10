import { useRef, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CancelIcon, DownIcon, UpIcon } from './icons';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { codeToHexString, getDesolatesCode, getDronieCode } from "./hashes";
import { Divider } from "@mui/material";


export function DesolatePuzzlePage(props){
    const ref = useRef();

    const [codes, setCodes] = useState([0,0,0,0]);
    const [colorCodes, setColorCodes] = useState([0x00, 0x00, 0x00])

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

    const Header = (props) => {
        return (
            <div className="your-codes-header">
                Generated:
            </div>
        )
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
        <div ref={ref} className="puzzle-page">
            <div className="puzzle-header">
                Find the Color Code
            </div>
            <div className="puzzle-content">
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
                        <div 
                            className="color-change-box"
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <UpButton index={0} color={'#DC1FFF'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <UpButton index={1} color={'#00FFA3'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <UpButton index={2} color={'#03E2FF'}/>
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
                                    <DownButton index={0} color={'#DC1FFF'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <DownButton index={1} color={'#00FFA3'}/>
                                </Grid>
                                <Grid item xs={4}>
                                    <DownButton index={2} color={'#03E2FF'}/>
                                </Grid>
                            </Grid>
                        </div>
                    </div>
                </ div>
            </div>
            <div className='code-container'>
                <Box>
                    <Grid container spacing={2}>
                        <Grid item xs={4}><Header/></Grid>
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
