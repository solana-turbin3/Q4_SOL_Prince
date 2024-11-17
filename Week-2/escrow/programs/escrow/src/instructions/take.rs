use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked}
};
// create context
#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker:Signer<'info>,
    pub mint_a: InterfaceAccount<'info,Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = taker,
    )]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,
    !todo()
}

// deposit token from taker to maker

// transfer token from vault to taker

// close the vault