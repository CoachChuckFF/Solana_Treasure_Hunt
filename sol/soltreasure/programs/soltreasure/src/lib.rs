use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, Burn, Mint};
use std::convert::Into;
use std::cmp;
use spl_associated_token_account::get_associated_token_address;

declare_id!("76k1YLcR4sPGoyoFk8BH38RDtCMAq6R61n9eEibDMq85");
const TX_LAMPORTS: u64 = 5000;
const NFT_LAMPORTS: u64 = 1000000000;
const NFT_NO_DEC: u64 = 1;

#[program]
pub mod soltreasure {
    use super::*;

    // ------ CREATION
    #[access_control(BuildChest::accounts(&ctx, nonce))]
    pub fn build_chest(
        ctx: Context<BuildChest>,
        bomb: u64,
        max_finders: u64,
        max_winners: u64,
        nonce: u8
    ) -> ProgramResult {

        let treasure_chest = &mut ctx.accounts.treasure_chest;

        // Set Globals
        treasure_chest.locked = false;

        treasure_chest.gatekeeper = ctx.accounts.gatekeeper.key();
        treasure_chest.coach = ctx.accounts.coach.key();
        treasure_chest.lamports = 0;
    
        treasure_chest.nonce = nonce;
        treasure_chest.bomb = bomb;
        treasure_chest.max_winners = max_finders;
        treasure_chest.max_winners = max_winners;

        msg!("Built!");
        Ok(())
    }

