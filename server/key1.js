console.log('You found me! [key1]');

//---------------- EDIT BELOW -----------------//

let YOUR_KEY1_MINTING_ADDRESS = '';
let MONTH = '';   //MM
let DAY = '';     //DD
let YEAR = '';    //YY

// ----- Finish the function! ------
// Input: (String, String, String)
// Output: "MM.DD.YY"
function buildDate(month, day, year){
    dateString = '';

    // TODO
    // Concatenate a the dateString to have the following format:
    // 'MM.DD.YY'

    // Or just uncomment this line?
    // dateString = `${month}.${day}.${year}`;

    return dateString;
}

//---------------- EDIT ABOVE -----------------//


//*** Directions
console.log(`Step 1: Go to twitter and find @Noot_Noot_Bot`);
console.log(`Step 2: Reply to any Noot Noot Bot's tweets with the following output:`);
console.log(`\nkey1:${YOUR_KEY1_MINTING_ADDRESS}:${key1Hash(YOUR_KEY1_MINTING_ADDRESS, buildDate(MONTH, DAY, YEAR))}\n`);
console.log('Step 3: Wait for a like and a DM!');

//*** Hash Function
function key1Hash(yourWallet, dateString){
    let hash = 0;
    let answer = '';

    if(!yourWallet){console.log(`[ERROR]: Enter in your sol in the YOUR_KEY1_MINTING_ADDRESS=''`); return "ERROR"}
    if(!dateString){console.log(`[ERROR]: Bad dateString`); return "ERROR"}

    let check = checkDateString(dateString);
    if(check){console.log(check); return "ERROR"}

    //STAGE 0: HASH
    for (i = 0; i < Math.min(yourWallet.length, dateString.length); i++) {
        let char = yourWallet.charCodeAt(i) ^ dateString.charCodeAt(i);
        hash  = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer        
    }

    //STAGE 1: AFFIRMATIONS
    let hashNumberString = `${Math.abs(hash) | 100}`;
    for(var i = 0; i < 3; i++){
        switch(hashNumberString.charAt(i)){
            case "0": answer += "GM"; break;
            case "1": answer += "GN"; break;
            case "2": answer += "GMI"; break;
            case "3": answer += "MOON"; break;
            case "4": answer += "WAGMI"; break;
            case "5": answer += "SOL"; break;
            case "6": answer += "MAXI"; break;
            case "7": answer += "DEGEN"; break;
            case "8": answer += "NOOT"; break;
            case "9": answer += "FAM"; break;
        }
        if(i < 2)
            answer += "-";
    }

    // STAGE 2: OUTPUT
    return answer;
}

function checkDateString(dateString){
    let check = dateString.split('.');
    if(check.length != 3) return "[ERROR] make sure buildDate's output is formatted like this 'MM.DD.YY'";
    if(isNaN(check[0]) || check[0].length != 2) return "[ERROR] bad month format";
    if(isNaN(check[1]) || check[1].length != 2) return "[ERROR] bad day format";
    if(isNaN(check[2]) || check[2].length != 2) return "[ERROR] bad year format";

    return null;
}

module.exports = { key1Hash };