import * as anchor from "@project-serum/anchor";
import * as helpers from "@coach-chuck/solana-helpers";
import * as ST from "../ts/sol-treasure"
import * as V0 from "../ts/v0"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

const secretArray = require('/Users/drkrueger/.config/solana/programs/sol-treasure.json');
const secret = new Uint8Array(secretArray);
const payerKeypair = anchor.web3.Keypair.fromSecretKey(secret);

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
      setTimeout(()=>{
          resolve(null);
      }, ms);
  });
}

// static local(url?: string, opts?: ConfirmOptions): Provider {
//   if (isBrowser) {
//     throw new Error(`Provider local is not available on browser.`);
//   }
//   opts = opts ?? Provider.defaultOptions();
//   const connection = new Connection(
//     url ?? "http://localhost:8899",
//     opts.preflightCommitment
//   );
//   const NodeWallet = require("./nodewallet.js").default;
//   const wallet = NodeWallet.local();
//   return new Provider(connection, wallet, opts);
// }

const createTestPlayer = async (coach: ST.STProvider, url?: string) => {
  const opts = anchor.Provider.defaultOptions();

  const connection = new anchor.web3.Connection(url ?? "http://localhost:8899", opts.preflightCommitment);
  const wallet = new NodeWallet(anchor.web3.Keypair.generate());
  const playerProvider = new anchor.Provider(connection, wallet, opts);
  const program = new anchor.Program<anchor.Idl>(coach.program.idl, coach.program.programId, playerProvider);

  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: coach.owner,
      toPubkey: playerProvider.wallet.publicKey,
      lamports: anchor.web3.LAMPORTS_PER_SOL,
    }),
  );

  await coach.provider.send(transaction);

  return await ST.STProvider.init(playerProvider, program);
}