    pub fn fill_chest(
        ctx: Context<FillChest>,
        cost: u64,
        amount: u64,
    ) -> ProgramResult {

        // TX
        let cpi_accounts = Transfer {
            from: ctx.accounts.coach_vault.to_account_info().clone(),
            to: ctx.accounts.chest_vault.to_account_info().clone(),
            authority: ctx.accounts.coach.to_account_info().clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        let token_tx_result = token::transfer(cpi_ctx, amount);

        if !token_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        // Update
        let treasure_chest = &mut ctx.accounts.treasure_chest;

        treasure_chest.exploded.push(false);
        treasure_chest.costs.push(cost);
        treasure_chest.mints.push(ctx.accounts.chest_vault.mint.key());
        treasure_chest.vaults.push(ctx.accounts.chest_vault.key());
        treasure_chest.counts.push(amount);

        Ok(())
    }

    pub fn lock_chest(
        ctx: Context<LockChest>,
    ) -> ProgramResult {

        let treasure_chest = &mut ctx.accounts.treasure_chest;

        treasure_chest.locked = true;

        Ok(())
    }

    // ------ DESTRUCTION

    pub fn distribute(
        ctx: Context<Distribute>
    ) -> ProgramResult {
        // use rand::seq::SliceRandom; // 0.7.2

        // let samples = vec!["hi", "this", "is", "a", "test!"];
        // let sample: Vec<_> = samples
        //     .choose_multiple(&mut rand::thread_rng(), 1)
        //     .collect();
        // println!("{:?}", sample);

        Ok(())
    }

    pub fn tick_tick_boom(
        ctx: Context<TickTickBoom>
    ) -> ProgramResult {

        let mut burn_index = 0;
        let mut burn_count = ctx.accounts.chest_vault.amount;
        match ctx.accounts.treasure_chest.vaults.iter().position(|&p| p == ctx.accounts.chest_vault.key()) {
            Some(i) => { burn_index = i; },
            None => { return Err(ErrorCode::SomethingBad.into()); },
        } 

        if burn_index == ctx.accounts.treasure_chest.vaults.len() - 1 {
            let seed = Clock::get()?.unix_timestamp as u64;
            let lammmys = ctx.accounts.treasure_chest.lamports as u64;
            let finders = ctx.accounts.treasure_chest.finders.len() as u64;
            let xor = seed ^ lammmys ^ finders;
            let start_state = ((xor >> 48 as u16) ^ (xor >> 32 as u16) ^ (xor >> 16 as u16) ^ (xor >> 0 as u16)) as u16;
            // let Vec

            // uint16_t start_state = 0xACE1u;  /* Any nonzero start state will work. */
            // uint16_t lfsr = start_state;
            // uint16_t bit;                    /* Must be 16-bit to allow bit<<15 later in the code */
            // unsigned period = 0;
        
            // do
            // {   /* taps: 16 14 13 11; feedback polynomial: x^16 + x^14 + x^13 + x^11 + 1 */
            //     bit = ((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5)) & 1u;
            //     lfsr = (lfsr >> 1) | (bit << 15);
            //     ++period;
            // }
            // while (lfsr != start_state);
        
            // return period;

            for n in 0..cmp::min(ctx.accounts.treasure_chest.max_winners as usize, ctx.accounts.treasure_chest.finders.len()) {

            }

            if finders < ctx.accounts.treasure_chest.max_winners { 
                burn_count = ctx.accounts.treasure_chest.max_winners - finders;
            } else {
                burn_count = 0;
            }
        }

        if burn_count > 0 {
            let seeds = &[
                ctx.accounts.treasure_chest.to_account_info().key.as_ref(),
                &[ctx.accounts.treasure_chest.nonce],
            ];
            let signer = &[&seeds[..]];
            let cpi_accounts = Burn {
                mint: ctx.accounts.mint.to_account_info().clone(),
                to: ctx.accounts.chest_vault.to_account_info().clone(),
                authority: ctx.accounts.gatekeeper.to_account_info().clone(),
            };
            let cpi_program = ctx.accounts.token_program.clone();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
            let token_tx_result = token::burn(cpi_ctx, burn_count);
    
            if !token_tx_result.is_ok() {
                return Err(ErrorCode::CouldNotTXNFT.into());
            }
        }


        let treasure_chest = &mut ctx.accounts.treasure_chest;
        treasure_chest.exploded[burn_index] = true;

        Ok(())
    }




    // -------------- USER FUNCTIONS ------------------------ //

    pub fn find_map(
        ctx: Context<FindMap>,
    ) -> ProgramResult {

        // Grab the sol for the TX
        // let tx_lams = anchor_lang::solana_program::system_instruction::transfer(
        //     &ctx.accounts.player.key(),
        //     &ctx.accounts.chest_map_vault.key(),
        //     TX_LAMPORTS * 5,
        // );

        // let get_tx_lams_response = anchor_lang::solana_program::program::invoke(
        //     &tx_lams,
        //     &[
        //         ctx.accounts.player.to_account_info().clone(),
        //         ctx.accounts.chest_map_vault.to_account_info().clone(),
        //     ],
        // );
        
        // if !get_tx_lams_response.is_ok() {
        //     return Err(ErrorCode::CouldNotFundTX.into());
        // }

        // Send them the Map
        let seeds = &[
            ctx.accounts.treasure_chest.to_account_info().key.as_ref(),
            &[ctx.accounts.treasure_chest.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.chest_map_vault.to_account_info().clone(),
            to: ctx.accounts.player_map_vault.to_account_info().clone(),
            authority: ctx.accounts.gatekeeper.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        let nft_amount = NFT_NO_DEC;
        let token_tx_result = token::transfer(cpi_ctx, nft_amount);

        if !token_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        let treasure_chest = &mut ctx.accounts.treasure_chest;
        treasure_chest.counts[Vaults::MAP] = treasure_chest.counts[Vaults::MAP] - NFT_NO_DEC;

        Ok(())
    }
}





// ------ DEFINES ------------------------------------------------

// Constructor - Bury the chest
#[derive(Accounts)]
pub struct BuildChest<'info> {
    #[account(zero)]
    pub treasure_chest: Account<'info, TreasureChest>,    
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
}

impl<'info> BuildChest<'info> {
    // Approves the gatekeeper
    pub fn accounts(ctx: &Context<BuildChest>, nonce: u8) -> Result<()> {
        let gatekeeper = Pubkey::create_program_address(
            &[ctx.accounts.treasure_chest.to_account_info().key.as_ref(), &[nonce]],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::InvalidGateKeeperNonce)?;
        if &gatekeeper != ctx.accounts.gatekeeper.to_account_info().key {
            return Err(ErrorCode::InvalidGatekeeper.into());
        }
        Ok(())
    }
}

// Constructor - Bury the chest
#[derive(Accounts)]
pub struct FillChest<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = !treasure_chest.locked
    )]
    pub treasure_chest: Account<'info, TreasureChest>,
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    // Coach's Vault 
    #[account(
        mut, 
        constraint = &coach_vault.owner == coach.key
    )]
    pub coach_vault: Account<'info, TokenAccount>,

    // Chests's Vault 
    #[account(
        mut, 
        constraint = &chest_vault.owner == gatekeeper.key &&
        &coach_vault.mint == &chest_vault.mint
    )]
    pub chest_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>,  
}

