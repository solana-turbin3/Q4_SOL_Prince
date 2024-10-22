import bs58 from 'bs58';
import prompt from 'prompt';

(async () => {
    // Start the prompt to accept user input
    prompt.start();

    // Prompt the user to input their wallet file (as a JSON string)
    console.log('Enter your wallet file:');
    const { privkey } = await prompt.get(['privkey']); // Fetch the wallet file input from the user

    // Parse the wallet file (assumed to be a JSON string), convert it to a Buffer, and then encode it in base58
    const wallet = bs58.encode(Buffer.from(JSON.parse(privkey as string)));

    // Print the resulting base58-encoded private key
    console.log(`Your base58-encoded private key is:\n${wallet}`);
})();
