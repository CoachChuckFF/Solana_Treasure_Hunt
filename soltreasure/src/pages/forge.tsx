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

export function ForgePage(props:any){

    const {
        globalState: [globalState],
        puzzleState: [puzzleState, setPuzzleState],
    } = useContext(StoreContext)

    useEffect(() => {
    }, [puzzleState]);

    useEffect(() => {
    }, []);

    const params: PuzzlePageParams = {
        puzzle: ST_PUZZLE_STATE.forge,
        currentPuzzleState: puzzleState,
        globalState: globalState,
        title: "Black Hole Forge",
        codes: NULL_MINT_BYTES,
        currentCodes: NULL_MINT_BYTES,
        onClose: (bytes)=>{},
        onClosed: ()=>{setPuzzleState(ST_PUZZLE_STATE.noPuzzle)}
    }

    return (
        <PuzzlePageFrame 
            params={params}
        >
        </PuzzlePageFrame>
    );
}