const main = async() => {
    console.log("🚀 Starting test...");
  
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Soltreasure;
    
    // ---------------------- PROVIDER ----------------------------------
    console.log("Creating Providers...");
    console.log("--- Coach");
    const stProvider = await ST.STProvider.init(provider, program);

    console.log("--- Players");
    const player1 = {stProvider: await createTestPlayer(stProvider), playerAccount: {} as ST.PlayerAccount};
    const player2 = {stProvider: await createTestPlayer(stProvider), playerAccount: {} as ST.PlayerAccount};
    const player3 = {stProvider: await createTestPlayer(stProvider), playerAccount: {} as ST.PlayerAccount};


    // ---------------------- CREATE GAME ----------------------------------
    let game = await V0.createTheGame(
      stProvider,
      anchor.web3.Keypair.generate(),
      true
    );

    game = await V0.startGame(
      stProvider,
      game,
    );

    console.log(await ST.gameToString(
      stProvider,
      game
    ));

    console.log("Starting in: ");
    await sleep(300);
    console.log("3");
    await sleep(300);
    console.log("2");
    await sleep(300);
    console.log("1");
    await sleep(300);

    // ---------------------- CREATE PLAYER ----------------------------------
    console.log("Creating Player...");
    player1.playerAccount = await ST.createPlayerAccount(
      player1.stProvider,
      game,
      {name: "OG"}
    );

    // ---------------------- HASH ----------------------------------
    console.log("Grabbing Keys...");
    for (const [key, value] of Object.entries(V0.ITEMS)) {
      console.log("--- " + key);
      if(
        value.params.itemType === ST.GameItemType.item &&
        !value.params.isReplayToken &&
        !value.params.isWrongAnswerItem
      ){
        let hash = ST.hashWallet(
          player1.stProvider,
          value.params.mintBytes,
          value.params.mintTailSeed,
        );

        player1.playerAccount = await ST.hashItem(
          player1.stProvider,
          game,
          player1.playerAccount,
          value.mint,
          { hash }
        );
      }
    }

    // ---------------------- BROKEN KEYS ----------------------------------
    console.log("Breaking Keys...");
    for (let i = 0; i < 2; i++) {
      console.log("--- SNAP " + i);
      player1.playerAccount = await ST.hashItem(
        player1.stProvider,
        game,
        player1.playerAccount,
        V0.ITEMS.blueKey.mint,
        { hash: ST.NULL_MINT_BYTES }
      );
    }

    // ---------------------- COMBO ----------------------------------
    console.log("Forging Keys...");
    let forgeParams = await ST.createForgeParams(
      player1.stProvider,
      game,
      0
    );
    player1.playerAccount = await ST.forgeItem(
      player1.stProvider,
      game,
      player1.playerAccount,
      forgeParams.mints.mintI0,
      forgeParams.mints.mintI1,
      forgeParams.mints.mintO,
      forgeParams.params,
    )

    // ---------------------- TREASURE ----------------------------------
    console.log("Opening Black Chest...");
    player1.playerAccount = await ST.hashItem(
      player1.stProvider,
      game,
      player1.playerAccount,
      V0.ITEMS.blackChest.mint,
      { hash: ST.NULL_MINT_BYTES },
    );

    console.log("Grabbing Replay Token...");
    player1.playerAccount = await ST.hashItem(
      player1.stProvider,
      game,
      player1.playerAccount,
      V0.ITEMS.replayToken.mint,
      { hash: ST.NULL_MINT_BYTES },
    );


    console.log("Opening White Chest...");
    player1.playerAccount = await ST.hashItem(
      player1.stProvider,
      game,
      player1.playerAccount,
      V0.ITEMS.whiteChest.mint,
      { hash: ST.NULL_MINT_BYTES },
    );

    console.log("Grabbing real treasure...");
    player1.playerAccount = await ST.hashItem(
      player1.stProvider,
      game,
      player1.playerAccount,
      V0.ITEMS.realTreasure.mint,
      { hash: ST.NULL_MINT_BYTES },
    );

    await sleep(1000 * 30);
    // ---------------------- SUPERNOVA ----------------------------------
    console.log("Supernova... ")
    for (const [key, value] of Object.entries(V0.ITEMS)) {
      console.log("--- " + key);
      game = await ST.supernova(
        stProvider,
        game,
        value.mint,
      );
    }

    await sleep(1000 * 2);
    // ---------------------- SPEEDRUN ----------------------------------
    console.log("Starting speedrun... ")
    player1.playerAccount = await ST.startSpeedrun(
      player1.stProvider,
      game,
      player1.playerAccount,
    );

    player1.playerAccount = await ST.hashItem(
      player1.stProvider,
      game,
      player1.playerAccount,
      game.items[0].mint,
      { hash: ST.hashWallet(
        player1.stProvider,
        game.items[0].mintBytes,
        game.items[0].mintTailSeed
      ) }
    );

    console.log("Send to a friend... ")
    await helpers.txSPL(
      player1.stProvider.provider,
      game.replayTokenMint,
      player2.stProvider.owner,
      1
    );

    player2.playerAccount = await ST.createPlayerAccount(
      player2.stProvider,
      game,
      {name: "Friend"}
    )

    player2.playerAccount = await ST.hashItem(
      player2.stProvider,
      game,
      player2.playerAccount,
      game.items[0].mint,
      { hash: ST.hashWallet(
        player2.stProvider,
        game.items[0].mintBytes,
        game.items[0].mintTailSeed
      ) }
    );


    console.log(await ST.gameToString(
      stProvider,
      game.game,
    ))

    console.log(await ST.playerToString(
      player1.stProvider,
      player1.playerAccount,
    ))

    console.log(await ST.playerToString(
      player2.stProvider,
      player2.playerAccount,
    ))

    // console.log(await ST.playerToString(
    //   players.player0.stProvider,
    //   players.player0.playerAccount,
    // ))

    // players.player0.playerAccount = await ST.hashItem(
    //   players.player0.stProvider,
    //   game,
    //   players.player0.playerAccount,
    //   items.key0.mint,
    //   {
    //     hash: [0,0,0,0]
    //   },
    // )

    // console.log(await ST.playerToString(
    //   players.player0.stProvider,
    //   players.player0.playerAccount,
    // ))

    // console.log(await ST.gameToString(
    //   stProvider,
    //   game.game,
    // ))

    // // ---------------------- REPLAY PLAYER ----------------------------------
    // console.log("Sending a Replay Token... ")
    // await helpers.txSPL(
    //   players.player0.stProvider.provider,
    //   items.replayToken.mint,
    //   players.player1.stProvider.owner,
    //   1
    // );

    // console.log("Creating Replay Player ")
    // players.player1.playerAccount = await ST.createPlayerAccount(
    //   players.player1.stProvider,
    //   game,
    //   {name: "Replay"}
    // );

    // players.player1.playerAccount = await ST.hashItem(
    //   players.player1.stProvider,
    //   game,
    //   players.player1.playerAccount,
    //   items.key0.mint,
    //   {
    //     hash: [0,0,0,0]
    //   },
    // )

    // console.log(await ST.doesMeetReq(
    //   players.player1.stProvider,
    //   game,
    //   players.player1.playerAccount,
    //   items.key0.mint,
    // ));
    // console.log(await ST.doesMeetReq(
    //   players.player1.stProvider,
    //   game,
    //   players.player1.playerAccount,
    //   items.treasure.mint,
    // ));
    // // players.player1.playerAccount = await ST.hashItem(
    // //   players.player1.stProvider,
    // //   game,
    // //   players.player1.playerAccount,
    // //   items.treasure.mint,
    // //   {
    // //     hash: [0,0,0,0]
    // //   },
    // // )

    // console.log(await ST.playerToString(
    //   players.player0.stProvider,
    //   players.player0.playerAccount,
    // ))

    // console.log(await ST.playerToString(
    //   players.player1.stProvider,
    //   players.player1.playerAccount,
    // ))

    // console.log(await ST.gameToString(
    //   stProvider,
    //   game.game,
    // ))

    console.log("... to the moon! 🌑")
  }

  const testGuarded = (func: ()=>Promise<any>) => {
    return new Promise<boolean>(async (resolve)=>{
      try {
        await func();
        resolve(false);
      } catch (error) {
        resolve(true);
      }
    });
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


