import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { web3, BN } from "@project-serum/anchor";
import * as helpers from "./solHelpers";

interface GameLeaderboardInfo {
    player: web3.PublicKey,
    runStart: BN,
    runPercentTimestamp: BN,
    runPercent: number,
}

interface GameCombination {
    input0Id: BN,
    input0Amount: number,
    input1Id: BN,
    input1Amount: number,
    outputId: BN,
    outputAmount: number,

    cost: BN,
}

enum GameItemType {
    KEY = 0x00,
    ITEM = 0x01,
    REWARD = 0x02,
    COMBINATION_OUTPUT = 0x03,
}

interface GameItem {
    name: string,

    item: web3.PublicKey,
    mint: web3.PublicKey,

    burned: boolean,

    itemType: GameItemType,
    requirements: BN, //64 bit number, a 1 bit means the item with that ID is needed
    id: BN,           //64 bit number, 0b1 << [index in array]

    codes: number,
    percent: number, // 0 - 100. Probably

    maxPerInventory: number,
    amountPerMint: number,

    cost: BN, // In Lamports
}

interface GameInventoryItem {
    item: web3.PublicKey,
    amount: number,
}

interface GamePlayer {
    playerAccount: web3.PublicKey,
    game: web3.PublicKey,
    player: web3.PublicKey,
    bump: number,

    runStart: BN,
    runPercentTimestamp: BN,
    runPercent: BN,

    inventory: GameInventoryItem [],
}

interface GameAccount {
    // Handlers
    game: web3.PublicKey,
    coach: web3.PublicKey,
    gatekeeper: web3.PublicKey,
    nonce: number,
    lamports: BN,

    // State
    cheaterTime: BN,
    playing: boolean,
    gameStart: BN,
    supernova: BN,

    // Mechanics
    assets: GameItem[],
    combinations: GameCombination[],
    wrongAnswerItem: web3.PublicKey,

    // Leaderboards
    leaderboard: GameLeaderboardInfo[],
}

class GameCodes {
    code: number;
   
    constructor(code: number) {
        this.code = code;
    }

    codeFromCodes(codes: number[]) {
        if(!codes) return new GameCodes(0);
        if(codes.length !== 4) return new GameCodes(0);

        let newCode = (codes[0] & 0xFF) << 0;
        newCode    |= (codes[1] & 0xFF) << 8;
        newCode    |= (codes[2] & 0xFF) << 16;
        newCode    |= (codes[3] & 0xFF) << 24;

        return new GameCodes(newCode);
    }
}

class Game {
    gameKey: web3.PublicKey;
    game: GameAccount;

    constructor(gameKey: web3.PublicKey) {
        this.gameKey = gameKey;
        this.game = {} as GameAccount;
    }

    async updateGameAccount(program: any, gameKey: web3.PublicKey) {
        return this.game = await program.account.game.fetch(gameKey);
    }   
}


// Sizes
const PUBKEY_SIZE = 32;
const U8 = 1;
const U16 = 2;
const U32 = 4;
const U64 = 8;
const VEC = 8;
const GAME_ITEM = 32 + PUBKEY_SIZE * 2 + U8 * 4 + U32 + U64 * 4
const GAME_COMBINATION = U64 * 4 + U8 * 3;
const LEADBOARD = PUBKEY_SIZE + U64 * 2 + U8;
const GAME_BASE = PUBKEY_SIZE * 4 + U64 * 4 + U8 * 2 + VEC * 3 + LEADBOARD * 10;
const getGameSize = (assetCount: number, combinationCount: number) => {
    return (
        GAME_BASE + assetCount * GAME_ITEM + combinationCount * GAME_COMBINATION
    );
}



const getGameAccount = (program: any, gameKey:  web3.PublicKey,) => {
    return program.account.game.fetch(gameKey);
}

