console.log('You found me! [key2] LAST KEY!');

//---------------- EDIT BELOW -----------------//

let YOUR_KEY2_MINTING_ADDRESS = '';
let PASSWORD = '';

// ----- Finish the function! ------
// Input: (number, number)
// Output: a XOR b
function hashFunction(a, b){

    // TODO
    // bitwise XOR a and b 
    let output = a^b;

    return output;
}

//---------------- EDIT ABOVE -----------------//


//*** Directions
console.log(`Step 1: Go to twitter and find @Noot_Noot_Bot`);
console.log(`Step 2: Reply to any Noot Noot Bot's tweets with the following output:`);
console.log(`\nkey2:${YOUR_KEY2_MINTING_ADDRESS}:${key2Hash(YOUR_KEY2_MINTING_ADDRESS, PASSWORD)}\n`);
console.log('Step 3: Wait for a like and a DM!');

//*** Hash Function
function key2Hash(yourWallet, password){
    let hash = 0;
    let answer = '';

    if(!yourWallet){console.log(`[ERROR]: Enter in your sol in the YOUR_KEY2_MINTING_ADDRESS=''`); return "ERROR"}
    if(!password){console.log(`[ERROR]: Enter in a password in PASSWORD=''`); return "ERROR"}
    if(!testHashFunction()){console.log(`[ERROR]: Bad function - you want A XOR B`); return "ERROR"}

    //STAGE 0: HASH
    for (i = 0; i < Math.min(yourWallet.length, password.length); i++) {
        let char = hashFunction(yourWallet.charCodeAt(i), password.charCodeAt(i));
        hash  = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer        
    }

    //STAGE 1: NOOT!
    let hashNumberString = `${Math.abs(hash) | 100}`;
    for(var i = 0; i < 3; i++){
        switch(hashNumberString.charAt(i)){
            case "0": answer += "noot"; break;
            case "1": answer += "Noot"; break;
            case "2": answer += "NoOt"; break;
            case "3": answer += "NOOT"; break;
            case "4": answer += "nOOT"; break;
            case "5": answer += "nOoT"; break;
            case "6": answer += "nooT"; break;
            case "7": answer += "NooT"; break;
            case "8": answer += "N0OT"; break;
            case "9": answer += "noOt"; break;
        }
        if(i < 2)
            answer += "-";
    }

    // STAGE 2: OUTPUT
    return answer;
}

function testHashFunction(){
    if(hashFunction(0xAA, 0x55) != 0xFF) return false;
    if(hashFunction(0xFF, 0x00) != 0xFF) return false;
    if(hashFunction(0xFF, 0xFF) != 0x00) return false;
    return true;
}

module.exports = { key2Hash };