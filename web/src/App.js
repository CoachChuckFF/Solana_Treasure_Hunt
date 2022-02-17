import './App.css';
import { useRef, useState, useEffect } from "react";
import { BuildScene } from './components/buildScene';
import { BuildHub } from './components/buildHub';
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
import { DesolatePuzzlePage } from './components/desolates';
import { getDesolatesCode, getDronieCode, getNootCode, getGuideCodes } from './components/hashes';

const staticCodes = {
  blue:  [-1,-1,-1,-1],
  green: [-1,-1,-1,-1],
  pink:  [-1,-1,-1,-1],
  white: [-1,-1,-1,-1],
};

const blankPuzzle = {
  state: {
    connected: false,
    loading: false,
    activePuzzle: 0,
    devMode: false,
    cameraOverride: [null, null, null],
  },
  keys: {
    blue: false,
    green: false,
    pink: false,
    black: false,
    white: false,
  },
  chests: {
    regular: false,
    secret: false,
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#9945FF'
    },
    secondary: {
      main: '#4FA5C4'
    },
    disabled: {
      main: '#0D0D0D',
    },
    blue: {
      main: '#4FA5C4',
    },
    green: {
      main: '#14F195',
    }
  }
});

const Bomb = Date.now() + 1000 * 60 * 60 * 24;

