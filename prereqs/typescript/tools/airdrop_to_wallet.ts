import prompt from 'prompt';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// Create a Solana devnet connection to request airdrops
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
    // Start the prompt to gather user input
    prompt.start();

    // Prompt the user for their Solana address (in base58 format) and the amount of SOL they want to airdrop
    console.log('Enter your address and how much SOL to airdrop:');
    const { address, sol } = await prompt.get(['address', 'sol']); // Fetch address and SOL amount from user input

    // Convert the input address to a PublicKey instance
    const wallet = new PublicKey(address as string);

    try {
        // Request an airdrop for the specified SOL amount (converted to lamports)
        const txhash = await connection.requestAirdrop(wallet, LAMPORTS_PER_SOL * parseInt(sol as string));

        // Log the success and provide a link to view the transaction on Solana Explorer
        console.log(`Success! Check out your TX here:\nhttps://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch (e) {
        // Log any errors encountered during the airdrop request
        console.error(`Oops, something went wrong: ${e}`);
    }
})();
