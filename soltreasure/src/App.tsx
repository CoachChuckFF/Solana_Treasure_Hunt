import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import './App.css';
import StoreProvider, { StoreContext, logoutOfStore } from './controllers/store';
import { STThemeProvider } from './models/theme';
import { STCurtains, TestCurtains } from './views/curtains';
import { PublicKey } from '@solana/web3.js';
import STSnackbar, { SNACKBAR_SEVERITY, TestSnackbar } from './views/snackbar';
import * as STS from './models/space';
import * as STState from './models/state';
import * as STSolana from './controllers/solana';


import { STHUD } from './views/hud';
import { STWorld } from './pages/world';
import { NootPuzzlePage } from './pages/puzzleNoot';
import { DroniesPuzzlePage } from './pages/puzzleDronie';
import { DesolatePuzzlePage } from './pages/puzzleDesolate';
import { RugPuzzlePage } from './pages/puzzleRug';
import { FractalsPuzzlePage } from './pages/puzzleFractals';
import { ForgePage } from './pages/forge';
import { createPlayerAccount, forgeItem, GameAccount, gameToString, hashItem, NULL_MINT_BYTES, PlayerAccount, STProvider } from './models/sol-treasure';
import { GAME_KEY, INDEXES, ITEMS } from './models/v0';
import { web3 } from '@project-serum/anchor';
import { BG_SOUND, FXs, playByte } from './sounds/music-man';

function Ticker(){
  const {
    globalState: [globalState, setGlobalState],
  } = React.useContext(StoreContext);
  const [tick, setTick] = React.useState(0);

  return null;
}

