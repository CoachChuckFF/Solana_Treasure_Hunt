
import React from "react";
import * as STSnackbar from "../views/snackbar";
import * as STCurtains from "../views/curtains";
import * as STWorldSpace from "./worldSpace";
import * as STClock from "./clock";
import { PublicKey } from "@solana/web3.js"
import { Vector3 } from 'three';
import { addDays } from "./clock";

//TODO Update these with SOL TREASURE
export enum ST_CHEST_TYPES {
    main = "Main Chest",
    secret = "Secret Chest"
}
export enum ST_CHEATER_TIMES {
    main = STClock.minutesToMS(10),
    secret = STClock.minutesToMS(30),
}

export enum ST_CAMERA_SLOTS {
    devSlot = -2,
    nullSlot = -1,
    slot0 = 0,
    slot1 = 1,
    slot2 = 2,
    slot3 = 3,
    slot4 = 4,
    slot5 = 4,
    sslot0 = 5,
    sslot1 = 6,
    sslot2 = 7,
    sslot3 = 8,
    sslot4 = 9,
    sslot5 = 10,
}

export enum ST_GLOBAL_STATE {
    supernova = "-1. Supernova",
    notConnected = "0. Connect your wallet",
    playing = "1. Playing",
    reconstruction = "2. Reconstruction",
}

export enum ST_PUZZLE_STATE {
    noPuzzle = "None",
    noot = "Noots",
    dronies = "Dronies",
    desolates = "Desolates",
    combination = "Combination",
    fractals = "Fractals",
}

export interface GameState {
    // Metrics
    supernova: Date;
    runStart: Date;
    runPercentTimestamp: Date;
    runPercent: number;

    // Codes
    blueMintBytes: number[];
    greenMintBytes: number[];
    purpleMintBytes: number[];
    whiteMintBytes: number[];

    // Forge
    forgeItemOne: PublicKey;
    forgeItemTwo: PublicKey;

    // Inventory
    blueKey: number;
    greenKey: number;
    purpleKey: number;
    brokenKey: number;
    blackKey: number;
    whiteKey: number;

    // Prizes
    main: number;
    secret: number;
    replay: number;
}

export const NULL_SUPERNOVA = addDays(0xFFF);
export const NULL_START_DATE = addDays(0xFF0);
export const NULL_TIMESTAMP = addDays(0xFF0);
export const NULL_MINT_CODES = [-1, -1, -1, -1];
export const NULL_GAME_STATE: GameState = {
    supernova: NULL_SUPERNOVA,
    runStart: NULL_START_DATE,
    runPercentTimestamp: NULL_TIMESTAMP,
    runPercent: 0,
    blueMintBytes: NULL_MINT_CODES,
    greenMintBytes: NULL_MINT_CODES,
    purpleMintBytes: NULL_MINT_CODES,
    whiteMintBytes: NULL_MINT_CODES,
    forgeItemOne: PublicKey.default,
    forgeItemTwo: PublicKey.default,
    blueKey: 0,
    greenKey: 0,
    purpleKey: 0,
    brokenKey: 0,
    blackKey: 0,
    whiteKey: 0,
    main: 0,
    secret: 0,
    replay: 0,
};
export const NULL_GLOBAL_STATE = ST_GLOBAL_STATE.notConnected;
export const NULL_PUZZLE_STATE = ST_PUZZLE_STATE.noPuzzle;
export const NULL_CAMERA_SLOT = ST_CAMERA_SLOTS.nullSlot;
export const NULL_CAMERA_POSITION = STWorldSpace.TargetCamera;
export const NULL_IS_LOADING = false;
export const NULL_DEV_MODE = false;
export const NULL_ACTION_CRANK = 0;

export const getNewGameState = ( newState: any ) => {
    return Object.assign(
        {},
        {
            ...NULL_GAME_STATE,
            ...newState
        }
    ) as GameState;
}

export const getNewCameraPosition = ( newState: STWorldSpace.STSpace) => {
    return Object.assign(
        {},
        {
            ...NULL_CAMERA_POSITION,
            pos: new Vector3(
                newState.pos.x,
                newState.pos.y,
                newState.pos.z,
            )
        }
    ) as STWorldSpace.STSpace;
}

export const isReconstruction = ( globalState: ST_GLOBAL_STATE ) => {
    return (globalState === ST_GLOBAL_STATE.reconstruction ? true : false);
}

export const likesPumkins = ( gameState: GameState, chest: ST_CHEST_TYPES, globalState: ST_GLOBAL_STATE, ) => {
    if( isReconstruction(globalState) ) return false;

    let cheatTime = ( chest == ST_CHEST_TYPES.secret ) ? ST_CHEATER_TIMES.secret : ST_CHEATER_TIMES.main;
    return Date.now() < gameState.runStart.getTime() + cheatTime;
}

export const supernovaHappened = ( gameState: GameState, globalState: ST_GLOBAL_STATE) => {
    if( isReconstruction(globalState) ) return false;
    return Date.now() >= gameState.supernova.getTime();
}

export const canUnlockChest = ( state: GameState, chest: ST_CHEST_TYPES, globalState: ST_GLOBAL_STATE ) => {
    if(state.blueKey < 1) return false;
    if(state.greenKey < 1) return false;
    if(state.purpleKey < 1) return false;
    if(likesPumkins(state, chest, globalState)) return false;
    if(supernovaHappened(state, globalState)) return false;

    if(chest === ST_CHEST_TYPES.secret){
        if(state.blackKey < 1) return false;
        if(state.whiteKey < 1) return false;
    }

    return true;
}  

export const canTryMint = ( mintCodes: number[] ) => {
    if(mintCodes.length !== 4) return false;
    if(mintCodes.includes(-1)) return false;
    return true;
}

export const canForgeItems = ( state: GameState, globalState: ST_GLOBAL_STATE ) => {

    if(state.forgeItemOne === PublicKey.default) return false;
    if(state.forgeItemTwo === PublicKey.default) return false;
    if(supernovaHappened(state, globalState)) return false;

    return true;
}  

export const canFixKey = ( state: GameState, globalState: ST_GLOBAL_STATE ) => {
    if(state.brokenKey < 2) return false;
    if(supernovaHappened(state, globalState)) return false;

    return true;
}  

export const didUnlockChest = ( state: GameState, chest: ST_CHEST_TYPES, ) => {
    if(chest === ST_CHEST_TYPES.secret){
        return state.secret > 0;
    } else {
        return state.main > 0;
    }
}
