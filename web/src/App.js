import './App.css';
import { useRef, useState, useEffect } from "react";
import { BuildScene } from './components/buildScene';
import { CombinationMint } from './components/combinationMint';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { curtains, Curtains } from './components/curtains';
import { StateView } from './components/stateView';
import TabsRouter from './components/router';
import * as FSM from './components/fsm';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { NootPuzzlePage } from './components/noot';
import { DroniesPuzzlePage } from './components/dronie';


import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';
import { getNFTs } from './components/solScan';

const staticCodes = ['','','',''];

const theme = createTheme({
  palette: {
    primary: {
      main: '#DC1FFF'
    },
    secondary: {
      main: '#03E2FF'
    },
    disabled: {
      main: '#0D0D0D',
    },
    blue: {
      main: '#03E2FF',
    },
    green: {
      main: '#00FFA3',
    }
  }
});

function Loader(props){
  return (
    <div>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={props.open}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}

function Puzzle1Page(props){

  if(props.wallet == null) return null;
  if(props.puzzle != FSM.MintNFKey1) return null;

  return (
    <NootPuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></NootPuzzlePage>
  );
}

function Puzzle2Page(props){

  if(props.wallet == null) return null;
  if(props.puzzle != FSM.MintNFKey2) return null;

  return (
    <DroniesPuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></DroniesPuzzlePage>
  );
}

function ChestPage(props){
  return (
    <div>
      <StateView state={props.state}/>
      <BuildScene curtains={props.curtains} wallet={props.wallet} wallet={props.wallet} state={props.state} />
      <CombinationMint mint={props.mint} subAction={props.subAction} action={props.action} curtains={props.curtains} connect={props.connect} wallet={props.wallet} codes={props.codes} state={props.state} puzzle={props.puzzle}/>
    </div>
  );
}

function App() {
  const [wallet, setwallet] = useState(null);
  const [curtains, setCurtains] = useState([useRef(), useRef()]);
  const [state, setState] = useState(FSM.NotConnected);

  const [activePuzzle, setActivePuzzle] = useState(null);

  const [actionCounter, setActionCounter] = useState(0);
  const [subActionCounter, setSubActionCounter] = useState(0);

  const [codes, setCodes] = useState(staticCodes);

  const [isLoading, setIsLoading] = useState(false);

  const mint = (codes) => {
    setTimeout(()=>{
      driveState();
    }, 2000);
  }

  const puzzleCB = (codes) => {

    setCodes(codes);
    driveSubState();
    setActivePuzzle(null);
  }

  const puzzle = (state) => {

    setActivePuzzle(state);
  }

  const driveState = () => {setActionCounter(actionCounter + 1);}
  const driveSubState = () => {setSubActionCounter(subActionCounter + 1);}
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });

          setwallet(new PublicKey(response.publicKey.toString()));
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      const response = await solana.connect();

      setwallet(new PublicKey(response.publicKey.toString()));
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  
  useEffect(() => {
    if (wallet) {
      setState(FSM.MintGuide);
      setActivePuzzle(null);
      driveState();
    }
  }, [wallet]);

  useEffect(() => {
    if(wallet){
      setIsLoading(true);
      getNFTs(wallet)
      .then((state)=>{
        setIsLoading(false);
        setState(FSM.MapToState(state));
        setActivePuzzle(null);
      })
      .catch(()=>{
        setIsLoading(false);
        setState(FSM.MintGuide);
        setActivePuzzle(null);
      });
    } else {
      setCodes(staticCodes);
      setwallet(null);
      setActivePuzzle(null);
      setState(FSM.NotConnected);
    }
  }, [actionCounter]);


  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <Loader open={isLoading}/>
        {/* <TabsRouter /> */}
        <Puzzle1Page puzzleCB={puzzleCB} wallet={wallet} puzzle={activePuzzle}/>
        <Puzzle2Page puzzleCB={puzzleCB} wallet={wallet} puzzle={activePuzzle}/>
        <ChestPage mint={mint} puzzle={puzzle} curtains={curtains} connect={connectWallet} wallet={wallet} state={state} codes={codes} action={actionCounter} subAction={subActionCounter}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
