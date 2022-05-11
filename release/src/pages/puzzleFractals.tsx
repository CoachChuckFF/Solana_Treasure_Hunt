import { useState, useEffect, useContext } from "react";
import { PuzzlePageFrame, PuzzlePageParams } from "../views/puzzleCommons";
import { getFractalCodes } from "../models/hashes";
import { NULL_MINT_CODES as NULL_MINT_BYTES, ST_PUZZLE_STATE } from "../models/state";
import { StoreContext } from "../controllers/store";

const FRACTALS = [
    {
        title: 'Blidain',
        id: 0,
        url: "https://solscan.io/token/F95gRGdq3prYCZYtXeYXK5MQw5qu3c7rh2hnaAjux9Ld",
        char: 'T',
        img: "https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Blidain.jpeg",
    },
    {
        title: 'Denhino',
        id: 1,
        url: "https://solscan.io/token/2dVh45UrGpBMjqBB5Dst5DapYR1hiPjADuxmMFpsYVPk",
        char: 'Q',
        img: "https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Denhino.jpeg",
    },
    {
        title: 'Wordel',
        id: 2,
        url: "https://solscan.io/token/CLHqxn6ETH558S8MkbFFq6kHMXEAGmF3kNQxJ4R8MrzM",
        char: 'P',
        img: "https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Wordel.jpeg",
    },
    {
        title: 'Dels',
        id: 3,
        url: "https://solscan.io/token/F889P7iHTypAiR9nudsLSx1KbUVrG5SurGQuhM4kzDJP",
        char: 'H',
        img: "https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Dels.jpeg",
    },
];

function Fractals(props:any){
    let activeFractal = props.activeFractal as number;
    let onFractal = props.onFractal as ((is:number)=>void);
    let combination = props.combination as string;

    const combinationToStar = ()=>{
        let pass = "";
        for(var i = 0; i < combination.length; i++){
            pass += "*";
        }
        return pass;
    }

    return (
        <div className="demo-center">
            <div className="demo-top">
                <div className="demo-left">
                    <div className={activeFractal == 0 ? "demo-selected" : "demo-image"} onClick={()=>{onFractal(0)}} key={0}>
                        <img
                            src={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Blidain.jpeg"}
                            srcSet={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Blidain.jpeg"}
                            alt={FRACTALS[0].title}
                            loading="lazy"
                        />
                    </div>
                </div>
                <div className="demo-right">
                <div className={activeFractal == 1 ? "demo-selected" : "demo-image"} onClick={()=>{onFractal(1)}} key={1}>
                        <img
                            src={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Denhino.jpeg"}
                            srcSet={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Denhino.jpeg"}
                            alt={FRACTALS[1].title}
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
            <div className="demo-bottom">
                <div className="demo-left">
                <div className={activeFractal == 2 ? "demo-selected" : "demo-image"} onClick={()=>{onFractal(2)}} key={2}>
                        <img
                            src={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Wordel.jpeg"}
                            srcSet={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Wordel.jpeg"}
                            alt={FRACTALS[2].title}
                            loading="lazy"
                        />
                    </div>
                </div>
                <div className="demo-right">
                <div className={activeFractal == 3 ? "demo-selected" : "demo-image"} onClick={()=>{onFractal(3)}} key={3}>
                        <img
                            src={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Dels.jpeg"}
                            srcSet={"https://shdw-drive.genesysgo.net/DYwKHj8KEMXreNEH1nK7tspEWB4Mn2kM2bvVRZ3vgmq5/Dels.jpeg"}
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
                        href={FRACTALS[activeFractal].url}
                    > 
                    {`${FRACTALS[activeFractal].title} on Solscan 👀`}
                    </a>
                </div>
            </div>
            <div className="demo-speed">
                <div className="demo-solscan">
                    {combinationToStar()}
                </div>
            </div>
        </div>
    );
}

export function FractalsPuzzlePage(props:any){
    const [activeFractal, setActiveFractal] = useState(0);
    const [bytes, setBytes] = useState(NULL_MINT_BYTES);
    const [combination, setCombination] = useState("");


    const {
        stProvider: [stProvider],
        globalState: [globalState],
        puzzleState: [puzzleState, setPuzzleState],
        gameState: [gameState, setGameState],
    } = useContext(StoreContext)

    useEffect(() => {
        setCombination("");
    }, [puzzleState]);

    const onFractal = (id:number) => {
        let char = FRACTALS[id].char;
        setActiveFractal(id);

        let newCombination = combination + char;
        if(newCombination.length > 16){
            newCombination = "";
        }
        setCombination(newCombination);
        setBytes(
            getFractalCodes(
                stProvider,
                newCombination
            )
        )
    }

    const params: PuzzlePageParams = {
        puzzle: ST_PUZZLE_STATE.fractals,
        currentPuzzleState: puzzleState,
        globalState: globalState,
        title: "[RF8]",
        codes: bytes,
        currentCodes: gameState.whiteMintBytes,
        onClose: (bytes)=>{
            setGameState({
                ...gameState,
                whiteMintBytes: bytes,
            });
        },
        onClosed: ()=>{setPuzzleState(ST_PUZZLE_STATE.noPuzzle)}
    }

    return (
        <PuzzlePageFrame 
            params={params}
        >
        <Fractals
            activeFractal={activeFractal}
            onFractal={onFractal}
            combination={combination}
        />
        </PuzzlePageFrame>
    );
}
