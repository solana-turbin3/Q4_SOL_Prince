use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked, CloseAccount, close_account};

use crate::state::Escrow;

#[derive(Accounts)]
pub struct Refund<'info> {
    /// The account of the maker who initiated the escrow.
    #[account(mut)]
    maker: Signer<'info>,

    /// The mint for the token being refunded.
    /// This ensures the refund is for the correct token type.
    mint_a: InterfaceAccount<'info, Mint>,

    /// The maker's associated token account (ATA) for the token being refunded.
    /// - This account must already be associated with the maker.
    /// - It uses `mint_a` as the mint.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    /// The escrow account storing metadata about the transaction.
    /// - It must:
    ///   - Be associated with `mint_a`.
    ///   - Have the maker as the authority.
    /// - This account will be closed after the refund is complete.
    #[account(
        mut,
        close = maker, // Upon closing, the lamports will be refunded to the maker.
        has_one = mint_a, // Ensures the escrow is for the correct token mint.
        has_one = maker,  // Ensures the maker is the authority of the escrow.
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()], // PDA derivation for the escrow account.
        bump = escrow.bump, // The bump seed used to generate the PDA.
    )]
    pub escrow: Account<'info, Escrow>,

    /// The vault holding the tokens deposited into the escrow.
    /// - This is an ATA associated with the escrow account.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    vault: InterfaceAccount<'info, TokenAccount>,

    /// The token program that facilitates token operations such as transfers and account closures.
    token_program: Interface<'info, TokenInterface>,

    /// The system program used for account closures and transferring lamports.
    system_program: Program<'info, System>,
}

impl<'info> Refund<'info> {
    /// Refunds tokens from the escrow's vault back to the maker's ATA and closes the vault account.
    pub fn refund_and_close_vault(&mut self) -> Result<()> {
        // --- Step 1: Refund Tokens from Vault to Maker's ATA ---
        // Define the seeds required to sign as the escrow PDA.
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",                        // Escrow identifier.
            self.maker.key.as_ref(),          // Maker's public key.
            &self.escrow.seed.to_le_bytes(),  // Unique seed for this escrow.
            &[self.escrow.bump]               // Escrow bump seed for PDA derivation.
        ]];

        // Prepare the CPI (Cross-Program Invocation) context for transferring tokens.
        let cpi_program = self.token_program.to_account_info(); // Token program account info.
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),        // Source: Vault account holding the tokens.
            to: self.maker_ata_a.to_account_info(),    // Destination: Maker's ATA.
            mint: self.mint_a.to_account_info(),       // Token mint for the transfer.
            authority: self.escrow.to_account_info(),  // Authority: Escrow PDA.
        };

        // Perform the token transfer using the escrow PDA as the signer.
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);
        transfer_checked(cpi_context, self.vault.amount, self.mint_a.decimals)?;

        // --- Step 2: Close the Vault Account ---
        // Prepare the CPI context for closing the vault account.
        let cpi_program = self.token_program.to_account_info(); // Token program account info.
        let cpi_account = CloseAccount {
            account: self.vault.to_account_info(),       // Vault account to be closed.
            destination: self.maker.to_account_info(),   // Recipient of remaining lamports in the vault.
            authority: self.escrow.to_account_info(),    // Authority: Escrow PDA.
        };

        // Close the vault account using the escrow PDA as the signer.
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_account, &signer_seeds);
        close_account(cpi_context)?;

        Ok(())
    }
}
