import wallet from "../../Turbin3-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
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
        // 1. Load the image file from the specified path
        const img = await readFile("/Users/prince/Turbin-3/Q4_Sol_Prince/Week-1/D3-NFT/utils/Crypto_Ape.jpg");
        // 2. Convert the loaded image into a generic file format
        const genImg = createGenericFile(img,"rug",{
            contentType: "image/png"
        })
        // 3. Upload the image using the UMI uploader
        const [uri] = await umi.uploader.upload([genImg]); // https://arweave.net/2vx5k3TCxTBh2xze1uDnDBajoHTp1GfQ6hqBkLYzgJNL
                                                           // https://devnet.irys.xyz/2vx5k3TCxTBh2xze1uDnDBajoHTp1GfQ6hqBkLYzgJNL

        // The uploaded image URI will be stored in the `uri` variable
        console.log("Your image URI: ", uri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
