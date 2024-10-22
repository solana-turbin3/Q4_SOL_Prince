import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./../../Turbin3-wallet.json";

// Load the keypair (wallet) from the secret key stored in the JSON file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Establish a connection to the Solana devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Convert GitHub username to a buffer, as required by the program
const github = Buffer.from("prince981620", "utf-8");

// Create an Anchor provider using the Solana connection and wallet
const provider = new AnchorProvider(connection, new Wallet(keypair), {
    commitment: "confirmed",
});

// Initialize the program using the IDL and provider
const program: Program<Turbin3Prereq> = new Program(IDL, provider);

// Create the PDA (Program Derived Address) for the enrollment account using a seed and public key
const enrollment_seed = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seed, program.programId);

(async () => {
    try {
        // Call the 'complete' method on the program, passing the GitHub buffer and accounts to use
        const txhash = await program.methods
            .complete(github) // Pass GitHub username buffer
            .accounts({
                signer: keypair.publicKey, // The signer of the transaction
            })
            .signers([keypair]) // Sign the transaction with the wallet
            .rpc(); // Send the transaction to the network and get the transaction hash

        // Log the successful transaction with a link to Solana Explorer for verification
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch (e) {
        // Log any errors encountered during the process
        console.error(`Error: ${e}`);
    }
})();
