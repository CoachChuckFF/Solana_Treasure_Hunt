import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import './App.css';
import StoreProvider, { StoreContext, logoutOfStore } from './controllers/store';
import { STThemeProvider } from './models/theme';
import { STCurtains, TestCurtains } from './views/curtains';
import { STHUD } from './views/hud';
import { PublicKey } from '@solana/web3.js';
import STSnackbar, { SNACKBAR_SEVERITY, TestSnackbar } from './views/snackbar';
import * as STState from './models/state';
import * as STSolana from './controllers/solana';
import { TreasureProvider } from './models/solTreasure';


function Ticker(){
  const {
    globalState: [globalState, setGlobalState],
  } = React.useContext(StoreContext);
  const [tick, setTick] = React.useState(0);

  return null;
}

function World(){
  const {
    treasureProvider: [treasureProvider, setTreasureProvider],
    devMode: [devMode, setDevMode],
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
      console.log("Error");
    });
  };
  const startMint = ( cameraSlot: STState.ST_CAMERA_SLOTS ) => { };
  const openPuzzle = (cameraSlot: STState.ST_CAMERA_SLOTS ) => { };
  const leaveDevMode = ( ) => { setDevMode(false); }


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
    />
    <Ticker />
  </>);
}

function App() {
  return (
    <div className="App">
      <STThemeProvider>
        <StoreProvider>
          <World/>
          <STSnackbar/>
          <STCurtains/>
        </StoreProvider>
      </STThemeProvider>
    </div>
  );
}

export default App;
