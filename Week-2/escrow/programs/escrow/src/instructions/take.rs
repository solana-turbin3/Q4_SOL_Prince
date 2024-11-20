use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token::{close_account, CloseAccount}, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked}
};

use crate::state::Escrow;

// create context
#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker:Signer<'info>,
    pub maker: SystemAccount<'info>,
    pub mint_a: InterfaceAccount<'info,Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_b,
        associated_token::authority = maker,
    )]
    pub maker_ata_b: InterfaceAccount<'info, TokenAccount>, // we will send b token to maker
    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker, 
    )]
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>, // we will deduct b token from taker
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
    )]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>, // we will add a token to taker
    #[account(
        mut,
        close = taker,
        has_one = maker,
        has_one = mint_a,
        has_one = mint_b,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    /// The program that manages associated token accounts.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The token program used for transfers and other token operations.
    pub token_program: Interface<'info, TokenInterface>,

    /// The system program used for creating accounts and handling SOL.
    pub system_program: Program<'info, System>,
}

impl<'info> Take<'info> {
    // deposit token from taker to maker
    pub fn deposit(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_account = TransferChecked {
            from: self.taker_ata_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info(),
            mint: self.mint_b.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_account);
        transfer_checked(cpi_ctx, self.escrow.receive, self.mint_b.decimals)
    }
// transfer token from vault to taker
    pub fn withdraw_and_close_vault(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",                        // Escrow identifier.
            self.maker.key.as_ref(),          // Maker's public key.
            &self.escrow.seed.to_le_bytes(),  // Unique seed for this escrow.
            &[self.escrow.bump]               // Escrow bump seed for PDA derivation.
        ]];
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
            mint: self.mint_a.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);
        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;
// close the vault

        let cpi_program = self.token_program.to_account_info();
        let cpi_account = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.taker.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_account, &signer_seeds);
        close_account(cpi_ctx)
    }
}