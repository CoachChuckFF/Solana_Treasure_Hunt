
import React from "react";
import * as STSnackbar from "../views/snackbar";
import * as STCurtains from "../views/curtains";
import * as STWorldSpace from "./space";
import * as STClock from "./clock";
import { PublicKey } from "@solana/web3.js"
import { Vector3 } from 'three';
import { addDays } from "./clock";
import { GAME_KEY, INDEXES } from "./v0";
import { BNToDate, findPlayerAccount, GameAccount, getGameAccount, getPlayerAccount, PlayerAccount, STProvider } from "./sol-treasure";
import { web3 } from "@project-serum/anchor";

export const FRACTAL_SOLUTION = "TTQPHHPT";

//TODO Update these with SOL TREASURE
export enum ST_CHEST_TYPES {
    main = "Main Chest",
    secret = "Secret Chest"
}
export enum ST_CHEATER_TIMES {
    main = STClock.minutesToMS(10),
    secret = STClock.minutesToMS(30),
}

export enum ST_GLOBAL_STATE {
    supernova = "-2. Supernova",
    notConnected = "0. Connect your wallet",
    playing = "1. Playing",
    reconstruction = "2. Reconstruction",
}

export enum ST_PUZZLE_STATE {
    noPuzzle = "None",
    noot = "Noots",
    dronies = "Dronies",
    desolates = "Desolates",
    forge = "Forge",
    rug = "Rug",
    fractals = "Fractals",
}

export interface GameState {
    // Metrics
    player: web3.PublicKey,
    coach: web3.PublicKey,
    supernova: Date;
    gameStart: Date;
    runStart: Date;
    runPercentTimestamp: Date;
    runPercent: number;
    ogPercent: number;

    // State
    isSpeedrunning: boolean;

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
    blackChest: number;
    whiteChest: number;
    replayToken: number;
    realTreasure: number;
    redHerring: number;
}

export const NULL_SUPERNOVA = addDays(0xFFF);
export const NULL_START_DATE = addDays(0xFF0);
export const NULL_TIMESTAMP = addDays(0xFF0);
export const NULL_MINT_CODES = [-1, -1, -1, -1];
export const NULL_GAME_STATE: GameState = {
    supernova: NULL_SUPERNOVA,
    gameStart: NULL_START_DATE,
    runStart: NULL_START_DATE,
    runPercentTimestamp: NULL_TIMESTAMP,
    player: web3.PublicKey.default,
    coach: web3.PublicKey.default,
    runPercent: 0,
    ogPercent: 0,
    isSpeedrunning: false,
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
    blackChest: 0,
    whiteChest: 0,
    replayToken: 0,
    realTreasure: 0,
    redHerring: 0,
};
export const NULL_GLOBAL_STATE = ST_GLOBAL_STATE.notConnected;
export const NULL_PUZZLE_STATE = ST_PUZZLE_STATE.noPuzzle;
export const NULL_CAMERA_SLOT = STWorldSpace.ST_CAMERA_SLOTS.nullSlot;
export const NULL_CAMERA_POSITION = STWorldSpace.NullSpace;
export const NULL_IS_LOADING = false;
export const NULL_DEV_MODE = false;
export const NULL_ACTION_CRANK = 0;
export const NULL_GAME_ACCOUNT = {} as GameAccount;
export const NULL_PLAYER_ACCOUNT = {} as PlayerAccount;
export const NULL_PROVIDER = {} as STProvider;

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
        return state.whiteChest > 0;
    } else {
        return state.blackChest > 0;
    }
}

export const getStory = () => {
    // let normalRun = Math.abs(run[0] - run[1]);
    // let fullRun = Math.abs(run[0] - run[2]);

    // if(puzzleState.secret){
    //     return "Congrats! You 100%'d this thing! AND you did it in " + getTimeString(fullRun) + '. You\'re the real treasure!\n\nLove,\nCoach Chuck';
    // }

    // if(puzzleState.regular){
    //     return "Congrats! You've opened the chest! AND you did it in " + getTimeString(normalRun) + '. Give yourself a pat on the back! Oh, and remember to ignore the red herring... \n\nLove,\nCoach Chuck';
    // }

    // if(state === FSM.Reconstruction){
    //     return "Welcome! The supernova has already happened... Hoever, if you're playing this right now, you're actually playing a digitally recreated world saved within a replay token or an OG sol-treasure account. You won't be able to mint anything, however, you can see how fast you can solve the puzzles! Happy Speedrunning!\n\nLove,\nCoach Chuck";
    // }

    return "Welcome to the Sol-Treasure microverse, which is, going to explode soon... The star beneath you is going supernova. There is treasure trapped here, and when the supernova hits, everything remaining will be burned. Fortunately, if you can retrieve 99% of the collection, you'll be able to digitally recreate this little world! So your mission is simple: solve puzzles, mint keys, and discover the secrets before they are blown away forever. \n\n Each key costs 0.05, BUT a wrong answer results in a broken key at 0.025\n\nGood Luck!\n\n";
    
}


export const updateGameState = (
    gameAccount: GameAccount,
    playerAccount: PlayerAccount,
) => {
    const gameState: GameState = {
        ...NULL_GAME_STATE,
        supernova: BNToDate(gameAccount.supernovaDate),
        gameStart: BNToDate(gameAccount.startDate),
        runStart: BNToDate(playerAccount.runStart),
        player: playerAccount.player,
        coach: gameAccount.coach,
        runPercentTimestamp: BNToDate(playerAccount.runPercentTimestamp),
        runPercent: playerAccount.runPercent,
        ogPercent: playerAccount.ogPercent,
        isSpeedrunning: playerAccount.isSpeedrunning,
        blueMintBytes: NULL_MINT_CODES,
        greenMintBytes: NULL_MINT_CODES,
        purpleMintBytes: NULL_MINT_CODES,
        whiteMintBytes: NULL_MINT_CODES,
        forgeItemOne: PublicKey.default,
        forgeItemTwo: PublicKey.default,
        blueKey: playerAccount.inventory[INDEXES.blueKey].mintedCount,
        greenKey: playerAccount.inventory[INDEXES.greenKey].mintedCount,
        purpleKey: playerAccount.inventory[INDEXES.purpleKey].mintedCount,
        brokenKey: playerAccount.inventory[INDEXES.brokenKey].mintedCount,
        blackKey: playerAccount.inventory[INDEXES.blackKey].mintedCount,
        whiteKey: playerAccount.inventory[INDEXES.whiteKey].mintedCount,
        blackChest: playerAccount.inventory[INDEXES.blackChest].mintedCount,
        whiteChest: playerAccount.inventory[INDEXES.whiteChest].mintedCount,
        replayToken: playerAccount.inventory[INDEXES.replayToken].mintedCount,
        realTreasure: playerAccount.inventory[INDEXES.realTreasure].mintedCount,
        redHerring: playerAccount.inventory[INDEXES.redHerring].mintedCount,
    }
    return gameState;
}

export const initGameState = async (
    stProvider: STProvider,
    onNeedsPlayerCB: (
        newGameAccount: GameAccount,
    ) => void,
    onSuccess: (
        newGameAccount: GameAccount,
        newPlayerAccount: PlayerAccount,
    ) => void,
) => {
    const game = await getGameAccount(
        stProvider,
        GAME_KEY
    );

    try {
        const player = await getPlayerAccount(
            stProvider,
            (await findPlayerAccount(
                stProvider,
                game
            ))[0]
        );

        onSuccess(
            game,
            player,
        );

    } catch (error) {
        // Creating 
        onNeedsPlayerCB(
            game,
        );
    }
}
