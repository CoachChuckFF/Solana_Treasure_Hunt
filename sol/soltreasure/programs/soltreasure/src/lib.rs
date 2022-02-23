use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, Burn, Mint};
use std::convert::Into;
use std::cmp;
use spl_associated_token_account::get_associated_token_address;

declare_id!("76k1YLcR4sPGoyoFk8BH38RDtCMAq6R61n9eEibDMq85");

const TX_LAMPORTS: u64 = 5000;
const NFT_LAMPORTS: u64 = 1000000000;
const NFT_NO_DEC: u64 = 1;

const MAX_ITEMS: usize = 55;
const MAX_LEADERBAORD: usize = 10;
const MAX_NAME_LEN: usize = 31;
const MAX_BITS: usize = 63;
const MAX_BYTES_IN_PUBKEY: usize = 32 - 1;

const TYPE_KEY: u8 = 0x00;
const TYPE_ITEM: u8 = 0x01;
const TYPE_REWARD: u8 = 0x02;
const TYPE_COMBINATION_OUTPUT: u8 = 0x03;

const CODE_NULL: u32 = 0;
const REQUIREMENTS_NULL: u64 = 0;

#[program]
pub mod soltreasure {
    use super::*;

    // -------------- CREATION ------------------------ //
    #[access_control(CreateGame::accounts(&ctx, nonce))]
    pub fn create_game(
        ctx: Context<CreateGame>,
        nonce: u8,
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;

        // Game Handlers
        game.game = game.key();
        game.coach = ctx.accounts.coach.key();
        game.gatekeeper = ctx.accounts.gatekeeper.key();
        game.nonce = nonce;
        game.lamports = 0;

        // Game State
        game.playing = false;
        game.supernova = 0;

        Ok(())
    }

