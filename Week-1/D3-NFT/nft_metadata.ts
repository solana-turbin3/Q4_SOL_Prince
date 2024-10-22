import wallet from "../../Turbin3-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Create a UMI connection to the Solana devnet
const umi = createUmi('https://api.devnet.solana.com');

// Load the keypair from the wallet JSON file
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));

// Create a signer from the keypair
const signer = createSignerFromKeypair(umi, keypair);

// Use the Irys uploader and set the signer identity for transactions
umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow the JSON structure specified in the Metaplex documentation
        // Reference: https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure
        // https://arweave.net/DxEL8waNAdHo6pbrz5RF4oJbksQQYDQtjd8zNt1okE6h

        const image = "https://devnet.irys.xyz/DxEL8waNAdHo6pbrz5RF4oJbksQQYDQtjd8zNt1okE6h"; // Image URI

        // Define the metadata for the token
        const metadata = {
            name: "Crypto Ape", // Name of the token
            symbol: "Ape", // Token symbol
            description: "Rich Ape", // Description of the token
            image: image, // Link to the image associated with the token
            attributes: [ // Attributes that describe the token
                { trait_type: 'color', value: 'white' },
                { trait_type: 'Dress color', value: 'green' },
                { trait_type: 'rarity', value: '100%' },
            ],
            properties: { // Additional properties for the token
                files: [ // Array of files associated with the token
                    {
                        type: "image/png", // File type
                        uri: image // URI of the file
                    },
                ]
            },
            creators: [keypair.publicKey] // Creator's public key
        };

        // Upload the metadata JSON and retrieve the URI
        const myUri = await umi.uploader.uploadJson(metadata); // URI for the uploaded metadata
        console.log("Your metadata URI: ", myUri); // Log the metadata URI
    } catch (error) {
        // Log any errors encountered during the process
        console.log("Oops.. Something went wrong", error);
    }
})();