// Constructor - Bury the chest
#[derive(Accounts)]
pub struct LockChest<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = !treasure_chest.locked
    )]
    pub treasure_chest: Account<'info, TreasureChest>,
    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
}

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(
        mut, 
        has_one = coach
    )]
    pub treasure_chest: Account<'info, TreasureChest>, 
    
    #[account(
        seeds = [treasure_chest.to_account_info().key.as_ref()],
        bump = treasure_chest.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &chest_vault.owner == gatekeeper.key
    )]
    pub chest_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>, 
}

#[derive(Accounts)]
pub struct TickTickBoom<'info> {
    #[account(
        mut, 
        has_one = coach
    )]
    pub treasure_chest: Account<'info, TreasureChest>, 
    
    #[account(
        seeds = [treasure_chest.to_account_info().key.as_ref()],
        bump = treasure_chest.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &chest_vault.owner == gatekeeper.key
        && chest_vault.amount > 1
    )]
    pub chest_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = chest_vault.mint == mint.key()
    )]
    pub mint: Account<'info, Mint>,

    // Signers
    #[account(mut)]
    pub coach: Signer<'info>,    
    pub token_program: AccountInfo<'info>, 
}



// USERS
#[derive(Accounts)]
pub struct FindMap<'info> {
    #[account(mut, 
        constraint = !treasure_chest.exploded[Vaults::MAP] 
        && chest_map_vault.amount > 0 
        && Clock::get()?.unix_timestamp < treasure_chest.bomb as i64
    )]
    pub treasure_chest: Account<'info, TreasureChest>, 
    
    #[account(
        seeds = [treasure_chest.to_account_info().key.as_ref()],
        bump = treasure_chest.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &chest_map_vault.owner == gatekeeper.key &&
        chest_map_vault.mint == treasure_chest.mints[Vaults::MAP]
    )]
    pub chest_map_vault: Account<'info, TokenAccount>,

    // Vaults
    #[account(
        mut, 
        constraint = &player_map_vault.owner == player.key &&
        &player_map_vault.mint == &chest_map_vault.mint &&
        // player_map_vault.amount == 0 &&
        get_associated_token_address(player.key, &treasure_chest.mints[Vaults::MAP]) == player_map_vault.key()
    )]
    pub player_map_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,    
    pub token_program: AccountInfo<'info>, 
    pub system_program: Program <'info, System>,
}

// Struct -
#[account]
pub struct TreasureChest {
    pub locked: bool,

    pub bomb: u64,

    pub nonce: u8,
    pub coach: Pubkey,
    pub gatekeeper: Pubkey,
    pub lamports: u64,

    pub max_finders: u64,
    pub max_winners: u64,

    pub exploded: Vec<bool>,
    pub costs: Vec<u64>,
    pub counts: Vec<u64>,
    pub mints: Vec<Pubkey>,
    pub vaults: Vec<Pubkey>,

    pub finders: Vec<Pubkey>,
    pub winners: Vec<Pubkey>,
}

// ENUM
#[non_exhaustive]
struct Vaults;

impl Vaults {
    pub const MAP: usize = 0;
    pub const BROKEN_KEY: usize = 1;
    pub const KEY_0: usize = 2;
    pub const KEY_1: usize = 3;
    pub const KEY_2: usize = 4;
    pub const CHEST:  usize = 5;
    pub const WINNINGS: usize = 255; //Last one of VEC
}

// ENUM - Error Codes
#[error]
pub enum ErrorCode {
    #[msg("Bad")]
    WrongCoach,
    #[msg("Chest is Locked")]
    LockedChest,
    #[msg("Naughty")]
    SomethingBad,
    #[msg("Could not fund the TX")]
    CouldNotFundTX, 
    #[msg("Could not TX NFT")]
    CouldNotTXNFT, 
    #[msg("The given nonce does not create a valid program derived address.")]
    InvalidGateKeeperNonce,
    #[msg("The derived check signer does not match that which was given.")]
    InvalidGatekeeper,
    #[msg("The given check has already been burned.")]
    AlreadyBurned,
}




// pub fn find_map(ctx: Context<FindMap>,) -> ProgramResult {

//     let map = &mut ctx.accounts.map;

//     // Set all vaults
    

//     // Give them the map

//     Ok(())
// }

