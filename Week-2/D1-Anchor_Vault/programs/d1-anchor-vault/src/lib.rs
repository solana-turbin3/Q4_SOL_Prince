use anchor_lang::{prelude::*, system_program::{Transfer, transfer}};

declare_id!("49ehR7TJnd1v8nzWxeEEvf4xCRevYFrvUxhQuuA29A9A");

#[program]
pub mod anchor_vault {
    use super::*;

    /// Initializes the `vault_state` by setting its bump values.
    /// - Calls `initialize` on the `Initialize` context, storing the PDA bumps within `vault_state`.
    /// - This step is necessary for setting up the vault's initial state, allowing subsequent interactions to verify PDAs.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Initializes `vault_state` by storing PDA bump values for future use
        ctx.accounts.initialize(&ctx.bumps)?;

        Ok(())
    }

    /// Deposits a specified `amount` of SOL into the `vault` account.
    /// - Calls `deposit` on the `Deposit` context, which handles the SOL transfer.
    /// - This allows users to securely send SOL into the vault after initialization.
    pub fn deposit(ctx: Context<Operation>, amount: u64) -> Result<()> {
        // Executes the deposit function, transferring `amount` from `user` to `vault`
        ctx.accounts.deposit(amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Operation>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw(amount)?;

        Ok(())
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close()?;

        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The user initializing the vault state account. Must sign the transaction.
    #[account(mut)] // mutable because it needs to pay for account creation which will change the num of lamports in account.
    pub user: Signer<'info>, // so we need user as signer and info -> lifetime of variable

    /// The VaultState account to store the PDA bumps and relevant state data.
    /// - Initializes with the user's funds (`payer = user`).
    /// - Uses a PDA derived from the seed "state" and the user's public key.
    /// - Allocates space based on `VaultState::INIT_SPACE`.
    #[account(
        init,                       // Indicates this account is created in this instruction
        payer = user,               // Specifies the user as the payer for account creation
        seeds = [b"state", user.key().as_ref()], // Seeds for PDA derivation [byte representation]
        bump,                       // Automatically calculates and stores the PDA [canonical bump] in the account
        space = VaultState::INIT_SPACE, // Allocates the required space for VaultState struct data
    )]
    pub vault_state: Account<'info, VaultState>,

    /// The vault account (SystemAccount) associated with VaultState.
    /// - Uses a PDA derived from the seed "vault" and the `vault_state` account's public key.
    /// - No initialization as system program will initialize it when it has enough lamport to get rent exempt. & vice versa
    /// - No need to pass space as space taken by sys-program is 0.
    #[account(
        seeds = [b"vault", vault_state.key().as_ref()], // Seeds for PDA derivation
        bump,                       // Uses the bump to find the exact PDA address
    )]
    pub vault: SystemAccount<'info>,

    /// Reference to the System Program, required for account initialization and funding.
    pub system_program: Program<'info, System>,
}

// #[derive(Accounts)]
// pub struct Deposit<'info> {
//     /// The user signing the transaction to deposit SOL into the vault.
//     /// as we are deducting lamports from user it must be mutable
//     #[account(mut)]
//     pub user: Signer<'info>,

//     /// The vault account to receive deposited funds.
//     /// - Mutable because funds will be transferred to this account.
//     /// - Uses a PDA derived from `vault_state`'s public key with the seed "vault".
//     /// - No need to recalculate the bump; instead, we use the stored bump (`vault_state.vault_bump`) for verification.
//     #[account(
//         mut,                                          // Allows the vault balance to increase with deposits
//         seeds = [b"vault", vault_state.key().as_ref()], // PDA seeds derived from "vault" and `vault_state` key
//         bump = vault_state.vault_bump,                 // Uses the pre-stored bump from `vault_state` to locate PDA
//     )]
//     pub vault: SystemAccount<'info>,

