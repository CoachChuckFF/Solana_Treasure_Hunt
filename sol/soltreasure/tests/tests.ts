import * as anchor from "@project-serum/anchor";
import * as helpers from "@coach-chuck/solana-helpers";
import * as ST from "../ts/sol-treasure"
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
    const players = {
      player0: {stProvider: await createTestPlayer(stProvider), playerAccount: {} as ST.PlayerAccount},
      player1: {stProvider: await createTestPlayer(stProvider), playerAccount: {} as ST.PlayerAccount},
      player2: {stProvider: await createTestPlayer(stProvider), playerAccount: {} as ST.PlayerAccount},
    };

    // ---------------------- GAME ITEMS ----------------------------------
    console.log("Creating Test Items...");
    const items = {
      key0: await ST.createTestGameItem(provider, {name: "Key 0"}),
      key1: await ST.createTestGameItem(provider, {name: "Key 1"}),
      key2: await ST.createTestGameItem(provider, {name: "Key 2", mintBytes: [0,1,2,3], }),
      badKey: await ST.createTestGameItem(provider, {name: "Bad Key", isWrongAnswerItem: true, percentPerItem: 0, itemsPerMint: 2, maxItemsPerInventory: 5}),
      forgedKey: await ST.createTestGameItem(provider, {name: "Forged Key", itemType: ST.GameItemType.comb}),
      treasure: await ST.createTestGameItem(provider, {name: "Treasure", itemType: ST.GameItemType.reward}),
      replayToken: await ST.createTestGameItem(provider, {name: "Replay Token", isReplayToken: true, percentPerItem: 0, itemType: ST.GameItemType.reward}),
    };

    const combinations = {
      forgedKey: await ST.createTestCombination(items.badKey.mint, items.badKey.mint, items.forgedKey.mint, {name: "Forged Key"})
    };

    const requirements = {
      replayToken: {mint: items.replayToken.mint, params: [items.key0.mint, items.key1.mint, items.key2.mint]},
      treasure: {mint: items.treasure.mint, params: [items.key0.mint, items.key1.mint, items.key2.mint]},
    };

    // ---------------------- CREATE GAME ----------------------------------
    console.log("Creating Game...");
    let game = await ST.createGame(
      stProvider,
      {
        name: "Sol-Treasure",
        itemCount: Object.keys(items).length,
        combinationCount: Object.keys(combinations).length,
        leaderboardCount: 10,
      }
    )

    // ---------------------- LOAD ITEMS ----------------------------------
    console.log("Loading Items...");
    for (const [key, value] of Object.entries(items)) {
      console.log("--- " + key);
      game = await ST.loadItem(
        stProvider,
        game,
        value.mint,
        value.params,
      )
    }

    // ---------------------- LOAD COMBOS ----------------------------------
    console.log("Loading Combos...");
    for (const [key, value] of Object.entries(combinations)) {
      console.log("--- " + key);
      game = await ST.loadCombination(
        stProvider,
        game,
        value.mintI0,
        value.mintI1,
        value.mintO,
        value.params,
      )
    }


    // ---------------------- LOAD REQUIREMENTS ----------------------------------
    console.log("Loading Requirements...");
    for (const [key, value] of Object.entries(requirements)) {
      console.log("--- " + key);
      game = await ST.loadRequirements(
        stProvider,
        game,
        value.mint,
        await ST.createLoadRequirementParams(stProvider, game, value.params),
      )
    }

    // ---------------------- START GAME ----------------------------------
    console.log("Starting Game...");
    await ST.startStopCountdown(
      stProvider,
      game,
      ST.createTestStartStop(true, {
        cheaterTime: new anchor.BN(0),
      }),
    )

    console.log( await ST.gameToString(stProvider, game.game) );

    console.log("Starting in: ");
    await sleep(300);
    console.log("3");
    await sleep(300);
    console.log("2");
    await sleep(300);
    console.log("1");
    await sleep(300);

    // ---------------------- CREATE PLAYERS ----------------------------------
    console.log("Creating Players...");
    for (const [key, value] of Object.entries(players)) {
      console.log("--- " + key);
      value.playerAccount = await ST.createPlayerAccount(
        value.stProvider,
        game,
        {name: key}
      )
    }
    console.log(
      await ST.playerToString(
        players.player0.stProvider,
        players.player0.playerAccount,
      )
    );

    // ---------------------- SHOULD FAIL ----------------------------------
    // console.log("Did fail? " + await testGuarded(
    //   ST.startSpeedrun(
    //     players.player0.stProvider,
    //     game,
    //     players.player0.playerAccount,
    //   ) as any
    // ))

    // ---------------------- HASH ----------------------------------
    console.log("Grabbing Keys...");

    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.key0.mint,
      {
        hash: [0,0,0,0]
      }
    )

    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.key1.mint,
      {
        hash: [0,0,0,0]
      }
    )

    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.key2.mint,
      {
        hash: ST.hashWallet(
          players.player0.stProvider,
          items.key2.params.mintBytes,
          items.key2.params.mintTailSeed,
        )
      }
    )

    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.key2.mint,
      {
        hash: [0,0,0,0]
      }
    )
    
    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.key2.mint,
      {
        hash: [0,0,0,0]
      }
    )

    // ---------------------- COMBO ----------------------------------
    console.log("Forging Keys...");
    let forgeParams = await ST.createForgeParams(
      players.player0.stProvider,
      game,
      0
    );
    players.player0.playerAccount = await ST.forgeItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      forgeParams.mints.mintI0,
      forgeParams.mints.mintI1,
      forgeParams.mints.mintO,
      forgeParams.params,
    )

    // ---------------------- TREASURE ----------------------------------
    console.log("Grabbing Treasure...");
    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.treasure.mint,
      {
        hash: [0,0,0,0]
      }
    )

    players.player0.playerAccount = await ST.hashItem(
      players.player0.stProvider,
      game,
      players.player0.playerAccount,
      items.replayToken.mint,
      {
        hash: [0,0,0,0]
      }
    )

    console.log(await ST.gameToString(
      stProvider,
      game.game,
    ))

    console.log(await ST.playerToString(
      players.player0.stProvider,
      players.player0.playerAccount,
    ))

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