    // -------------- LOAD ASSETS ------------------------ //
    pub fn load_assets(
        ctx: Context<LoadAssets>,
        name: String,
        game_type: u8,
        codes: u32, //Hash codes for puzzle to mint
        is_wrong_answer_item: bool, //Default item to mint on wrong answer
        percent: u8, //Percentage gained with item,
        amount_per_mint: u8, //How many to mint at a pop
        max_per_inventory: u8, //Max amount in inventory
        cost: u64, //Cost in Lammys
        items_count_to_tx: u64, //Amount to transfer from vault
    ) -> ProgramResult {

        // Update
        let game = &mut ctx.accounts.game;
        let id = game.assets.len();
        let safe_name = &name[..cmp::min(name.len(), MAX_NAME_LEN)];

        match game_type {
            TYPE_KEY | TYPE_ITEM | TYPE_REWARD => {
                game.assets.push(
                    GameItem{
                        name: String::from(safe_name),
                        item: ctx.accounts.game_vault.key(),
                        mint: ctx.accounts.game_vault.mint,
                        burned: false,
                        item_type: game_type,
                        codes: codes,
                        percent: percent,
                        id: 0b1 << id,
                        requirements: 0, // Will be set later
                        max_per_inventory: max_per_inventory,
                        amount_per_mint: amount_per_mint,
                        cost: cost,
                    }
                );
            }
            _=> {
                return Err(ErrorCode::BadItemType.into());
            }
        }

        if is_wrong_answer_item {
            game.wrong_answer_item = ctx.accounts.game_vault.key();
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.coach_vault.to_account_info().clone(),
            to: ctx.accounts.game_vault.to_account_info().clone(),
            authority: ctx.accounts.coach.to_account_info().clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        let token_tx_result = token::transfer(cpi_ctx, items_count_to_tx);

        if !token_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        Ok(())
    }

    // -------------- LOAD COMBINATIONS ------------------------ //
    pub fn load_combinations(
        ctx: Context<LoadCombinations>,
        input_0_amount: u8, // Total amount
        input_1_amount: u8, // Total amount
        output_amount: u8, // Total amount
        cost: u64, //Cost in Lammys, For Reward: this is the amount of replay tokens given out
    ) -> ProgramResult {

        // Update
        let game = &mut ctx.accounts.game;
        let len = cmp::min(game.assets.len(), MAX_ITEMS);

        let mut input_0_id = 0;
        let mut input_1_id = 0;
        let mut output_id = 0;

        for i in 0..len {

            if game.assets[i].item == ctx.accounts.input_0.key() {
                input_0_id = 0b1 << i;
            } else if game.assets[i].item == ctx.accounts.input_1.key() {
                input_1_id = 0b1 << i;
            } else if game.assets[i].item == ctx.accounts.output.key() {
                output_id = 0b1 << i;
            }

            if input_0_id != 0 && input_1_id != 0 && output_id != 0 {
                break;
            }
        }

        if input_0_id == 0 || input_1_id == 0 || output_id == 0  {
            return Err(ErrorCode::BadItemId.into());
        }

        game.combinations.push(
            GameCombination{
                input_0_id: input_0_id,
                input_0_amount: input_0_amount,
                input_1_id: input_1_id,
                input_1_amount: input_1_amount,
                output_id: output_id,
                output_amount: output_amount,
                cost: cost,
            }
        );

        Ok(())
    }

    // -------------- Load REQUREMENTS ------------------------ //
    pub fn load_requirements(
        ctx: Context<LoadRequirements>,
        requirements: u64, // Total amount
    ) -> ProgramResult {

        // Update
        let game = &mut ctx.accounts.game;
        let len = game.assets.len();

        let mut item_index = len;

        for i in 0..len {
            if game.assets[i].item == ctx.accounts.requirement_vault.key() {
                item_index = i;
                break;
            }
        }

        if item_index == len {
            return Err(ErrorCode::BadItemId.into());
        }

        game.assets[item_index].requirements = requirements;

        Ok(())
    }

    // -------------- PLAY/PAUSE ------------------------ //
    pub fn play_pause(
        ctx: Context<PlayPause>,
        playing: bool,
        supernova: u64,
        cheater_time: u64,
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;

        game.playing = playing;
        game.game_start = Clock::get()?.unix_timestamp as u64;
        game.supernova = supernova;
        game.cheater_time = cheater_time;

        Ok(())
    }

    // -------------- SUPERNOVA ------------------------ //
    pub fn supernova(
        ctx: Context<Supernova>,
    ) -> ProgramResult {

        let mut burn_index = 0;

        match ctx.accounts.game.assets.iter().position(|p| p.item == ctx.accounts.game_vault.key()) {
            Some(i) => { burn_index = i; },
            None => { return Err(ErrorCode::SomethingBad.into()); },
        } 

        let burn_count = ctx.accounts.game_vault.amount;
        let seeds = &[
            ctx.accounts.game.to_account_info().key.as_ref(),
            &[ctx.accounts.game.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info().clone(),
            to: ctx.accounts.game_vault.to_account_info().clone(),
            authority: ctx.accounts.gatekeeper.to_account_info().clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        let token_tx_result = token::burn(cpi_ctx, burn_count);

        if !token_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        // Update State
        let game = &mut ctx.accounts.game;
        game.assets[burn_index].burned = true;

        Ok(())
    }

    // -------------- USER FUNCTIONS ------------------------ //
    pub fn create_game_player(ctx: Context<CreateGamePlayer>, bump: u8) -> ProgramResult {
        
        let player_account = &mut ctx.accounts.player_account;

        player_account.player_account = player_account.key();
        player_account.game = ctx.accounts.game.key();
        player_account.player = ctx.accounts.player.key();
        player_account.bump = bump;

        player_account.run_start = Clock::get()?.unix_timestamp as u64;
        player_account.run_percent_timestamp = player_account.run_start;
        player_account.run_percent = 0;


        Ok(())
    }

    pub fn set_game_player_game(
        ctx: Context<SetGamePlayerGame>,

    ) -> ProgramResult {

        let player_account = &mut ctx.accounts.player_account;

        player_account.game = ctx.accounts.game.key();

        player_account.run_start = Clock::get()?.unix_timestamp as u64;
        player_account.run_percent_timestamp = player_account.run_start;
        player_account.run_percent = 0;

        Ok(())
    }

    pub fn mint_item(
        ctx: Context<MintItem>,
        item_index: u8,
        puzzle_index: u8,
        hash: u32,
        amount: u8, //usually 1
    ) -> ProgramResult {

        if item_index as usize >= ctx.accounts.game.assets.len() || puzzle_index > 16 {
            return Err(ErrorCode::BadMintIndex.into());
        }

        let game = &mut ctx.accounts.game;
        let player = &mut ctx.accounts.player_account;
        let asset_len = game.assets.len();
        let inventory_len = player.inventory.len();

        let good_item = game.assets[item_index as usize].clone();
        let bad_item_key = game.wrong_answer_item;

        let mut got_it_right = false;

        let current_time = Clock::get()?.unix_timestamp as u64;
        let is_too_fast = (current_time - player.run_start) < game.cheater_time;

        let mut bad_item_index = asset_len;
        let mut good_inventory_item_index = asset_len;
        let mut bad_inventory_item_index = asset_len;

        let mut bad_item_cost = !0;
        let mut total_sol = !0;

        let mut good_amount = 0;
        let mut bad_amount = 0;

        // Check Big Errors
        if good_item.burned {
            return Err(ErrorCode::Burned.into());
        }

        if asset_len > MAX_ITEMS {
            return Err(ErrorCode::BadLens.into());
        }

        if inventory_len > asset_len {
            return Err(ErrorCode::BadLens.into());
        }

        // Check Hash
        if good_item.codes != CODE_NULL {
            let wallet_bytes = ctx.accounts.player.key().to_bytes();
            let mut correct_hash = 0 as u32;
            let puzzle_byte = wallet_bytes[MAX_BYTES_IN_PUBKEY - puzzle_index as usize];

            for i in 0..4 {
                correct_hash |= ((puzzle_byte ^ wallet_bytes[ cmp::min(MAX_BYTES_IN_PUBKEY, (good_item.codes >> (i * 8)) as usize) ]) as u32 & 0x000000FF) << (i * 8);
            }

            got_it_right = correct_hash != hash;
        }

        // Check Inventory
        for i in 0..inventory_len {
            if player.inventory[i].item == good_item.item {
                good_inventory_item_index = i;
                got_it_right = player.inventory[i].amount + amount <= good_item.max_per_inventory;
            } else if player.inventory[i].item == bad_item_key {
                bad_inventory_item_index = i;
            }
        }

        // Check Requirements + Get Bad Item
        for i in 0..asset_len {
            if game.assets[i].item == bad_item_key {
                bad_item_index = i;
                bad_item_cost = game.assets[i].cost;
            }

            if 0b1 << i & good_item.requirements != 0 {

                let mut did_find = false;
                for j in 0..inventory_len {
                    if player.inventory[j].item == game.assets[i].item {
                        did_find = true;
                        break;
                    }
                }

                if !did_find {
                    got_it_right = false;
                }
            }

        }

        // Set amounts
        if got_it_right  {
            match good_item.item_type {
                TYPE_KEY | TYPE_ITEM => {
                    good_amount = good_item.amount_per_mint;
                    bad_amount = 0;
                },
                TYPE_REWARD => {
                    if is_too_fast {
                        return Err(ErrorCode::Cheater.into());
                    }
    
                    good_amount = 1;
                    bad_amount = good_item.amount_per_mint;
                    bad_item_cost = 0;
                },
                TYPE_COMBINATION_OUTPUT => {
                    good_amount = 0;
                    bad_amount = 1;
                },
                _=> {
                    good_amount = 0;
                    bad_amount = 0;
                }
            }

        } else {
            good_amount = 0;
            bad_amount = 1;
        }

        // Check Amounts
        if bad_item_index == asset_len {
            bad_amount = 0;
        }

        if good_amount as u64 > ctx.accounts.game_vault.amount {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        if bad_amount as u64 > ctx.accounts.wrong_answer_game_vault.amount {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        // Send SFTs
        let seeds = &[
            game.to_account_info().key.as_ref(),
            &[game.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.clone();

        if good_amount > 0 {
            let good_tx = Transfer {
                from: ctx.accounts.game_vault.to_account_info().clone(),
                to: ctx.accounts.player_vault.to_account_info().clone(),
                authority: ctx.accounts.gatekeeper.clone(),
            };
            let good_cpi = CpiContext::new_with_signer(cpi_program.clone(), good_tx, signer);
            let good_tx_result = token::transfer(good_cpi, good_amount as u64);
    
            if !good_tx_result.is_ok() {
                return Err(ErrorCode::CouldNotTXNFT.into());
            }
        }

        if bad_amount > 0 {
            let bad_tx = Transfer {
                from: ctx.accounts.game_vault.to_account_info().clone(),
                to: ctx.accounts.player_vault.to_account_info().clone(),
                authority: ctx.accounts.gatekeeper.clone(),
            };
            let bad_cpi = CpiContext::new_with_signer(cpi_program.clone(), bad_tx, signer);
            let bad_tx_result = token::transfer(bad_cpi, bad_amount as u64);
    
            if !bad_tx_result.is_ok() {
                return Err(ErrorCode::CouldNotTXNFT.into());
            }
        }

        // Get Sol
        if got_it_right {
            total_sol = good_item.cost * good_amount as u64;
        } else {
            total_sol = bad_item_cost * bad_amount as u64;
        }

        let tx_lams = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &game.coach.key(),
            total_sol,
        );
        
        let get_tx_lams_response = anchor_lang::solana_program::program::invoke(
            &tx_lams,
            &[
                ctx.accounts.player.to_account_info().clone(),
                ctx.accounts.coach.to_account_info().clone(),
            ],
        );
        
        if !get_tx_lams_response.is_ok() {
            return Err(ErrorCode::CouldNotFundTX.into());
        }
        
        // Set States
        if good_amount > 0 {
            if good_inventory_item_index != asset_len {
                player.inventory[good_inventory_item_index].amount += good_amount;
            } else {
                player.inventory.push(
                    GameInventoryItem {
                        item: good_item.item,
                        amount: good_amount
                    }
                );
            }

            if good_item.percent > 0 {
                player.run_percent += good_item.percent;
                player.run_percent_timestamp = current_time;
            }
        }

        if bad_amount > 0 {
            if bad_inventory_item_index != asset_len {
                player.inventory[bad_inventory_item_index].amount += bad_amount;
            } else {
                player.inventory.push(
                    GameInventoryItem {
                        item: bad_item_key,
                        amount: bad_amount
                    }
                );
            }
        }

        //Leaderboard
        let mut overwrite_index = MAX_LEADERBAORD;
        let mut lowest_percent = 0x100 as u16;
        let mut slowest_time = 0 as u64;
        if game.leaderboard.len() == MAX_LEADERBAORD {
            if !is_too_fast {
                for i in 0..game.leaderboard.len() {
                    if game.leaderboard[i].run_percent < player.run_percent {
                        lowest_percent = game.leaderboard[i].run_percent as u16;
                        slowest_time = game.leaderboard[i].run_percent_timestamp;
                        overwrite_index = i;
        
                        for j in i..game.leaderboard.len() {
                            if  lowest_percent > game.leaderboard[j].run_percent as u16 {
                                lowest_percent = game.leaderboard[j].run_percent as u16;
                                slowest_time = game.leaderboard[j].run_percent_timestamp;
                                overwrite_index = i;
                            }
                        }
    
                        break;
                    }
                }
                if overwrite_index != MAX_LEADERBAORD {
                    for k in 0..game.leaderboard.len() {
                        if lowest_percent == game.leaderboard[k].run_percent as u16 {
                            if slowest_time < game.leaderboard[k].run_percent_timestamp {
                                slowest_time = game.leaderboard[k].run_percent_timestamp;
                                overwrite_index = k;
                            }
                        }
                    }
                }
                if overwrite_index != MAX_LEADERBAORD {

                    game.leaderboard[overwrite_index].player = player.player;
                    game.leaderboard[overwrite_index].run_start = player.run_start;
                    game.leaderboard[overwrite_index].run_percent = player.run_percent;
                    game.leaderboard[overwrite_index].run_percent_timestamp = player.run_percent_timestamp;
                }
            }
        } else {
            game.leaderboard.push(
                GameLeaderboardInfo {
                    player: player.player,
                    run_start: player.run_start,
                    run_percent: player.run_percent,
                    run_percent_timestamp: player.run_percent_timestamp,
                }
            );
        }


        Ok(())
    }
}


    // -------------- COMBINE ITEMS ------------------------ //
    pub fn combine_items(
        ctx: Context<CombineItem>,
        combine_index: u8,
    ) -> ProgramResult {

        if combine_index as usize >= ctx.accounts.game.combinations.len() {
            return Err(ErrorCode::BadCombination.into());
        }

        let game =  &mut ctx.accounts.game;
        let player = &mut ctx.accounts.player_account;
        let inventory_len = player.inventory.len();
        let combination = game.combinations[combine_index as usize].clone();

        let mut inventory_input_0_index = inventory_len;
        let mut inventory_input_1_index = inventory_len;
        let mut inventory_output_index =  inventory_len;

        // Search player inventory
        for i in 0..inventory_len {
            if player.inventory[i].item == ctx.accounts.input_0_vault.key() {
                inventory_input_0_index = i;
            }
            
            if player.inventory[i].item == ctx.accounts.input_1_vault.key() {
                inventory_input_1_index = i;
            }
            
            if  player.inventory[i].item == ctx.accounts.output_vault.key() {
                inventory_output_index = i
            }
        }

        // Check Amounts
        if inventory_input_0_index == inventory_len || inventory_input_1_index == inventory_len {
            return Err(ErrorCode::NotEnoughToCombine.into());
        }

        if player.inventory[inventory_input_0_index].amount < combination.input_0_amount {
            return Err(ErrorCode::NotEnoughToCombine.into()); 
        }

        if player.inventory[inventory_input_1_index].amount < combination.input_1_amount {
            return Err(ErrorCode::NotEnoughToCombine.into()); 
        }

        let mut output_index = 0 as usize;
        for _i in 0..MAX_ITEMS {
            if combination.output_id & 0b1 << output_index != 0 {
                break;
            } else {
                output_index += 1;
            }
        }

        if output_index as usize >= game.assets.len() {
            return Err(ErrorCode::BadCombination.into());
        }


        if inventory_output_index != inventory_len {

            if player.inventory[inventory_output_index].amount + combination.output_amount > game.assets[output_index].max_per_inventory {
                return Err(ErrorCode::NotEnoughToCombine.into()); 
            }

        } else {

            player.inventory.push(
                GameInventoryItem {
                    item: game.assets[output_index].item,
                    amount: 0,
                }
            );

            inventory_output_index = player.inventory.len() - 1;
        }

        //Set New Amounts
        player.inventory[inventory_output_index].amount += combination.output_amount;
        player.inventory[inventory_input_0_index].amount -= combination.input_0_amount;
        player.inventory[inventory_input_1_index].amount -= combination.input_1_amount;

        //TX Output
        let seeds = &[
            game.to_account_info().key.as_ref(),
            &[game.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.clone();

        let output_tx = Transfer {
            from: ctx.accounts.output_vault.to_account_info().clone(),
            to: ctx.accounts.player_input_1_vault.to_account_info().clone(),
            authority: ctx.accounts.gatekeeper.clone(),
        };
        let output_cpi = CpiContext::new_with_signer(cpi_program.clone(), output_tx, signer);
        let output_tx_result = token::transfer(output_cpi, combination.output_amount as u64);

        if !output_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        //RX Input 0
        let input_rx_0 = Transfer {
            from: ctx.accounts.player_input_0_vault.to_account_info().clone(),
            to: ctx.accounts.input_0_vault.to_account_info().clone(),
            authority: ctx.accounts.player.to_account_info().clone(),
        };
        let input_cpi_0 = CpiContext::new(cpi_program.clone(), input_rx_0);

        let input_rx_0_result = token::transfer(input_cpi_0, combination.input_0_amount as u64);

        if !input_rx_0_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        //RX Input 1
        let input_rx_1 = Transfer {
            from: ctx.accounts.player_input_1_vault.to_account_info().clone(),
            to: ctx.accounts.input_1_vault.to_account_info().clone(),
            authority: ctx.accounts.player.to_account_info().clone(),
        };
        let input_cpi_1 = CpiContext::new(cpi_program.clone(), input_rx_1);

        let input_rx_1_result = token::transfer(input_cpi_1, combination.input_1_amount as u64);

        if !input_rx_1_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }
        

        Ok(())
    }


// ------------ CREATE GAME -------------------------------
#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(zero)]
    pub game: Account<'info, Game>,    
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
}

impl<'info> CreateGame<'info> {
    // Approves the gatekeeper
    pub fn accounts(ctx: &Context<CreateGame>, nonce: u8) -> Result<()> {

        let gatekeeper = Pubkey::create_program_address(
            &[ctx.accounts.game.to_account_info().key.as_ref(), &[nonce]],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::InvalidGateKeeperNonce)?;

        if &gatekeeper != ctx.accounts.gatekeeper.to_account_info().key {
            return Err(ErrorCode::InvalidGatekeeper.into());
        }
        Ok(())
    }
}

// ------------ LOAD CHESTS -------------------------------
#[derive(Accounts)]
pub struct LoadAssets<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = !game.playing && game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    // Coach's Vault 
    #[account(
        mut, 
        constraint = &coach_vault.owner == coach.key 
        && game.assets.len() < MAX_ITEMS
        && game_vault.mint == coach_vault.mint
        && get_associated_token_address(&coach.key(), &coach_vault.mint) == coach_vault.key()
    )]
    pub coach_vault: Account<'info, TokenAccount>,

    // Game's Vault 0 (SFT || Input 0)
    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
        && get_associated_token_address(&gatekeeper.key(), &game_vault.mint) == game_vault.key()
    )]
    pub game_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>,  
}

// ------------ LOAD COMBINATIONS -------------------------------
#[derive(Accounts)]
pub struct LoadCombinations<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = !game.playing && game.coach == coach.key()
        && game.combinations.len() < MAX_ITEMS
    )]
    pub game: Account<'info, Game>,
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    #[account(
        mut, 
        constraint = &input_0.owner == gatekeeper.key
    )]
    pub input_0: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &input_1.owner == gatekeeper.key
    )]
    pub input_1: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &output.owner == gatekeeper.key
    )]
    pub output: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>,  
}

