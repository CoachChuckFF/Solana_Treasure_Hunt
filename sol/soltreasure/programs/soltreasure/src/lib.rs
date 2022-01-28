use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use std::convert::Into;

declare_id!("BrMDSDPTx2qZ5p1EWWDDom1vgjiLJDwSeVR7mo17o5Tr");

#[program]
pub mod soltreasure {
    use super::*;
    pub fn bury_chest(ctx: Context<BuryChest>, nonce: u8, amount: u64) -> ProgramResult {
        // // Transfer funds to the check.
        // let cpi_accounts = Transfer {
        //     from: ctx.accounts.from.to_account_info().clone(),
        //     to: ctx.accounts.vault.to_account_info().clone(),
        //     authority: ctx.accounts.owner.clone(),
        // };
        // let cpi_program = ctx.accounts.token_program.clone();
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // token::transfer(cpi_ctx, amount)?;

        // // Print the check.
        // let check = &mut ctx.accounts.check;
        // check.amount = amount;
        // check.from = *ctx.accounts.from.to_account_info().key;
        // check.to = *ctx.accounts.to.to_account_info().key;
        // check.vault = *ctx.accounts.vault.to_account_info().key;
        // check.nonce = nonce;
        // check.memo = memo;

        // Ok(())

        // // &mut means its mutable, ie we can change it
        let treasure_chest = &mut ctx.accounts.treasure_chest;

        // Request Key0
        // Request Key1
        // Request Key2
        // Request Broken Keys
        // Request Treasure

        // Set counts to 0
        treasure_chest.key0_count  = 0;
        treasure_chest.key1_count = 0;
        treasure_chest.key2_count = 0;
        treasure_chest.broken_key_count = 0;
        treasure_chest.treasure_count = 0;

        // Set Coach
        treasure_chest.coach = ctx.accounts.coach.key();

        Ok(())
    }

    pub fn mint_key_0(ctx: Context<MintKey0>) -> ProgramResult {

        // if &ctx.accounts.coffee_jar.barista == &ctx.accounts.to.key() {
        //     let instrcution = anchor_lang::solana_program::system_instruction::transfer(
        //         &ctx.accounts.from.key(),
        //         &ctx.accounts.coffee_jar.barista,
        //         lamports,
        //     );
    
        //     let response = anchor_lang::solana_program::program::invoke(
        //         &instrcution,
        //         &[
        //             ctx.accounts.from.to_account_info(),
        //             ctx.accounts.to.to_account_info(),
        //         ],
        //     );

        //     if response.is_ok() {

        //         let coffee_jar_account = &mut ctx.accounts.coffee_jar;
        //         coffee_jar_account.coffee_count  = coffee_jar_account.coffee_count + 1;
        //         coffee_jar_account.lamport_count = coffee_jar_account.lamport_count + lamports;

        //         return Ok(());
                
        //     } else {
        //         return Err(ErrorCode::SomethingBad.into());
        //     }
        // }

        // return Err(ErrorCode::WrongBarista.into());

        Ok(())
    }
}

// #[account]
// pub struct Check {
//     from: Pubkey,
//     to: Pubkey,
//     amount: u64,
//     memo: Option<String>,
//     vault: Pubkey,
//     nonce: u8,
//     burned: bool,
// }

// #[derive(Accounts)]
// pub struct CreateCheck<'info> {
//     // Check being created.
//     #[account(zero)]
//     check: Account<'info, Check>,
//     // Check's token vault.
//     #[account(mut, constraint = &vault.owner == check_signer.key)]
//     vault: Account<'info, TokenAccount>,
//     // Program derived address for the check.
//     check_signer: AccountInfo<'info>,
//     // Token account the check is made from.
//     #[account(mut, has_one = owner)]
//     from: Account<'info, TokenAccount>,
//     // Token account the check is made to.
//     #[account(constraint = from.mint == to.mint)]
//     to: Account<'info, TokenAccount>,
//     // Owner of the `from` token account.
//     owner: AccountInfo<'info>,
//     token_program: AccountInfo<'info>,
// }


// Constructor - Bury the chest
#[derive(Accounts)]
pub struct BuryChest<'info> {
    #[account(init, payer = coach, space = (1 + (8 * 5) + 40))] 
    pub treasure_chest: Account<'info, TreasureChest>,      
    #[account(mut)]
    pub coach: Signer<'info>,       
    pub system_program: Program <'info, System>,   
}

// Function - Mint Key 0
#[derive(Accounts)]
pub struct MintKey0<'info> {
    #[account(mut)]
    pub treasure_chest: Account<'info, TreasureChest>,   // the coffee jar account!
    #[account(mut)]
    pub minter: Signer<'info>,                           // who is sending the sol
    pub system_program: Program <'info, System>,           // literally solana itself
}


// Struct - Treasure Chest (1 + (8 * 5) + 40)
#[account]
pub struct TreasureChest {
    pub nonce: u8,
    pub key0_count: u64,
    pub key1_count: u64,
    pub key2_count: u64,
    pub broken_key_count: u64,
    pub treasure_count: u64,
    pub coach: Pubkey,
}

// ENUM - Error Codes
#[error]
pub enum ErrorCode {
    #[msg("Bad")]
    WrongCoach,
    #[msg("Naughty")]
    SomethingBad,
}
