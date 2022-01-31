use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};
use std::convert::Into;

declare_id!("BrMDSDPTx2qZ5p1EWWDDom1vgjiLJDwSeVR7mo17o5Tr");

#[program]
pub mod soltreasure {
    use super::*;

    #[access_control(BuildChest::accounts(&ctx, nonce))]
    pub fn build_chest(
        ctx: Context<BuildChest>,
        max_real_treasure: u64,
        max_actual_treasure: u64,
        nonce: u8
    ) -> ProgramResult {

        let treasure_chest = &mut ctx.accounts.treasure_chest;

        // Set Globals
        treasure_chest.exploded = false;
        treasure_chest.locked = false;

        treasure_chest.gatekeeper = ctx.accounts.gatekeeper.key();
        treasure_chest.coach = ctx.accounts.coach.key();
        treasure_chest.lamports = 0;
    
        treasure_chest.nonce = nonce;
        treasure_chest.max_real_treasure = max_real_treasure;
        treasure_chest.max_actual_treasure = max_actual_treasure;

        treasure_chest.bomb = 0;
    
        Ok(())
    }

    pub fn fill_chest(
        ctx: Context<FillChest>,
        cost: u64,
        amount: u64,
    ) -> ProgramResult {

        let treasure_chest = &mut ctx.accounts.treasure_chest;

        treasure_chest.costs.push(cost);
        treasure_chest.vaults.push(ctx.accounts.chest_vault.key());
        treasure_chest.counts.push(amount);
        let cpi_accounts = Transfer {
            from: ctx.accounts.coach_vault.to_account_info().clone(),
            to: ctx.accounts.chest_vault.to_account_info().clone(),
            authority: ctx.accounts.coach.to_account_info().clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        return token::transfer(cpi_ctx, amount);
    }

    pub fn lock_chest(
        ctx: Context<LockChest>,
    ) -> ProgramResult {

        let treasure_chest = &mut ctx.accounts.treasure_chest;

        treasure_chest.locked = true;

        Ok(())
    }

    pub fn find_map(
        ctx: Context<FindMap>,
    ) -> ProgramResult {

        let map = &mut ctx.accounts.map;
        let amount = 1000000000u64;

        map.holder = ctx.accounts.holder.key();
        map.treasure_chest = ctx.accounts.treasure_chest.key();
        
        map.vaults.push(ctx.accounts.map_vault.key());

        // Send them the Map
        let seeds = &[
            ctx.accounts.treasure_chest.to_account_info().key.as_ref(),
            &[ctx.accounts.treasure_chest.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.chest_map_vault.to_account_info().clone(),
            to: ctx.accounts.map_vault.to_account_info().clone(),
            authority: ctx.accounts.gatekeeper.clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        // Decrement Amount
        let treasure_chest = &mut ctx.accounts.treasure_chest;
        treasure_chest.counts[Vaults::MAP] = treasure_chest.counts[Vaults::MAP] - amount;

        treasure_chest.holders.push(ctx.accounts.holder.key());
        treasure_chest.maps.push(ctx.accounts.map.key());

        return token::transfer(cpi_ctx, amount);
    }
}

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
    #[account(mut, has_one = coach, constraint = !treasure_chest.locked && !treasure_chest.exploded)]
    pub treasure_chest: Account<'info, TreasureChest>,
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    // Coach's Vault 
    #[account(mut, constraint = &coach_vault.owner == coach.key)]
    pub coach_vault: Account<'info, TokenAccount>,

    // Chests's Vault 
    #[account(mut, constraint = &chest_vault.owner == gatekeeper.key)]
    pub chest_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>,  
}

// Constructor - Bury the chest
#[derive(Accounts)]
pub struct LockChest<'info> {
    #[account(mut, has_one = coach, constraint = !treasure_chest.locked && !treasure_chest.exploded)]
    pub treasure_chest: Account<'info, TreasureChest>,
    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
}

// Constructor - Bury the chest
#[derive(Accounts)]
pub struct FindMap<'info> {
    #[account(zero)]
    pub map: Account<'info, Map>,  

    #[account(mut, 
        constraint = !treasure_chest.exploded && 
        treasure_chest.counts[Vaults::MAP] > 0 && 
        !treasure_chest.holders.contains(holder.key)
    )]
    pub treasure_chest: Account<'info, TreasureChest>, 
    
    #[account(
        seeds = [treasure_chest.to_account_info().key.as_ref()],
        bump = treasure_chest.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(mut, constraint = &chest_map_vault.owner == gatekeeper.key)]
    pub chest_map_vault: Account<'info, TokenAccount>,

    // Vaults
    #[account(mut, constraint = &map_vault.owner == holder.key)]
    pub map_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub holder: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>, 
}

// Struct -
#[account]
pub struct Map {
    pub treasure_chest: Pubkey,
    pub holder: Pubkey,
    pub vaults: Vec<Pubkey>,
}

// Struct -
#[account]
pub struct TreasureChest {
    pub locked: bool,
    pub exploded: bool,

    pub nonce: u8,
    pub coach: Pubkey,
    pub gatekeeper: Pubkey,
    pub lamports: u64,

    pub max_real_treasure: u64,
    pub max_actual_treasure: u64,

    pub bomb: u64,

    pub costs: Vec<u64>,
    pub vaults: Vec<Pubkey>,
    pub counts: Vec<u64>,

    pub holders: Vec<Pubkey>,
    pub maps: Vec<Pubkey>,
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
    pub const REAL_TREASURE:   usize = 6;
    pub const ACTUAL_TREASURE: usize = 7;
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
    #[msg("Bad puzzle index. [0-4]")]
    BadPuzzleIndex, 
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