// ------------ LOAD REQUIREMENTS -------------------------------
#[derive(Accounts)]
pub struct LoadRequirements<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = !game.playing && game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,
    pub gatekeeper: AccountInfo<'info>, //PDA who signs for transactions

    #[account(
        mut, 
        constraint = &requirement_vault.owner == gatekeeper.key
    )]
    pub requirement_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>,  
}

// ------------ Play Pause -------------------------------
#[derive(Accounts)]
pub struct PlayPause<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,
    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
}

// ------------ Supernova -------------------------------
#[derive(Accounts)]
pub struct Supernova<'info> {
    #[account(
        mut, 
        has_one = coach,
        constraint = game.coach == coach.key() 
        && Clock::get()?.unix_timestamp > game.supernova as i64
    )]
    pub game: Account<'info, Game>, 
    
    #[account(
        seeds = [game.to_account_info().key.as_ref()],
        bump = game.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
        && game_vault.amount > 0
    )]
    pub game_vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        constraint = game_vault.mint == mint.key()
    )]
    pub mint: Account<'info, Mint>,

    // Signers
    #[account(mut)]
    pub coach: AccountInfo<'info>,    
    pub token_program: AccountInfo<'info>, 
}

// ------------ Create Player -------------------------------
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateGamePlayer<'info> {
  #[account(mut)]
  pub player: Signer<'info>,

  #[account(
    init_if_needed,
    seeds = [player.key().as_ref()],
    bump,
    payer = player,
  )]
  pub player_account: Account<'info, GamePlayer>,

  #[account(mut, 
    has_one = coach,
    constraint = game.coach == coach.key()
    && game.playing
    && Clock::get()?.unix_timestamp < game.supernova as i64
)]
  pub game: Account<'info, Game>, 

  #[account(mut)]
  pub coach: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
}

