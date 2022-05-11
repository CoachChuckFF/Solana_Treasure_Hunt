import React from 'react';
import './App.css';
import StoreProvider, { StoreContext } from './controllers/store';
import { STThemeProvider } from './models/theme';
import { STCurtains } from './views/curtains';
import { PublicKey } from '@solana/web3.js';
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
import { BNToDate, checkAllBurned, createPlayerAccount, errorToString, forgeItem, GameAccount, getGameAccount, getPlayerAccount, hashItem, hashTwoItems, NULL_MINT_BYTES, PlayerAccount, startSpeedrun, STProvider } from './models/sol-treasure';
import { INDEXES } from './models/v0';
import { web3 } from '@project-serum/anchor';
// import { BG_SOUND, FXs, playByte } from './sounds/music-man';
import STPopup from './views/popup';

function Loop(){
  const {
    gameAccount: [gameAccount, setGameAccount],
    playerAccount: [playerAccount, setPlayerAccount],
    stProvider: [stProvider, setSTProvider],
    devMode: [devMode, setDevMode],
    gameState: [gameState, setGameState],
    puzzleState: [puzzleState, setPuzzleState],
    globalState: [globalState, setGlobalState],
    curtains: [curtains, drawCurtains, setCurtains],
    isLoading: [isLoading, setIsLoading],
    popup: [popup, showPopup],
    logout: [logout],
  } = React.useContext(StoreContext);
  const [playingMusic, setPlayingMusic] = React.useState(false);

  const forceUpdate = () => {
    setIsLoading(true);
    STSolana.connectWallet(false).then(()=>{
      getGameAccount(
        stProvider,
        gameAccount.game,
      ).then((newGameAccount)=>{
        getPlayerAccount(
          stProvider,
          playerAccount.playerAccount,
        ).then((newPlayerAccount)=>{
          drawCurtains(
            "State Loaded."
          );
          onAccountsLoaded(
            newGameAccount,
            newPlayerAccount,
          )
        }).catch((error)=>{
          setIsLoading(false);
          drawCurtains(
            "Solana Error [" + errorToString(error) + "]",
          );
        })
      }).catch((error)=>{
        setIsLoading(false);
        drawCurtains(
          "Solana Error [" + errorToString(error) + "]",
        );
      })
    }).catch((error)=>{
      setIsLoading(false);
      drawCurtains(
        "Solana Error [Can't connect to wallet]",
      );
    })

  }

  const connectWallet = (onlyIfTrusted?:boolean) => { 
    setIsLoading(true);
    STSolana.connectWallet(onlyIfTrusted).then(async (walletKey:PublicKey)=>{
      setSTProvider(await STProvider.init(
        STSolana.getProvider()
      ))
    }).catch((error)=>{
      console.log("Connecting Wallet Error", error);
      setIsLoading(false);
    });
  };

  const mintTwo = (
    index0: number,
    index1: number,
  ) => {
    setIsLoading(true);
    STSolana.connectWallet(false).then(()=>{
      hashTwoItems(
        stProvider,
        gameAccount,
        playerAccount,
        gameAccount.items[index0].mint,
        gameAccount.items[index1].mint,
        { hash: NULL_MINT_BYTES }
      ).then((updatedAccount)=>{
        setPlayerAccount(updatedAccount);
      }).catch((error)=>{
        setIsLoading(false);
        drawCurtains(
          "Solana Error [" + errorToString(error, true) + "]",
        );
      });
    }).catch(()=>{
      setIsLoading(false);
      drawCurtains(
        "Solana Error [Can't connect to wallet]",
      );
    });

  }

  const mintAnswer = (
    index: number,
    hash: number[],
  ) => {
    setIsLoading(true);
    STSolana.connectWallet(false).then(()=>{
      hashItem(
        stProvider,
        gameAccount,
        playerAccount,
        gameAccount.items[index].mint,
        { hash }
      ).then((updatedAccount)=>{
        setPlayerAccount(updatedAccount);
      }).catch((error)=>{
        setIsLoading(false);
  
        drawCurtains(
          "Solana Error [" + errorToString(error, true) + "]",
        );
      });
    }).catch((error)=>{
      setIsLoading(false);
      drawCurtains(
        "Solana Error [Can't connect to wallet]",
      );
    })

  }

  const blackHoleForge = (
    input0: web3.PublicKey,
    input1: web3.PublicKey,
  ) => {
    setIsLoading(true);
    STSolana.connectWallet(false).then(()=>{
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
        console.log(error);
        setIsLoading(false);
        drawCurtains(
          "Solana Error [" + errorToString(error) + "]",
        );
      });
    }).catch((error)=>{
      setIsLoading(false);
      drawCurtains(
        "Solana Error [Can't connect to wallet]",
      );
    });

  }

  const redHerring = () => {
    mintAnswer(
      INDEXES.redHerring, 
      NULL_MINT_BYTES,
    );
  }

  const startRecreationSpeedrun = () => {
    if(gameState.supernova.getTime() < Date.now()
      || stProvider.owner.equals(gameAccount.coach)
    ){
      setIsLoading(true);
      STSolana.connectWallet(false).then(()=>{
        startSpeedrun(
          stProvider,
          gameAccount,
          playerAccount,
        ).then(()=>{
          drawCurtains(
            "Ready. Set. Go.",
            false,
            ()=>{
              setTimeout(logout, 999);
            }
          );
        }).catch((error)=>{
          setIsLoading(false);
          console.log(error);
          console.log(JSON.stringify(error));
          drawCurtains(
            "Solana Error",
          );
        })
      }).catch((error)=>{
        setIsLoading(false);
        drawCurtains(
          "Solana Error [Can't connect to wallet]",
        );
      })

    }
  }

  const startMint = ( cameraSlot: STS.ST_CAMERA_SLOTS ) => { 
    // playByte(FXs.noOp, playingMusic);


    switch(cameraSlot){
      case STS.ST_CAMERA_SLOTS.slot1:
        startRecreationSpeedrun();
      break;
      case STS.ST_CAMERA_SLOTS.sslot0:
        if(gameState.whiteChest < 1){
          mintTwo(
            INDEXES.whiteChest, 
            INDEXES.realTreasure, 
          );
        } else {
          drawCurtains(
            "Real Winner!",
          );
        }
      break;
      case STS.ST_CAMERA_SLOTS.slot0: 
        if(gameState.blackChest < 1){
          mintTwo(
            INDEXES.blackChest, 
            INDEXES.replayToken, 
          );
        } else {
          drawCurtains(
            "Winner!",
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
    // playByte(FXs.op, playingMusic);

    switch(cameraSlot){
      case STS.ST_CAMERA_SLOTS.sslot0: logout(); break;
      case STS.ST_CAMERA_SLOTS.slot0: logout(); break;
      case STS.ST_CAMERA_SLOTS.slot2: setPuzzleState(STState.ST_PUZZLE_STATE.noot); break;
      case STS.ST_CAMERA_SLOTS.slot3: setPuzzleState(STState.ST_PUZZLE_STATE.dronies); break;
      case STS.ST_CAMERA_SLOTS.slot4: setPuzzleState(STState.ST_PUZZLE_STATE.desolates); break;

      case STS.ST_CAMERA_SLOTS.sslot1: setPuzzleState(STState.ST_PUZZLE_STATE.rug); break;
      case STS.ST_CAMERA_SLOTS.sslot2: setPuzzleState(STState.ST_PUZZLE_STATE.forge); break;
      case STS.ST_CAMERA_SLOTS.sslot5: setPuzzleState(STState.ST_PUZZLE_STATE.fractals); break;

      case STS.ST_CAMERA_SLOTS.sslot3: setPuzzleState(STState.ST_PUZZLE_STATE.dronies); break;
      case STS.ST_CAMERA_SLOTS.devSlot: setPuzzleState(STState.ST_PUZZLE_STATE.dronies); break;
      
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

    const cb = () => {
      createPlayerAccount(
        stProvider,
        newGameAccount,
        { name: stProvider.owner.toString().substring(0,3).toUpperCase() }
      ).then((newPlayerAccount)=>{
        onAccountsLoaded(
          newGameAccount,
          newPlayerAccount,
        )
      }).catch((error)=>{
        setIsLoading(false);
        showPopup(
          "Try Again!",
          "Something went wrong or there was a timeout. Try connecting again, you won't be charged twice!",
          cb,
        )
      });
    }

    const isRecon = BNToDate(newGameAccount.supernovaDate).getTime() < Date.now();

    let message = "";
    if(isRecon){
      message = "You'll need to have at least 1 Replay Token to create an account. Once that happens and your account has been created, you can freely play the game as long as you hold on to your token!";
    } else {
      message = "Your mission is simple, solve the puzzles, mint the keys (0.05 ◎ ea) and open the chest BEFORE the supernova. Since you are a new explorer, you'll be asked to open a data account (~0.01 ◎). This only has to be done once! \n\n\nGood luck, we're all counting on you!";
    }

    showPopup(
      "You Ready?!",
      message,
      cb,
    )

  }

  const onAccountsLoaded = (
    newGameAccount: GameAccount,
    newPlayerAccount: PlayerAccount,
  ) => {
    console.log("Supernova Date: " + new Date(1000 * (newGameAccount.supernovaDate.toNumber())));

    setGameAccount(newGameAccount);
    setPlayerAccount(newPlayerAccount);
    setIsLoading(false);
  }

  // On Player Account Change
  React.useEffect(() => {
    setIsLoading(false);

    if ( stProvider.valid ) {

      const newGameState = STState.updateGameState(
        gameAccount,
        playerAccount,
      );

      const isRecon = BNToDate(gameAccount.supernovaDate).getTime() < Date.now();

      const updateState = () => {
        setGameState(
          STState.updateGameState(
            gameAccount,
            playerAccount,
          )
        );


        if(isRecon){
          
          checkAllBurned(
            stProvider,
            gameAccount,
          ).then((allBurned)=>{
            if(allBurned){
              setGlobalState(STState.ST_GLOBAL_STATE.reconstruction);
            } else {
              drawCurtains("Supernova in Process...");
              setGlobalState(STState.ST_GLOBAL_STATE.supernova);
            }
          })
        } else {
          setGlobalState(STState.ST_GLOBAL_STATE.playing);

        }

      }


      if(gameState.supernova !== STState.NULL_SUPERNOVA){
        if(gameState.brokenKey < newGameState.brokenKey) { drawCurtains("SNAP!", false, updateState); return;}
        if(gameState.blackKey < newGameState.blackKey) { drawCurtains("FORGED!", false, updateState); return;}
        if(gameState.blueKey < newGameState.blueKey) { drawCurtains("CLICK!", false, updateState); return;}
        if(gameState.greenKey < newGameState.greenKey) { drawCurtains("CLICK!", false, updateState); return;}
        if(gameState.purpleKey < newGameState.purpleKey) { drawCurtains("CLICK!", false, updateState); return;}
        if(gameState.whiteKey < newGameState.whiteKey) { drawCurtains("CLICK!", false, updateState); return;}
        if(gameState.blackChest < newGameState.blackChest) { drawCurtains("You did it!", true, updateState); return;}
        if(gameState.whiteChest < newGameState.whiteChest) { drawCurtains("You're the real Treasure!", true, updateState); return;}
      }

      updateState();


    } else {
      setGlobalState(STState.ST_GLOBAL_STATE.notConnected)
    }
  }, [ playerAccount ]);

  // On Change
  React.useEffect(() => {

    // BG_SOUND.set(playingMusic);

  }, [playingMusic]);

  
  // On Login
  React.useEffect(() => {
    if ( stProvider.valid ) {
      
      STState.initGameState(
        stProvider,
        createPlayerWorkflow,
        onAccountsLoaded,
      )

    } else {
      setIsLoading(false);
      setGlobalState(STState.ST_GLOBAL_STATE.notConnected)
    }
  }, [stProvider]);

  return (<>

    <STHUD 
        connectWallet={connectWallet}
        startMint={startMint}
        openPuzzle={openPuzzle}
        leaveDevMode={leaveDevMode}
        forceRefresh={forceUpdate}
    />
    <NootPuzzlePage/>
    <DroniesPuzzlePage redHerring={redHerring}/>
    <DesolatePuzzlePage/>
    <RugPuzzlePage/>
    <ForgePage />
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
          <STCurtains/>
          <STPopup />
        </StoreProvider>
      </STThemeProvider>
    </div>
  );
}

export default App;
