import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import wallet from "../../Turbin3-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// Load the keypair from the wallet JSON file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a connection to the Solana devnet with a specified commitment level
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Define the mint address for the token to be transferred
const mint = new PublicKey("LeB8ocXrkrRSP1xFevFTGB8j6rRcxhwyzZMTaPKGnX8");

// Define the recipient's address where tokens will be sent
const to = new PublicKey("9RPLHqpXmpyWDDy13p6NLmHqgi1LV8GPvhB94MxWoZRp");

(async () => {
    try {
        // Get the associated token account (ATA) for the sender's wallet
        // If it doesn't exist, it will be created
        const ataFrom = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            keypair.publicKey // The owner's public key (sender)
        );

        // Get the associated token account (ATA) for the recipient's wallet
        // If it doesn't exist, it will be created
        const ataTo = await getOrCreateAssociatedTokenAccount(
            connection,
            keypair,
            mint,
            to // The recipient's public key
        );

        // Transfer tokens from the sender's ATA to the recipient's ATA
        // Here, we are transferring 1,000,000 tokens (adjusted to the token's decimals)
        const tx = await transfer(
            connection,
            keypair,              // The payer for the transaction
            ataFrom.address,      // The source token account (sender)
            ataTo.address,        // The destination token account (recipient)
            keypair.publicKey,    // The authority for the transfer (sender)
            1_000_000n,          // Amount of tokens to transfer (in the smallest units)
        );

        // Log the transaction signature
        console.log(`Transfer successful! Transaction signature: ${tx}`);
    } catch(e) {
        // Log any errors encountered during the process
        console.error(`Oops, something went wrong: ${e}`);
    }
})();
