import { useRef, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CancelIcon } from './icons';
import { ConstCode, Header, codeToHex } from './commons';
import { getCorrectTestCodes, getWrongTestCodes } from "./hashes";

const FRACTALS = [
    {
        title: 'Smaez',
        id: 0,
        url: "https://solscan.io/token/7qNcZHos3hGHBNxxHSLqKxQBEARFNMBX7GQghMqktNgQ",
    },
    {
        title: 'Denhino',
        id: 1,
        url: "https://solscan.io/token/2dVh45UrGpBMjqBB5Dst5DapYR1hiPjADuxmMFpsYVPk",
    },
    {
        title: 'Wordel',
        id: 2,
        url: "https://solscan.io/token/CLHqxn6ETH558S8MkbFFq6kHMXEAGmF3kNQxJ4R8MrzM",
    },
    {
        title: 'Dels',
        id: 3,
        url: "https://solscan.io/token/F889P7iHTypAiR9nudsLSx1KbUVrG5SurGQuhM4kzDJP",
    },
];

export function DemoPuzzlePage(props){
    const refs = [useRef(), useRef()];

    const [activeFractal, setActiveFractal] = useState(0);
    const [codes, setCodes] = useState([0,0,0,0]);

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

    const PageButton = () => {
        return (
            <Button
                color={'test'}
                onClick={closePageWithCodes}
                variant="contained"
                sx={{
                    width: '100%',
                    height: '5vh',
                    margin: 0,
                    color: "#0E1922",
                }}
                disableElevation
            >Try Codes</Button>
        );
    }

    const BackButton = () => {
        return (
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
        );
    }

    const Fractals = () => {

        return (
            <div className="demo-center">
                <div className="demo-top">
                    <div className="demo-left">
                        <div className={activeFractal == 0 ? "demo-selected" : "demo-image"} onClick={()=>{setActiveFractal(0)}} key={0}>
                            <img
                                src={'/img/' + FRACTALS[0].title + '.jpeg'}
                                srcSet={'/img/' + FRACTALS[0].title + '.jpeg'}
                                alt={FRACTALS[0].title}
                                loading="lazy"
                            />
                        </div>
                    </div>
                    <div className="demo-right">
                    <div className={activeFractal == 1 ? "demo-selected" : "demo-image"} onClick={()=>{setActiveFractal(1)}} key={1}>
                            <img
                                src={'/img/' + FRACTALS[1].title + '.jpeg'}
                                srcSet={'/img/' + FRACTALS[1].title + '.jpeg'}
                                alt={FRACTALS[1].title}
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
                <div className="demo-bottom">
                    <div className="demo-left">
                    <div className={activeFractal == 2 ? "demo-selected" : "demo-image"} onClick={()=>{setActiveFractal(2)}} key={2}>
                            <img
                                src={'/img/' + FRACTALS[2].title + '.jpeg'}
                                srcSet={'/img/' + FRACTALS[2].title + '.jpeg'}
                                alt={FRACTALS[2].title}
                                loading="lazy"
                            />
                        </div>
                    </div>
                    <div className="demo-right">
                    <div className={activeFractal == 3 ? "demo-selected" : "demo-image"} onClick={()=>{setActiveFractal(3)}} key={3}>
                            <img
                                src={'/img/' + FRACTALS[3].title + '.jpeg'}
                                srcSet={'/img/' + FRACTALS[3].title + '.jpeg'}
                                alt={FRACTALS[3].title}
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
                <div className="demo-speed">
                    <div className="demo-solscan">
                        <a
                            target="_blank"
                            href={'https://www.fractal.is/fractals'}
                        > 
                        {`${FRACTALS[activeFractal].title}`}
                        </a>
                    </div>
                </div>
            </div>
        );
    }


    useEffect(() => {
        if(activeFractal === 3){
            setCodes(getCorrectTestCodes(props.wallet))
        } else {
            setCodes(getWrongTestCodes(props.wallet, activeFractal))
        }
    }, [activeFractal]);

    return (
        <div ref={refs[0]} className="puzzle-page">
            <div ref={refs[1]} className="puzzle-frame"></div>
            <div className="puzzle-header">
                Most Valuble?
            </div>
            <div className="puzzle-area">
                <Fractals/>
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
                                <PageButton />
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
