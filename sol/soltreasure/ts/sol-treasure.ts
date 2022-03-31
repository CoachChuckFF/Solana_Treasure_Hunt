import * as spl from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';
import * as helpers from "@coach-chuck/solana-helpers";
import { web3, BN } from "@project-serum/anchor";

// --------- DEFINES -----------------------------------------
export const SOL_TREASURE_ID = new web3.PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

export const NULL_MINT_BYTES = [0,0,0,0];

export enum GameItemType {
    item = 0x00,
    reward = 0x01,
    comb = 0x02,
}

export interface GameLeaderboardInfo {
    name: string,
    player: web3.PublicKey,
    runStart: BN,
    runPercentTimestamp: BN,
    runPercent: number,
}

export interface GameCombination {
    name: string,
    input0Id: BN,
    input0Amount: number,
    input1Id: BN,
    input1Amount: number,
    outputId: BN,
    outputAmount: number,
}

export interface GameItem {
    name: string,
    mint: web3.PublicKey,
    burned: boolean,
    requirements: BN,
    id: BN,
    itemType: GameItemType,
    mintTailSeed: number,
    mintBytes: number[],
    percent: number,
    maxPerInventory: number,
    amountPerMint: number,
    cost: BN,
}

export interface GameInventoryItem {
    mint: web3.PublicKey,
    amount: number,
    mintedCount: number,
}

export interface PlayerAccount {
    name: string,
    player: web3.PublicKey,
    game: web3.PublicKey,
    playerReplayVault: web3.PublicKey,
    playerAccount: web3.PublicKey,
    bump: number,
    runStart: BN,
    runPercentTimestamp: BN,
    runPercent: number,
    isOg: boolean,
    isSpeedrunning: boolean,
    inventory: GameInventoryItem[]
}

export interface GameAccount {
    name: string,
    game: web3.PublicKey,
    coach: web3.PublicKey,
    gatekeeper: web3.PublicKey,
    nonce: number,
    lamports: BN,
    cheaterTime: BN,
    startDate: BN,
    supernovaDate: BN,
    replayTokenMint: web3.PublicKey,
    wrongAnswerMint: web3.PublicKey,
    itemCount: number,
    combinationCount: number,
    leaderboardCount: number,
    items: GameItem[],
    combinations: GameCombination[],
    leaderboard: GameLeaderboardInfo[],
    speedboard: GameLeaderboardInfo[],
}

export interface CreateGameParams {
    name: string,
    nonce?: number,
    itemCount: number,
    combinationCount: number,
    leaderboardCount: number,
}

export interface LoadItemsParams {
    name: string,
    itemType: GameItemType,
    mintTailSeed: number,
    mintBytes: number[],
    isReplayToken: boolean,
    isWrongAnswerItem: boolean,
    percent: number,
    amountPerMint: number,
    maxPerInventory: number,
    cost: BN,
    amountToTx: BN,
}

export interface LoadCombinationsParams {
    name: string,
    input0Amount: number,
    input1Amount: number,
    outputAmount: number,
}

export interface LoadRequirementsParams {
    requirements: BN,
}

export interface StartStopCountdownParams {
    playing: boolean,
    countdownTime: BN,
    supernovaDate: BN,
    cheaterTime: BN,
}

export interface CreatePlayerParams {
    name: string,
    bump?: number,
}

export interface HashItemParams {
    hash: number[],
}

// --------- PROVIDER -----------------------------------------
export class STProvider {
    provider: anchor.Provider;
    program: anchor.Program<anchor.Idl>;

    // Call init
    private constructor(
        provider: anchor.Provider,
        program: anchor.Program<anchor.Idl>,
    ) {
        this.provider = provider;
        this.program = program;
    }

    static init = async (
        provider: anchor.Provider,
        program?: anchor.Program<anchor.Idl>,
    ) => {
        return new STProvider(
            provider,
            program ?? await STProvider._getSTProgram(provider),
        );
    }

