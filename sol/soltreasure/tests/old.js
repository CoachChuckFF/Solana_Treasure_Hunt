// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/

const anchor = require('@project-serum/anchor');
const serumCmn = require("@project-serum/common");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { SystemProgram } = anchor.web3;
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new anchor.web3.PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);


// Keys
const playerKP = require('./hunter.json');

const secretArray = Object.values(playerKP._keypair.secretKey);
const secret = new Uint8Array(secretArray);
const playerSecret = anchor.web3.Keypair.fromSecretKey(secret);

const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';

const badMint = 'HYBRCvzBnQJmypAD1Se3ptu9EqFTE6USoXieqqf3hzFL';

const mapMint = 'En8Q8mwd2nKJewEaZUdoGkq1NzDrqYYZcmHCRABfugE4';
const mapVault = '3B1UNSJ94hZzGsWb961NhMfh5wa3zQd1yNg6ouY5zqc3';

const brokenKeyMint = 'DzKrhc5B4w999J1KYJ1ahtNepPmDEm4CMhn8wNZdKbac';
const brokenKeyVault = 'DYDHGM6N4D4wjS8GZrYwcJfuWkpywbzW3aiw2bmVPUt6';

const key0Mint = '3VPzVcZu3ng2vdS1iviQqMqxzZg9p2GwBYgc27vvQwNB';
const key0Vault = '473bD9Hm3n8iCuzqDuPLCHDX7nkGM8M4u8a3qj5C2zKe';

const key1Mint = 'ASp2WTzB3V76nRK3oJ45F56yk4yWPFn2ojiZtduvRQoQ';
const key1Vault = '3GPqaiXizL41Qqka5ZC1Pbvm5ZvrwWmrb1JQNL7avmeF';

const key2Mint = '3odMrWHw2YAE2YzBWzxwK1576JcRopxsxrBn5jxowjBb';
const key2Vault = '5cLBgvxMKuVKrcVeEkeAQNVbGUm8heX3tXQcacnxGHgF';

const chestMint = '2nL47jjS7PcS5H8SfvXrC1xuNcruEnFpeoxxgB9ZniNh';
const chestVault = 'DNNJnwgnA4DxZ2WSvnmbS7ns6U2fj43aGM12nejZdEHQ';

const realTreasureMint = 'Gk62SgoiCFcwL2rgm6pw6ksJiPPb136Qu2PysPPK3Hqp';
const realTreasureVault = '7jGTeNWzwvXgCdmAs9B5mNfrNqhGgpyVEV4jdQcweWZg';

const actualTreasureMint = 'EH36P92j5XFYFGa78my9tkARMFLttrKz5hWsuGs3EDrd';
const actualTreasureVault = 'HMfmbunX3CxjD2GipftMvTVV9xTrX2v87Ez1CuML4zut';

const tokenMintStrings = [
  mapMint, brokenKeyMint, key0Mint, key1Mint,
  key2Mint, chestMint, realTreasureMint, actualTreasureMint
];

const coachVaultStrings = [
  mapVault, brokenKeyVault, key0Vault, key1Vault,
  key2Vault, chestVault, realTreasureVault, actualTreasureVault
];

// Helpers
const LAMPORT_COST = 0.000000001
const numFromRust = (num) => 
{
  return num.toNumber();
}
const numToRust = (num) => 
{
  return new anchor.BN(Math.round(num));
}

const solTolamports = (sol) => {
  return Math.round(sol / LAMPORT_COST);
}

const lamportsToSol = (lamports) => {
  return lamports * LAMPORT_COST;
}

const getUnixTimeStamp = (hours) => {
  return new anchor.BN(Math.floor(new Date.now().getTime() / 1000) + (hours * 60))
}

// Settings
const MAP = "map";
const BROKENKEY = "brokenKey";
const KEY0 = "key0";
const KEY1 = "key1";
const KEY2 = "key2";
const CHEST = "chest";
const REALTREASURE = "realTreasure";
const ACTUALTREASURE = "actualTreasure";
// THESE HAVE TO MATCH |
const mintIndexes = {
  map: 0,
  brokenKey: 1,
  key0: 2,
  key1: 3,
  key2: 4,
  chest: 5,
  realTreasure: 6,
  actualTreasure: 7,
}

const amounts = [
  100, // Map
  100, // Broken Key
  100, // Key 0
  100, // Key 1
  100, // Key 2
  100, // Chest
  100, // Real Treasure
  100, // Actual Treasure
];

