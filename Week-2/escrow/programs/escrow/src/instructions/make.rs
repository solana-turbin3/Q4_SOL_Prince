use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked}
};

use crate::state::Escrow;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    /// The account of the user initiating the escrow.
    #[account(mut)]
    pub maker: Signer<'info>,   

    /// The mint for the token that the maker will deposit into the escrow.
    /// Ensures the mint is associated with the specified token program.
    // #[account(
    //     mint::token_program = token_program
    // )]
    pub mint_a: InterfaceAccount<'info, Mint>,

    /// The mint for the token that the maker expects to receive in return.
    /// Also ensures the mint is tied to the specified token program.
    // #[account(
    //     mint::token_program = token_program
    // )]
    pub mint_b: InterfaceAccount<'info, Mint>,

    /// The maker's associated token account (ATA) for the token they are depositing.
    /// This account must:
    /// - Be initialized and associated with the `maker`.
    /// - Use `mint_a` as its mint.
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    /// The escrow account that holds metadata about the transaction.
    /// It is initialized using a unique seed for the maker, allowing multiple escrows.
    #[account(
        init,
        payer = maker,
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()], // Unique seed for each escrow.
        bump,
        space = 8 + Escrow::INIT_SPACE, // Allocate enough space for the Escrow struct.
    )]
    pub escrow: Account<'info, Escrow>,

    /// The vault account where the maker's tokens are deposited for the escrow.
    /// It is:
    /// - An ATA for `mint_a`.
    /// - Owned by the `escrow` account for secure custody of the tokens.
    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        // associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// The program that manages associated token accounts.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The token program used for transfers and other token operations.
    pub token_program: Interface<'info, TokenInterface>,

    /// The system program used for creating accounts and handling SOL.
    pub system_program: Program<'info, System>,
}

impl<'info> Make<'info> {
    /// Initializes the escrow metadata with the provided parameters.
    /// 
    /// - `seed`: A unique identifier for the escrow.
    /// - `receive`: The amount of tokens the maker expects to receive in return.
    /// - `bump`: The bump seed for the escrow PDA to ensure correct account derivation.
    pub fn init_escrow(&mut self, seed: u64, receive: u64, bumps: &MakeBumps) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seed, // Unique identifier for the escrow.
            maker: self.maker.key(), // The maker's public key.
            mint_a: self.mint_a.key(), // The mint of the token being deposited.
            mint_b: self.mint_b.key(), // The mint of the token expected in return.
            receive, // Amount of tokens to receive in the trade.
            bump: bumps.escrow, // Bump seed for the escrow PDA.
        });
        Ok(())
    }

    /// Handles depositing tokens into the vault as part of the escrow setup.
    /// 
    /// - `deposit`: The amount of tokens the maker wants to deposit into the escrow.
    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        // Prepare the accounts and context for the token transfer.
        let cpi_program = self.token_program.to_account_info(); // Token program account info.
        let cpi_accounts = TransferChecked {
            from: self.maker_ata_a.to_account_info(), // Source account (maker's ATA).
            to: self.vault.to_account_info(),        // Destination account (escrow vault).
            authority: self.maker.to_account_info(), // Authority (maker) for the source account.
            mint: self.mint_a.to_account_info(),     // Mint of the tokens being transferred.
        };

        // Create a CPI context for the transfer operation.
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Perform the token transfer and check its success.
        transfer_checked(cpi_ctx, deposit, self.mint_a.decimals)?;

        Ok(())
    }
}