    static _getSTProgram = async (provider: anchor.Provider) => { 
        const idl = await anchor.Program.fetchIdl(SOL_TREASURE_ID, provider);
        return new anchor.Program<anchor.Idl>(idl as any, SOL_TREASURE_ID, provider);
    }
}

// --------- FUNCTIONS -----------------------------------------
export const getGameAccount = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    shouldUpdate?: boolean,
) => { 
    if((stKey as GameAccount).nonce){
        if( shouldUpdate ){
            return (await stProvider.program.account.game.fetch((stKey as GameAccount).game)) as GameAccount; 
        } else {
            return await stKey as GameAccount;
        }
    }
    return (await stProvider.program.account.game.fetch(stKey as web3.PublicKey)) as GameAccount; 
}

export const getPlayerAccount = async (
    stProvider: STProvider,
    playerAccountKey: web3.PublicKey | PlayerAccount,
    shouldUpdate?: boolean,
) => { 
    if((playerAccountKey as PlayerAccount).bump){
        if( shouldUpdate ){
            return (await stProvider.program.account.player.fetch((playerAccountKey as PlayerAccount).playerAccount)) as PlayerAccount; 
        } else {
            return await playerAccountKey as PlayerAccount;
        }
    }
    return (await stProvider.program.account.player.fetch(playerAccountKey as web3.PublicKey)) as PlayerAccount; 
}

export const findPlayerAccount = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    playerKey: web3.PublicKey,
) => {
    const game = await getGameAccount(stProvider, stKey);
    return await web3.PublicKey.findProgramAddress(
        [
            playerKey.toBuffer(),
            game.game.toBuffer(),
        ],
        stProvider.program.programId,
    );
}

export const createGame = async (
    stProvider: STProvider,
    params: CreateGameParams,
    existingGameKeypair?: web3.Keypair,
) => {
    const owner = stProvider.provider.wallet.publicKey;
    const gameKeypair = existingGameKeypair ?? web3.Keypair.generate();

    const [gatekeeper, nonce] = await web3.PublicKey.findProgramAddress(
        [gameKeypair.publicKey.toBuffer()],
        stProvider.program.programId
    );

    params.nonce = nonce;

    console.log(params);
    
    await stProvider.program.rpc.createGame(
        params,
        {
            accounts: {
                game: gameKeypair.publicKey,
                gatekeeper: gatekeeper,
                coach: owner,
                systemProgram: web3.SystemProgram.programId,
            },
            signers: [gameKeypair],
            instructions: [],
        }
    );

    return getGameAccount(stProvider, gameKeypair.publicKey, true);
}

export const loadItem = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    mint: web3.PublicKey,
    params: LoadItemsParams,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const owner = stProvider.provider.wallet.publicKey;

    const ownerVault = await helpers.getAssociatedTokenAddress(
        mint,
        owner, 
    );

    const { vault, shouldCreate } = await helpers.getAssociatedTokenAddressAndShouldCreate(
        stProvider.provider,
        mint,
        game.gatekeeper,
        true,
    );
    
    await stProvider.program.rpc.loadItem(
        params,
        {
          accounts: {
                game: game.game,
                gatekeeper: game.gatekeeper,
                coachVault: ownerVault,
                gameVault: vault,
                coach: owner,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
          },
          signers: [],
          instructions: [
            ...(shouldCreate) ? [
                spl.Token.createAssociatedTokenAccountInstruction(
                    spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                    spl.TOKEN_PROGRAM_ID,
                    mint,
                    vault,
                    game.gatekeeper,
                    owner,
                ) 
            ] : []
          ],
        }
    );

    return getGameAccount(stProvider, game.game, true);
}

