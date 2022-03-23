import { PublicKey } from '@solana/web3.js';
import { TreasureProvider } from './solTreasure';
import { NULL_MINT_CODES } from './state';
import Rand from 'rand-seed';

const PUBKEYSIZE = 32;

function arrayToByte(wallet:PublicKey, puzzle:number, index:number){
    return wallet.toBytes()[PUBKEYSIZE - 1 - puzzle] ^ wallet.toBytes()[index];
}

function codesToByteArray(provider:TreasureProvider, puzzle:number, zero:number, one:number, two:number, three:number){
    if(provider.valid){
        let wallet = provider.provider.wallet.publicKey;
        return [
            arrayToByte(wallet, puzzle, zero),
            arrayToByte(wallet, puzzle, one),
            arrayToByte(wallet, puzzle, two),
            arrayToByte(wallet, puzzle, three)
        ]
    }
    return NULL_MINT_CODES;
}

export function getRandomCodes(seed?:string){
    const rand = new Rand(seed);

    return [
        Math.floor(rand.next() * 0xFF),
        Math.floor(rand.next() * 0xFF),
        Math.floor(rand.next() * 0xFF),
        Math.floor(rand.next() * 0xFF),
    ];
}

export function codeToHexString(code?:number){
    return `0x${code == null || code === -1 ? '??' : code.toString(16).padStart(2, '0').toUpperCase()}`;
}

export function getGuideCodes(provider:TreasureProvider){
    return codesToByteArray(
        provider,
        0,
        1,
        2, 
        3,
        4,
    );
}

export function getNootCode(provider:TreasureProvider, noot:number){
    return codesToByteArray(
        provider,
        noot,
        5,
        6, 
        7,
        8,
    );
}

export function getDronieCode(provider:TreasureProvider, xorIndex:number){

    return codesToByteArray(
        provider,
        PUBKEYSIZE - 1 - xorIndex,
        0,
        1, 
        2,
        3,
    );
}

export function getDesolatesCode(provider:TreasureProvider, r:number, g:number, b:number){

    return codesToByteArray(
        provider,
        8,
        r & 0x0F,
        g & 0x0F,
        b & 0x0F,
        r & 0x0F + g & 0x0F + b & 0x0F,
    );
}

export function getFractalCodes(provider:TreasureProvider, combination:string, isCorrect:boolean){

    if(!isCorrect){
        if(combination.length === 0){
            return NULL_MINT_CODES;
        } else {
            return getRandomCodes(combination);
        }
    }

    return codesToByteArray(
        provider,
        3,
        0xA,
        0xB,
        0xC,
        0xD,
    );
}