const costs = [
  solTolamports(0.00), // Map
  solTolamports(0.02), // Broken Key
  solTolamports(0.03), // Key 0
  solTolamports(0.05), // Key 1
  solTolamports(0.08), // Key 2
  solTolamports(0.00), // Chest
  solTolamports(0.00), // Real Treasure
  solTolamports(0.00), // Actual Treasure
];

const VECSIZE = 4;
const PUBKEYSIZE = 32;
const getTreasureSize = () => {
  return 0 +
    // nonce
    1 + 
    // coach
    PUBKEYSIZE + 
    // lamports
    8 + 
    // treasure counts
    8 + 8 +
    // bomb
    8 + 
    // vaults
    VECSIZE + (1          * amounts.length) +
    VECSIZE + (8          * amounts.length) +
    VECSIZE + (PUBKEYSIZE * amounts.length) +
    VECSIZE + (8          * amounts.length) +
    // finders
    VECSIZE + (PUBKEYSIZE * amounts[mintIndexes[REALTREASURE]]) +
    // luckies
    VECSIZE + (PUBKEYSIZE * amounts[mintIndexes[ACTUALTREASURE]]);
}



const getProvider = async (keyPair) => {
  try {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    const myAddress = new anchor.web3.PublicKey("2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM");
    const signature = await connection.requestAirdrop(pubkey, anchor.web3.LAMPORTS_PER_SOL * 2);
    await connection.confirmTransaction(signature);
  } catch (_){}

}

// const getProvider = (secret) => {
//   const connection = new anchor.Connection(
//     anchor.web3.clusterApiUrl('mainnet-beta'), 
//     "processed"
//   );
//   const provider = new anchor.Provider(
//     connection, 
//     playerSecret.toBuffer(),
//     "processed",
//   );
//   return provider;
// }

