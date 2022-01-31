// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/

const anchor = require('@project-serum/anchor');
const serumCmn = require("@project-serum/common");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { SystemProgram } = anchor.web3;

// Keys
const mapHolderKP = require('./hunter.json');

const secretArray = Object.values(mapHolderKP._keypair.secretKey);
const secret = new Uint8Array(secretArray);
const mapHolder = anchor.web3.Keypair.fromSecretKey(secret);

const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';

const mapMint = '3C8pWGsvZsxSxNduMVhRXW5fs9he8ydb8LXWu3V1731g';
const mapVault = 'CeMWCN6zYPEL8wbfxqrgsLHa1DzNeAdq1j3wJKvU7PuL';

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
  1, // Map
  2, // Broken Key
  3, // Key 0
  4, // Key 1
  5, // Key 2
  6, // Chest
  7, // Real Treasure
  8, // Actual Treasure
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
    VECSIZE + (8          * amounts.length) +
    VECSIZE + (PUBKEYSIZE * amounts.length) +
    VECSIZE + (8          * amounts.length) +
    // finders
    VECSIZE + (PUBKEYSIZE * amounts[mintIndexes[REALTREASURE]]) +
    // luckies
    VECSIZE + (PUBKEYSIZE * amounts[mintIndexes[ACTUALTREASURE]]);
}

const getMapSize = () => {
  return 0 +
    // map
    PUBKEYSIZE + 
    // holder
    PUBKEYSIZE +
    // treasure counts
    VECSIZE + (PUBKEYSIZE * amounts.length);
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

  receiver = await serumCmn.createTokenAccount(
    coach,
    mints[0],
    coach.wallet.publicKey
  );

  console.log(receiver);


  receiver = await serumCmn.createTokenAccount(
    coach,
    mints[0],
    coach.wallet.publicKey
  );

  console.log(receiver);

  receiver = await serumCmn.createTokenAccount(
    coach,
    mints[0],
    coach.wallet.publicKey
  );

  console.log(receiver);


  console.log(
    "Account opening cost: [", 
    lamportsToSol(await coach.connection.getMinimumBalanceForRentExemption(getTreasureSize())).toFixed(5),
     "]"
  );

  // Build Chest
  let buildTx = await program.rpc.buildChest(
    new anchor.BN(amounts[mintIndexes[REALTREASURE]]),
    new anchor.BN(lamportsToSol(amounts[mintIndexes[ACTUALTREASURE]])),
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
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [chestVaults[index], coach.wallet.Keypair],
      instructions: [
        ...(await serumCmn.createTokenAccountInstrs(coach, chestVaults[index].publicKey, mints[index], gatekeeper)),
      ],
    });

    console.log(`Fill [${index}]: `, fillTx);
  }

    

  lockTx = await program.rpc.lockChest(
    {
    accounts: {
      treasureChest: treasureChest.publicKey, //Main Account
      coach: coach.wallet.publicKey,
    },
    signers: [coach.wallet.Keypair],
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

  const treasureChestAccount = await program.account.treasureChest.fetch(treasureChest.publicKey);
  console.log(treasureChestAccount);

  // // getMapSize
  // let map = anchor.web3.Keypair.generate();
  // let holderMapVault = anchor.web3.Keypair.generate();

  // // Create a Map Holder
  // let findMapTx = await program.rpc.findMap({
  //   accounts: {
  //     map: map.publicKey,
  //     treasureChest: treasureChestAccount, //Just need Public Key
  //     gatekeeper: treasureChestAccount.gatekeeper,

  //     chestMapVault: treasureChestAccount.vaults[mintIndexes[MAP]],
  //     mapVault: holderMapVault.publicKey,

  //     holder: mapHolder.publicKey,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //   },
  //   signers: [chestVaults[index], coach.wallet.Keypair],
  //   instructions: [
  //     await program.account.map.createInstruction(map, getMapSize()),
  //     ...(await serumCmn.createTokenAccountInstrs(coach, holderMapVault.publicKey, mints[mintIndexes[MAP]], mapHolder.publicKey)),
  //   ],
  // });

  // console.log(`Map `, findMapTx);

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