// ------------ Set Player Game -------------------------------
#[derive(Accounts)]
pub struct SetGamePlayerGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
  
    #[account(
        mut, 
        has_one = player,
        constraint = player_account.player == player.key(),
        seeds = [player.to_account_info().key.as_ref()],
        bump = player_account.bump,
    )]
    pub player_account: Account<'info, GamePlayer>,

    #[account(
        mut, 
        has_one = coach, 
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,

    #[account(mut)]
    pub coach: AccountInfo<'info>,    
}

// ------------ Mint Item -------------------------------
#[derive(Accounts)]
pub struct MintItem<'info> {
    #[account(mut, 
        has_one = coach,
        constraint = game.coach == coach.key()
        && game.playing
        && Clock::get()?.unix_timestamp < game.supernova as i64
    )]
    pub game: Account<'info, Game>, 

    #[account(
        seeds = [game.to_account_info().key.as_ref()],
        bump = game.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        has_one = player,
        constraint = player_account.player == player.key() 
        && player_account.game == game.key(),
        seeds = [player.to_account_info().key.as_ref()],
        bump = player_account.bump,
    )]
    pub player_account: Account<'info, GamePlayer>,

    // Game Vaults
    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
        && game_vault.mint == player_vault.mint
        && get_associated_token_address(&game_vault.key(), &game_vault.mint) == game_vault.key()
        && game_vault.amount > 0
    )]
    pub game_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &wrong_answer_game_vault.owner == gatekeeper.key
        && wrong_answer_game_vault.mint == wrong_answer_player_vault.mint
        && get_associated_token_address(&wrong_answer_game_vault.key(), &wrong_answer_game_vault.mint) == wrong_answer_game_vault.key()
        && wrong_answer_game_vault.amount > 0
    )]
    pub wrong_answer_game_vault: Account<'info, TokenAccount>,

    // Player Vaults
    #[account(
        mut, 
        constraint = &player_vault.owner == player.key
        && get_associated_token_address(&player_vault.key(), &player_vault.mint) == player_vault.key()
    )]
    pub player_vault: Account<'info, TokenAccount>, // Create Account If Needed
    #[account(
        mut, 
        constraint = &wrong_answer_player_vault.owner == player.key
        && get_associated_token_address(&wrong_answer_player_vault.key(), &wrong_answer_player_vault.mint) == wrong_answer_player_vault.key()
    )]
    pub wrong_answer_player_vault: Account<'info, TokenAccount>, // Create Account If Needed

    // Coach
    #[account(mut)]
    pub coach: AccountInfo<'info>,  

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,    
    pub token_program: AccountInfo<'info>, 
    pub system_program: Program <'info, System>,
}

