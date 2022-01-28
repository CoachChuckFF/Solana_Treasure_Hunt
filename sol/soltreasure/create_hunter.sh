#! /bin/bash
cd tests/
node createHunter.js
solana config set --keypair ./hunter-raw.json
solana airdrop 2
solana config set --keypair ~/.config/solana/id.json