import bs58 from 'bs58';
import prompt from 'prompt';

(async () => {
    // Start the prompt to accept user input
    prompt.start();

    // Ask the user to input their base58-encoded private key
    console.log('Enter your base58-encoded private key:');
    const { privkey } = await prompt.get(['privkey']); // Fetch private key input from the user

    // Decode the base58-encoded private key into its original byte format (Uint8Array)
    const wallet = bs58.decode(privkey as string);

    // Print out the decoded wallet in byte format
    console.log(`Your wallet file is:\n[${wallet}]`);
})();