export const loadCombination = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    mintI0: web3.PublicKey,
    mintI1: web3.PublicKey,
    mintO: web3.PublicKey,
    params: LoadCombinationsParams,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const owner = stProvider.provider.wallet.publicKey;

    const input0 = await helpers.getAssociatedTokenAddress(mintI0, game.gatekeeper, true);
    const input1 = await helpers.getAssociatedTokenAddress(mintI1, game.gatekeeper, true);
    const output = await helpers.getAssociatedTokenAddress(mintO, game.gatekeeper, true);
    
    await stProvider.program.rpc.loadCombination(
        params,
        {
            accounts: {
                game: game.game,
                gatekeeper: game.gatekeeper,
                input0: input0,
                input1: input1,
                output: output,
                coach: owner,
            },
            signers: [],
            instructions: [],
        }
    );

    return getGameAccount(stProvider, game.game, true);
}

export const loadRequirements = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    mint: web3.PublicKey,
    params: LoadRequirementsParams,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const owner = stProvider.provider.wallet.publicKey;

    const itemVault = await helpers.getAssociatedTokenAddress(mint, game.gatekeeper, true);
    
    await stProvider.program.rpc.loadRequirements(
        params,
        {
            accounts: {
                game: game.game,
                gatekeeper: game.gatekeeper,
                itemVault: itemVault,
                coach: owner,
            },
            signers: [],
            instructions: [],
        }
    );

    return getGameAccount(stProvider, game.game, true);
}

export const startStopCountdown = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    params: StartStopCountdownParams,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const owner = stProvider.provider.wallet.publicKey;
    
    await stProvider.program.rpc.startStopCountdown(
        params,
        {
            accounts: {
                game: game.game,
                coach: owner,
            },
            signers: [],
            instructions: [],
        }
    );

    return getGameAccount(stProvider, game.game, true);
}

export const supernova = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    mint: web3.PublicKey,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const owner = stProvider.provider.wallet.publicKey;

    const itemVault = await helpers.getAssociatedTokenAddress(mint, game.gatekeeper, true);
    
    await stProvider.program.rpc.supernova(
        {
            accounts: {
                game: game.game,
                gatekeeper: game.gatekeeper,
                itemVault: itemVault,
                itemMint: mint,
                coach: owner,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
            },
            signers: [],
            instructions: [],
        }
    );

    return getGameAccount(stProvider, game.game, true);
}

export const createPlayerAccount = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    params: CreatePlayerParams,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const player = stProvider.provider.wallet.publicKey;

    const [ playerAccount, bump ] = await findPlayerAccount(
        stProvider,
        game,
        player
    );

    params.bump = bump;

    const { vault, shouldCreate } = await helpers.getAssociatedTokenAddressAndShouldCreate(
        stProvider.provider,
        game.replayTokenMint,
        player,
    );

    await stProvider.program.rpc.createPlayerAccount(
        params,
        {
            accounts: {
                playerAccount: playerAccount,
                game: game.game,
                player: player,
                playerReplayVault: vault,
                gatekeeper: game.gatekeeper,
                systemProgram: web3.SystemProgram.programId,
            },
            signers: [],
            instructions: [
                ...(shouldCreate) ? [
                    spl.Token.createAssociatedTokenAccountInstruction(
                        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                        spl.TOKEN_PROGRAM_ID,
                        game.replayTokenMint,
                        vault,
                        player,
                        player,
                    ) 
                ] : []
            ],
        }
    );

    return getPlayerAccount(stProvider, playerAccount, true);
}

export const startSpeedrun = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    playerAccountKey: web3.PublicKey | PlayerAccount,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const playerAccount = await getPlayerAccount(stProvider, playerAccountKey);
    const player = stProvider.provider.wallet.publicKey;

    await stProvider.program.rpc.startSpeedrun(
        {
            accounts: {
                game: game.game,
                playerAccount: playerAccount.playerAccount,
                playerReplayVault: playerAccount.playerReplayVault,
                player: player,
            },
            signers: [],
            instructions: [],
        }
    );

    return getPlayerAccount(stProvider, playerAccount, true);
}

