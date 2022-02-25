"use strict";
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
exports.Game = exports.pauseGame = exports.playGame = exports.createGame = exports.createTestGame = void 0;
const spl_token_1 = require("@solana/spl-token");
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const helpers = __importStar(require("./solHelpers"));
var GameItemType;
(function (GameItemType) {
    GameItemType[GameItemType["KEY"] = 0] = "KEY";
    GameItemType[GameItemType["ITEM"] = 1] = "ITEM";
    GameItemType[GameItemType["REWARD"] = 2] = "REWARD";
    GameItemType[GameItemType["COMBINATION_OUTPUT"] = 3] = "COMBINATION_OUTPUT";
})(GameItemType || (GameItemType = {}));
class GameCodes {
    constructor(code) {
        this.code = code;
    }
    codeFromCodes(codes) {
        if (!codes)
            return new GameCodes(0);
        if (codes.length !== 4)
            return new GameCodes(0);
        let newCode = (codes[0] & 0xFF) << 0;
        newCode |= (codes[1] & 0xFF) << 8;
        newCode |= (codes[2] & 0xFF) << 16;
        newCode |= (codes[3] & 0xFF) << 24;
        return new GameCodes(newCode);
    }
}
class Game {
    constructor(gameKey) {
        this.gameKey = gameKey;
        this.game = {};
    }
    updateGameAccount(program, gameKey) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.game = yield program.account.game.fetch(gameKey);
        });
    }
}
exports.Game = Game;
// Sizes
const PUBKEY_SIZE = 32;
const U8 = 1;
const U16 = 2;
const U32 = 4;
const U64 = 8;
const VEC = 8;
const GAME_ITEM = 32 + PUBKEY_SIZE * 2 + U8 * 4 + U32 + U64 * 4;
const GAME_COMBINATION = U64 * 4 + U8 * 3;
const LEADBOARD = PUBKEY_SIZE + U64 * 2 + U8;
const GAME_BASE = PUBKEY_SIZE * 4 + U64 * 4 + U8 * 2 + VEC * 3 + LEADBOARD * 10;
const getGameSize = (assetCount, combinationCount) => {
    return (GAME_BASE + assetCount * GAME_ITEM + combinationCount * GAME_COMBINATION);
};
const getGameAccount = (program, gameKey) => {
    return program.account.game.fetch(gameKey);
};
const createGameAccount = (provider, program, assetCount, combinationCount) => __awaiter(void 0, void 0, void 0, function* () {
    const game = anchor.web3.Keypair.generate();
    let [gatekeeper, nonce] = yield anchor.web3.PublicKey.findProgramAddress([game.publicKey.toBuffer()], program.programId);
    yield program.rpc.createGame(nonce, {
        accounts: {
            game: game.publicKey,
            gatekeeper: gatekeeper,
            coach: provider.wallet.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [game],
        instructions: [
            yield program.account.game.createInstruction(game, getGameSize(assetCount, combinationCount)),
        ],
    });
    return yield getGameAccount(program, game.publicKey);
});
const loadAsset = (provider, program, game, asset, isWrongAsset) => __awaiter(void 0, void 0, void 0, function* () {
    let coachGameVault = yield helpers.findAssociatedTokenAddress(game.coach, asset.mint);
    let coachAssetInfo = yield helpers.getSPLInfo(provider, asset.mint, coachGameVault);
    let assetGameVault = yield helpers.findAssociatedTokenAddress(game.gatekeeper, asset.mint);
    asset.item = assetGameVault;
    let createTX = yield program.rpc.loadAssets(asset.name, asset.itemType, asset.codes, isWrongAsset !== null && isWrongAsset !== void 0 ? isWrongAsset : false, asset.percent, asset.amountPerMint, asset.maxPerInventory, new anchor.BN(asset.cost), new anchor.BN(coachAssetInfo.amount), {
        accounts: {
            game: game.game,
            gatekeeper: game.gatekeeper,
            coachVault: coachAssetInfo.address,
            gameVault: assetGameVault,
            coach: provider.wallet.publicKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        signers: [],
        instructions: [
            (yield spl_token_1.Token.createAssociatedTokenAccountInstruction(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, coachAssetInfo.mint, assetGameVault, game.gatekeeper, provider.wallet.publicKey)),
        ],
    });
    return yield getGameAccount(program, game.game);
});
const createTestGame = (provider, program) => __awaiter(void 0, void 0, void 0, function* () {
    //Create Assets
    let dummyAssetCount = 5;
    let dummyAssets = [];
    let dummyCombinationCount = 1;
    let dummyCombintaions = [];
    for (var i = 0; i < dummyAssetCount; i++) {
        let dummySLP = yield helpers.createSPL(provider, 100000);
        dummyAssets.push({
            name: `Item ${i}`,
            mint: dummySLP.mint,
            item: dummySLP.address,
            burned: false,
            itemType: GameItemType.KEY,
            requirements: new anchor_1.BN(0),
            id: new anchor_1.BN(0),
            codes: 0x01020304,
            percent: 5,
            maxPerInventory: 1,
            amountPerMint: 1,
            cost: new anchor_1.BN(Math.round(anchor_1.web3.LAMPORTS_PER_SOL * 0.05))
        });
    }
    for (var i = 0; i < dummyCombinationCount; i++) {
        dummyCombintaions.push({
            input0Amount: 1,
            input0Id: new anchor_1.BN(0b1),
            input1Amount: 1,
            input1Id: new anchor_1.BN(0b1),
            outputAmount: 1,
            outputId: new anchor_1.BN(0b10),
            cost: new anchor_1.BN(Math.round(anchor_1.web3.LAMPORTS_PER_SOL * 0.05))
        });
    }
    return (0, exports.createGame)(provider, program, dummyAssets, dummyCombintaions);
});
exports.createTestGame = createTestGame;
const createGame = (provider, program, assets, combinations) => __awaiter(void 0, void 0, void 0, function* () {
    //Create Account
    let gameAccount = yield createGameAccount(provider, program, assets.length, combinations.length);
    //Load Assets
    for (var i = 0; i < assets.length; i++) {
        gameAccount = yield loadAsset(provider, program, gameAccount, assets[i], assets[i].name.toUpperCase().includes("BAD"));
    }
    return gameAccount;
    //Load Requirements
    //Load Combinations
});
exports.createGame = createGame;
const playGame = (provider, program, assets, combinations) => __awaiter(void 0, void 0, void 0, function* () {
});
exports.playGame = playGame;
const pauseGame = (provider, program, assets, combinations) => __awaiter(void 0, void 0, void 0, function* () {
});
exports.pauseGame = pauseGame;
