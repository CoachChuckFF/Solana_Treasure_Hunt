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
import { TreasureProvider } from './models/solTreasure';


import { STHUD } from './views/hud';
import { STWorld } from './pages/world';
import { NootPuzzlePage } from './pages/puzzleNoot';
import { DroniesPuzzlePage } from './pages/puzzleDronie';
import { DesolatePuzzlePage } from './pages/puzzleDesolate';
import { RugPuzzlePage } from './pages/puzzleRug';
import { FractalsPuzzlePage } from './pages/puzzleFractals';
import { ForgePage } from './pages/forge';


function Ticker(){
  const {
    globalState: [globalState, setGlobalState],
  } = React.useContext(StoreContext);
  const [tick, setTick] = React.useState(0);

  return null;
}

function Loop(){
  const {
    treasureProvider: [treasureProvider, setTreasureProvider],
    devMode: [devMode, setDevMode],
    puzzleState: [puzzleState, setPuzzleState],
    actionCrank: [actionCrank, crankAction],
    globalState: [globalState, setGlobalState],
    logout: [logout],
  } = React.useContext(StoreContext);


  const connectWallet = (onlyIfTrusted?:boolean) => { 
    STSolana.connectWallet(onlyIfTrusted).then(async (walletKey:PublicKey)=>{
      setTreasureProvider(await TreasureProvider.create(
        STSolana.getProvider()
      ));
    }).catch((error)=>{
      console.log("Connecting Wallet Error");
    });
  };
  const startMint = ( cameraSlot: STS.ST_CAMERA_SLOTS ) => { 
    console.log("Mint Button: " + cameraSlot);

  };
  const openPuzzle = (cameraSlot: STS.ST_CAMERA_SLOTS ) => { 
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

      connectWallet(true);
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  
  // On Login
  React.useEffect(() => {
    if ( treasureProvider.valid ) {
      setGlobalState(STState.ST_GLOBAL_STATE.playing)
    } else {
      setGlobalState(STState.ST_GLOBAL_STATE.notConnected)
    }
  }, [treasureProvider]);

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
