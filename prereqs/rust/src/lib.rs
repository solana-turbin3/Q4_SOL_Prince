mod programs;

#[cfg(test)]
mod tests {

    use crate::programs::turbin3_prereq::{CompleteArgs, WbaPrereqProgram};
    use bs58;
    use solana_client::rpc_client::RpcClient;
    use solana_program::{pubkey::Pubkey, system_instruction::transfer};
    use solana_sdk::{
        message::Message, signature::{read_keypair_file, Keypair, Signer}, system_program, transaction::Transaction
    };
    use std::io::{self, BufRead};
    use std::str::FromStr;

    const RPC_URL: &str = "https://api.devnet.solana.com";

    #[test]
    fn prereq() {
        // Load the signer's wallet from a file
        let signer = read_keypair_file("Turbin3-wallet.json").expect("Couldn't read wallet file");

        // Derive the Program Derived Address (PDA) for the prerequisite program
        let prereq = WbaPrereqProgram::derive_program_address(
            &[b"prereq", signer.pubkey().to_bytes().as_ref()]
        );

        // Set up the arguments for the prerequisite completion
        let args = CompleteArgs {
            github: b"prince981620".to_vec()
        };

        // Initialize the RPC client
        let rpc_client = RpcClient::new(RPC_URL);

        // Get the latest blockhash
        let blockhash = rpc_client.get_latest_blockhash().expect("Unable to get recent blockhash");

        // Create the transaction for completing the prerequisite
        let transaction = WbaPrereqProgram::complete(
            &[&signer.pubkey(), &prereq, &system_program::id()],
            &args,
            Some(&signer.pubkey()),
            &[&signer],
            blockhash
        );

        // Send and confirm the transaction
        let signature = rpc_client.send_and_confirm_transaction(&transaction).expect("Failed to send transaction");
        println!("Transaction sent! Check it here: https://explorer.solana.com/tx/{}?cluster=devnet", signature);
    }
    
    #[test]
    fn keygen() {
        // Generate a new Solana wallet keypair
        let kp = Keypair::new();
        println!("You have generated a new Solana wallet: {}", kp.pubkey().to_string());
        println!("");
        println!("To save your wallet, copy and paste the following into a JSON file:");
        println!("{:?}", kp.to_bytes());
    }

    #[test]
    fn airdrop() {
        // Load the keypair from a file
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't read wallet file");

        // Initialize the RPC client
        let client = RpcClient::new(RPC_URL);

        // Request an airdrop of 2 SOL
        match client.request_airdrop(&keypair.pubkey(), 2_000_000_000u64) {
            Ok(sig) => {
                println!("Airdrop successful! Check your transaction here:");
                println!("https://explorer.solana.com/tx/{}?cluster=devnet", sig.to_string());
            }
            Err(e) => {
                println!("Airdrop failed: {:?}", e.to_string());
            }
        }
    }

    #[test]
    fn transfer_sol() {
        // Load the keypair from a file
        let keypair = read_keypair_file("dev-wallet.json").expect("Couldn't read wallet file");

        // Define the recipient's public key
        let to_pubkey = Pubkey::from_str("7MBcR9GQs94CWwL2SwzgSuhTa8guzb1dAVTDPCpnFzr9").unwrap();

        // Initialize the RPC client
        let rpc_client = RpcClient::new(RPC_URL);

        // Get the balance of the sender's wallet
        let balance = rpc_client.get_balance(&keypair.pubkey()).expect("Failed to get balance");

        // Get the latest blockhash
        let recent_blockhash = rpc_client.get_latest_blockhash().expect("Failed to get recent blockhash");

        // Create a mock transaction to calculate fees
        let message = Message::new_with_blockhash(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance)],
            Some(&keypair.pubkey()),
            &recent_blockhash
        );

        // Get the fee for the transaction
        let fee = rpc_client.get_fee_for_message(&message).expect("Failed to get fee");

        // Create and sign the transaction
        let transaction = Transaction::new_signed_with_payer(
            &[transfer(&keypair.pubkey(), &to_pubkey, balance - fee)],
            Some(&keypair.pubkey()),
            &vec![&keypair],
            recent_blockhash,
        );

        // Send and confirm the transaction
        let signature = rpc_client.send_and_confirm_transaction(&transaction).expect("Failed to send transaction");
        println!("Transaction sent! Check it here: https://explorer.solana.com/tx/{}?cluster=devnet", signature);
    }

    #[test]
    fn base58_to_wallet() {
        println!("Enter your private key as base58:");
        let stdin = io::stdin();
        let base58 = stdin.lock().lines().next().unwrap().unwrap();

        // Decode the base58 private key into a wallet byte array
        let wallet = bs58::decode(base58).into_vec().unwrap();
        println!("Your wallet file is:");
        println!("{:?}", wallet);
    }

    #[test]
    fn wallet_to_base58() {
        println!("Input your private key as a wallet file byte array:");
        let stdin = io::stdin();
        let wallet = stdin
            .lock()
            .lines()
            .next()
            .unwrap()
            .unwrap()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .split(',')
            .map(|s| s.trim().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();

        // Encode the wallet byte array into a base58 private key
        let base58 = bs58::encode(wallet).into_string();
        println!("Your base58 private key is:");
        println!("{:?}", base58);
    }
}
