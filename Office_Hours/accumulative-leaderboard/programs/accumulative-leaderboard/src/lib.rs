use anchor_lang::prelude::*;

declare_id!("8uiBKFYXETht5vkNegA4dSR3X2Z7FZAHupaq24oiKndg");

#[program]
pub mod acumulative_leaderboard {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.global.authority = *ctx.accounts.payer.key;
        ctx.accounts.global.leaderboard = Vec::with_capacity(10);
        Ok(())
    }

    pub fn play(ctx: Context<Play>) -> Result<()> {
        ctx.accounts.user.plays = ctx.accounts.user.plays.checked_add(1).unwrap();

        let position = ctx
            .accounts
            .global
            .leaderboard
            .iter()
            .position(|x| x.address == ctx.accounts.payer.key());

        if position.is_some() {
            let index = position.unwrap();
            ctx.accounts.global.leaderboard[index].plays = ctx.accounts.user.plays;
        } else if ctx.accounts.global.leaderboard.len() < 10
            || ctx.accounts.user.plays
                > ctx.accounts.global.leaderboard[ctx.accounts.global.leaderboard.len() - 1].plays
        {
            if !ctx.accounts.global.leaderboard.is_empty()
                && ctx.accounts.user.plays
                    > ctx.accounts.global.leaderboard[ctx.accounts.global.leaderboard.len() - 1]
                        .plays
            {
                ctx.accounts.global.leaderboard.pop();
            }
            let user_obj = UserStruct {
                address: ctx.accounts.payer.key(),
                plays: ctx.accounts.user.plays,
            };

            ctx.accounts.global.leaderboard.push(user_obj);
            ctx.accounts
                .global
                .leaderboard
                .sort_by(|a, b| b.plays.cmp(&a.plays));
        }
        ctx.accounts
            .global
            .leaderboard
            .sort_by(|a, b| b.plays.cmp(&a.plays));

        emit!(PlayEvent {
            leaderboard: ctx.accounts.global.leaderboard.clone()
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, seeds = [b"leaderboard"], payer = payer, bump, space = Leaderboard::LEN)]
    pub global: Account<'info, Leaderboard>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init_if_needed, seeds = [b"user", global.key().as_ref(), payer.key().as_ref()], bump, space = User::LEN, payer = payer)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub global: Account<'info, Leaderboard>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Leaderboard {
    pub authority: Pubkey,
    pub leaderboard: Vec<UserStruct>,
}

impl Leaderboard {
    const LEN: usize = 8 + 32 + ((8 + 32) * 10);
}

#[account]
pub struct User {
    pub plays: u64,
}

impl User {
    const LEN: usize = 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UserStruct {
    pub address: Pubkey,
    pub plays: u64,
}

#[event]
pub struct PlayEvent {
    pub leaderboard: Vec<UserStruct>,
}
