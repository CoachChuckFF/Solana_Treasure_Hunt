import * as anchor from "@project-serum/anchor";
import * as helpers from "@coach-chuck/solana-helpers";
import * as ST from "../ts/sol-treasure"
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

const secretArray = require('/Users/drkrueger/.config/solana/programs/sol-treasure.json');
const secret = new Uint8Array(secretArray);
const payerKeypair = anchor.web3.Keypair.fromSecretKey(secret);

const sleep = (ms: number) => {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            resolve(null);
        }, ms);
    });
}

interface TestItemParams {
  name?: string,
  itemType?: ST.GameItemType,
  mintTailSeed?: number,
  mintBytes?: number[],
  isReplayToken?: boolean,
  isWrongAnswerItem?: boolean,
  percent?: number,
  amountPerMint?: number,
  maxPerInventory?: number,
  cost?: anchor.BN,
  amountToTx?: anchor.BN,
  amountToMake?: number,
}
const createTestGameItem = async (
  provider: anchor.Provider,
  params: TestItemParams,
) => {
  return {
    mint: (await helpers.createSPL(provider, params.amountToMake ?? 1000000)).mint,
    params: {
      name: params.name ?? "Test Item",
      itemType: params.itemType ?? ST.GameItemType.item,
      mintTailSeed: params.mintTailSeed ?? 0,
      mintBytes: params.mintBytes ?? ST.NULL_MINT_BYTES,
      isReplayToken: params.isReplayToken ?? false,
      isWrongAnswerItem: params.isWrongAnswerItem ?? false,
      percent: params.percent ?? 1,
      amountPerMint: params.amountPerMint ?? 1,
      maxPerInventory: params.maxPerInventory ?? 1,
      cost: params.cost ?? new anchor.BN(1),
      amountToTx: params.amountToTx ?? new anchor.BN(params.amountToMake ?? 1000000),
    } as ST.LoadItemsParams,
  };
}

interface TestCombinationParams {
  name?: string,
  input0Amount?: number,
  input1Amount?: number,
  outputAmount?: number,
}
const createTestCombination = async (
  mintI0: anchor.web3.PublicKey,
  mintI1: anchor.web3.PublicKey,
  mintO: anchor.web3.PublicKey,
  params: TestCombinationParams,
) => {
  return {
    mintI0: mintI0,
    mintI1: mintI1,
    mintO: mintO,
    params: {
      name: params.name ?? "Test Combo",
      input0Amount: params.input0Amount ?? 1,
      input1Amount: params.input1Amount ?? 1,
      outputAmount: params.outputAmount ?? 1,
    } as ST.LoadCombinationsParams
  }
}


const main = async() => {
    console.log("🚀 Starting test...")
  
    // let ownerWallet = new NodeWallet(payerKeypair);
    // const provider = helpers.getSolanaProvider(ownerWallet);
    // anchor.setProvider(provider);

    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Soltreasure;
    
    // ---------------------- PROVIDER ----------------------------------
    console.log("Creating Provider...");
    const stProvider = await ST.STProvider.init(provider, program);

    // ---------------------- GAME ITEMS ----------------------------------
    console.log("Creating Test Items...");
    const items = {
      key0: await createTestGameItem(provider, {name: "Key 0"}),
      key1: await createTestGameItem(provider, {name: "Key 1"}),
      key2: await createTestGameItem(provider, {name: "Key 2"}),
      badKey: await createTestGameItem(provider, {name: "Bad Key", isWrongAnswerItem: true, percent: 0}),
      replayToken: await createTestGameItem(provider, {name: "Replay Token", isReplayToken: true, percent: 0}),
      forgedKey: await createTestGameItem(provider, {name: "Forged Key", itemType: ST.GameItemType.comb}),
      treasure: await createTestGameItem(provider, {name: "Treasure", itemType: ST.GameItemType.reward}),
    };

    const combinations = {
      forgedKey: createTestCombination(items.badKey.mint, items.badKey.mint, items.forgedKey.mint, {name: "Forged Key"})
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

    // console.log(game);

    // // ---------------------- LOAD ITEMS ----------------------------------
    // console.log("Loading Combinations...");
    // for (const key in items) {
    //   console.log("--- " + key);
    //   game = await ST.loadItem(
    //     stProvider,
    //     game,
    //     items[key].mint,
    //     items[key].params,
    //   )
    // }

    // console.log("Settings Requirements...");
    // for (const key in items) {
    //   console.log("--- " + key);
    //   game = await ST.loadItem(
    //     stProvider,
    //     game,
    //     items[key].mint,
    //     items[key].params,
    //   )
    // }

    console.log("... to the moon! 🌑")
  }
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
  
  runMain();


