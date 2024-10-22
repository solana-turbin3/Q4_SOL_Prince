import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../../Turbin3-wallet.json";

// Load the keypair (wallet) from the secret key stored in the JSON file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Define the commitment level (confirmation status) for transactions
const commitment: Commitment = "confirmed";

// Establish a connection to the Solana devnet
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
  try {
    // Create a new mint (token) on Solana
    // Parameters:
    // - connection: The Solana connection object
    // - keypair: The payer (and owner of the mint)
    // - keypair.publicKey: The authority who will manage the mint
    // - null: No freeze authority (means tokens can't be frozen)
    // - 6: Number of decimal places for the token (same as USDC/USDT)
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6 // 6 decimal places
    );

    // Output the mint address (in base58 format) after successful creation
    console.log(`Success! Mint created at ${mint.toBase58()}`);
  } catch (e) {
    // Log any errors encountered during the mint creation process
    console.error(`Error: ${e}`);
  }
})();
