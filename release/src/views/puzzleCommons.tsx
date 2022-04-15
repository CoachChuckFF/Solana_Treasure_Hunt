import { useRef } from "react";
import { CancelIcon, PuzzleIcon } from "./icons";
import { ST_GLOBAL_STATE, ST_PUZZLE_STATE } from "../models/state";
import { HudControls, HUDState, NULL_HUD_STATE } from "./hud";
import { ST_THEME_COLORS } from "../models/theme";


export interface PuzzlePageParams {
    puzzle: ST_PUZZLE_STATE,
    currentPuzzleState: ST_PUZZLE_STATE,
    globalState: ST_GLOBAL_STATE,
    title: string,
    codes: number[],
    currentCodes: number[],
    onClose: (codes: number[]) => void,
    onClosed: () => void,
}
export function PuzzlePageFrame(props:any){
    const params = props.params as PuzzlePageParams;
    const refs = [
        useRef() as any,
        useRef() as any,
        useRef() as any,
        useRef() as any,
    ];

    const closePage = (codes:number[]) => {
        refs[0].current.className = "puzzle-page-out";
        refs[1].current.className = "puzzle-frame-out";

        params.onClose(codes);
        setTimeout(()=>{
            params.onClosed();
        }, 555);
    }
    const closePageWithCodes = () => {closePage([...params.codes]);}
    const closePageBack = () => {closePage([...params.currentCodes]);}

    if(params.currentPuzzleState !== params.puzzle || 
        (params.globalState !== ST_GLOBAL_STATE.playing &&
        params.globalState !== ST_GLOBAL_STATE.reconstruction)
    ){
        return null;
    }

    const hudState: HUDState = {
        ...NULL_HUD_STATE,
        enabled: true,
        icon: (<PuzzleIcon/>),
        puzzleIcon: (<CancelIcon />),
        text: "Set Bytes",
        title: "Mint Bytes:",
        codes: params.codes,
        overrideThemeColor: ST_THEME_COLORS.grey,
        showingOnStart: true
    }

    return (
        <div ref={refs[0]} className="puzzle-page">
            <div ref={refs[1]} className="puzzle-frame"></div>
            <div className="puzzle-header">
                {params.title}
            </div>
            <div className="puzzle-area">
                {props.children}
            </div>
            <HudControls 
                bytesRef={refs[2]}
                buttonsRef={refs[3]}
                hudState={hudState}
                isLoading={false}
                handleMintClick={closePageWithCodes}
                handlePuzzleClick={closePageBack}
            />
        </div>
    );
}