const findAssociatedTokenAddress = (wallet, mint) => {
  return new Promise((resolve, reject) => {
    anchor.web3.PublicKey.findProgramAddress(
      [
          wallet.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    ).then((keyList) => {
      resolve(keyList[0]);
    })
    .catch((error)=>{
      reject(error);
    });
  });
}

const createKeypairArray = (amount) => {
  let keys = [];
  for (let i = 0; i < amount; i++) {
    keys[i] = anchor.web3.Keypair.generate();
  }
  return keys;
}

const stringsToPubkeys = (keys) => {
  let pubKeys = [];
  for (let i = 0; i < keys.length; i++) {
    pubKeys[i] = new anchor.web3.PublicKey(keys[i]);
  }
  return pubKeys;
}

const main = async() => {
  console.log("🚀 Starting test...")

  const coach = anchor.Provider.env();
  anchor.setProvider(coach);

  const program = anchor.workspace.Soltreasure;

  const mints = stringsToPubkeys(tokenMintStrings);
  const coachVaults = stringsToPubkeys(coachVaultStrings);

  const treasureChest = anchor.web3.Keypair.generate();
  const chestVaults = createKeypairArray(mints.length);
  
  let gatekeeper = null;
  let [_gatekeeper, nonce] = await anchor.web3.PublicKey.findProgramAddress(
    [treasureChest.publicKey.toBuffer()],
    program.programId
  );
  gatekeeper = _gatekeeper;

  console.log("Gatekeeper Address ", gatekeeper.toString());
  console.log("Chest Address ", treasureChest.publicKey.toString());

  //Airdropping
  airdrop(coach.wallet.publicKey);

  console.log(
    "Account opening cost: [", 
    lamportsToSol(await coach.connection.getMinimumBalanceForRentExemption(getTreasureSize())).toFixed(5),
     "]"
  );

  // Build Chest
  let buildTx = await program.rpc.buildChest(
    new anchor.BN(lamportsToSol(amounts[mintIndexes[REALTREASURE]])),
    new anchor.BN(lamportsToSol(amounts[mintIndexes[ACTUALTREASURE]])),
    getUnixTimeStamp(2), //Now + 2 Hours
    nonce,
    {
      accounts: {
        treasureChest: treasureChest.publicKey,
        gatekeeper: gatekeeper,

        coach: coach.wallet.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [treasureChest, coach.wallet.Keypair],
      instructions: [
        await program.account.treasureChest.createInstruction(treasureChest, getTreasureSize()),
      ],
    }
  );

  console.log("Build: ", buildTx);
  let treasureChestAccount = await program.account.treasureChest.fetch(treasureChest.publicKey);
  console.log("Bomb: ", treasureChestAccount.bomb.toNumber());
  

  // Fill Chest
  for(var i = 0; i < amounts.length; i++){
    // let index = amounts.length - i - 1; // Fill in reverse order
    let index = i;

    let fillTx = await program.rpc.fillChest(
      new anchor.BN(costs[index]),
      new anchor.BN(amounts[index]),
      {
      accounts: {
        treasureChest: treasureChest.publicKey, //Main Account
        gatekeeper: gatekeeper,
  
        coachVault: coachVaults[index],
  
        chestVault: chestVaults[index].publicKey,
  
        coach: coach.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [chestVaults[index], coach.wallet.Keypair],
      instructions: [
        ...(await serumCmn.createTokenAccountInstrs(coach, chestVaults[index].publicKey, mints[index], gatekeeper)),
      ],
    });

    treasureChestAccount = await program.account.treasureChest.fetch(treasureChest.publicKey);

    console.log(`Token Account [${index}]: `, treasureChestAccount.vaults[i].toString());
    console.log(`Token Mint [${index}]: `, treasureChestAccount.mints[i].toString());
    console.log('');
  }

    

  lockTx = await program.rpc.lockChest(
    {
    accounts: {
      treasureChest: treasureChest.publicKey, //Main Account
      coach: coach.wallet.publicKey,
    },
  });

  console.log(`Lock `, lockTx);

  // try {
  //   testLock = await program.rpc.lockChest(
  //     {
  //     accounts: {
  //       treasureChest: treasureChest.publicKey, //Main Account
  //       coach: coach.wallet.publicKey,
  //     },
  //     signers: [coach.wallet.Keypair],
  //   });
  // } catch (error) {
  //   console.log("Good Error ", error)
  // }

  // Setup Player Context
  const playerContextTreasureChest = treasureChest.publicKey;
  treasureChestAccount = await program.account.treasureChest.fetch(playerContextTreasureChest);

  console.log(treasureChestAccount);
  treasureChestAccount.mints.forEach((mint)=>{
    console.log(mint.toString());
  });

  const player = coach; // this is phantom

  const playerMapVault = await findAssociatedTokenAddress(
    player.wallet.publicKey,
    treasureChestAccount.mints[0]
  );

  console.log(playerMapVault.toString());

  let createAccountInstruction = [];

  try {
    console.log("Already has account");
    playerMapVaultAccount = await serumCmn.getTokenAccount(
      player,
      playerMapVault
    );
  } catch (error) {
    console.log("Should create account ", error);
    createAccountInstruction = await serumCmn.createTokenAccountInstrs(
      player, 
      playerMapVault, 
      treasureChestAccount.mints[mintIndexes[MAP]], 
      player.wallet.publicKey
    );
  }

  console.log(playerMapVaultAccount);

  // Create a Map Holder
  let findMapTx = await program.rpc.findMap({
    accounts: {
      treasureChest: playerContextTreasureChest, //Just need Public Key
      gatekeeper: treasureChestAccount.gatekeeper,

      chestMapVault: treasureChestAccount.vaults[mintIndexes[MAP]],
      playerMapVault: playerMapVault,

      player: player.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    },
    signers: [player.wallet.Keypair],
    instructions: [
      ...createAccountInstruction
    ],
  });

  console.log(`Map `, findMapTx);

  // TICK TICK BOOM
  treasureChestAccount = await program.account.treasureChest.fetch(treasureChest.publicKey);
  for(var i = 0; i < amounts.length; i++){
    // let index = amounts.length - i - 1; // Fill in reverse order
    let index = i;
    console.log(`Boom Account [${index}]: `, treasureChestAccount.vaults[i].toString());
    console.log(`Boom Mint [${index}]: `, treasureChestAccount.mints[i].toString());
    console.log('');


    let boom = await program.rpc.tickTickBoom({
      accounts: {
        treasureChest: treasureChest.publicKey, //Main Account
        gatekeeper: treasureChestAccount.gatekeeper,
        chestVault: treasureChestAccount.vaults[index],
        mint: treasureChestAccount.mints[index],
        coach: coach.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    treasureChestAccount = await program.account.treasureChest.fetch(treasureChest.publicKey);

    console.log(`Boom Account [${index}]: `, treasureChestAccount.vaults[i].toString());
    console.log(`Boom Mint [${index}]: `, treasureChestAccount.mints[i].toString());
    console.log('');
  }

  treasureChestAccount = await program.account.treasureChest.fetch(treasureChest.publicKey);
  console.log(treasureChestAccount);

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
// console.log(getTreasureSize());
// console.log(VECSIZE + (PUBKEYSIZE * amounts[mintIndexes[REALTREASURE]]));
// // console.log(mintIndexes.keys().length);
// // console.log(mintIndexes.keys().length);
// // m1.size
// // console.log(amounts[mintIndexes[REALTREASURE]]);
