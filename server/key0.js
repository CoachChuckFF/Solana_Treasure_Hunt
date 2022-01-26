console.log('You found me! [key0]');

//---------------- EDIT BELOW -----------------//

let YOUR_KEY0_MINTING_ADDRESS = '';
let FAKE_NFT_TOKEN_ADDRESS = '';

//---------------- EDIT ABOVE -----------------//


//*** Directions
console.log(`Step 1: Go to twitter and find @Noot_Noot_Bot`);
console.log(`Step 2: Reply to any Noot Noot Bot's tweets with the following output:`);
console.log(`\nkey0:${YOUR_KEY0_MINTING_ADDRESS}:${key0Hash(YOUR_KEY0_MINTING_ADDRESS, FAKE_NFT_TOKEN_ADDRESS)}\n`);
console.log('Step 3: Wait for a like and a DM!');

//*** Hash Function
function key0Hash(yourWallet, fakeNFT){
    let hash = 0;
    let answer = '';

    if(!yourWallet){console.log(`[ERROR]: Enter in your sol in the YOUR_KEY0_MINTING_ADDRESS=''`); return "ERROR"}
    if(!fakeNFT){console.log(`[ERROR]: Enter in the fake NFT's token address in FAKE_NFT_TOKEN_ADDRESS=''`); return "ERROR"}

    //STAGE 0: HASH
    for (i = 0; i < Math.min(yourWallet.length, fakeNFT.length); i++) {
        let char = yourWallet.charCodeAt(i) ^ fakeNFT.charCodeAt(i);
        hash  = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer        
    }

    //STAGE 1: EMOJI
    let hashNumberString = `${Math.abs(hash) | 0x0001}`;
    for(var i = 0; i < hashNumberString.length; i++){
        switch(hashNumberString.charAt(i)){
            case "0": answer += "🐧"; break;
            case "1": answer += "🐵"; break;
            case "2": answer += "🐍"; break;
            case "3": answer += "🐦"; break;
            case "4": answer += "🐶"; break;
            case "5": answer += "🔥"; break;
            case "6": answer += "🌕"; break;
            case "7": answer += "🚀"; break;
            case "8": answer += "💎"; break;
            case "9": answer += "❤️"; break;
        }
    }

    // STAGE 2: OUTPUT
    return answer;
}

module.exports = { key0Hash };