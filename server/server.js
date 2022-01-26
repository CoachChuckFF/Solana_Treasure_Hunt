const express = require('express');
const nootBot = require('./nootBot.js');
const solBot = require('./sol.js');
const key0 = require('./key0.js');
const app = express();

require('dotenv').config();
const port = process.env.PORT || 5000;

async function connectToSolana(){
    console.log("Connecting to Solana");
    // //Solana Stuff
    // let connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');

    // let info = await connection.getSupply(new web3.PublicKey("5B1QZJYws1Nnp8Kh3FWVoeQbasr5tJeyiZZnWz8sxDZf"));
    // console.log(info);
}


function getTXAmount(sol, keyNumber){
    console.log("JD5C5Bsp3q9jeC5S57QuSCDDfpeKzXvRkfPB3Td6x3Wh".length);
    console.log("7RawqnUsUxA8pnb8nAUTgyzRaLVRYwR9yzPR3gfzbdht".length);
    console.log("DeBtJy88jrnheD8F3HEAqiQztykXksgMyvmcByHC5RGv".length);
    console.log("HVVzRzhEsMURJd42CcEgSxDFcAZEwDWVZdZvfFtKkaDd".length);
    console.log("F95gRGdq3prYCZYtXeYXK5MQw5qu3c7rh2hnaAjux9Ld".length);

    console.log("tfxdDLtqfQAWLo5zZjW4kfGKv1J7E6LZrShtHdoFjgc".length);
}

//https://onecompiler.com/nodejs/3xrfq5a67
function key0Check(sol, solution){
    return solution === key0.key0Hash(sol, process.env.FAKE_NFT);
}

//Morse code
//red Harring
// https://onecompiler.com/nodejs/3xrft5nu6
function key1Check(sol, solution){

    return true;

}

//red Harring
// https://onecompiler.com/nodejs/3xrftanzm
function key3Check(sol, solution){

    return true;
}

function checkAnswer(tweet){

    //Null Check
    if(tweet == null) return false;

    //Get Parts
    let parts = tweet.split(":");
    if(parts.length !== 3) return false;
    
    switch(parts[0]){
        case "key0": return key0Check(parts[1], parts[2]);
        case "key1": return key1Check(parts[1], parts[2]);
        case "key2": return key3Check(parts[1], parts[2]);
    }

    return false;
}

function spinUpServer(){

    //Connect To Solana
    let sol = solBot.connectToSolana();

    //Spin up Twitter Bot
    let noot = nootBot.startnootBootLoop(checkAnswer);

    //Spin Up Server
    app.listen(port, () => console.log(`Listening on port ${port}`));

    //Set Hooks
    app.get('/report/:user', (req, res) => {
        try{
            res.send(getReport(report, req.params.user));
        } catch (error) {
            console.log(`Trouble getting report (${error})`);
        }
    });

}

// spinUpServer();
// 7DhUR2sgQCtCGYZw1RWvzKPJCDu2Qp2N9nkiGZZUMCfN

const key = 'key0';
const user = process.env.USER_SOL;
const solution = key0.key0Hash(user, process.env.FAKE_NFT);

console.log(checkAnswer(`${key}:${user}:${solution}`));