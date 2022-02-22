// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/

const anchor = require('@project-serum/anchor');
const serumCmn = require("@project-serum/common");
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token } = require("@solana/spl-token");
const { SystemProgram } = anchor.web3;

const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';


// SOLANA HELPERS
const findAssociatedTokenAddress = (wallet, mint) => {
  return new Promise((resolve, reject) => {
    anchor.web3.PublicKey.findProgramAddress(
      [
          wallet.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    ).then((keyList) => {
      resolve(keyList[0]);
    })
    .catch((error)=>{
      reject(error);
    });
  });
}

// interface Signer {
//   publicKey: PublicKey;
//   secretKey: Uint8Array;
// }
const createSPL = async (provider) => {
  return await Token.createMint(
    provider.connection,
    {
      publicKey: provider.wallet.publicKey,
      secretKey: provider.wallet.payer.secretKey,
    },
    provider.wallet.publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID,
  );
}



const getTokenFromMint = async (provider, mint) => {
  return token = new Token(
    provider.connection,
    mint,
    TOKEN_PROGRAM_ID,
    {
      publicKey: provider.wallet.publicKey,
      secretKey: provider.wallet.payer.secretKey,
    },
  );
}

const getTokenInfo = async(provider, mint, owner) => {
  let token = await getTokenFromMint(provider, mint);
  console.log(owner);
  let account = await token.getOrCreateAssociatedAccountInfo(owner ?? provider.wallet.publicKey);

  return {
    mint: account.mint,
    vault: account.address,
    amount: account.amount,
  };
}

const createTestAsset = async (provider, amount) => {
  let token = await createSPL(provider);

  let tokenAccount = await token.getOrCreateAssociatedAccountInfo(provider.wallet.publicKey);
  let tx = await token.mintTo(
    tokenAccount.address,
    provider.wallet.publicKey,
    [],
    amount
  );
  
  return {
    mint: token.publicKey,
    vault: tokenAccount.address,
    amount: tokenAccount.amount,
  };
}

const createTestAssets = async(provider, assetCount, assetAmount) => {
  let assets = [];

  for(var i = 0; i < assetCount; i++){
    assets.push(await createTestAsset(provider, assetAmount))
  }

  return assets;
}

const airdrop = async (pubkey) => {
  try {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    const myAddress = new anchor.web3.PublicKey("2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM");
    const signature = await connection.requestAirdrop(pubkey, anchor.web3.LAMPORTS_PER_SOL * 2);
    await connection.confirmTransaction(signature);
  } catch (_){}

}

const getRent = async(provider, size) => {
  return (await provider.connection.getMinimumBalanceForRentExemption(size)) / anchor.web3.LAMPORTS_PER_SOL;
}

// GAME-ACCOUNT
const getGameSize = () => {
  // return 10485760;
  return 10000;
}

const getGameAccount = (program, gameKey) => {
  return program.account.game.fetch(gameKey);
}

const createGame = async (provider, program, gamePair) => {
  console.log("Creating Game...");

  console.log("[1/3] Creating Game Key");
  const game = gamePair ?? anchor.web3.Keypair.generate();

  console.log("[2/3] Getting Gatekeeper");
  let [gatekeeper, nonce] = await anchor.web3.PublicKey.findProgramAddress(
    [game.publicKey.toBuffer()],
    program.programId
  );

  console.log("[3/3] Spinning Up Game");
  let gameSize = getGameSize();
  let creationCost = await getRent(provider, gameSize);

  let createTX = await program.rpc.createGame(
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
        await program.account.game.createInstruction(game, gameSize),
      ],
    }
  );

  console.log("Done.\n");

  return {
    type: "Game",
    account: await getGameAccount(program, game.publicKey),
    cost: creationCost,
    tx: createTX,
  }
}