function Loop(){
  const {
    gameAccount: [gameAccount, setGameAccount],
    playerAccount: [playerAccount, setPlayerAccount],
    stProvider: [stProvider, setSTProvider],
    snackbar: [snackbar, showSnackbar],
    devMode: [devMode, setDevMode],
    gameState: [gameState, setGameState],
    puzzleState: [puzzleState, setPuzzleState],
    actionCrank: [actionCrank, crankAction],
    globalState: [globalState, setGlobalState],
    logout: [logout],
  } = React.useContext(StoreContext);
  const [playingMusic, setPlayingMusic] = React.useState(false);


  const connectWallet = (onlyIfTrusted?:boolean) => { 
    STSolana.connectWallet(onlyIfTrusted).then(async (walletKey:PublicKey)=>{
      setSTProvider(await STProvider.init(
        STSolana.getProvider()
      ))
    }).catch((error)=>{
      console.log("Connecting Wallet Error");
    });
  };

  const mintAnswer = (
    index: number,
    hash: number[],
  ) => {
    hashItem(
      stProvider,
      gameAccount,
      playerAccount,
      gameAccount.items[index].mint,
      { hash }
    ).then((updatedAccount)=>{
      setPlayerAccount(updatedAccount);
    }).catch((error)=>{

      showSnackbar(
        "Error minting answer",
        SNACKBAR_SEVERITY.error,
      );
    });
  }

  const blackHoleForge = (
    input0: web3.PublicKey,
    input1: web3.PublicKey,
  ) => {
    forgeItem(
      stProvider,
      gameAccount,
      playerAccount,
      input0,
      input1,
      gameAccount.items[INDEXES.blackKey].mint,
      { combinationIndex: 0 }
    ).then((updatedAccount)=>{
      setPlayerAccount(updatedAccount);
    }).catch((error)=>{

      showSnackbar(
        "Error forging items",
        SNACKBAR_SEVERITY.error,
      );
    });
  }

  const startMint = ( cameraSlot: STS.ST_CAMERA_SLOTS ) => { 
    console.log("Mint Button: " + cameraSlot);
    playByte(FXs.noOp, playingMusic);

    switch(cameraSlot){
      case STS.ST_CAMERA_SLOTS.sslot0:
        if(gameState.whiteChest == 0){
          mintAnswer(
            INDEXES.whiteChest, 
            NULL_MINT_BYTES,
          );
        } else if(gameState.realTreasure == 0){
          mintAnswer(
            INDEXES.realTreasure, 
            NULL_MINT_BYTES,
          );
        }
      break;
      case STS.ST_CAMERA_SLOTS.slot0: 
        if(gameState.blackChest == 0){
          mintAnswer(
            INDEXES.blackChest, 
            NULL_MINT_BYTES,
          );
        } else if(gameState.replayToken == 0){
          mintAnswer(
            INDEXES.replayToken, 
            NULL_MINT_BYTES,
          );
        }
      break;
      case STS.ST_CAMERA_SLOTS.slot2: 
        mintAnswer(
          INDEXES.blueKey, 
          gameState.blueKey == 0 ? gameState.blueMintBytes : NULL_MINT_BYTES,
        );
      break;
      case STS.ST_CAMERA_SLOTS.slot3: 
        mintAnswer(
          INDEXES.greenKey, 
          gameState.greenKey == 0 ? gameState.greenMintBytes : NULL_MINT_BYTES,
        );
      break;
      case STS.ST_CAMERA_SLOTS.slot4:
        mintAnswer(
          INDEXES.purpleKey, 
          gameState.purpleKey == 0 ? gameState.purpleMintBytes : NULL_MINT_BYTES,
        );
      break;
      case STS.ST_CAMERA_SLOTS.sslot1:

      break;
      case STS.ST_CAMERA_SLOTS.sslot2: 
        console.log("TODO Fix");
        // gameState.forgeItemOne,
        // gameState.forgeItemTwo,
        blackHoleForge(
          gameAccount.items[INDEXES.brokenKey].mint,
          gameAccount.items[INDEXES.brokenKey].mint,
        );
      break;
      case STS.ST_CAMERA_SLOTS.sslot5: 
        mintAnswer(
          INDEXES.whiteKey, 
          gameState.whiteKey == 0 ? gameState.whiteMintBytes : NULL_MINT_BYTES,
        );
      break;
    }

  };
  const openPuzzle = (cameraSlot: STS.ST_CAMERA_SLOTS ) => { 
    playByte(FXs.op, playingMusic);

    console.log("Puzzle Button: " + cameraSlot);
    switch(cameraSlot){
      case STS.ST_CAMERA_SLOTS.sslot0: logout(); break;
      case STS.ST_CAMERA_SLOTS.slot0: logout(); break;
      case STS.ST_CAMERA_SLOTS.slot2: setPuzzleState(STState.ST_PUZZLE_STATE.noot); break;
      case STS.ST_CAMERA_SLOTS.slot3: setPuzzleState(STState.ST_PUZZLE_STATE.dronies); break;
      case STS.ST_CAMERA_SLOTS.slot4: setPuzzleState(STState.ST_PUZZLE_STATE.desolates); break;

      case STS.ST_CAMERA_SLOTS.sslot1: setPuzzleState(STState.ST_PUZZLE_STATE.rug); break;
      case STS.ST_CAMERA_SLOTS.sslot2: setPuzzleState(STState.ST_PUZZLE_STATE.forge); break;
      case STS.ST_CAMERA_SLOTS.sslot5: setPuzzleState(STState.ST_PUZZLE_STATE.fractals); break;
    }

  };
  const leaveDevMode = ( ) => { 
    setDevMode(false); 
  }

  // On Page Load
  React.useEffect(() => {
    const onLoad = async () => {

      // connectWallet(true);
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);


  const createPlayerWorkflow = (
    newGameAccount: GameAccount,
  ) => {
    createPlayerAccount(
      stProvider,
      newGameAccount,
      { name: "Tod" }
    ).then((newPlayerAccount)=>{

      showSnackbar(
        "Welcome player! Please create a Sol-Treasure account (1-time only)",
        SNACKBAR_SEVERITY.info,
        5000,
      );

      onAccountsLoaded(
        newGameAccount,
        newPlayerAccount,
      )
    }).catch((error)=>{
      showSnackbar(
        "Could not create player account",
        SNACKBAR_SEVERITY.error
      );
    });
  }

  const onAccountsLoaded = (
    newGameAccount: GameAccount,
    newPlayerAccount: PlayerAccount,
  ) => {
    setGameAccount(newGameAccount);
    setPlayerAccount(newPlayerAccount);
  }

  // On Player Account Change
  React.useEffect(() => {
    if ( stProvider.valid ) {

      setGameState(
        STState.updateGameState(
          gameAccount,
          playerAccount,
        )
      );
      setGlobalState(STState.ST_GLOBAL_STATE.playing);

    } else {
      setGlobalState(STState.ST_GLOBAL_STATE.notConnected)
    }
  }, [ playerAccount ]);

  // On Change
  React.useEffect(() => {

    BG_SOUND.set(playingMusic);

  }, [playingMusic]);
  
  // On Login
  React.useEffect(() => {
    if ( stProvider.valid ) {

      setPlayingMusic(true);
      
      STState.initGameState(
        stProvider,
        createPlayerWorkflow,
        onAccountsLoaded,
      )

    } else {
      setGlobalState(STState.ST_GLOBAL_STATE.notConnected)
    }
  }, [stProvider]);

  // On Crank
  React.useEffect(() => {

  }, [actionCrank]);


  return (<>
    <STHUD 
        connectWallet={connectWallet}
        startMint={startMint}
        openPuzzle={openPuzzle}
        leaveDevMode={leaveDevMode}
    />
    <NootPuzzlePage/>
    <DroniesPuzzlePage/>
    <DesolatePuzzlePage/>
    <RugPuzzlePage/>
    <ForgePage/>
    <FractalsPuzzlePage/>
  </>);
}

function App() {
  return (
    <div className="App">
      <STThemeProvider>
        <StoreProvider>
          <Loop/>
          <STWorld />
          <Ticker />
          <STSnackbar/>
          <STCurtains/>
        </StoreProvider>
      </STThemeProvider>
    </div>
  );
}

export default App;
