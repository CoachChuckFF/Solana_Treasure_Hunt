import { PublicKey } from '@solana/web3.js';

export const NotConnected = "0. Connect your wallet";
export const MintGuide = "1. Mint the guide";
export const MintNFKey1 = "2. Find the fake in puzzle 1 to get the NFKey 1 codes";
export const MintNFKey2 = "3. Find the date in puzzle 2 to get the NFKey 2 codes";
export const MintNFKey3 = "4. Find the password in puzzle 3 to get the NFKey 3 codes";
export const OpenChest = "5. Open the chest!";
export const Done = "X. Congratulations!";
export const CheckYourWallet = "?. You've gotten the real prize! Hooray!";

export const Guide = new PublicKey('2dm1VxKGnTHfN9SDpL9EAH8MtQ4ZMuXGM5jXugkVCPqU');
export const NFKeyB = new PublicKey('98LMSXMzUP4myGehpbHmLQmhByPiMyjm8nzRJBKBtJz5');
export const NFKey1 = new PublicKey('FFKitVyAsQS2zr7dnAdCMwEnNeNZqyCKT4mcqGcmp8pm');
export const NFKey2 = new PublicKey('13A6UfHnpcTGheHFrhMp6mTuatbKEUifhbtu5DvhTbFD');
export const NFKey3 = new PublicKey('9uoKy1frKFFjKKhjpnKLjHRMGiq7RxZ2jdtTLBYkvVUh');
export const Treasure = new PublicKey('JB3SZLbMn7fZQ2fSdg8pc2y5exDCzNZfUs16wnkXsNjT');
export const Mystery = new PublicKey('BtkPvSzfF9tMh9hHgKLUQ453BVJdWG92n46WRCkgX69h');

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
    if(map[Mystery.toString()]) return CheckYourWallet;
    if(map[Treasure.toString()]) return Done;
    if(map[NFKey3.toString()]) return OpenChest;
    if(map[NFKey2.toString()]) return MintNFKey3;
    if(map[NFKey1.toString()]) return MintNFKey2;
    if(map[Guide.toString()]) return MintNFKey1;

    console.log("Change FSM");

    return MintNFKey3;

    return MintGuide;
};