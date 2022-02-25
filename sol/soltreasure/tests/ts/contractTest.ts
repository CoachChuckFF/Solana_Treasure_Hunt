// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/

import * as anchor from "@project-serum/anchor";
import * as metaplex from "@metaplex/js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";
import * as treasure from "./treasure";
import * as helpers from "./solHelpers";

const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';

// MAIN
const main = async() => {
  console.log("🚀 Starting test...\n\n")

  // ------------- STEP 0 = INIT PROVIDER -------------------
  const coach = anchor.Provider.env();
  anchor.setProvider(coach);
  const program = anchor.workspace.Soltreasure;

  let game = await treasure.createTestGame(coach, program);

  console.log(game);

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
