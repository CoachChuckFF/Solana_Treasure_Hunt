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
exports.createSFT = exports.createSPL = exports.getSPLInfo = exports.findAssociatedTokenAddress = exports.getRent = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const metaplex = __importStar(require("@metaplex/js"));
const spl_token_1 = require("@solana/spl-token");
const devWallet = 'HAzgWmFC2TGw1Ry6C3h2i2eAnnbrD91wDremBSxXBgCB';
// SOLANA HELPERS
const getRent = (provider, size) => {
    return provider.connection.getMinimumBalanceForRentExemption(size);
};
exports.getRent = getRent;
const findAssociatedTokenAddress = (owner, mint) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield anchor.web3.PublicKey.findProgramAddress([
        owner.toBuffer(),
        spl_token_1.TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
    ], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID))[0];
    return spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, owner);
});
exports.findAssociatedTokenAddress = findAssociatedTokenAddress;
const getSPLInfo = (provider, mint, vault) => __awaiter(void 0, void 0, void 0, function* () {
    return new spl_token_1.Token(provider.connection, mint, spl_token_1.TOKEN_PROGRAM_ID, anchor.web3.Keypair.generate()).getAccountInfo(vault);
});
exports.getSPLInfo = getSPLInfo;
const createSPL = (provider, amount = 100000) => __awaiter(void 0, void 0, void 0, function* () {
    let mint = anchor.web3.Keypair.generate();
    let tx = new anchor.web3.Transaction();
    let owner = provider.wallet.publicKey;
    let vault = yield (0, exports.findAssociatedTokenAddress)(owner, mint.publicKey);
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
    yield provider.send(tx, [mint]);
    return yield (0, exports.getSPLInfo)(provider, mint.publicKey, vault);
});
exports.createSPL = createSPL;
const createSFT = (provider, amount = 100000, name, symbol, uri, sellerFeeBasisPoints = 300) => __awaiter(void 0, void 0, void 0, function* () {
    let tokenInfo = yield (0, exports.createSPL)(provider, amount);
    let collection = anchor.web3.Keypair.generate();
    let preambleMetadata = {
        recentBlockhash: (yield provider.connection.getRecentBlockhash(provider.opts.preflightCommitment)).blockhash,
        nonceInfo: null,
        feePayer: provider.wallet.publicKey,
        signatures: []
    };
    let actualMetadata = {
        metadata: yield metaplex.programs.metadata.Metadata.getPDA(tokenInfo.mint),
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
    };
    let mdtx = new metaplex.programs.metadata.CreateMetadataV2(preambleMetadata, actualMetadata);
    // TODO - verify collection
    // TODO - upload to Arweave
    // TODO - Disable mint
    let mdRes = yield provider.send(mdtx, []);
    return actualMetadata;
});
exports.createSFT = createSFT;
