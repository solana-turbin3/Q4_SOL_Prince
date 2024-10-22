import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallet from "./../../Turbin3-wallet.json";

// Load the keypair (wallet) from the secret key stored in the JSON file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Connect to the Solana devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

(async ()=>{
    try {
        // Request an airdrop of 2 SOL (converted to lamports) to the wallet's public key
        const txhash = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);

        // Log the transaction hash and provide a link to the Solana Explorer for checking the transaction
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch(e){
        // Log any errors encountered during the process
        console.error(`Error: ${e}`);
    }
})();
