import { Keypair } from "@solana/web3.js";
import base58 from "bs58";

// Generate a new random keypair (wallet)
let kp = Keypair.generate();

// Get the public key in base58 format (Solana's standard format)
const wallet = kp.publicKey.toBase58();
console.log(`You've generated a new Solana wallet: ${wallet}`);

// Encode the secret key (Uint8Array) in base58 format for readability/storage
const secretKeyBase58 = base58.encode(kp.secretKey);
console.log(`Your secret key in base58: ${secretKeyBase58}`);

// Decode the secret key back from base58 to the original Uint8Array format
const secretKeyBytes = base58.decode(secretKeyBase58);
console.log(`This is your wallet's secret key in bytes: ${secretKeyBytes}`);

// Restore the keypair from the decoded secret key (Uint8Array)
const restoredKeypair = Keypair.fromSecretKey(secretKeyBytes);
console.log(`Restored keypair's secret key: [${restoredKeypair.secretKey}]`);

// For the Turbin wallet, decode the provided base58 private key into Uint8Array
const secretKeyBytesTurbinWallet = base58.decode("Your wallet private key in base58 format");

// Restore the Turbin wallet's keypair from the decoded secret key
const restoredKeypairTurbinWallet = Keypair.fromSecretKey(secretKeyBytesTurbinWallet);

// Get the public key of the restored Turbin wallet in base58 format
const newWallet = restoredKeypairTurbinWallet.publicKey.toBase58();

// Log the restored Turbin wallet's secret key and public key
console.log(`Restored turbin-3 keypair's secret key: [${restoredKeypairTurbinWallet.secretKey}]`);
console.log(`Restored turbin-3 keypair's public key: [${newWallet}]`);
