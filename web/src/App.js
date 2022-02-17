import './App.css';
import { useRef, useState, useEffect } from "react";
import { BuildScene } from './components/buildScene';
import { BuildHub } from './components/buildHub';
import { CombinationMint } from './components/combinationMint';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { drawCurtains, Curtains } from './components/curtains';
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
import { getDesolatesCode, getDronieCode, getNootCode } from './components/hashes';

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
  if(props.puzzle != FSM.Puzzle1) return null;

  return (
    <NootPuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></NootPuzzlePage>
  );
}

function Puzzle2Page(props){

  if(props.wallet == null) return null;
  if(props.puzzle != FSM.Puzzle2) return null;

  return (
    <DroniesPuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></DroniesPuzzlePage>
  );
}

function Puzzle3Page(props){

  if(props.wallet == null) return null;
  if(props.puzzle != FSM.Puzzle3) return null;

  return (
    <DesolatePuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></DesolatePuzzlePage>
  );
}

function ChestPage(props){
  return (
    <div>
      {/* <StateView state={props.state}/> */}
      <BuildHub run={props.run} puzzleState={props.puzzleState} bomb={props.bomb} changeCameraIndex={props.changeCameraIndex} cameraIndex={props.cameraIndex} curtains={props.curtains} wallet={props.wallet} state={props.state} />
      <CombinationMint run={props.run} puzzleState={props.puzzleState} bomb={props.bomb} activePuzzle={props.activePuzzle} cameraIndex={props.cameraIndex} mint={props.mint} subAction={props.subAction} action={props.action} curtains={props.curtains} connect={props.connect} wallet={props.wallet} codes={props.codes} state={props.state} puzzle={props.puzzle}/>
    </div>
  );
}

function App() {
  const [wallet, setwallet] = useState(null);
  const [curtains, setCurtains] = useState([useRef(), useRef()]);
  const [state, setState] = useState(FSM.NotConnected);

  const [activePuzzle, setActivePuzzle] = useState(null);

  const [bomb, setBomb] = useState(Date.now() + 1000 * 60 * 60 *24);
  const [run, setRun] = useState([-1, -1, -1]);

  const [actionCounter, setActionCounter] = useState(0);
  const [subActionCounter, setSubActionCounter] = useState(0);

  const [codes, setCodes] = useState(FSM.staticCodes);
  const [puzzleState, setPuzzleState] = useState(FSM.blankPuzzle)
  const [cameraIndex, setCameraIndex] = useState(-1);

  const [isLoading, setIsLoading] = useState(false);

  const logout = () => {
    setCodes(FSM.staticCodes);
    setCameraIndex(-1);
    setwallet(null);
    setActivePuzzle(null);
    setState(FSM.NotConnected);
  }

  const mint = (inputCodes) => {
    let isCorrect = true;
    let rightCodes = null;

    switch(cameraIndex) {
      case 0:
        if(puzzleState.blue && puzzleState.green && puzzleState.purple && !puzzleState.regular){
          isCorrect = true;

          drawCurtains(curtains, "...", ()=>{
            setRun([run[0], Date.now(), run[1]]);
            setPuzzleState(Object.assign({}, {...puzzleState, regular: true}));
          });
        } else {
          isCorrect = false;
        }
        break;
      case 2:
        if(puzzleState.blue){
          isCorrect = false;
        } else {
          rightCodes = getNootCode(wallet, 1);
          for(var i = 0; i < rightCodes.length; i++) if(codes.blue[i] != rightCodes[i]){ isCorrect = false; }
          if(isCorrect){
            drawCurtains(curtains, "Click.", ()=>{
              setPuzzleState(Object.assign({}, {...puzzleState, blue: true}));
            });
          }
        }
        break;
      case 3:
        if(puzzleState.green){
          isCorrect = false;
        } else {
          rightCodes = getDronieCode(wallet, 5);
          for(var i = 0; i < rightCodes.length; i++) if(codes.green[i] != rightCodes[i]){ isCorrect = false; }
          if(isCorrect){
            drawCurtains(curtains, "Click.", ()=>{
              setPuzzleState(Object.assign({}, {...puzzleState, green: true}));
            });
          }
        }
        break;
      case 4:
        if(puzzleState.purple){
          isCorrect = false;
        } else {
          rightCodes = getDesolatesCode(wallet, 0xFF, 0x55, 0x33);
          for(var i = 0; i < rightCodes.length; i++) if(codes.purple[i] != rightCodes[i]){ isCorrect = false; }
          if(isCorrect){
            drawCurtains(curtains, "Click.", ()=>{
              setPuzzleState(Object.assign({}, {...puzzleState, purple: true}));
            });
          }
        }
        break;
      case 0x10:
          isCorrect = false;
          break;
      case 0x11:
          isCorrect = false;
          break;
      case 0x12:
          isCorrect = false;
          break;
      case 0x13:
          isCorrect = false;
          break;
      default:
        isCorrect = false;
        break;
    }

    if(isCorrect){
      // alert('Correct!');
    } else {
      drawCurtains(curtains, "SNAP!", ()=>{
        setPuzzleState(Object.assign({}, {...puzzleState, broken: true}));
      });
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
      case FSM.Puzzle1:
        setCodes(Object.assign({}, {...codes, blue: [...newCodes]}));
        break;
      case FSM.Puzzle2:
        setCodes(Object.assign({}, {...codes, green: [...newCodes]}));
        break;
      case FSM.Puzzle3:
        setCodes(Object.assign({}, {...codes, purple: [...newCodes]}));
        break;
      case FSM.Puzzle4:
        setCodes(Object.assign({}, {...codes, white: [...newCodes]}));
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
        setActivePuzzle(FSM.Puzzle1);
        break;
      case 3:
        setActivePuzzle(FSM.Puzzle2);
        break;
      case 4:
        setActivePuzzle(FSM.Puzzle3);
        break;
      case 0x11:
        setActivePuzzle(FSM.Puzzle4);
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
      setRun([Date.now(), 0, 0]);
      driveState();
    }
  }, [wallet]);


  useEffect(() => {
    if(wallet){
      setIsLoading(true);
      getNFTs(wallet)
      .then((state)=>{
        setState(FSM.Playing);
        setActivePuzzle(null);
        // setPuzzleState();
        setIsLoading(false);
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
        <ChestPage run={run} bomb={bomb} mint={mint} activePuzzle={activePuzzle} puzzle={puzzle} cameraIndex={cameraIndex} changeCameraIndex={changeCameraIndex} curtains={curtains} connect={connectWallet} wallet={wallet} state={state} codes={codes} puzzleState={puzzleState} action={actionCounter} subAction={subActionCounter}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
