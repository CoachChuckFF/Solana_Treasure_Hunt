import './App.css';
import { useRef, useState, useEffect } from "react";
import { BuildScene } from './components/buildScene';
import { CombinationMint } from './components/combinationMint';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { curtains, Curtains } from './components/curtains';
import { StateView } from './components/stateView';
import TabsRouter from './components/router';
import * as FSM from './components/fsm';


import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';
import { getNFTs } from './components/solScan';

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
    }
  }
});


function ChestPage(props){

  return (
    <div>
      <StateView state={props.state}/>
      <BuildScene curtains={props.curtains} wallet={props.wallet} wallet={props.wallet} state={props.state}/>
      <CombinationMint curtains={props.curtains} connect={props.connect} wallet={props.wallet}/>
    </div>
  );
}

function App() {
  const [wallet, setwallet] = useState(null);
  const [curtains, setCurtains] = useState([useRef(), useRef()]);
  const [state, setState] = useState(FSM.NotConnected);
  const [actionCounter, setActionCounter] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const driveState = () => {setActionCounter(actionCounter + 1);}
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          setwallet(response.publicKey);
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
      console.log('Connected with Public Key:', response.publicKey.toString());
      setwallet(response.publicKey);
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
      console.log(wallet.toString());
      setState(FSM.MintGuide);
      driveState();
    }
  }, [wallet]);

  useEffect(() => {
    if(wallet){
      getNFTs(wallet)
      .then((state)=>{
        setState(FSM.MapToState(state));
      })
      .catch(()=>{
        setState(FSM.MintGuide);
      });
    } else {
      setState(FSM.NotConnected);
    }
  }, [actionCounter]);


  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        {/* <TabsRouter /> */}
        <ChestPage curtains={curtains} connect={connectWallet} wallet={wallet} state={state}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
