import { useRef, useState, useEffect, useContext } from "react";
import { PuzzlePageFrame, PuzzlePageParams } from "../views/puzzleCommons";
import { FRACTAL_SOLUTION, NULL_MINT_CODES as NULL_MINT_BYTES, ST_PUZZLE_STATE } from "../models/state";
import { StoreContext } from "../controllers/store";

function RuggedTerminal(props:any){
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

    if(tap < 0){ 
        prgm = '';
    } else if(tap < prgm.length){
        prgm = prgm.substring(0, tap);
    } 

    return (
        <div className="rug-terminal">
            {'> ' + prgm + (blink ? ' ' : ' ▐')}
        </div>
    )
}

export function RugPuzzlePage(props:any){

    const {
        globalState: [globalState],
        puzzleState: [puzzleState, setPuzzleState],
    } = useContext(StoreContext)

    useEffect(() => {
    }, [puzzleState]);

    useEffect(() => {
    }, []);

    const params: PuzzlePageParams = {
        puzzle: ST_PUZZLE_STATE.rug,
        currentPuzzleState: puzzleState,
        globalState: globalState,
        title: "RUGGED",
        codes: NULL_MINT_BYTES,
        currentCodes: NULL_MINT_BYTES,
        onClose: (bytes)=>{},
        onClosed: ()=>{setPuzzleState(ST_PUZZLE_STATE.noPuzzle)}
    }

    return (
        <PuzzlePageFrame params={params}>
            <div className="rug-top"></div>
            <div className="rug-middle">
                <RuggedTerminal program={`This puzzle has been rugged. Originally, the '${FRACTAL_SOLUTION}' NFT was marketed as your key to the openworld-mmorpg-crafting-puzzle-forklift-simulator-metaverse (with fishing!). Turns out the 1 week delivery time was UnrEALIstIC... I digress. Fortuntatly for you, the black key can be obtained in another fashion.`}/>
            </ div>
            <div className="rug-bottom"></div>
        </PuzzlePageFrame>
    );
}