// pub fn solve_puzzle(ctx: Context<SolvePuzzle>, index: u8, hash: u32) -> ProgramResult {
//     let treasure_chest = &mut ctx.accounts.treasure_chest;
//     let sleuth_bytes = ctx.accounts.hunter.key().to_bytes();
//     let hash_bytes = [(hash >> 0) as u8, (hash >> 8) as u8, (hash >> 16) as u8, (hash >> 24) as u8];
//     let mut should_mint = true;
//     let mut lamports = VAULT_ACCOUNTS;

//     // get 

//     match index as usize {
//         Vaults::BrokenKey => {
//             for i in 0..4 {
//                 if sleuth_bytes[i] != hash_bytes[i] {
//                     should_mint = false;
//                 }
//             }
//         },
//         _ => {
//             return Err(ErrorCode::BadPuzzleIndex.into());
//         }
//     }

//     // treasure_chest.to_account_info().key.
//     // if &ctx.accounts.coffee_jar.barista == &ctx.accounts.to.key() {
//     //     let instrcution = anchor_lang::solana_program::system_instruction::transfer(
//     //         &ctx.accounts.from.key(),
//     //         &ctx.accounts.coffee_jar.barista,
//     //         lamports,
//     //     );

//     //     let response = anchor_lang::solana_program::program::invoke(
//     //         &instrcution,
//     //         &[
//     //             ctx.accounts.from.to_account_info(),
//     //             ctx.accounts.to.to_account_info(),
//     //         ],
//     //     );

//     //     if response.is_ok() {

//     //         let coffee_jar_account = &mut ctx.accounts.coffee_jar;
//     //         coffee_jar_account.coffee_count  = coffee_jar_account.coffee_count + 1;
//     //         coffee_jar_account.lamport_count = coffee_jar_account.lamport_count + lamports;

//     //         return Ok(());
            
//     //     } else {
//     //         return Err(ErrorCode::SomethingBad.into());
//     //     }
//     // }

//     // return Err(ErrorCode::WrongBarista.into());

//     Ok(())
// }


// // Create a hunter account
// #[derive(Accounts)]
// pub struct FindMap<'info> {
//     #[account(zero)]
//     pub map: Account<'info, TreasureMap>, 
//     #[account(mut)]
//     pub treasure_chest: Account<'info, TreasureChest>,   

//     // // Vaults
//     // #[account(mut, constraint = &map_vault.owner == hunter.key)]
//     // pub map_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &broken_key_vault.owner == hunter.key)]
//     // pub broken_key_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &key_0_vault.owner == hunter.key)]
//     // pub key_0_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &key_1_vault.owner == hunter.key)]
//     // pub key_1_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &key_2_vault.owner == hunter.key)]
//     // pub key_2_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &chest_vault.owner == hunter.key)]
//     // pub chest_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &real_treasure_vault.owner == hunter.key)]
//     // pub real_treasure_vault: Account<'info, TokenAccount>,
//     // #[account(mut, constraint = &actual_treasure_vault.owner == hunter.key)]
//     // pub actual_treasure_vault: Account<'info, TokenAccount>,

//     // Signers
//     #[account(mut)]
//     pub hunter: AccountInfo<'info>,    
//     pub token_program: AccountInfo<'info>,  
// }


// // Function - Mint Key 0
// #[derive(Accounts)]
// pub struct SolvePuzzle<'info> {
//     #[account(mut)]
//     pub treasure_chest: Account<'info, TreasureChest>,
//     #[account(mut)]
//     pub vault: Account<'info, TokenAccount>,
//     #[account(
//         seeds = [treasure_chest.to_account_info().key.as_ref()],
//         bump = treasure_chest.nonce,
//     )]
//     pub gatekeeper: AccountInfo<'info>,
//     #[account(mut)]
//     pub hunter: Signer<'info>,
//     #[account(mut)]
//     pub hunters_bag: Account<'info, TokenAccount>,
//     pub token_program: AccountInfo<'info>,
//     pub system_program: Program <'info, System>,
// }

// // Function - Pick Winners and Burn Supply
// #[derive(Accounts)]
// pub struct TickTickBoom<'info> {
//     #[account(mut)]
//     pub treasure_chest: Account<'info, TreasureChest>,
//     #[account(mut)]
//     pub coach: Signer<'info>,
//     pub token_program: AccountInfo<'info>,
//     pub system_program: Program <'info, System>,
// }

// // Hunter - 
// #[account]
// pub struct TreasureMap {
//     pub treasure_chest: Pubkey,
//     pub hunter: Pubkey,
//     pub vaults: Vec<Pubkey>,
// }