const createGameAccount = async (provider: anchor.Provider, program: any, assetCount: number, combinationCount: number) => {
    const game = anchor.web3.Keypair.generate();
  
    let [gatekeeper, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [game.publicKey.toBuffer()],
      program.programId
    );
    
    await program.rpc.createGame(
      nonce,
      {
        accounts: {
          game: game.publicKey,
          gatekeeper: gatekeeper,
          coach: provider.wallet.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [game],
        instructions: [
          await program.account.game.createInstruction(game, getGameSize(assetCount, combinationCount)),
        ],
      }
    );
    
    return await getGameAccount(program, game.publicKey);
}

const loadAsset = async (provider: anchor.Provider, program: any, game: GameAccount, asset: GameItem, isWrongAsset: boolean) => {

  
    let coachGameVault = await helpers.findAssociatedTokenAddress(game.coach, asset.mint);
    let coachAssetInfo = await helpers.getSPLInfo(provider, asset.mint, coachGameVault);

    let assetGameVault = await helpers.findAssociatedTokenAddress(game.gatekeeper, asset.mint);

    asset.item = assetGameVault;
  
    let createTX = await program.rpc.loadAssets(
      asset.name,
      asset.itemType,
      asset.codes,
      isWrongAsset ?? false,
      asset.percent,
      asset.amountPerMint,
      asset.maxPerInventory,
      new anchor.BN(asset.cost),
      new anchor.BN(coachAssetInfo.amount),
      {
        accounts: {
          game: game.game,
          gatekeeper: game.gatekeeper,
  
          coachVault: coachAssetInfo.address,
          gameVault: assetGameVault,
  
          coach: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
        instructions: [
          (await Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            coachAssetInfo.mint, 
            assetGameVault,
            game.gatekeeper,
            provider.wallet.publicKey
          )),
        ],
      }
    );

    return await getGameAccount(program, game.game);
}


export const createTestGame = async (
    provider: anchor.Provider, 
    program: any,
) => {
    //Create Assets
    let dummyAssetCount = 5;
    let dummyAssets: Array<GameItem> = [];

    let dummyCombinationCount = 1;
    let dummyCombintaions: Array<GameCombination> = [];

    for(var i = 0; i < dummyAssetCount; i++){
        let dummySLP = await helpers.createSPL(provider, 100000);
        dummyAssets.push({
            name: `Item ${i}`,
            mint: dummySLP.mint,
            item: dummySLP.address, //Does not matter
            burned: false, //Does not matter
            itemType: GameItemType.KEY,
            requirements: new BN(0),
            id: new BN(0),
            codes: 0x01020304,
            percent: 5,
            maxPerInventory: 1,
            amountPerMint: 1,
            cost: new BN(Math.round(web3.LAMPORTS_PER_SOL * 0.05))
        });
    }

    for(var i = 0; i < dummyCombinationCount; i++){
        dummyCombintaions.push({
            input0Amount: 1,
            input0Id: new BN(0b1),
            input1Amount: 1,
            input1Id: new BN(0b1),
            outputAmount:1,
            outputId: new BN(0b10),
            cost: new BN(Math.round(web3.LAMPORTS_PER_SOL * 0.05))
        });
    }


    return createGame(provider, program, dummyAssets, dummyCombintaions);
}

export const createGame = async (
    provider: anchor.Provider, 
    program: any,
    assets: Array<GameItem>,
    combinations: Array<GameCombination>,
) => {

    //Create Account
    let gameAccount = await createGameAccount(provider, program, assets.length, combinations.length);

    //Load Assets
    for(var i = 0; i < assets.length; i++){
        gameAccount = await loadAsset(provider, program, gameAccount, assets[i], assets[i].name.toUpperCase().includes("BAD"));
    }

    return gameAccount;
    //Load Requirements

    //Load Combinations


}

export const playGame = async (
    provider: anchor.Provider, 
    program: any,
    assets: Array<GameItem>,
    combinations: Array<GameCombination>,

) => {

}

export const pauseGame = async (
    provider: anchor.Provider, 
    program: any,
    assets: Array<GameItem>,
    combinations: Array<GameCombination>,

) => {

}


export { Game };
