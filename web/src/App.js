import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';

import kp from './keypair.json'
import idl from './idl.json';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const secretArray = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(secretArray);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
//TODO in product use "finalized"
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = 'CoachChuckFF';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // State
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [solList, setSolList] = useState(null);

  // Actions
  const addCredits = () => {
    sendSol("test");
    setCreditsLeft(creditsLeft + 1);
  }

  // ---- Helpers ----
  const numToRust = (num) => 
  {
    return new BN(Math.round(num));
  }

  const solTolamports = (sol) => {
    return new BN(Math.round(sol / 0.000000001));
  }

  const sendSol = async (sol) => {
    if(sol){
      try {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);

        await program.rpc.sendSol(
          solTolamports(0.1), 
          {
            accounts: {
              to: baseAccount.publicKey,
              from: provider.wallet.publicKey,
              systemProgram: SystemProgram.programId,
            },
            signers: [provider.wallet.Keypair]
          }
        );

        console.log("Sent sol");

        await loadSolList();
      } catch (error) {
        console.log("Error sending sol ", error);
      }
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createSolAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping ", programID);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new base account w/ address: ", baseAccount.publicKey.toString())
      await loadSolList();

    } catch (error) {
      console.log("Cannot get base account: ", error);
    }
  }

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

  const loadSolList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account");
      console.log(account.gifList);
      setSolList(account.gifList);

    } catch (error) {
      console.log("Error in giflist ", error);
      setSolList(null);
    }
  }

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  
  useEffect(() => {
    if (walletAddress) {
      console.log('Loading Sol...');
      loadSolList();
    }
  }, [walletAddress]);

  useEffect(() => {
    console.log("Credits left = ", creditsLeft);
  }, [creditsLeft]);


  const renderCreateAccount = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={createSolAccount}
    >
      One-Time Account Creation
    </button>
  );

  const renderMint = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={addCredits}
    >
      Mint Key {creditsLeft}
    </button>
  );

  const renderConnectedContainer = () => {
    return renderMint();
    if(solList === null){
      return renderCreateAccount();
    } else {
      return renderMint();
    }

  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );


  return (
    <div className="App">
			{/* This was solely added for some styling fanciness */}
			<div className={'container'}>
        <div className="header-container">
          <p className="header">Treasure Hunt</p>
          <p className="sub-text">
            N F T ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className='spacing'></div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Crafted By @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;

// import twitterLogo from './assets/twitter-logo.svg';
// import './App.css';

// // Constants
// const TWITTER_HANDLE = '_buildspace';
// const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// const App = () => {
//   return (
//     <div className="App">
//       <div className="container">
//         <div className="header-container">
//           <p className="header">🖼 GIF Portal</p>
//           <p className="sub-text">
//             View your GIF collection in the metaverse ✨
//           </p>
//         </div>
//         <div className="footer-container">
//           <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
//           <a
//             className="footer-text"
//             href={TWITTER_LINK}
//             target="_blank"
//             rel="noreferrer"
//           >{`built on @${TWITTER_HANDLE}`}</a>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;
