import * as anchor from "@project-serum/anchor";
import * as helpers from "@coach-chuck/solana-helpers";
import * as ST from "../ts/sol-treasure"
import * as V0 from "../ts/v0"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

const secretArray = require('/Users/drkrueger/.config/solana/programs/sol-treasure.json');
const secret = new Uint8Array(secretArray);
const payerKeypair = anchor.web3.Keypair.fromSecretKey(secret);

const gameToEnd = new anchor.web3.PublicKey("FABt9886NbLDkfJReCNw4EicD2zPoYVC25jkmMyGXvUP");

const supernova = async(
    stProvider: ST.STProvider,
    gameKey: anchor.web3.PublicKey | ST.GameAccount,
) => {
    const game = await ST.getGameAccount(stProvider, gameKey);

    console.log(await ST.gameToString(stProvider, game));

    console.log(ST.BNToDate(game.startDate).toUTCString());
    console.log(ST.BNToDate(game.supernovaDate).toUTCString());
    console.log((new Date(Date.now())).toUTCString());

    console.log("Supernova... ")
    for (const [key, value] of Object.entries(game.items)) {
      console.log("--- " + key);
      await ST.supernova(
        stProvider,
        game,
        value.mint,
      );
    }
}

const endGame = async() => {
    console.log("🚀 Supernova");

    const opts = anchor.Provider.defaultOptions()
    const provider = new anchor.Provider(
      new anchor.web3.Connection("http://localhost:8899", opts.preflightCommitment),
      new NodeWallet(payerKeypair),
      opts,
    )
    anchor.setProvider(provider);
    const stProvider = await ST.STProvider.init(provider);


    await supernova(stProvider, gameToEnd);
}

const main = async() => {
    console.log("🚀 Starting test...");
  
    let ownerWallet = new NodeWallet(payerKeypair);
    const provider = helpers.getSolanaProvider(ownerWallet, false);
    anchor.setProvider(provider);

        
    // ---------------------- PROVIDER ----------------------------------
    console.log("Creating Providers...");
    console.log("--- Coach");
    const stProvider = await ST.STProvider.init(provider);


    // ---------------------- CREATE GAME ----------------------------------
    // let game = await V0.createTheGame(
    //   stProvider,
    //   anchor.web3.Keypair.generate(),
    //   false
    // );

    let game = await ST.getGameAccount(stProvider, V0.GAME_KEY);

    // game = await V0.startGame(
    //   stProvider,
    //   game,
    // );

    // console.log(await ST.gameToString(
    //   stProvider,
    //   game
    // ));

    console.log(await ST.getGameAccount(stProvider, V0.GAME_KEY));

    // console.log("... to the moon! 🌑")
  }
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {

      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();
// endGame();


