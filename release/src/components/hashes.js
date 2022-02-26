import { PublicKey } from '@solana/web3.js';

const PUBKEYSIZE = 32;

function arrayToByte(wallet, puzzle, index){
    return wallet.toBytes()[PUBKEYSIZE - 1 - puzzle] ^ wallet.toBytes()[index];
}
function codesToByteArray(wallet, puzzle, zero, one, two, three){
    return [
        arrayToByte(wallet, puzzle, zero),
        arrayToByte(wallet, puzzle, one),
        arrayToByte(wallet, puzzle, two),
        arrayToByte(wallet, puzzle, three)
    ]
}

export function codeToHexString(code){
    return `0x${code == null ? '??' : code.toString(16).padStart(2, '0').toUpperCase()}`;
}

export function getGuideCodes(wallet){

    if(wallet){
        return codesToByteArray(
            wallet,
            0,
            1,
            2, 
            3,
            4,
        );
    }

    return null;
}

export function getNootCode(wallet, noot){

    if(wallet){
        return codesToByteArray(
            wallet,
            noot,
            5,
            6, 
            7,
            8,
        );
    }

    return null;
}

export function getDronieCode(wallet, xorIndex){

    if(wallet){
        return codesToByteArray(
            wallet,
            PUBKEYSIZE - 1 - xorIndex,
            0,
            1, 
            2,
            3,
        );
    }

    return null;
}

export function getDesolatesCode(wallet, r, g, b){

    if(wallet){
        return codesToByteArray(
            wallet,
            8,
            r & 0x0F,
            g & 0x0F,
            b & 0x0F,
            r & 0x0F + g & 0x0F + b & 0x0F,
        );
    }

    return null;
}