// ------------ Mint Item -------------------------------
#[derive(Accounts)]
pub struct CombineItem<'info> {
    #[account(mut, 
        has_one = coach,
        constraint = game.coach == coach.key()
        && game.playing
        && Clock::get()?.unix_timestamp < game.supernova as i64
    )]
    pub game: Account<'info, Game>, 

    #[account(
        seeds = [game.to_account_info().key.as_ref()],
        bump = game.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        has_one = player,
        constraint = player_account.player == player.key() 
        && player_account.game == game.key(),
        seeds = [player.to_account_info().key.as_ref()],
        bump = player_account.bump,
    )]
    pub player_account: Account<'info, GamePlayer>,

    // Game Vaults
    #[account(
        mut, 
        constraint = &input_0_vault.owner == gatekeeper.key
        && player_input_0_vault.mint == input_0_vault.mint
        && get_associated_token_address(&input_0_vault.key(), &input_0_vault.mint) == input_0_vault.key()
    )]
    pub input_0_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &input_1_vault.owner == gatekeeper.key
        && input_1_vault.mint == input_1_vault.mint
        && get_associated_token_address(&input_1_vault.key(), &input_1_vault.mint) == input_1_vault.key()
    )]
    pub input_1_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &output_vault.owner == gatekeeper.key
        && output_vault.mint == player_output_vault.mint
        && get_associated_token_address(&output_vault.key(), &output_vault.mint) == output_vault.key()
        && output_vault.amount > 1
    )]
    pub output_vault: Account<'info, TokenAccount>,

    // Player Vaults
    #[account(
        mut, 
        constraint = &player_input_0_vault.owner == player.key
        && get_associated_token_address(&player_input_0_vault.key(), &player_input_0_vault.mint) == player_input_0_vault.key()
        && player_input_0_vault.amount > 1
    )]
    pub player_input_0_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &player_input_1_vault.owner == player.key
        && get_associated_token_address(&player_input_1_vault.key(), &player_input_1_vault.mint) == player_input_1_vault.key()
        && player_input_1_vault.amount > 1
    )]
    pub player_input_1_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &player_output_vault.owner == player.key
        && get_associated_token_address(&player_output_vault.key(), &player_output_vault.mint) == player_output_vault.key()
    )]
    pub player_output_vault: Account<'info, TokenAccount>,

    // Coach
    #[account(mut)]
    pub coach: AccountInfo<'info>,  

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,    
    pub token_program: AccountInfo<'info>, 
    pub system_program: Program <'info, System>,
}

