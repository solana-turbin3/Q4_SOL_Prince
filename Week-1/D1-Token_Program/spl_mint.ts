import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../../Turbin3-wallet.json";

// Load the keypair from the wallet JSON file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Define the commitment level for transaction confirmations
const commitment: Commitment = "confirmed";

// Establish a connection to the Solana devnet
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Define the token's decimal places (in this case, 6 decimals)
const token_decimals = 1_000_000n; // BigInt format for precise minting

// The mint public key for the token we want to work with
const mint = new PublicKey("HmTmrAbxtpTFc4RFPxTsu1LHgUaYsjoTV5Vb8DjgGDYg");

(async () => {
  try {
    // Get or create the associated token account (ATA) for the keypair
    // Parameters:
    // - connection: The Solana connection object
    // - keypair: The wallet of the owner
    // - mint: The mint address of the token
    // - keypair.publicKey: The owner of the token account (in this case, the same wallet)
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    console.log(`Success! ATA created at ${ata.address.toBase58()}`);

    // Mint the specified amount of tokens to the created ATA
    // Parameters:
    // - connection: Solana connection object
    // - keypair: The payer (and mint authority in this case)
    // - mint: The mint address of the token
    // - ata.address: The associated token account to mint to
    // - keypair.publicKey: The authority for the minting
    // - token_decimals: Amount of tokens to mint (considering decimal places)
    const mintTx = await mintTo(
      connection,
      keypair,
      mint,
      ata.address,
      keypair.publicKey,
      token_decimals
    );

    // Log the success details: the transaction signature and the minted amount
    console.log(`Success! Minted transaction at ${mintTx}`);
    console.log(`Success! Minted ${token_decimals} tokens to ${ata.address.toBase58()}`);
  } catch (e) {
    // Log any errors encountered during the ATA creation or minting process
    console.error(`Error: ${e}`);
  }
})();
