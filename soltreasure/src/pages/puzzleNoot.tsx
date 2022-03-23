import { useRef, useState, useEffect, useContext } from "react";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { PuzzlePageFrame, PuzzlePageParams } from "../views/puzzleCommons";
import { getNootCode } from "../models/hashes";
import { NULL_MINT_CODES as NULL_MINT_BYTES, ST_PUZZLE_STATE } from "../models/state";
import { StoreContext } from "../controllers/store";

interface NootInfo {
    img: string,
    title: string,
    id: number,
    url: string
}
const NOOTS:NootInfo[] = [
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

function NootPFP (props:any){

    const setThisNoot = () =>{
        if(props.activeNoot !== props.nootID){
            props.onNoot(props.nootID);
        }
    }

    return (
        <div className={props.activeNoot === props.nootID ? "noot-selected" : "noot-image"} onClick={setThisNoot} key={props.nootID.id}>
            <img
                src={props.nootSrc}
                srcSet={props.nootSetSrc}
                alt={props.nootTitle}
                loading="lazy"
            />
        </div>
    );
}

function Penguins(props:any){
    return (
        <div className="noot-grid">
            {props.nooters.map((nootObj:NootInfo) => (
                <NootPFP
                    key={nootObj.id}
                    activeNoot={props.activeNoot}
                    nootID={nootObj.id}
                    nootSrc={`/img/noot.png`}
                    nootSetSrc={`/img/noot.png`}
                    nootTitle={nootObj.title}
                    onNoot={props.onNoot}
                />
            ))}
        </div>
    );
}

function SolScan(props:any){
    if(props.activeNoot == null) return null;

    let url = "";
    for(var i = 0; i < NOOTS.length; i++){
        if(props.activeNoot === i){
            url = NOOTS[i].url;
        }
    }

    return (
        <div className="noot-solscan">
            <a
                target="_blank"
                href={url}
            > 
            {`View 00${props.activeNoot + 1} on Solscan 👀`}
            </a>
        </div>
    )
}

export function NootPuzzlePage(props:any){

    const [activeNoot, setActiveNoot] = useState(0);
    const [nooters, setNooters] = useState(NOOTS);
    const [bytes, setBytes] = useState(NULL_MINT_BYTES);

    const {
        treasureProvider: [treasureProvider],
        globalState: [globalState],
        puzzleState: [puzzleState, setPuzzleState],
        gameState: [gameState, setGameState],
    } = useContext(StoreContext)

    useEffect(() => {
        setBytes(gameState.blueMintBytes);
    }, [puzzleState]);

    useEffect(() => {
        let noots = [];
        for(var i = 0; i < NOOTS.length; i++){
            noots.push(NOOTS[i]);
        }
        shuffleArray(noots);
        setNooters(noots);
    }, []);

    useEffect(() => {
        setBytes(getNootCode(treasureProvider, activeNoot))
    }, [activeNoot]);

    const shuffleArray = (array:any) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    const onNoot = (noot: number) => {
        setActiveNoot(Math.min(NOOTS.length - 1, Math.round(Math.abs(noot))));
    }

    const params: PuzzlePageParams = {
        puzzle: ST_PUZZLE_STATE.noot,
        currentPuzzleState: puzzleState,
        globalState: globalState,
        title: "Find the real NOOT, NOOT NOOT",
        codes: bytes,
        currentCodes: gameState.blueMintBytes,
        onClose: (bytes)=>{
            setGameState({
                ...gameState,
                blueMintBytes: bytes,
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
            <Penguins 
                activeNoot={activeNoot}
                nooters={nooters}
                onNoot={onNoot}
            />
            <SolScan 
                activeNoot={activeNoot}
            />
        </PuzzlePageFrame>
    );
}
