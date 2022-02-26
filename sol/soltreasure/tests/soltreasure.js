"use strict";
// This file is from Farza's Buildspace Solana course - not my own
// https://app.buildspace.so/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@project-serum/anchor"));
const metaplex = __importStar(require("@metaplex/js"));
const spl_token_1 = require("@solana/spl-token");
const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';
// SOLANA HELPERS
const findAssociatedTokenAddress = (owner, mint) => {
    return spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, owner);
};
const createSFT = (provider, amount = 100000, name, symbol, uri, sellerFeeBasisPoints = 300) => __awaiter(void 0, void 0, void 0, function* () {
    let mint = anchor.web3.Keypair.generate();
    let metadata = anchor.web3.Keypair.generate();
    let collection = anchor.web3.Keypair.generate();
    let tx = new anchor.web3.Transaction();
    let owner = provider.wallet.publicKey;
    let vault = yield findAssociatedTokenAddress(owner, mint.publicKey);
    let token = new spl_token_1.Token(provider.connection, mint.publicKey, spl_token_1.TOKEN_PROGRAM_ID, mint);
    // Create the Account
    tx.add(anchor.web3.SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: mint.publicKey,
        lamports: yield spl_token_1.Token.getMinBalanceRentForExemptMint(provider.connection),
        space: spl_token_1.MintLayout.span,
        programId: spl_token_1.TOKEN_PROGRAM_ID
    }));
    // Create the Mint
    tx.add(spl_token_1.Token.createInitMintInstruction(spl_token_1.TOKEN_PROGRAM_ID, // Program ID
    mint.publicKey, // Mint
    0, // Decimals
    owner, // Mint Authority
    null));
    // Create Associated Account
    tx.add(spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint.publicKey, vault, // Associated Account
    owner, // Owner
    owner));
    // Mint
    tx.add(spl_token_1.Token.createMintToInstruction(spl_token_1.TOKEN_PROGRAM_ID, mint.publicKey, vault, owner, [], // Multi-signers
    amount));
    let txRes = yield provider.send(tx, [mint]);
    let mdtx = new metaplex.programs.metadata.CreateMetadataV2({
        recentBlockhash: null,
        nonceInfo: null,
        feePayer: null,
        signatures: []
    }, {
        metadata: metadata.publicKey,
        metadataData: {
            name: name,
            symbol: symbol,
            uri: uri,
            sellerFeeBasisPoints: sellerFeeBasisPoints,
            creators: [
                {
                    address: provider.wallet.publicKey.toString(),
                    verified: true,
                    share: 100,
                },
            ],
            collection: new metaplex.programs.metadata.Collection({
                key: collection.publicKey.toString(),
                verified: true,
            }),
            uses: null,
        },
        updateAuthority: provider.wallet.publicKey,
        mint: mint.publicKey,
        mintAuthority: provider.wallet.publicKey,
    });
    let mdRes = yield provider.send(mdtx);
    console.log(mdRes);
});
// MAIN
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🚀 Starting test...\n\n");
    // ------------- STEP 0 = INIT PROVIDER -------------------
    const coach = anchor.Provider.env();
    anchor.setProvider(coach);
    const program = anchor.workspace.Soltreasure;
    yield createSFT(coach, 100000, "TEST", "TEST", "test.uri", 300);
    console.log("... to the moon! 🌑");
});
const runMain = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield main();
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
runMain();
