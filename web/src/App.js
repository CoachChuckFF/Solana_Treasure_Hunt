import './App.css';
import { useRef, useState, useEffect } from "react";
import { BuildScene } from './components/buildScene';
import { CombinationMint } from './components/combinationMint';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { curtains, Curtains } from './components/curtains';
import TabsRouter from './components/router';

import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';

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
      <BuildScene curtains={props.curtains} wallet={props.wallet} wallet={props.wallet}/>
      <CombinationMint curtains={props.curtains} connect={props.connect} wallet={props.wallet}/>
    </div>
  );
}

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [curtains, setCurtains] = useState([useRef(), useRef()]);

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

          setWalletAddress(response.publicKey.toString());
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
      setWalletAddress(response.publicKey.toString());
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
    if (walletAddress) {
      console.log(walletAddress);
    }
  }, [walletAddress]);


  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        {/* <TabsRouter /> */}
        <ChestPage curtains={curtains} connect={connectWallet} wallet={walletAddress}/>
        <Curtains curtains={curtains}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