// LOAD ASSETS
const loadAssets = async (provider, program, gameInfo, mint, gameType, codes, isWrongAnswerItem, percentage, amount, maxAmount, amountTX, cost) => {
  console.log("Loading Assets...");

  console.log("[1/3] Getting Token Account");
  let assetInfo = await getTokenInfo(provider, mint);

  console.log("[2/3] Creating Game Vault");
  let assetGameVault = await findAssociatedTokenAddress(
    gameInfo.account.gatekeeper,
    assetInfo.mint, 
  );

  console.log(assetInfo.mint);
  console.log(assetGameVault);
  console.log(gameInfo.account.gatekeeper);
  console.log(provider.wallet.publicKey);

  console.log("[3/3] Loading Asset");
  let createTX = await program.rpc.loadAssets(
    gameType ?? 0,
    codes ?? 0x00000000,
    isWrongAnswerItem ?? false,
    percentage ?? 0,
    amount ?? 1,
    maxAmount ?? 1,
    new anchor.BN(amountTX) ?? new anchor.BN(assetInfo.amount),
    new anchor.BN(cost) ?? new anchor.BN(Math.round(anchor.web3.LAMPORTS_PER_SOL * 0.05)),
    {
      accounts: {
        game: gameInfo.account.game,
        gatekeeper: gameInfo.account.gatekeeper,

        coachVault: assetInfo.vault,
        gameVault: assetGameVault,

        coach: gameInfo.account.coach,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [provider.wallet.Keypair],
      instructions: [
        // ...(await serumCmn.createTokenAccountInstrs(provider, assetGameVault, assetInfo.mint, gameInfo.account.gatekeeper)),
        (await Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          assetInfo.mint, 
          assetGameVault,
          gameInfo.account.gatekeeper,
          provider.wallet.publicKey
        )),
      ],
    }

  );

  console.log("Done.\n");

  return {
    type: "Load Assets",
    tx: createTX,
  }
}

// PLAYER-ACCOUNT
const getGamePlayerSize = () => {
  return 10000;
}

const getPlayerAccount = (program, playerAccountKey) => {
  return program.account.gamePlayer.fetch(playerAccountKey);
}

const createGamePlayer = async (provider, program, gameInfo) => {
  console.log("Creating Game Player...");

  console.log("[1/3] Getting Player Keypair");
  const player = provider.wallet.payer;

  console.log("[2/3] Getting Player Account");
  let [playerAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
    [player.publicKey.toBuffer()],
    program.programId
  );

  console.log("[3/3] Spawning Player");
  let playerSize = getGamePlayerSize();
  let creationCost = await getRent(provider, playerSize);


  let createTX = await program.rpc.createGamePlayer(
    bump,
    {
      accounts: {
        player: player.publicKey,
        playerAccount: playerAccount,

        game: gameInfo.account.game,
        coach: gameInfo.account.coach,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    }
  );

  console.log("Done.\n");

  return {
    type: "Player",
    account: await getPlayerAccount(program, playerAccount),
    cost: creationCost,
    tx: createTX,
  }
}


// MAIN
const main = async() => {
  console.log("🚀 Starting test...\n\n")

  // ------------- STEP 0 = INIT PROVIDER -------------------
  // Grabbing anchor info
  const coach = anchor.Provider.env();
  anchor.setProvider(coach);
  const program = anchor.workspace.Soltreasure;

  // ------------- STEP 1 = CREATE GAME -------------------
  let testGameKeypair = anchor.web3.Keypair.generate();

  // Create the Game  
  let gameInfo = await createGame(coach, program, testGameKeypair);

  // Try to build a duplicate game
  try {
    await createGame(coach, program, testGameKeypair); //Should fail
  } catch (e) {
    console.log("Bad Game: PASSED\n");
  }

  // ------------- STEP 2 = CREATE LOAD ASSETS -------------------
  let assets = await createTestAssets(coach, 9, 100000);
  let assetTX = [];
  for(var i = 0; i < assets.length; i++){
    console.log(assets[i]);
    assetTX.push(await loadAssets(coach, program, gameInfo, assets[i].mint));
  }

  // ------------- STEP X = CREATE GAME PLAYER -------------------
  let playerInfo = await createGamePlayer(coach, program, gameInfo);
  console.log(playerInfo);

  // Try to build a duplicate player
  try {
    let badPlayer = await createGamePlayer(coach, program, gameInfo);
    console.log(badPlayer);
  } catch (e) {
    console.log("Bad Player: PASSED\n");
  }

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
