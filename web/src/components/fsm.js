import { PublicKey } from '@solana/web3.js';

export const Devmode = "-2. Devmode"
export const Supernova = "-1. Supernova"
export const NotConnected = "0. Connect your wallet";
export const Playing = "1. Playing";

export const Puzzle1 = "Noots";
export const Puzzle2 = "Terminal";
export const Puzzle3 = "Desolates";
export const Puzzle4 = "Trees";

export const Guide = new PublicKey('2dm1VxKGnTHfN9SDpL9EAH8MtQ4ZMuXGM5jXugkVCPqU');
export const NFKeyB = new PublicKey('98LMSXMzUP4myGehpbHmLQmhByPiMyjm8nzRJBKBtJz5');
export const NFKey1 = new PublicKey('FFKitVyAsQS2zr7dnAdCMwEnNeNZqyCKT4mcqGcmp8pm');
export const NFKey2 = new PublicKey('13A6UfHnpcTGheHFrhMp6mTuatbKEUifhbtu5DvhTbFD');
export const NFKey3 = new PublicKey('9uoKy1frKFFjKKhjpnKLjHRMGiq7RxZ2jdtTLBYkvVUh');
export const Treasure = new PublicKey('JB3SZLbMn7fZQ2fSdg8pc2y5exDCzNZfUs16wnkXsNjT');
export const Mystery = new PublicKey('BtkPvSzfF9tMh9hHgKLUQ453BVJdWG92n46WRCkgX69h');

export const staticCodes = {
    blue:  [-1,-1,-1,-1],
    green: [-1,-1,-1,-1],
    purple:  [-1,-1,-1,-1],
    white: [-1,-1,-1,-1],
};

export const blankPuzzle = {
    blue: false,
    green: false,
    purple: false,
    broken: false,
    black: false,
    white: false,
    regular: false,
    secret: false,
    replay: false,
};

export const canOpenChest = (puzzleState) => {
    if(!puzzleState) return false;
    return puzzleState.blue && puzzleState.green && puzzleState.purple && !puzzleState.regular;
}

export const Items = [
    Guide,
    NFKeyB,
    NFKey1,
    NFKey2,
    NFKey3,
    Treasure,
    Mystery
];

export const ItemMap = {
    [Guide.toString()] : false,
    [NFKeyB.toString()] : false,
    [NFKey1.toString()] : false,
    [NFKey2.toString()] : false,
    [NFKey3.toString()] : false,
    [Treasure.toString()] : false,
    [Mystery.toString()] : false,
};

export const MapToState = (map) => {
    // if(map[Mystery.toString()]) return CheckYourWallet;
    // if(map[Treasure.toString()]) return Done;
    // if(map[NFKey3.toString()]) return OpenChest;
    // if(map[NFKey2.toString()]) return MintNFKey3;
    // if(map[NFKey1.toString()]) return MintNFKey2;
    // if(map[Guide.toString()]) return MintNFKey1;

    return Playing;
};