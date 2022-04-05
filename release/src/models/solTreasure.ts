import * as spl from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';
import * as meta from "@metaplex/js";

import { web3, BN } from "@project-serum/anchor";

// --------- DEFINES -----------------------------------------
export const SOL_TREASURE_ID = new anchor.web3.PublicKey("95EjVJVAyCVqAZMydfuGDaWHcEVp1HgcNvoJRUEWrS18");
export interface GameAccount {
    name: string,
    coin: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    gatekeeper: anchor.web3.PublicKey,
    nonce: number,
    tokenMint: anchor.web3.PublicKey,
    percentageFee: number, //1000 == 1%
    maxFlipAmount: anchor.BN,
    coinflipVault: anchor.web3.PublicKey,
    feeTally: anchor.BN,
    playerCount: number,
    flipCount: number,
}

export interface PlayerAccount {
    name: string,
    playerCoin: anchor.web3.PublicKey,
    player: anchor.web3.PublicKey,
    playerAccount: anchor.web3.PublicKey,
    playerNonce: number,
    playerGatekeeper: anchor.web3.PublicKey,
    playerGatekeeperNonce: number,
    playerWinningsVault: anchor.web3.PublicKey,
    flipCount: number,
    wlTally: anchor.BN,
}



// --------- FUNCTIONS -----------------------------------------
export class TreasureProvider {
    provider: anchor.Provider;
    treasureProgram: anchor.Program<anchor.Idl>;
    valid: boolean;

    // Call create
    private constructor(
        provider: anchor.Provider,
        treasureProgram: anchor.Program<anchor.Idl>,
        valid: boolean
    ) {
        this.provider = provider;
        this.treasureProgram = treasureProgram;
        this.valid = valid;
    }

    static create = async (provider: anchor.Provider) => {
        // TODO get IDL
        // return new TreasureProvider(
        //     provider,
        //     await TreasureProvider._getTreasureProgram(provider),
        // );
        return new TreasureProvider(
            provider,
            (null as any),
            true,
        );
    }

    static empty = () => {
        return new TreasureProvider(
            (null as any),
            (null as any),
            false,
        );
    }

    static _getTreasureProgram = (provider: anchor.Provider) => { return _getProgram(provider, SOL_TREASURE_ID); }
       
    async getGameAccount(
        coinKey: anchor.web3.PublicKey | GameAccount,
        shouldUpdate?: boolean,
    ) { 
        if((coinKey as GameAccount).name){
            if( shouldUpdate ){
                return (await this.treasureProgram.account.coin.fetch((coinKey as GameAccount).coin)) as GameAccount; 
            } else {
                return await coinKey as GameAccount;
            }
        }
        return (await this.treasureProgram.account.coin.fetch(coinKey as anchor.web3.PublicKey)) as GameAccount; 
    }

    async findPlayerAccount(
        coinKey: anchor.web3.PublicKey | GameAccount,
    ) {
        const coin = await this.getGameAccount(coinKey);
        return anchor.web3.PublicKey.findProgramAddress(
            [
                this.provider.wallet.publicKey.toBuffer(),
                coin.coin.toBuffer(),
            ],
            this.treasureProgram.programId,
        );
    }

    async getPlayerAccount(
        playerKey: anchor.web3.PublicKey | PlayerAccount,
        shouldUpdate?: boolean,
    ) { 
        if((playerKey as PlayerAccount).name){
            if( shouldUpdate ){
                return (await this.treasureProgram.account.player.fetch((playerKey as PlayerAccount).player)) as PlayerAccount; 
            } else {
                return await playerKey as PlayerAccount;
            }
        }
        return (await this.treasureProgram.account.player.fetch(playerKey as anchor.web3.PublicKey)) as PlayerAccount; 
    }
}

// --------- HELPER FUNCTIONS -----------------------------------------
const _percentageToSolana = (percent: number) => {
  return percent * 100 * 1000;
}

const _dateToSolanaDate = (date: Date) => {
    return new anchor.BN(Math.floor(date.getTime() / 1000));
}

const _getProvider = async (provider: anchor.Provider, programID: anchor.web3.PublicKey) => {
    const idl = await anchor.Program.fetchIdl(programID, provider);
    return new anchor.Program<anchor.Idl>(idl as any, programID, provider);
}

const _getProgram = async (provider: anchor.Provider, programID: anchor.web3.PublicKey) => {
    const idl = await anchor.Program.fetchIdl(programID, provider);
    return new anchor.Program<anchor.Idl>(idl as any, programID, provider);
}

const _getSPLAccount = async (provider: anchor.Provider, mint: anchor.web3.PublicKey, vault: anchor.web3.PublicKey) => {
    return new spl.Token(provider.connection, mint, spl.TOKEN_PROGRAM_ID, anchor.web3.Keypair.generate()).getAccountInfo(vault);
}

const _getAssociatedTokenAddress = async (mint: anchor.web3.PublicKey, owner: anchor.web3.PublicKey, allowOffCurve?: boolean) => {
    return spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        mint,
        owner,
        allowOffCurve
    );
}

const _getAssociatedTokenAddressAndShouldCreate = async (provider: anchor.Provider, mint: anchor.web3.PublicKey, owner: anchor.web3.PublicKey, allowOffCurve?: boolean) => {
    let vault = await _getAssociatedTokenAddress( mint, owner, allowOffCurve );
    let shouldCreate = false;
    try {
        await _getSPLAccount(provider, mint, vault);
    } catch (e) {
        shouldCreate = true;
    }

    return {vault, shouldCreate};
}

const _getCreateAssociatedTokenAddressInstructions = (
    mint: anchor.web3.PublicKey,
    vault: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    payer: anchor.web3.PublicKey,
    shouldCreate?: boolean
) => {
    return (shouldCreate ?? true) ? [
        spl.Token.createAssociatedTokenAccountInstruction(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            mint, 
            vault,
            owner,
            payer
        )
    ] : [];
}

const _getCreateSPLTokenAccountInstrcutions = async (
  provider: anchor.Provider,
  mint: anchor.web3.PublicKey,
  vault: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  payer: anchor.web3.PublicKey,
  shouldCreate?: boolean
) => {
  return (shouldCreate ?? true) ? [
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: vault,
      lamports: await spl.Token.getMinBalanceRentForExemptAccount(provider.connection),
      space: spl.AccountLayout.span,
      programId: spl.TOKEN_PROGRAM_ID
    }),
    spl.Token.createInitAccountInstruction(
        spl.TOKEN_PROGRAM_ID,
        mint,
        vault,
        owner,
    )
  ] : [];
}
