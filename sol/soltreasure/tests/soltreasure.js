const anchor = require('@project-serum/anchor');
const { SystemProgram } = require('@solana/web3.js');
const kp = require('./keypair.json');

const secretArray = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(secretArray);
const treasureChest = anchor.web3.Keypair.fromSecretKey(secret);

const main = async() => {
  console.log("🚀 Starting test...")

  //Create and set the provider. We set it 
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Soltreasure;

  // Create an account keypair for our program to use
  // const baseAccount = anchor.web3.Keypair.generate();
  // await testBuildSpace(program, baseAccount, provider);

  // const testChest = anchor.web3.Keypair.generate();

  // let tx = await program.rpc.lockChest(
  //   numToRust(21), 
  //   numToRust(34), 
  //   numToRust(55), 
  //   numToRust(89),
  //   numToRust(89),
  //   {
  //     accounts: {
  //       treasureChest: testChest.publicKey,
  //       hunter: provider.wallet.publicKey,
  //       systemProgram: SystemProgram.programId,
  //     },
  //     signers: [testChest]
  //   }
  // );
  // console.log("📝 Your transaction signature", tx);

  // let account = await program.account.treasureChest.fetch(testChest.publicKey);
  // console.log('Key 0 count:', account.key0Count);
  // console.log('Key 1 count:', account.key1Count);
  // console.log('Key 2 count:', account.key2Count);
  // console.log('Treasure count:', account.treasureCount);

  // tx = await program.rpc.mintKey0(
  //   solTolamports(0.1), 
  //   solTolamports(0.05), 
  //   {
  //     accounts: {
  //       to: treasureChest.publicKey,
  //       from: provider.wallet.publicKey,
  //       systemProgram: SystemProgram.programId,
  //     },
  //     signers: [provider.wallet.Keypair]
  //   }
  // );
  tx = await program.rpc.sendSol(
    solTolamports(0.1), 
    // solTolamports(0.05), 
    {
      accounts: {
        to: treasureChest.publicKey,
        from: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [provider.wallet.Keypair]
    }
  );
  console.log("📝 Your transaction signature", tx);


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

// ---- Helpers ----
const numToRust = (num) => {
  return new anchor.BN(Math.round(num));
}

const solTolamports = (sol) => {
  return new anchor.BN(Math.round(sol / 0.000000001));
}

// ---- Old -----

const printGifs = async (program, baseAccount) => {
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('👀 GIF Count', account.totalGifs.toString());
  console.log('👀 GIF List', account.gifList);
}

const testBuildSpace = async (program, baseAccount, provider) => {
  // Call start_stuff_off, pass it the params it needs
  let tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount]
  });
  console.log("📝 Your transaction signature", tx);

  //0 Gifs
  await printGifs(program, baseAccount);
  

  tx = await program.rpc.addGif("this is a link", {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    }
  });
  console.log("📝 Your transaction signature", tx);

  //1 Gif
  await printGifs(program, baseAccount);
}

runMain();

// console.log(solTolamports(0.5).toNumber());

// const anchor = require('@project-serum/anchor');

// describe('soltreasure', () => {

//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.Provider.env());

//   it('Is initialized!', async () => {
//     // Add your test here.
//     const program = anchor.workspace.Soltreasure;
//     const tx = await program.rpc.initialize();
//     console.log("Your transaction signature", tx);
//   });
// });
