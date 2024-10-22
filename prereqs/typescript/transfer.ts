import { Transaction, SystemProgram, Connection, PublicKey, Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import wallet from "./../../Turbin3-wallet.json";

// Load the sender's wallet from the secret key stored in the JSON file
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

// The public key of the recipient (hardcoded for this example)
const to = new PublicKey("7MBcR9GQs94CWwL2SwzgSuhTa8guzb1dAVTDPCpnFzr9");

// Connect to the Solana devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

(async()=>{
    try{
        // Fetch the balance of the sender's wallet in lamports
        const balance = await connection.getBalance(from.publicKey);

        // Create a new transaction and add a transfer instruction (sending entire balance initially)
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey, // Sender's public key
                toPubkey: to, // Recipient's public key
                lamports: balance, // Amount to send (entire balance)
            })
        );

        // Set the recent blockhash required for the transaction to be processed
        transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

        // Assign fee payer for the transaction (sender in this case)
        transaction.feePayer = from.publicKey;

        // Estimate the transaction fee based on the current network conditions
        const fee = (await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value || 0;

        // Remove the previous transfer instruction, as we need to subtract the fee from the balance
        transaction.instructions.pop();

        // Add a new transfer instruction, adjusting the balance to account for the fee
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey, // Sender's public key
                toPubkey: to, // Recipient's public key
                lamports: balance - fee, // Subtract fee from the amount to send
            })
        );

        // Sign, send, and confirm the transaction on the network
        const signature = await sendAndConfirmTransaction(
            connection, // Solana connection instance
            transaction, // The transaction object
            [from] // Sign the transaction with the sender's keypair
        );

        // Log the successful transaction with a link to Solana Explorer for viewing
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    } catch(e){
        // Log any errors encountered during the process
        console.error(`Error: ${e}`);
    }
})();
