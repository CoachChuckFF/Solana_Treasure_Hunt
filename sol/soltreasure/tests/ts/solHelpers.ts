// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/

import * as anchor from "@project-serum/anchor";
import * as metaplex from "@metaplex/js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";

const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';

// SOLANA HELPERS
export const getRent = (provider: anchor.Provider, size: number) => {
    return provider.connection.getMinimumBalanceForRentExemption(size);
}

export const findAssociatedTokenAddress = async (owner: anchor.web3.PublicKey, mint: anchor.web3.PublicKey) => {
    return (await anchor.web3.PublicKey.findProgramAddress(
        [
            owner.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];

  return Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    TOKEN_PROGRAM_ID, 
    mint,
    owner,
  );
}

export const getSPLInfo = async (provider: anchor.Provider, mint: anchor.web3.PublicKey, vault: anchor.web3.PublicKey) => {
    return new Token(provider.connection, mint, TOKEN_PROGRAM_ID, anchor.web3.Keypair.generate()).getAccountInfo(vault);
}

export const createSPL = async (provider: anchor.Provider, amount: number = 100000) => {
    let mint = anchor.web3.Keypair.generate();
    let tx = new anchor.web3.Transaction();
    let owner = provider.wallet.publicKey;
    let vault = await findAssociatedTokenAddress(owner, mint.publicKey);
  
    // Create the Account
    tx.add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: mint.publicKey,
        lamports: await Token.getMinBalanceRentForExemptMint(provider.connection),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID
      })
    );
  
    // Create the Mint
    tx.add(
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID, // Program ID
        mint.publicKey, // Mint
        0, // Decimals
        owner, // Mint Authority
        null, // Freeze Authority
      )
    );
  
    // Create Associated Account
    tx.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        vault, // Associated Account
        owner, // Owner
        owner, // Payer
      )
    );
  
    // Mint
    tx.add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        vault,
        owner,
        [], // Multi-signers
        amount
      )
    );
  
    await provider.send(tx, [mint]);
  
    return await getSPLInfo(provider, mint.publicKey, vault);
}

export const createSFT = async (provider: anchor.Provider, amount: number = 100000, name: string, symbol: string, uri: string, sellerFeeBasisPoints: number = 300) => {

  let tokenInfo = await createSPL(provider, amount);
  let collection = anchor.web3.Keypair.generate();

  let preambleMetadata = {
    recentBlockhash: (await provider.connection.getRecentBlockhash(provider.opts.preflightCommitment)).blockhash,
    nonceInfo: null,
    feePayer: provider.wallet.publicKey,
    signatures: []
  };

  let actualMetadata = {
    metadata: await metaplex.programs.metadata.Metadata.getPDA(tokenInfo.mint),
    metadataData: new metaplex.programs.metadata.DataV2({
      name: name,
      symbol: symbol,
      uri: uri,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
      creators: [
        new metaplex.programs.metadata.Creator({
          address: provider.wallet.publicKey.toString(),
          verified: true,
          share: 100,
        }),
      ],
      collection: new metaplex.programs.metadata.Collection({
        key: collection.publicKey.toString(),
        verified: false,
      }),
      uses: null,
    }),
    updateAuthority: provider.wallet.publicKey,
    mint: tokenInfo.mint,
    mintAuthority: provider.wallet.publicKey,
  }

  let mdtx = new metaplex.programs.metadata.CreateMetadataV2(
    preambleMetadata,
    actualMetadata
  );

  // TODO - verify collection

  // TODO - upload to Arweave

  // TODO - Disable mint

  let mdRes = await provider.send(mdtx, []);

  return actualMetadata;

}