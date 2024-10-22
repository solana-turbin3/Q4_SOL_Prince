import wallet from "../../Turbin3-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        //1. Load image
        const img = await readFile("/Users/prince/Documents/turbin-3/solana-starter/ts/jeff.png");
        //2. Convert image to generic file.
        const genImg = createGenericFile(img,"rug",{
            contentType: "image/png"
        })
        //3. Upload image
        const [uri] = await umi.uploader.upload([genImg]); // https://arweave.net/2vx5k3TCxTBh2xze1uDnDBajoHTp1GfQ6hqBkLYzgJNL
    // const image = ???                                // https://devnet.irys.xyz/2vx5k3TCxTBh2xze1uDnDBajoHTp1GfQ6hqBkLYzgJNL

        // const [myUri] = ??? 
        console.log("Your image URI: ", uri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