// ------------ Structs -------------------------------
#[account]
#[derive(Default)]
pub struct GamePlayer {
    pub player_account: Pubkey,
    pub game: Pubkey,
    pub player: Pubkey,
    pub bump: u8,

    pub run_start: u64,
    pub run_percent_timestamp: u64,
    pub run_percent: u8,

    pub inventory: Vec<GameInventoryItem>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameItem {
    pub name: String, //Max Length 32

    pub item: Pubkey,
    pub mint: Pubkey,

    pub burned: bool,

    pub item_type: u8,
    pub requirements: u64,
    pub id: u64,

    pub codes: u32, // 4 bytes
    pub percent: u8, // 0-100

    pub max_per_inventory: u8, //Usually 1
    pub amount_per_mint: u8, //Usally 1

    pub cost: u64, //In Lammys
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameInventoryItem {
    pub item: Pubkey,
    pub amount: u8,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameCombination {
    pub input_0_id: u64,
    pub input_0_amount: u8,
    pub input_1_id: u64,
    pub input_1_amount: u8,
    pub output_id: u64,
    pub output_amount: u8,

    pub cost: u64,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameLeaderboardInfo {
    pub player: Pubkey,
    pub run_start: u64,
    pub run_percent_timestamp: u64,
    pub run_percent: u8,
    
}

#[account]
pub struct Game {
    // Game Handlers
    pub game: Pubkey,
    pub coach: Pubkey,
    pub gatekeeper: Pubkey,
    pub nonce: u8,
    pub lamports: u64,

    // Game State
    pub cheater_time: u64,
    pub playing: bool,
    pub game_start: u64,
    pub supernova: u64,

    // Game Mechanics
    pub assets: Vec<GameItem>,
    pub combinations: Vec<GameCombination>,
    pub wrong_answer_item: Pubkey,

    // -- Leaderboards [Ranked by percent, then time from start]
    pub leaderboard: Vec<GameLeaderboardInfo>,
}

// ENUM - Error Codes
#[error]
pub enum ErrorCode {
    #[msg("Bad")]
    WrongCoach,
    #[msg("Naughty")]
    SomethingBad,
    #[msg("Could not fund the TX")]
    CouldNotFundTX, 
    #[msg("Bad item ID")]
    BadItemId, 
    #[msg("Bad combination")]
    BadCombination, 
    #[msg("Not Enough to Combine")]
    NotEnoughToCombine, 
    #[msg("Bad item type")]
    BadItemType, 
    #[msg("Bad mint index")]
    BadMintIndex, 
    #[msg("Already Burned")]
    Burned, 
    #[msg("Len out of bounds")]
    BadLens, 
    #[msg("Cheater...")]
    Cheater, 
    #[msg("Could not TX the NFT")]
    CouldNotTXNFT, 
    #[msg("The given nonce does not create a valid program derived address.")]
    InvalidGateKeeperNonce,
    #[msg("The derived check signer does not match that which was given.")]
    InvalidGatekeeper,
}
