import { useRef, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CancelIcon } from './icons';
import { ConstCode, Header, codeToHex } from './commons';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { getNootCode } from "./hashes";

const NOOTS = [
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 0,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 1,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 2,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 3,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 4,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 5,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 6,
        url: "https://solscan.io/token/2ct6MNqzxoAv2guPoZQtrKd9pznfcAgd7MYaXHxNr5cW#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 7,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
    {
        img: 'https://www.arweave.net/EImqZ7GmraVINv5xcsHlmSdTN77WJSLwrtHJFSdwXkU?ext=png',
        title: 'NOOT',
        id: 8,
        url: "https://solscan.io/token/HZy1GBpjJcsEJkJCEytqzu4nRgEwrU3S9AbwgAqpGDd#metadata",
    },
];

function NootImage(props) {
    return (
        <img
            src={props.nootSrc}
            srcSet={props.nootSetSrc}
            alt={props.nootTitle}
            loading="lazy"
        />
    );
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function NootPuzzlePage(props){
    const refs = [useRef(), useRef()];

    const [activeNoot, setActiveNoot] = useState(0);
    const [didShuffle, setDidShuffle] = useState(false);
    const [NOOTERS, setNoots] = useState(null);
    const [codes, setCodes] = useState([0,0,0,0]);

    if(!didShuffle){
        let noots = [];
        for(var i = 0; i < NOOTS.length; i++){
            noots.push(NOOTS[i]);
        }
        shuffleArray(noots);
        setNoots(noots);
        setDidShuffle(true);
    }

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

    const SolScan = (props) => {
        if(props.noot == null) return null;

        let url = "";
        for(var i = 0; i < NOOTS.length; i++){
            if(props.noot == i){
                url = NOOTS[i].url;
            }
        }
        return (
            <div className="noot-solscan">
                <a
                    target="_blank"
                    href={url}
                > 
                {`View N-00${props.noot + 1} on Solscan 👀`}
                </a>
            </div>
        )
    }

    const NootPFP = (props) => {

        const setThisNoot = () =>{
            console.log(NOOTS[props.nootID].img);
            setActiveNoot(props.nootID);
        }

        return (
            <div className={props.noot == props.nootID ? "noot-selected" : "noot-image"} onClick={setThisNoot} key={props.nootID.id}>
                <NootImage 
                    nootSrc={props.nootSrc}
                    nootSetSrc={props.nootSetSrc}
                    nootTitle={props.nootTitle}
                />
            </div>
        );
    }

    const Penguins = (props) => {
        return (
            <div className="noot-grid">
                {NOOTERS.map((nootObj) => (
                    <NootPFP
                        key={nootObj.id}
                        noot={props.noot}
                        nootID={nootObj.id}
                        nootSrc={`/img/noot.png`}
                        nootSetSrc={`/img/noot.png`}
                        nootTitle={nootObj.title}
                    />
                ))}
            </div>
        );
    }


    useEffect(() => {
        setCodes(getNootCode(props.wallet, activeNoot))
    }, [activeNoot]);

    return (
        <div ref={refs[0]} className="puzzle-page">
            <div ref={refs[1]} className="puzzle-frame"></div>
            <div className="puzzle-header">
                Find the NOOT, NOOT NOOT
            </div>
            <div className="puzzle-area">
                <Penguins noot={activeNoot}/>
                <SolScan noot={activeNoot}/>
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