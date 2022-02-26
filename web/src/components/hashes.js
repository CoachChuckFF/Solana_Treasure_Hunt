import { PublicKey } from '@solana/web3.js';


function arrayToByte(wallet, index){
    return wallet.toBytes()[index];
}
function codesToByteArray(wallet, code0, code1, code2, code3){
    return [
        arrayToByte(wallet, code0),
        arrayToByte(wallet, code1),
        arrayToByte(wallet, code2),
        arrayToByte(wallet, code3)
    ]
}

export function codeToHexString(code){
    return `0x${code == null ? '??' : code.toString(16).padStart(2, '0').toUpperCase()}`;
}

export function getCorrectTestCodes(wallet){
    if(wallet){
        return codesToByteArray(
            wallet,
            0x10,
            0x11,
            0x12,
            0x13,
        );
    }

    return null;
}

export function getWrongTestCodes(wallet, test){
    if(wallet){
        return codesToByteArray(
            wallet,
            10 + test,
            11 + test, 
            12 + test,
            13 + test,
        );
    }

    return null;
}