//     /// The account storing state and PDA bump values for `vault` and `state`.
//     /// - Uses a PDA derived from the user's key with the seed "state".
//     /// - Uses the stored bump (`state_bump`) to find the exact PDA.
//     /// - No need to be mut because we are not altering anything.
//     #[account(
//         seeds = [b"state", user.key().as_ref()],      // PDA seeds derived from "state" and user's public key
//         bump = vault_state.state_bump,                // Uses the pre-stored bump for PDA verification
//     )]
//     pub vault_state: Account<'info, VaultState>,

//     /// System Program reference, needed to transfer native SOL.
//     pub system_program: Program<'info, System>,       // Essential for SOL transfers within CPI
// }


// impl<'info> Deposit<'info> {
//     /// Transfers a specified `amount` of SOL from `user` to `vault`.
//     pub fn deposit(&mut self, amount: u64) -> Result<()> {
//         // Sets up the CPI context for the system program's `transfer` function
//         let cpi_program = self.system_program.to_account_info();

//         // Specifies the accounts involved in the transfer
//         let cpi_accounts = Transfer {
//             from: self.user.to_account_info(),       // Source: `user`'s account
//             to: self.vault.to_account_info(),        // Destination: `vault` account
//         };

//         // Builds the CPI context for transferring SOL
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

//         // Executes the SOL transfer
//         transfer(cpi_ctx, amount)?;

//         Ok(())
//     }
// }
 // since both deposit and withdraw has same context we can create one context as operation and implemet both deposit and withdraw inside this
#[derive(Accounts)]
pub struct Operation<'info> {
    #[account(mut)] // Marks the user's account as mutable because they will receive lamports, modifying their balance
    pub user: Signer<'info>, // user is signer because we need to varify the if the vault is derived from the user otherwise anyone will be able to empty my vault

    #[account(
        mut, // Allows the vault account balance to be modified as lamports will be withdrawn from it
        seeds = [b"vault", vault_state.key().as_ref()], // Seeds used to derive this vault account address
        bump = vault_state.vault_bump, // The "bump" seed for the derived address, ensuring uniqueness
    )]
    pub vault: SystemAccount<'info>, // System account representing the vault holding the lamports

    #[account(
        seeds = [b"state", user.key().as_ref()], // Seeds to derive the `vault_state` account address using the user's key
        bump = vault_state.state_bump, // Bump seed to uniquely identify this state account
    )]
    pub vault_state: Account<'info, VaultState>, // Stores state information for the vault, including bumps and other metadata

    pub system_program: Program<'info, System> // Reference to the System Program for transferring lamports
}

impl<'info> Operation<'info> {

    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        // Sets up the CPI context for the system program's `transfer` function
        let cpi_program = self.system_program.to_account_info();

        // Specifies the accounts involved in the transfer
        let cpi_accounts = Transfer {
            from: self.user.to_account_info(),       // Source: `user`'s account
            to: self.vault.to_account_info(),        // Destination: `vault` account
        };

        // Builds the CPI context for transferring SOL
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Executes the SOL transfer
        transfer(cpi_ctx, amount)?;

        Ok(())
    }

    // Withdraw function to transfer specified amount of lamports from the vault to the user's account
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        // Prepare the `to_account_info` for `system_program` to perform the CPI (Cross-Program Invocation) transfer
        let cpi_program = self.system_program.to_account_info();

        // Define the accounts involved in the transfer: vault (from) and user (to)
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        // Seeds needed to sign the transaction on behalf of the vault (PDA, or Program Derived Address)
        let seeds = &[
            b"vault", // First part of the seed for the vault
            self.vault_state.to_account_info().key.as_ref(), // Public key reference to the vault state
            &[self.vault_state.vault_bump], // Bump seed for the vault account
        ];
        let signer_seeds = &[&seeds[..]]; // Seed format for using with `with_signer`

        // Create the CPI context, which includes the signer seeds and accounts for the transfer instruction
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program, // Program to invoke
            cpi_accounts, // Accounts for the transfer
            signer_seeds // Seeds used to authenticate the vault account
        );

        // Execute the transfer, moving `amount` lamports from the vault to the user's account
        transfer(cpi_ctx, amount)?;

        Ok(()) // Return success if transfer is completed without error
    }


}

