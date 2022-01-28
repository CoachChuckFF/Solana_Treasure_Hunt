// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/

const anchor = require('@project-serum/anchor');
const serumCmn = require("@project-serum/common");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { SystemProgram } = anchor.web3;

const hunterKP = require('./hunter.json');

const secretArray = Object.values(hunterKP._keypair.secretKey);
const secret = new Uint8Array(secretArray);
const hunter = anchor.web3.Keypair.fromSecretKey(secret);

// Wallet: HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB
// Token: 8DWGZBLd3eCw73mEiFqdxfJFiDVwh7mo6Rcu4Kzx6RQR
// Account: jkwfpHCGwErBMLqttT8QVZahFJD5bi8qFnsV3ddvZaA

// New Token: 99BCKjZJZ8ntffwWmrnGfN9DFEBLJwRPsszbYtd1ZNvB
// New Account: FpWn6R3eYVCN28CKh1hTKfYSWhS9cM8Z6rnUnSKLMEJs

const main = async() => {
  console.log("🚀 Starting test...")

    // const [_mint, _god] = await serumCmn.createMintAndVault(
    //   program.provider,
    //   new anchor.BN(1000000)
    // );

  const coach = anchor.Provider.env();
  anchor.setProvider(coach);

  const program = anchor.workspace.Soltreasure;
  let tokenWallet = new anchor.web3.PublicKey("FpWn6R3eYVCN28CKh1hTKfYSWhS9cM8Z6rnUnSKLMEJs");
  console.log(tokenWallet.toString());

  let tokenAccount = await serumCmn.getTokenAccount(program.provider, tokenWallet);
  
  let amount = tokenAccount.amount;
  let address = tokenAccount.address;
  let owner = tokenAccount.owner;
  console.log(lamportsToSol(amount.toNumber()));
  console.log(address);
  console.log(owner.toString());

  // const barista = anchor.Provider.env();
  // barista; //for now the barista will buy their own coffee
  // anchor.setProvider(barista);

  // const program = anchor.workspace.Buymeasolcoffee;
  // const coffeeJar = anchor.web3.Keypair.generate();

  // console.log("☕ Brewing Coffee...")
  // let foundingTx = await program.rpc.startCoffeeJar({
  //   accounts: {
  //     coffeeJar: coffeeJar.publicKey,                //Web  keypair
  //     barista: barista.wallet.publicKey,             //User keypair
  //     systemProgram: SystemProgram.programId,
  //   },
  //   signers: [coffeeJar], //even though the barista is the payer, the coffeejar needs to sign this
  // });

  // console.log("💲 Buying 0.1 Coffee...");
  // let buyingTx = await program.rpc.buyCoffee(
  //   numToRust(solTolamports(0.1)),
  //   {
  //     accounts: {
  //       coffeeJar: coffeeJar.publicKey,
  //       from: coffeeBuyer.publicKey,
  //       to: barista.wallet.publicKey,
  //       systemProgram: SystemProgram.programId,
  //     },
  //     signers: [coffeeBuyer]
  //   }
  // );

  // console.log("🧮 Tabulating Info...");
  // let coffeeJarAccount = await program.account.coffeeJar.fetch(coffeeJar.publicKey);
  
  // console.log("\n---- 📝 Coffee Jar Info -----");
  // console.log(`--- Founding TX   : [${foundingTx}]`);
  // console.log(`--- Buying TX     : [${buyingTx}]`);
  // console.log(`--- Barista Key   : [${coffeeJarAccount.barista}]`);
  // console.log(`--- Buyer Key     : [${coffeeBuyer.publicKey}]`);
  // console.log(`--- Coffee Count  : [${coffeeJarAccount.coffeeCount}]`);
  // console.log(`--- Sol Total     : [${lamportsToSol(coffeeJarAccount.lamportCount)}]`);
  // console.log("-----------------------------\n");

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

runMain();