function Loader(props){
  return (
    <div>
      <Backdrop
        sx={{ color: '#fff', opacity:1.0, zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={props.open}
      >
        <div>
          <CircularProgress color="inherit" />
          <p>Loading Puzzle State</p>
        </div>
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

function Puzzle3Page(props){

  if(props.wallet == null) return null;
  if(props.puzzle != FSM.MintNFKey3) return null;

  return (
    <DesolatePuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></DesolatePuzzlePage>
  );
}

function ChestPage(props){
  return (
    <div>
      {/* <StateView state={props.state}/> */}
      <BuildHub bomb={props.bomb} changeCameraIndex={props.changeCameraIndex} cameraIndex={props.cameraIndex} curtains={props.curtains} wallet={props.wallet} state={props.state} />
      <CombinationMint bomb={props.bomb} activePuzzle={props.activePuzzle} cameraIndex={props.cameraIndex} mint={props.mint} subAction={props.subAction} action={props.action} curtains={props.curtains} connect={props.connect} wallet={props.wallet} codes={props.codes} state={props.state} puzzle={props.puzzle}/>
    </div>
  );
}

function App() {
  const [wallet, setwallet] = useState(null);
  const [curtains, setCurtains] = useState([useRef(), useRef()]);
  const [state, setState] = useState(FSM.NotConnected);

  const [activePuzzle, setActivePuzzle] = useState(null);

  const [bomb, setBomb] = useState(Date.now() + 1000 * 60 * 60 *24);

  const [actionCounter, setActionCounter] = useState(0);
  const [subActionCounter, setSubActionCounter] = useState(0);

  const [codes, setCodes] = useState(staticCodes);
  const [puzzleState, setPuzzleState] = useState(blankPuzzle)
  const [cameraIndex, setCameraIndex] = useState(-1);

  const [isLoading, setIsLoading] = useState(false);

  const logout = () => {
    setCodes(staticCodes);
    setCameraIndex(-1);
    setwallet(null);
    setActivePuzzle(null);
    setState(FSM.NotConnected);
  }

  const mint = (inputCodes, isSecret) => {
    let rightCodes = null;
    if(isSecret == true){

    } else {
      switch(cameraIndex) {
        case 0: break;
        case 2:
          rightCodes = getNootCode(wallet, 8);
          for(var i = 0; i < rightCodes.length; i++) if(codes.blue[i] != rightCodes[i]){ console.log("Bad code ", cameraIndex, rightCodes, inputCodes); break; }
          alert("Correct!");
          break;
        case 3:
          rightCodes = getDronieCode(wallet, 5);
          for(var i = 0; i < rightCodes.length; i++) if(codes.green[i] != rightCodes[i]){ console.log("Bad code ", cameraIndex, rightCodes, inputCodes); break; }
          //TODO mint Green Key
          alert("Correct!");
          break;
        case 4:
          rightCodes = getDesolatesCode(wallet, 0xFF, 0x55, 0x33);
          for(var i = 0; i < rightCodes.length; i++) if(codes.pink[i] != rightCodes[i]){ console.log("Bad code ", cameraIndex, rightCodes, inputCodes); break; }
          //TODO mint Pink Key
          alert("Correct!");
          break;
        default:
          alert("Nope.");
          break;
      }
    }


    // setTimeout(()=>{
    //   if(newState != state){
    //     setCodes(staticCodes);
    //   }
    //   setState(newState);
    //   driveState();
    // }, 3400);
  }

  const changeCameraIndex = (index) => {
    setCameraIndex(index);
  }

  const puzzleCB = (newCodes) => {

    switch(activePuzzle){
      case FSM.MintNFKey1:
        setCodes(Object.assign({}, {...codes, blue: [...newCodes]}));
        break;
      case FSM.MintNFKey2:
        setCodes(Object.assign({}, {...codes, green: [...newCodes]}));
        break;
      case FSM.MintNFKey3:
        setCodes(Object.assign({}, {...codes, pink: [...newCodes]}));
        break;
    }

    setActivePuzzle(null);
  }


  const puzzle = (index) => {
    switch(index) {
      case 0: 
        logout();
        break;
      case 2:
        setActivePuzzle(FSM.MintNFKey1);
        break;
      case 3:
        setActivePuzzle(FSM.MintNFKey2);
        break;
      case 4:
        setActivePuzzle(FSM.MintNFKey3);
        break;
      default:

        break;
    }
  }

  const driveState = () => {setActionCounter(actionCounter + 1);}
  const driveSubState = () => {setSubActionCounter(subActionCounter + 1);}
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          try {
            const response = await solana.connect({ onlyIfTrusted: true });

            setwallet(new PublicKey(response.publicKey.toString()));
          } catch (error) {
            console.log("Error re-connecting to phantom. ", error);
          }

        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.log("Error re-connecting to phantom. ", error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
  
    if (solana) {
      try {
        const response = await solana.connect();
        setwallet(new PublicKey(response.publicKey.toString()));
      } catch (error) {
        console.log("Error connecting to phantom");
      }

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
      setState(FSM.MintNFKey1);
      setActivePuzzle(null);
      driveState();
    }
  }, [wallet]);

  useEffect(() => {
    console.log("hi");
    console.log(codes);
    console.log("byte");
  }, [codes]);

  useEffect(() => {
    if(wallet){
      setIsLoading(true);
      getNFTs(wallet)
      .then((state)=>{
        // puzzleState.
        setPuzzleState()
        setIsLoading(false);
        // setState(FSM.MapToState(state));
        setActivePuzzle(null);
      })
      .catch(()=>{
        console.log("Coult not get NFTs");
        logout();
      });
    } else {
      logout();
    }
  }, [actionCounter]);


  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <Loader open={isLoading}/>
        {/* <TabsRouter /> */}
        <Puzzle1Page puzzleCB={puzzleCB} wallet={wallet} puzzle={activePuzzle}/>
        <Puzzle2Page puzzleCB={puzzleCB} wallet={wallet} puzzle={activePuzzle}/>
        <Puzzle3Page puzzleCB={puzzleCB} wallet={wallet} puzzle={activePuzzle}/>
        <ChestPage bomb={bomb} mint={mint} activePuzzle={activePuzzle} puzzle={puzzle} cameraIndex={cameraIndex} changeCameraIndex={changeCameraIndex} curtains={curtains} connect={connectWallet} wallet={wallet} state={state} codes={codes} action={actionCounter} subAction={subActionCounter}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