#[derive(Accounts)]
// The `Close` struct represents the accounts and state involved in the close operation.
pub struct Close<'info> {
    #[account(mut)] // Marks `user` as mutable (allowed to change).
    pub user: Signer<'info>, // The user signing this transaction.
    
    #[account(
        mut, // `vault` is also mutable.
        seeds = [b"vault", vault_state.key().as_ref()], // Derives the vault's address from a seed prefix and vault_state's public key.
        bump = vault_state.vault_bump, // Ensures the account can be found by the `bump` seed.
    )]
    pub vault: SystemAccount<'info>, // Represents the vault account to be closed.
    
    #[account(
        mut, // `vault_state` is mutable.
        seeds = [b"state", user.key().as_ref()], // Derives vault_state's address from a seed prefix and user's public key.
        bump = vault_state.vault_bump, // Matches the bump used in the PDA derivation.
        close = user, // Closes `vault_state` account and returns remaining lamports to `user`.
    )]
    pub vault_state: Account<'info, VaultState>, // Custom account holding vault-related state.
    
    pub system_program: Program<'info, System>, // Reference to the system program, used for transferring lamports.
}

impl<'info> Close<'info> {
    // The `close` function transfers all lamports from the `vault` account to the `user` account
    // and then marks the `vault_state` account to be closed.
    pub fn close(&mut self) -> Result<()> {
        // Setup CPI (cross-program invocation) to perform a lamport transfer.
        let cpi_program = self.system_program.to_account_info(); // System program account.
        
        // Define accounts involved in the transfer: `vault` as the source and `user` as the destination.
        let cpi_accounts = Transfer {
            from: self.vault.to_account_info(), // Source: the vault account.
            to: self.user.to_account_info(), // Destination: the user account.
        };

        // Seed array for signing the transaction with the vault PDA (Program Derived Address).
        let seeds = &[
            b"vault", // Seed prefix for the vault.
            self.vault_state.to_account_info().key.as_ref(), // Public key reference to `vault_state`.
            &[self.vault_state.vault_bump], // Bump for PDA generation.
        ];
        
        let signer_seeds = &[&seeds[..]]; // Wrap seeds in an array slice for signer.

        // Create a CPI context with the signer seeds for the system program transfer.
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program, 
            cpi_accounts, 
            signer_seeds,
        );
        
        // Perform the transfer from `vault` to `user` for the vault's entire lamport balance.
        transfer(cpi_ctx, self.vault.lamports())?;

        Ok(())
    }
}


impl<'info> Initialize<'info> {
    /// Initializes the `vault_state` account by setting its stored bump values.
    /// - Uses the bump values from the `InitializeBumps` struct, which contains pre-calculated bumps for PDAs.
    /// - This function is called once during setup to store the bumps for later use in PDA derivations.
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        // Stores the bump for the `vault` PDA in `vault_state`
        self.vault_state.vault_bump = bumps.vault;
        
        // Stores the bump for the `state` PDA in `vault_state`
        self.vault_state.state_bump = bumps.vault_state;

        Ok(())
    }
}


#[account]

// The VaultState struct holds the bump values for the vault and state PDAs.
// Bumps ensure the derived addresses are unique and help with re-deriving them.(basically to find out the exact PDA)
pub struct VaultState {
    /// Bump seed for the vault PDA. Used to recreate the PDA and verify its uniqueness.
    pub vault_bump: u8,

    /// Bump seed for the state PDA. Similar to `vault_bump`, used to recreate the state PDA.
    pub state_bump: u8,
}


impl Space for VaultState {
    const INIT_SPACE: usize = 8 + 1 + 1; // 8 bytes for Anchor discriminator, 2 bytes for bumps (1 byte each)
}
