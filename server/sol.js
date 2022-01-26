const web3 =  require("@solana/web3.js");

async function connectToSolana(){
    console.log("Connecting to Solana");
    // //Solana Stuff
    // let connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');

    // let info = await connection.getSupply(new web3.PublicKey("5B1QZJYws1Nnp8Kh3FWVoeQbasr5tJeyiZZnWz8sxDZf"));
    // console.log(info);
}

module.exports = { connectToSolana };