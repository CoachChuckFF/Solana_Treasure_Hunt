import * as spl from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';
import * as meta from "@metaplex/js";

import { web3, BN } from "@project-serum/anchor";

const NETWORK = anchor.web3.clusterApiUrl('devnet');
const OPTS = { preflightCommitment: "processed" }

export const connectWallet = (onlyIfTrusted?: boolean) => {
    return new Promise<anchor.web3.PublicKey>(async (resolve, reject) => {
        try {
            const { solana } = window as any;
            if (solana) {
                if (solana.isPhantom) {
                    try {
                        solana.connect({ onlyIfTrusted: onlyIfTrusted }).then((result:any)=>{
                            resolve(new anchor.web3.PublicKey(result.publicKey.toString()));
                        }).catch((error:any)=>{
                            reject(`Error ${error}`);
                        })
                    } catch (error) {
                        reject(`Error re-connecting to phantom. ${error}`);
                    }
                }
            } else {
                reject('Solana object not found! Get a Phantom Wallet 👻');
            }
        } catch (error) {
            reject(error);
        }
    });
};


export const getProvider = () => {
    const connection = new anchor.web3.Connection(NETWORK, OPTS.preflightCommitment as any);
    const provider = new anchor.Provider(
      connection, getSolanaWallet(), OPTS.preflightCommitment as any,
    );
    return provider;
}

export const getSolanaWallet = () => {
    const { solana } = window as any;
    return solana;
}
