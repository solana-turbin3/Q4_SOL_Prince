import wallet from "../../Turbin3-wallet.json";
import bs58 from "bs58";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { 
    createMetadataAccountV3, 
    CreateMetadataAccountV3InstructionAccounts, 
    CreateMetadataAccountV3InstructionArgs,
    DataV2Args
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";

// Define the mint address for the token metadata
const mint = publicKey("LeB8ocXrkrRSP1xFevFTGB8j6rRcxhwyzZMTaPKGnX8");

// Create a UMI connection to the Solana Devnet
const umi = createUmi('https://api.devnet.solana.com');

// Generate a signer (user) from the wallet's secret key (loaded from JSON)
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

// Use the signerIdentity for the transaction
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Define the accounts required for the createMetadataAccountV3 transaction
        let accounts: CreateMetadataAccountV3InstructionAccounts = {
            mint: mint,           // The mint account of the token
            mintAuthority: signer // The authority who has control over the mint
        };

        // Define the metadata to be attached to the token
        let data: DataV2Args = {
            name: "Prince Token part2", // Name of the token
            symbol: "TEST2",            // Token symbol
            uri: "",                    // URI for token metadata (typically a JSON file on IPFS or another hosting service)
            sellerFeeBasisPoints: 600,  // Royalties percentage (600 = 6%)
            creators: null,             // Creators (optional)
            collection: null,           // Collection info (optional)
            uses: null                  // Token usage information (optional)
        };

        // Set up arguments for creating the metadata account
        let args: CreateMetadataAccountV3InstructionArgs = {
            data: data,                 // Metadata for the token
            isMutable: false,           // Set whether the metadata is mutable or not
            collectionDetails: null     // Additional collection details (optional)
        };

        // Create the metadata account using the specified accounts and args
        let tx = createMetadataAccountV3(
            umi, 
            {
                ...accounts, // Pass in the required accounts
                ...args      // Pass in the metadata args
            }
        );

        // Send and confirm the transaction
        let result = await tx.sendAndConfirm(umi);

        // Log the transaction signature in base58 format
        console.log(bs58.encode(result.signature)); 
        // Example output: 2PRcyuaULTuhXzw7rbxVUMDACVpTNDyiUz2U2wL2FHCKPppAJMRZSQR6BPuUtT88cFYSdoj57m8UkfvgBz5JsMt7
    } catch(e) {
        // Log any errors that occur during the process
        console.error(`Oops, something went wrong: ${e}`);
    }
})();
