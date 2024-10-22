import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../../Turbin3-wallet.json"; // Import the wallet containing the secret key
import base58 from "bs58"; // Library to encode and decode base58

// Define the Solana devnet RPC endpoint
const RPC_ENDPOINT = "https://api.devnet.solana.com";

// Create a UMI connection to the specified RPC endpoint
const umi = createUmi(RPC_ENDPOINT);

// Load the keypair from the wallet JSON file
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

// Create a signer from the keypair and set it as the identity for UMI
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner)); // Use the signer identity for transactions

// Include the MPL token metadata plugin for NFT operations
umi.use(mplTokenMetadata());

// Generate a new signer for the minting process
const mint = generateSigner(umi);

(async () => {
    // Create the transaction to mint a new NFT
    let tx = createNft(umi, {
        mint, // The generated mint signer
        name: "Jeff's beard rug", // The name of the NFT
        symbol: "long", // The symbol for the NFT
        uri: "https://devnet.irys.xyz/596ZjtA4eNdb6aAdwzpvDMrWTeWDH985F5tjYEkkZeBs", // URI for the NFT metadata
        sellerFeeBasisPoints: percentAmount(1), // Seller fee in basis points (1% in this case)
    });

    // Send the transaction and wait for confirmation
    let result = await tx.sendAndConfirm(umi);
    
    // Encode the transaction signature to base58 for easy readability
    const signature = base58.encode(result.signature);
    
    // Log success message with the transaction link
    console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Log the mint address of the newly created NFT
    console.log("Mint Address: ", mint.publicKey);
})();
