import { NodeWallet } from "@metaplex/js";
import * as anchor from "@project-serum/anchor";
import * as helpers from "./solana-helpers"
import { ITEMS } from "./assets";
// const fetch = require('node-fetch');

// let settings = { method: "Get" };
// export const getJsonMetadata = async(url:string) => {
//     return new Promise((resolve, reject)=>{
//         fetch(url, settings)
//         .then((res:any) => res.json())
//         .then((json:any) => {
//             resolve(json);
//         });
//     });
// }

const secretArray = require('/Users/drkrueger/.config/solana/programs/sol-treasure.json');
const secret = new Uint8Array(secretArray);
const payerKeypair = anchor.web3.Keypair.fromSecretKey(secret);

const verify = "ts-node src/cli-nft.ts verify-collection -c AGquvffj8QSnRLXag3i46MfeaZXBXu6YFRKtqc3XFTZY -m D8y7xCZ1G1MHgu9PAH8EpVqQH1Aw3TV4RfhgH8CKoQ58 --keypair ~/.config/solana/programs/sol-treasure.json";
const command = "spl-token transfer BSuCiPcSpWRT7PabVWyBDemgndb1gZX2mMMkqur5Gfxs 1 FhSeAC7RccBX81Cu863jkhynqXaLZby8FMwU6rrxaZ5v --fund-recipient --allow-unfunded-recipient"
const test = "https://arweave.net/NuSmhExsvXotBoCJ0CN9UFh8FOe37FhjIVi_E63sdaw"


const COLLECTION = ITEMS.config.collection;

const META = require('../../ar/metadata/purple_chest.json');
const URI = ITEMS.purpleChest.json;
const AMOUNT = ITEMS.purpleChest.amount;

const SPL = undefined; //new anchor.web3.PublicKey('DEAj8PGJrszPvzoFEihCfNxcFTjEsSqGiwaFgUwehPz2');
const METADATA = undefined; //new anchor.web3.PublicKey('3P3EGw8kw6CPAKccFCv9aEc2eY26vPmHVCzqvbQPvMps');
const VERIFIED = undefined;

const main = async () => {
    let ownerWallet = new NodeWallet(payerKeypair);
    const provider = helpers.getSolanaProvider(ownerWallet, false);
    anchor.setProvider(provider);

    // console.log(await getJsonMetadata(URI));

    const inputMetadata = helpers.objToMetadata(META);
    inputMetadata.sellerFeeBasisPoints = META.seller_fee_basis_points;

    let collectionData = undefined;
    if( COLLECTION.length !== 0 ){
        collectionData = await helpers.getCollectionData(
            provider,
            new anchor.web3.PublicKey(COLLECTION),
        );
    }

    if(collectionData === undefined &&  COLLECTION.length !== 0 ) return;

    console.log("Creating SFT...");
    const SFTData = await helpers.createSFT(
        provider,
        URI,
        META,
        new anchor.BN(AMOUNT),
        collectionData,
        SPL,
        METADATA,
        VERIFIED
    );

    console.log("--------- SAVE THE FOLLOWING --------------\n");
    console.log(`SFT Mint:         ${SFTData.mint}`);
    console.log(`SFT Vault:        ${SFTData.vault}`);
    console.log(`Collection Mint:  ${SFTData.collectionData.collectionMint}`);
    console.log("\n-------------------------------------------\n");
}


main();