export const hashItem = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    playerAccountKey: web3.PublicKey | PlayerAccount,
    mint: web3.PublicKey,
    params: HashItemParams,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const playerAccount = await getPlayerAccount(stProvider, playerAccountKey);
    const player = stProvider.provider.wallet.publicKey;

    const gameItemAccount = await helpers.getAssociatedTokenAddress(mint, game.gatekeeper, true);

    const tx = new web3.Transaction();

    tx.add(
        stProvider.program.instruction.hashItem(
            {
                accounts: {
                    game: game.game,
                    playerAccount: playerAccount.playerAccount,
                    gatekeeper: game.gatekeeper,
                    gameItemAccount: gameItemAccount,
                    playerReplayVault: playerAccount.playerReplayVault,
                    player: player,
                },
                signers: [],
                instructions: [],
            } 
        )
    );

    if(game.supernovaDate.toNumber() <= dateToUnix()){
        const gameVault = await helpers.getAssociatedTokenAddress(mint, game.gatekeeper, true);
        const { vault, shouldCreate } = await helpers.getAssociatedTokenAddressAndShouldCreate(
            stProvider.provider,
            mint,
            player,
        );

        tx.add(
            stProvider.program.instruction.mintItem(
                {
                    accounts: {
                        game: game.game,
                        gatekeeper: game.gatekeeper,
                        playerAccount: playerAccount.playerAccount,
                        gameVault: gameVault,
                        playerVault: vault,
                        player: player,
                        coach: game.coach,
                        tokenProgram: spl.TOKEN_PROGRAM_ID,
                    },
                    signers: [],
                    instructions: [
                        ...(shouldCreate) ? [
                            spl.Token.createAssociatedTokenAccountInstruction(
                                spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                                spl.TOKEN_PROGRAM_ID,
                                mint,
                                vault,
                                player,
                                player,
                            ) 
                        ] : []
                    ],
                } 
            )
        );
    }

    await stProvider.provider.send(tx);

    return getPlayerAccount(stProvider, playerAccount, true);
}

export const forgeItem = async (
    stProvider: STProvider,
    stKey: web3.PublicKey | GameAccount,
    playerAccountKey: web3.PublicKey | PlayerAccount,
    mintI0: web3.PublicKey,
    mintI1: web3.PublicKey,
    mintO: web3.PublicKey,
    params: any,
) => {
    const game = await getGameAccount(stProvider, stKey);
    const playerAccount = await getPlayerAccount(stProvider, playerAccountKey);
    const player = stProvider.provider.wallet.publicKey;

    const input0Vault = await helpers.getAssociatedTokenAddress(mintI0, game.gatekeeper, true);
    const input1Vault = await helpers.getAssociatedTokenAddress(mintI1, game.gatekeeper, true);
    const outputVault = await helpers.getAssociatedTokenAddress(mintO, game.gatekeeper, true);

    const playerInput0Vault = await helpers.getAssociatedTokenAddress(mintI0, player);
    const playerInput1Vault = await helpers.getAssociatedTokenAddress(mintI1, player);
    const playerOutputVault = await helpers.getAssociatedTokenAddress(mintO, player);

    await stProvider.program.rpc.forgeItem(
        {
            accounts: {
                game: game.game,
                gatekeeper: game.gatekeeper,
                playerAccount: playerAccount.playerAccount,
                input0Vault: input0Vault,
                input1Vault: input1Vault,
                outputVault: outputVault,
                playerInput0Vault: playerInput0Vault,
                playerInput1Vault: playerInput1Vault,
                playerOutputVault: playerOutputVault,
                player: player,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
            },
            signers: [],
            instructions: [],
        }
    );

    return getPlayerAccount(stProvider, playerAccount, true);
}

// --------- HELPERS -------------------------------------------

export const dateToUnix = (date?: Date) => {
    return ( date ) ? 
        (Math.trunc(date.getTime() / 1000)) :
        (Math.trunc(Date.now() / 1000));
}

