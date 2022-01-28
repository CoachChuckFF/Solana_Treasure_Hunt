use anchor_lang::prelude::*;

declare_id!("8oLQrC9nJo7NkEZtAoGgsdXWLPWuPycqwwYbadV5ELXW");

#[program]
pub mod soltreasure {
  use super::*;
  pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
    // Get a refernce to the account.__rust_force_expr!
    let base_account = &mut ctx.accounts.base_account;
    // Initalize total_gifs
    base_account.total_gifs = 0;
    Ok(())
  }

  pub fn lock_chest(ctx: Context<LockChest>, key0: u64, key1: u64, key2: u64, broken_keys: u64, treasure: u64) -> ProgramResult {

    let treasure_chest = &mut ctx.accounts.treasure_chest;
    
    treasure_chest.key0_count = key0;
    treasure_chest.key1_count = key1;
    treasure_chest.key2_count = key2;
    treasure_chest.broken_keys = broken_keys;
    treasure_chest.treasure_count = treasure;

    Ok(())
  }

  pub fn mint_key_0(ctx: Context<MintKey0>, amount: u64, change: u64) -> ProgramResult {
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.from.key(),
        &ctx.accounts.to.key(),
        amount,
    );
    let result = anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.from.to_account_info(),
            ctx.accounts.to.to_account_info(),
        ],
    );

    Ok(())
  }

  pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> ProgramResult {
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.from.key(),
        &ctx.accounts.to.key(),
        amount,
    );
    return anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.from.to_account_info(),
            ctx.accounts.to.to_account_info(),
        ],
    );
  }

  pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
    // &mut allows us to have mutable access to the base_account
    let base_account = &mut ctx.accounts.base_account;
    let user = &mut ctx.accounts.user;

    // Build the struct
    let item = ItemStruct {
        gif_link: gif_link.to_string(),
        user_address: *user.to_account_info().key,
    };

    // Add it to the gif_list vector
    base_account.gif_list.push(item);
    base_account.total_gifs += 1;
    Ok(())
  }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct LockChest<'info> {
    #[account(init, payer = hunter, space = 9000)]
    pub treasure_chest: Account<'info, TreasureChest>,
    #[account(mut)]
    pub hunter: Signer<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct MintKey0<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct SendSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program <'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}

#[account]
pub struct TreasureChest {
    pub key0_count: u64,
    pub key1_count: u64,
    pub key2_count: u64,
    pub broken_keys: u64,
    pub treasure_count: u64,
}

#[error]
pub enum ErrorCode {
    #[msg("Naughty")]
    SomethingBad,
}