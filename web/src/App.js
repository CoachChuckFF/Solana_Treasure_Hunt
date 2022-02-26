import './App.css';
import { useRef, useState, useEffect } from "react";
import { BuildHub, TargetCamera  } from './components/buildHub';
import { CombinationMint } from './components/combinationMint';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { drawCurtains, Curtains } from './components/curtains';
import * as FSM from './components/fsm';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import * as hashes from './components/hashes.js';
import { DemoPuzzlePage } from './components/demo';

import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';
import { getNFTs } from './components/solScan';

const theme = createTheme({
  typography: {
    fontFamily: [
      "Vimland",
    ].join(",")
  },
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
    test: {
      main: '#FFB600',
    },
    blue: {
      main: '#4FA5C4',
    },
    green: {
      main: '#14F195',
    }
  }
});


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

function Puzzle0Page(props){

  if(props.wallet == null) return null;
  if(props.puzzle != FSM.Puzzle0) return null;

  return (
    <DemoPuzzlePage wallet={props.wallet} puzzleCB={props.puzzleCB}></DemoPuzzlePage>
  );
}

function ChestPage(props){
  return (
    <div>
      <BuildHub run={props.run} puzzleState={props.puzzleState} changeCameraIndex={props.changeCameraIndex} cameraIndex={props.cameraIndex} curtains={props.curtains} wallet={props.wallet} state={props.state} />
      <CombinationMint setDevMode={props.setDevMode} run={props.run} puzzleState={props.puzzleState} bomb={props.bomb} activePuzzle={props.activePuzzle} cameraIndex={props.cameraIndex} mint={props.mint} subAction={props.subAction} action={props.action} curtains={props.curtains} connect={props.connect} wallet={props.wallet} codes={props.codes} state={props.state} puzzle={props.puzzle}/>
    </div>
  );
}

function App() {
  const [wallet, setwallet] = useState(null);
  const [curtains, setCurtains] = useState([useRef(), useRef()]);
  const [state, setState] = useState(FSM.NotConnected);

  const [run, setRun] = useState([Date.now(), -1, -1]);

  const [actionCounter, setActionCounter] = useState(0);
  const [subActionCounter, setSubActionCounter] = useState(0);

  const [codes, setCodes] = useState(FSM.staticCodes);
  const [activePuzzle, setActivePuzzle] = useState(null);
  const [puzzleState, setPuzzleState] = useState(FSM.blankPuzzle)
  const [cameraIndex, setCameraIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const changeCameraIndex = (index) => {
    setCameraIndex(index);
  }

  const mint = (inputCodes) => {
    let isCorrect = true;
    let rightCodes = null;

    switch(cameraIndex) {
      case 0:
        if(puzzleState.test){
          drawCurtains(curtains, "SOON.", ()=>{
            logout();
          });
        }
        break;
      case 1:
        rightCodes = hashes.getCorrectTestCodes(wallet);

        for(var i = 0; i < rightCodes.length; i++) if(rightCodes[i] != codes.test[i]) isCorrect = false;

        if(isCorrect){
          if(puzzleState.test){
            drawCurtains(curtains, "Already Unlocked.", ()=>{
              setPuzzleState(Object.assign({}, {...puzzleState, test: true}));
            });
          } else {
            drawCurtains(curtains, "Click.", ()=>{
              setPuzzleState(Object.assign({}, {...puzzleState, test: true}));
            });
          }
        }
        break;
    }
    

    if(!isCorrect){
      drawCurtains(curtains, "SNAP!", ()=>{
        setPuzzleState(Object.assign({}, {...puzzleState, brokenKey: true}));
      });
    }

  }

  const puzzleCB = (newCodes) => {

    switch(activePuzzle){
      case FSM.Puzzle0:
        setCodes(Object.assign({}, {...codes, test: [...newCodes]}));
        break;
    }

    setActivePuzzle(null);
  }

  const puzzle = (index) => {
    switch(index) {
      case 0: 
        logout();
        break;
      case 1:
        setActivePuzzle(FSM.Puzzle0);
        break;
    }
  }

  const logout = () => {
    setCodes(FSM.staticCodes);
    setPuzzleState(FSM.blankPuzzle);
    setCameraIndex(-1);
    setwallet(null);
    setActivePuzzle(null);
    setState(FSM.NotConnected);
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
      .then((newState)=>{
        setState(state === FSM.NotConnected ? FSM.Playing : state);
        setActivePuzzle(null);
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
        <Puzzle0Page puzzleCB={puzzleCB} wallet={wallet} puzzle={activePuzzle}/>
        <ChestPage run={run} puzzle={puzzle} activePuzzle={activePuzzle} mint={mint} cameraIndex={cameraIndex} changeCameraIndex={changeCameraIndex} activePuzzle={activePuzzle} curtains={curtains} connect={connectWallet} wallet={wallet} state={state} codes={codes} puzzleState={puzzleState} action={actionCounter} subAction={subActionCounter}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
