use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, Burn, Mint};
use spl_associated_token_account::get_associated_token_address;
use std::convert::Into;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

macro_rules! null_key {() => {Pubkey::new_from_array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])}}
macro_rules! get_id {($id_index:expr) => {0b1 << $id_index}}
macro_rules! get_time {() => {Clock::get()?.unix_timestamp as u64}}
macro_rules! is_playing {($start_date:expr) => { ($start_date as u64) < get_time!() }}
macro_rules! is_recreation {($supernova_date:expr) => { ($supernova_date as u64) < get_time!() }}
macro_rules! is_cheating {($start_date:expr,$cheat_time:expr) => { ($start_date as u64 + $cheat_time as u64) > get_time!() }}

const ACCOUNT_DISCRIMINATOR: usize = 8;
const MAX_NAME_LEN: usize = 32;
const MAX_TAIL_SEED_INDEX: usize = 16;

const TYPE_ITEM: u8 = 0x00;
const TYPE_REWARD: u8 = 0x01;
const TYPE_COMBINATION_OUTPUT: u8 = 0x02;

const NULL_MINT_BYTES: [u8; 4] = [0,0,0,0];
const NULL_DATE: u64 = !0;
const NULL_REQUIREMENTS: u64 = 0;
const PUBKEY_SIZE: usize = 32;

#[program]
pub mod soltreasure {
    use super::*;

    // -------------- CREATION ------------------------ //
    pub fn create_game(
        ctx: Context<CreateGame>,
        params: CreateGameParams,
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;

        if params.name.len() > MAX_NAME_LEN - 1 { return Err(ErrorCode::GeneralError.into()); }

        // Check Gatekeeper
        let gatekeeper = Pubkey::create_program_address(
            &[
                game.key().as_ref(), 
                &[params.nonce]
            ],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::GeneralError)?;

        if &gatekeeper != ctx.accounts.gatekeeper.to_account_info().key {
            return Err(ErrorCode::GeneralError.into());
        }

        // Game Handlers
        game.name = params.name.clone();
        game.game = game.key().clone();
        game.coach = ctx.accounts.coach.key().clone();
        game.gatekeeper = ctx.accounts.gatekeeper.key().clone();
        game.nonce = params.nonce;
        game.lamports = 0;

        // Game State
        game.cheater_time = NULL_DATE;
        game.start_date = NULL_DATE;
        game.supernova_date = NULL_DATE;

        // Token Mints
        game.replay_token_mint = null_key!();
        game.wrong_answer_mint = null_key!();

        // Counts
        game.item_count = params.item_count;
        game.combination_count = params.combination_count;
        game.leaderboard_count = params.leaderboard_count;

        Ok(())
    }

    // -------------- LOAD ITEM ------------------------ //
    pub fn load_item(
        ctx: Context<LoadItem>,
        params: LoadItemParams
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;
        let id_index = game.items.len();

        let item_mint = ctx.accounts.game_vault.mint;
        let item_index = get_item_index_from_mint(&item_mint, &game.items);


        if ctx.accounts.coach_vault.amount < params.amount_to_tx { return Err(ErrorCode::GeneralError.into()); }
        if params.name.len() > MAX_NAME_LEN { return Err(ErrorCode::GeneralError.into()); }
        if item_index != game.items.len() { return Err(ErrorCode::GeneralError.into()); }
        if params.mint_tail_seed as usize > MAX_TAIL_SEED_INDEX { return Err(ErrorCode::GeneralError.into()); }
        if !check_item_has_ok_mint(&params.mint_bytes) { return Err(ErrorCode::GeneralError.into()); }
        if game.items.len() + 1 > game.item_count as usize { return Err(ErrorCode::GeneralError.into()); }
        if is_playing!(game.start_date) { return Err(ErrorCode::GeneralError.into()); }

        match params.item_type {
            TYPE_ITEM | TYPE_REWARD => {
                game.items.push(
                    GameItem{
                        name: params.name.clone(),
                        mint: ctx.accounts.game_vault.mint.clone(),
                        burned: false,
                        item_type: params.item_type,
                        mint_tail_seed: params.mint_tail_seed,
                        mint_bytes: params.mint_bytes.clone(),
                        percent: params.percent,
                        id: get_id!(id_index),
                        requirements: !0, // Will be set later
                        max_per_inventory: params.max_per_inventory,
                        amount_per_mint: params.amount_per_mint,
                        cost: params.cost,
                    }
                );
            }
            _=> {
                return Err(ErrorCode::GeneralError.into());
            }
        }

        if params.is_replay_token {
            game.replay_token_mint = ctx.accounts.game_vault.mint;
        }

        if params.is_wrong_answer_item {
            game.wrong_answer_mint = ctx.accounts.game_vault.mint;
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.coach_vault.to_account_info().clone(),
            to: ctx.accounts.game_vault.to_account_info().clone(),
            authority: ctx.accounts.coach.to_account_info().clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        let token_tx_result = token::transfer(cpi_ctx, params.amount_to_tx);

        if !token_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        Ok(())
    }

    // -------------- LOAD COMBINATION ------------------------ //
    pub fn load_combination(
        ctx: Context<LoadCombination>,
        params: LoadCombinationParams,
    ) -> ProgramResult {

        // Update
        let game = &mut ctx.accounts.game;
        let item_count = game.items.len();

        if params.name.len() > MAX_NAME_LEN { return Err(ErrorCode::GeneralError.into()); }
        if game.combinations.len() + 1 > game.combination_count as usize { return Err(ErrorCode::GeneralError.into()); }
        if is_playing!(game.start_date) { return Err(ErrorCode::GeneralError.into()); }

        let mut input_0_id = 0;
        let mut input_1_id = 0;
        let mut output_id = 0;

        for i in 0..item_count {
            if game.items[i].mint == ctx.accounts.input_0.mint {
                input_0_id = get_id!(i);
            }
            if game.items[i].mint == ctx.accounts.input_1.mint {
                input_1_id = get_id!(i);
            }
            if game.items[i].mint == ctx.accounts.output.mint {
                output_id = get_id!(i);
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
                name: String::from(params.name),
                input_0_id: input_0_id,
                input_0_amount: params.input_0_amount,
                input_1_id: input_1_id,
                input_1_amount: params.input_1_amount,
                output_id: output_id,
                output_amount: params.output_amount,
            }
        );

        Ok(())
    }

    // -------------- LOAD REQUREMENTS ------------------------ //
    pub fn load_requirements(
        ctx: Context<LoadRequirements>,
        params: LoadRequirementsParams,
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;
        let item_index = get_item_index_from_mint(&ctx.accounts.item_vault.mint, &game.items);

        if item_index == game.items.len() { return Err(ErrorCode::GeneralError.into()); }
        if is_playing!(game.start_date) { return Err(ErrorCode::GeneralError.into()); }

        game.items[item_index].requirements = params.requirements;

        Ok(())
    }

    // -------------- PLAY/PAUSE ------------------------ //
    pub fn start_stop_countdown(
        ctx: Context<StartStopCountdown>,
        params: StartStopCountdownParams,
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;
        let replay_token_index = get_item_index_from_mint(&game.replay_token_mint, &game.items);
        let wrong_answer_index = get_item_index_from_mint(&game.wrong_answer_mint, &game.items);
        let now = get_time!();

        if replay_token_index == game.items.len() { return Err(ErrorCode::GeneralError.into()); }
        if wrong_answer_index == game.items.len() { return Err(ErrorCode::GeneralError.into()); }
        if now + params.countdown_time >= params.supernova_date { return Err(ErrorCode::GeneralError.into()); }
        if params.supernova_date - now - params.countdown_time < params.cheater_time { return Err(ErrorCode::GeneralError.into()); }

        if params.playing {
            game.cheater_time = params.cheater_time;
            game.start_date = now + params.countdown_time;
            game.supernova_date = params.supernova_date;
        } else {
            game.cheater_time = NULL_DATE;
            game.start_date = NULL_DATE;
            game.supernova_date = NULL_DATE;
        }

        Ok(())
    }

    // -------------- SUPERNOVA ------------------------ //
    pub fn supernova(
        ctx: Context<Supernova>,
    ) -> ProgramResult {

        let game = &mut ctx.accounts.game;
        let item_vault = &ctx.accounts.item_vault;
        let burn_index = get_item_index_from_mint(&item_vault.mint, &game.items);
        let now = get_time!();

        if !is_playing!(game.start_date) { return Err(ErrorCode::GeneralError.into()); }
        if now <= game.supernova_date { return Err(ErrorCode::GeneralError.into()); }
        if burn_index == game.items.len(){ return Err(ErrorCode::GeneralError.into()); }
        if item_vault.amount == 0 { return Err(ErrorCode::GeneralError.into()); }
        if game.items[burn_index].burned { return Err(ErrorCode::GeneralError.into()); }

        let seeds = &[
            game.to_account_info().key.as_ref(),
            &[game.nonce],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Burn {
            mint: ctx.accounts.item_mint.to_account_info().clone(),
            to: ctx.accounts.item_vault.to_account_info().clone(),
            authority: ctx.accounts.gatekeeper.to_account_info().clone(),
        };
        let cpi_program = ctx.accounts.token_program.clone();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        let token_tx_result = token::burn(cpi_ctx, item_vault.amount);

        if !token_tx_result.is_ok() {
            return Err(ErrorCode::CouldNotTXNFT.into());
        }

        // Update State
        game.items[burn_index].burned = true;

        Ok(())
    }

    // -------------- USER FUNCTIONS ------------------------ //
    pub fn create_player_account(
        ctx: Context<CreatePlayer>, 
        params: CreatePlayerParams,
    ) -> ProgramResult {
        
        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let now = get_time!();

        if params.name.len() > MAX_NAME_LEN { return Err(ErrorCode::GeneralError.into()); }
        if now > game.supernova_date && ctx.accounts.player_replay_vault.amount == 0 { return Err(ErrorCode::GeneralError.into()); }

        // Check Player Account
        let player_account_key = Pubkey::create_program_address(
            &[
                ctx.accounts.player.key().as_ref(),
                game.key().as_ref(),
                &[params.bump]
            ],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::GeneralError)?;

        if &player_account_key != &player_account.key() {
            return Err(ErrorCode::GeneralError.into());
        }

        player_account.name = params.name.clone();
        player_account.player = ctx.accounts.player.key().clone();
        player_account.game = game.key().clone();
        player_account.player_replay_vault = ctx.accounts.player_replay_vault.key().clone();
        player_account.player_account = player_account.key().clone();
        player_account.bump = params.bump;

        player_account.run_start = now;
        player_account.run_percent_timestamp = now;
        player_account.run_percent = 0;

        player_account.is_og = false;
        player_account.is_speedrunning = false;

        for i in 0..game.items.len() {
            player_account.inventory.push(
                GameInventoryItem{
                    mint: game.items[i].mint,
                    minted_count: 0,
                    amount: 0,
                }
            );
        }

        Ok(())
    }

    pub fn start_speedrun(
        ctx: Context<StartSpeedrun>, 
    ) -> ProgramResult {
        
        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let now = get_time!();

        if now < game.supernova_date { return Err(ErrorCode::GeneralError.into()); }
        if !player_account.is_og && ctx.accounts.player_replay_vault.amount == 0 { return Err(ErrorCode::GeneralError.into()); }

        player_account.run_start = now;
        player_account.run_percent_timestamp = now;
        player_account.run_percent = 0;

        player_account.is_speedrunning = true;

        for i in 0..game.items.len() {
            player_account.inventory[i] = GameInventoryItem {
                mint: game.items[i].mint,
                minted_count: 0,
                amount: 0,
            };
        }

        Ok(())
    }

    pub fn hash_item(
        ctx: Context<HashItem>,
        params: HashItemParams
    ) -> ProgramResult {

        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let now = get_time!();
        let is_recreation = is_recreation!(game.supernova_date);
        let item_index = get_item_index_from_mint(&ctx.accounts.game_item_account.mint, &game.items);
        let bad_index = get_item_index_from_mint(&game.wrong_answer_mint, &game.items);

        if !is_playing!(game.start_date) { return Err(ErrorCode::GeneralError.into()); }
        if item_index == game.items.len() { return Err(ErrorCode::GeneralError.into()); }

        if is_recreation {
            if !player_account.is_og {
                if ctx.accounts.player_replay_vault.amount == 0 { return Err(ErrorCode::GeneralError.into()); }
            }
        }

        let item = &game.items[item_index];
        let bad_item = &game.items[bad_index];
        let item_inventory_index = get_inventory_item_index_from_mint(&item.mint, &player_account.inventory);
        let bad_inventory_index = get_inventory_item_index_from_mint(&game.wrong_answer_mint, &player_account.inventory);

        // Check in inventory
        if item_inventory_index == player_account.inventory.len() { return Err(ErrorCode::GeneralError.into()); }
        if bad_inventory_index == player_account.inventory.len() { return Err(ErrorCode::GeneralError.into()); }

        // Check Combo Item
        if item.item_type == TYPE_COMBINATION_OUTPUT { return Err(ErrorCode::GeneralError.into()); }

        // Check Cheat
        if !is_recreation && item.item_type == TYPE_REWARD && is_cheating!(player_account.run_start, game.cheater_time) { 
            return Err(ErrorCode::GeneralError.into()); 
        }

        // Check Requirements
        if item.requirements != NULL_REQUIREMENTS {
            if !meets_item_requirements(
                &player_account.inventory,
                item.requirements, 
            ) { return Err(ErrorCode::GeneralError.into()); }
        }

        let mut good_hash = false;

        // Check Hash
        if check_item_has_null_mint(&item.mint_bytes) {
            good_hash = true;
        } else {
            if check_for_correct_hash(
                &params.hash,
                &item.mint_bytes,
                &ctx.accounts.player.key(),
                item.mint_tail_seed,    
            ) { good_hash = true; }
        }

        // Set State
        if good_hash {
            if item.max_per_inventory < item.amount_per_mint + player_account.inventory[item_inventory_index].amount { 
                return Err(ErrorCode::GeneralError.into()); 
            }

            player_account.inventory[item_inventory_index].amount += item.amount_per_mint;
        } else {
            if bad_item.max_per_inventory < 1 + player_account.inventory[bad_inventory_index].amount { 
                return Err(ErrorCode::GeneralError.into()); 
            }

            player_account.inventory[bad_inventory_index].amount += 1;
        }

        // Set more data
        if is_recreation && good_hash {
            player_account.run_percent += item.percent;
            player_account.run_percent_timestamp = now;
            player_account.inventory[item_inventory_index].minted_count += item.amount_per_mint;

            // Set Speedboard
            if player_account.is_speedrunning {
                let player_percent = player_account.run_percent;
                let player_time = now - player_account.run_start;
                let player_entry = GameLeaderboardInfo {
                    name: player_account.name.clone(),
                    player: player_account.player,
                    run_start: player_account.run_start,
                    run_percent: player_account.run_percent,
                    run_percent_timestamp: player_account.run_percent_timestamp,
                };
    
                if game.speedboard.len() != game.leaderboard_count as usize {
                    game.speedboard.push(player_entry);
                } else {
                    let bump_index = get_leaderbaord_bump_index(
                        &game.speedboard,
                        &player_account.player,
                        player_percent,
                        player_time,
                    );

                    if bump_index != game.speedboard.len() {
                        game.speedboard[bump_index] = player_entry;
                    }
                }
            }
        }

        Ok(())
    }

    pub fn mint_item(
        ctx: Context<MintItem>,
    ) -> ProgramResult {

        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let item_index = get_item_index_from_mint(&ctx.accounts.player_vault.mint, &game.items);
        let inventory_index = get_inventory_item_index_from_mint(&ctx.accounts.player_vault.mint, &player_account.inventory);
        let is_recreation = is_recreation!(game.supernova_date);
        
        if is_recreation { return Err(ErrorCode::GeneralError.into()); }
        if !is_playing!(game.start_date) { return Err(ErrorCode::GeneralError.into()); }

        if item_index == game.items.len() { return Err(ErrorCode::GeneralError.into()); }
        if inventory_index == player_account.inventory.len() { return Err(ErrorCode::GeneralError.into()); }

        let cost_per = game.items[item_index].cost;
        let amount = player_account.inventory[inventory_index].amount - player_account.inventory[inventory_index].minted_count;

        if amount == 0 { return Err(ErrorCode::GeneralError.into()); }

        // If there are not enough in the vault, still count it for the game!
        if ctx.accounts.game_vault.amount >= amount as u64 {

            // Get those Lammys
            let tx_lams = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.player.key(),
                &game.coach.key(),
                cost_per * amount as u64,
            );
            
            let get_tx_lams_response = anchor_lang::solana_program::program::invoke(
                &tx_lams,
                &[
                    ctx.accounts.player.to_account_info().clone(),
                    ctx.accounts.coach.to_account_info().clone(),
                ],
            );
            
            if !get_tx_lams_response.is_ok() {
                return Err(ErrorCode::GeneralError.into());
            }

            // Get those Lammys
            let tx_lams = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.player.key(),
                &game.coach.key(),
                cost_per * amount as u64,
            );
            
            let get_tx_lams_response = anchor_lang::solana_program::program::invoke(
                &tx_lams,
                &[
                    ctx.accounts.player.to_account_info().clone(),
                    ctx.accounts.coach.to_account_info().clone(),
                ],
            );
            
            if !get_tx_lams_response.is_ok() {
                return Err(ErrorCode::GeneralError.into());
            }
            


            // TX Output
            let seeds = &[
                game.to_account_info().key.as_ref(),
                &[game.nonce],
            ];
            let signer = &[&seeds[..]];
            let cpi_program = ctx.accounts.token_program.clone();

            let output_tx = Transfer {
                from: ctx.accounts.game_vault.to_account_info().clone(),
                to: ctx.accounts.player_vault.to_account_info().clone(),
                authority: ctx.accounts.gatekeeper.clone(),
            };
            let output_cpi = CpiContext::new_with_signer(cpi_program.clone(), output_tx, signer);
            let output_tx_result = token::transfer(output_cpi, amount as u64);

            if !output_tx_result.is_ok() {
                return Err(ErrorCode::CouldNotTXNFT.into());
            }
        }

        // Set State
        player_account.is_og = true;
        player_account.run_percent += game.items[item_index].percent;
        player_account.run_percent_timestamp = get_time!();
        player_account.inventory[inventory_index].minted_count += amount;

        Ok(())
    }

    // -------------- COMBINE ITEMS ------------------------ //
    pub fn forge_item(
        ctx: Context<ForgeItem>,
    ) -> ProgramResult {

        // &ctx.accounts.game;

        Ok(())
    }

}

// ------------ CREATE GAME -------------------------------
#[derive(Accounts)]
#[instruction(params: CreateGameParams)]
pub struct CreateGame<'info> {
    #[account(
        init, 
        payer = coach, 
        space = get_game_size(
            params.item_count as usize,
            params.combination_count as usize,
            params.leaderboard_count as usize,
        )
    )]
    pub game: Account<'info, Game>,
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.to_account_info().key.as_ref()],
        bump = params.nonce,
    )]
    pub gatekeeper: AccountInfo<'info>,

    // Signers
    #[account(mut)]
    pub coach: Signer<'info>, 
    /// CHECK: Global account, no need to check
    pub system_program: AccountInfo<'info>,
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreateGameParams {
    pub name: String,
    pub nonce: u8,
    pub item_count: u8,
    pub combination_count: u8,
    pub leaderboard_count: u8,
}

// ------------ LOAD ITEMS -------------------------------
#[derive(Accounts)]
#[instruction(params: LoadItemParams)]
pub struct LoadItem<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.key().as_ref()],
        bump = game.nonce,
    )]
    pub gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &coach_vault.owner == coach.key
        && game_vault.mint == coach_vault.mint
        && get_associated_token_address(&coach.key(), &coach_vault.mint) == coach_vault.key()
    )]
    pub coach_vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
        && get_associated_token_address(&gatekeeper.key(), &game_vault.mint) == game_vault.key()
    )]
    pub game_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: Signer<'info>,    
    /// CHECK: Global Account
    pub token_program: AccountInfo<'info>,  
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct LoadItemParams {
    name: String, // Name of Asset
    item_type: u8, // Game Type 0-3
    mint_tail_seed: u8, // Tail for hash codes
    mint_bytes: [u8; 4], // Hash codes for puzzle to mint
    is_replay_token: bool, // Item as replay token
    is_wrong_answer_item: bool, // Default item to mint on wrong answer
    percent: u8, // Percentage gained with item,
    amount_per_mint: u8, // How many to mint at a pop
    max_per_inventory: u8, // Max amount in inventory
    cost: u64, // Cost in Lammys
    amount_to_tx: u64, // Amount to transfer from vault
}

// ------------ LOAD COMBINATIONS -------------------------------
#[derive(Accounts)]
#[instruction(params: LoadCombinationParams)]
pub struct LoadCombination<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.key().as_ref()],
        bump = game.nonce,
    )]
    pub gatekeeper: AccountInfo<'info>,

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
    pub coach: Signer<'info>,    
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct LoadCombinationParams {
    name: String,       // Name of Combo
    input_0_amount: u8, // Total amount
    input_1_amount: u8, // Total amount
    output_amount:  u8, // Total amount
}

// ------------ LOAD REQUIREMENTS -------------------------------
#[derive(Accounts)]
#[instruction(params: LoadRequirementsParams)]
pub struct LoadRequirements<'info> {
    #[account(
        mut,
        has_one = coach, 
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.key().as_ref()],
        bump = game.nonce,
    )]
    pub gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &item_vault.owner == gatekeeper.key
    )]
    pub item_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub coach: Signer<'info>,    
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct LoadRequirementsParams {
    requirements: u64,
}

// ------------ Play Pause -------------------------------
#[derive(Accounts)]
#[instruction(params: StartStopCountdownParams)]
pub struct StartStopCountdown<'info> {
    #[account(
        mut, 
        has_one = coach, 
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>,

    #[account(mut)]
    pub coach: Signer<'info>,
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct StartStopCountdownParams {
    playing: bool,
    countdown_time: u64,
    supernova_date: u64,
    cheater_time: u64,
}

// ------------ Supernova -------------------------------
#[derive(Accounts)]
pub struct Supernova<'info> {
    #[account(
        mut, 
        has_one = coach,
        constraint = game.coach == coach.key() 
    )]
    pub game: Account<'info, Game>, 
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.key().as_ref()],
        bump = game.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &item_vault.owner == gatekeeper.key
        && item_vault.amount > 0
    )]
    pub item_vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        constraint = item_vault.mint == item_mint.key()
    )]
    pub item_mint: Account<'info, Mint>,

    // Signers
    #[account(mut)]
    pub coach: Signer<'info>,    
    /// CHECK: Global Account
    pub token_program: AccountInfo<'info>, 
}

// ------------ Create Player -------------------------------
#[derive(Accounts)]
#[instruction(params: CreatePlayerParams)]
pub struct CreatePlayer<'info> {
    #[account(
        init,
        payer = player,
        space = get_player_size(game.items.len() as u8)
    )]
    pub player_account: Account<'info, Player>,

    #[account(mut)]
    pub game: Account<'info, Game>, 

    #[account(
        mut, 
        constraint = &player_replay_vault.owner == player.key
        && player_replay_vault.mint == game.replay_token_mint
        && get_associated_token_address(&player.key(), &player_replay_vault.mint) == player_replay_vault.key()
    )]
    pub player_replay_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreatePlayerParams {
    name: String,
    bump: u8,
}

// ------------ Start Speedrun -------------------------------
#[derive(Accounts)]
pub struct StartSpeedrun<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>, 

    #[account(
        mut, 
        has_one = player,
        constraint = player_account.player == player.key() 
        && player_account.game == game.key(),
    )]
    pub player_account: Account<'info, Player>,

    #[account(
        mut, 
        constraint = &player_replay_vault.owner == player.key
        && player_replay_vault.mint == game.replay_token_mint
    )]
    pub player_replay_vault: Account<'info, TokenAccount>,// Signers

    #[account(mut)]
    pub player: Signer<'info>,
}

// ------------ Mint Item -------------------------------
#[derive(Accounts)]
#[instruction(params: HashItemParams)]
pub struct HashItem<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>, 

    #[account(
        mut, 
        has_one = player,
        constraint = player_account.player == player.key() 
        && player_account.game == game.key(),
    )]
    pub player_account: Account<'info, Player>,
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.key().as_ref()],
        bump = game.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        constraint = &game_item_account.owner == gatekeeper.key
    )]
    pub game_item_account: Account<'info, TokenAccount>,// Signers

    #[account(
        mut, 
        constraint = &player_replay_vault.owner == player.key
        && player_replay_vault.mint == game.replay_token_mint
    )]
    pub player_replay_vault: Account<'info, TokenAccount>,// Signers

    #[account(mut)]
    pub player: Signer<'info>,    
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct HashItemParams {
    hash: [u8; 4],
}

#[derive(Accounts)]
pub struct MintItem<'info> {
    #[account(
        mut,
        has_one = coach,
        constraint = game.coach == coach.key()
    )]
    pub game: Account<'info, Game>, 
    /// CHECK: PDA, no need to check
    #[account(
        seeds = [game.key().as_ref()],
        bump = game.nonce,
    )]
    gatekeeper: AccountInfo<'info>,

    #[account(
        mut, 
        has_one = player,
        constraint = player_account.player == player.key() 
        && player_account.game == game.key(),
    )]
    pub player_account: Account<'info, Player>,

    // Game Vaults
    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
        && game_vault.mint == player_vault.mint
    )]
    pub game_vault: Account<'info, TokenAccount>,

    // Player Vaults
    #[account(
        mut, 
        constraint = &player_vault.owner == player.key
    )]
    pub player_vault: Account<'info, TokenAccount>, 

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,  
    /// CHECK: We check that it matches the game
    pub coach: AccountInfo<'info>,
    /// CHECK: Global Account
    pub token_program: AccountInfo<'info>, 
    // /// CHECK: Global Account
    // pub system_program: AccountInfo<'info>,
}

// ------------ Mint Item -------------------------------
#[derive(Accounts)]
pub struct ForgeItem<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>, 
    /// CHECK: PDA, no need to check
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
    )]
    pub player_account: Account<'info, Player>,

    // Game Vaults
    #[account(
        mut, 
        constraint = &input_0_vault.owner == gatekeeper.key
        && player_input_0_vault.mint == input_0_vault.mint
    )]
    pub input_0_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &input_1_vault.owner == gatekeeper.key
        && input_1_vault.mint == input_1_vault.mint
    )]
    pub input_1_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &output_vault.owner == gatekeeper.key
        && output_vault.mint == player_output_vault.mint
    )]
    pub output_vault: Account<'info, TokenAccount>,

    // Player Vaults
    #[account(
        mut, 
        constraint = &player_input_0_vault.owner == player.key
    )]
    pub player_input_0_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &player_input_1_vault.owner == player.key
    )]
    pub player_input_1_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &player_output_vault.owner == player.key
    )]
    pub player_output_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,    
    /// CHECK: Global Account
    pub token_program: AccountInfo<'info>, 
}

// ------------ Structs -------------------------------
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameInventoryItem {
    pub mint: Pubkey,
    pub amount: u8,
    pub minted_count: u8,
}
pub fn get_game_inventory_item_size () -> usize {
    return 32 + 2;
}

#[account]
#[derive(Default)]
pub struct Player {
    pub name: String,
    pub player: Pubkey,
    pub game: Pubkey,

    pub player_replay_vault: Pubkey,
    pub player_account: Pubkey,
    pub bump: u8,

    pub run_start: u64,
    pub run_percent_timestamp: u64,
    pub run_percent: u8,

    pub is_og: bool,
    pub is_speedrunning: bool,

    pub inventory: Vec<GameInventoryItem>,
}
pub fn get_player_size (
    game_item_count: u8,
) -> usize {
    return  ACCOUNT_DISCRIMINATOR +
            (MAX_NAME_LEN) + 
            (32 * 4) + 
            1 + // bump
            8 + // run_start
            8 + // run_percent_timestamp
            1 + // run_percent
            1 + // is_og
            1 + // is_speedrunning
            8 + (game_item_count as usize * get_game_inventory_item_size());
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameItem {
    pub name: String,          // Max Length 32
    pub mint: Pubkey,          // Vault key of the item

    pub burned: bool,          // Is this burned?

    pub requirements: u64,     // Uses ID
    pub id: u64,               // Holds position in 
    pub item_type: u8,         // 0-3

    pub mint_tail_seed: u8,    // 0-15
    pub mint_bytes: [u8; 4],   // 4 bytes

    pub percent: u8,           // 0-100
    pub max_per_inventory: u8, // Usually 1
    pub amount_per_mint: u8,   // Usually 1

    pub cost: u64,             // In Lammys
}
pub fn get_game_item_size () -> usize {
    return  (MAX_NAME_LEN) + 
        (32 * 1) + 
        1 + // burned
        8 + // requirements
        8 + // id
        1 + // item_type
        1 + // mint_tail_seed
        4 + // mint_bytes
        1 + // percent
        1 + // max_per_inventory
        1 + // amount_per_mint
        8;  // cost
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameCombination {
    pub name: String,

    pub input_0_id: u64,
    pub input_0_amount: u8,
    pub input_1_id: u64,
    pub input_1_amount: u8,
    pub output_id: u64,
    pub output_amount: u8,

}
pub fn get_game_combination_size () -> usize {
    return (MAX_NAME_LEN) + (8 * 3) + (3 * 1);
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GameLeaderboardInfo {
    pub name: String,
    pub player: Pubkey,
    pub run_start: u64,
    pub run_percent_timestamp: u64,
    pub run_percent: u8,
}
pub fn get_leaderboard_info_size () -> usize {
    return (MAX_NAME_LEN) + 32 + 8 + 8 + 1;
}

#[account]
pub struct Game {
    // Game Handlers
    pub name: String,
    pub game: Pubkey,
    pub coach: Pubkey,
    pub gatekeeper: Pubkey,
    pub nonce: u8,

    // Game State
    pub lamports: u64,
    pub cheater_time: u64,
    pub start_date: u64,
    pub supernova_date: u64,

    // Game Mechanics
    pub replay_token_mint: Pubkey, 
    pub wrong_answer_mint: Pubkey,

    // Counts 
    pub item_count: u8,
    pub combination_count: u8,
    pub leaderboard_count: u8,

    // Game Items
    pub items: Vec<GameItem>,
    pub combinations: Vec<GameCombination>,

    // Leaderboards
    pub leaderboard: Vec<GameLeaderboardInfo>, // [Ranked by percent, then time from start_date]
    pub speedboard: Vec<GameLeaderboardInfo>, //  [Ranked by percent, then time from run_start]
}
pub fn get_game_size (
    item_count: usize,
    combination_count: usize,
    leaderboard_count: usize,
) -> usize {
    return  ACCOUNT_DISCRIMINATOR +
        (MAX_NAME_LEN) + 
        (32 * 3) + 
        1 + // nonce
        8 + // lammys
        8 + // cheater_time
        8 + // start_date
        8 + // supernova_date
        32 + // replay_token
        32 + // wrong_answer_item
        (3 * 1) + // counts
        8 + (item_count as usize * get_game_item_size()) +
        8 + (combination_count as usize * get_game_combination_size()) +
        8 + (leaderboard_count as usize * get_leaderboard_info_size()) + 
        8 + (leaderboard_count as usize * get_leaderboard_info_size());
}

// ENUM - Error Codes
#[error]
pub enum ErrorCode {
    #[msg("General Error")]
    GeneralError,
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

pub fn get_inventory_item_index_from_mint (
    mint: &Pubkey,
    inventory: &Vec<GameInventoryItem>,
) -> usize {
    let index = inventory.len();
    for i in 0..index {
        if &inventory[i].mint == mint {
            return i;
        }
    }
    return index;
}

pub fn get_item_index_from_mint (
    mint: &Pubkey,
    items: &Vec<GameItem>,
) -> usize {
    let index = items.len();
    for i in 0..index {
        if items[i].mint == *mint {
            return i;
        }
    }
    return index;
}

pub fn check_item_has_null_mint(
    item_mint_bytes: &[u8; 4],
) -> bool {
    for i in 0..item_mint_bytes.len() {
        if item_mint_bytes[i] != NULL_MINT_BYTES[i] { return false; }
    }

    return true;
}

pub fn check_item_has_ok_mint(
    item_mint_bytes: &[u8; 4],
) -> bool {
    for i in 0..item_mint_bytes.len() {
        if item_mint_bytes[i] as usize > PUBKEY_SIZE - 1 { return false; }
    }

    return true;
}

pub fn meets_item_requirements (
    inventory: &Vec<GameInventoryItem>,
    requirement: u64,
) -> bool {
    for i in 0..inventory.len() {
        if get_id!(i) & requirement != 0 {
            if inventory[i].amount == 0 { return false; }
            if inventory[i].minted_count == 0 { return false; }
        }
    }

    return true;
}

pub fn check_for_correct_hash(
    hash: &[u8; 4],
    item_mint_bytes: &[u8; 4],
    player: &Pubkey,
    mint_tail_seed: u8,
) -> bool {
    let mut correct_hash = [0, 0, 0, 0] as [u8; 4];

    // Create the correct hash
    for i in 0..item_mint_bytes.len() {
        correct_hash[i] = 
            player.to_bytes()[PUBKEY_SIZE - 1 - mint_tail_seed as usize] ^ 
            player.to_bytes()[item_mint_bytes[i] as usize];
    }

    // Check against input
    for i in 0..hash.len() {
        if hash[i] != correct_hash[i] { return false }
    }

    return true;
}

pub fn get_leaderbaord_bump_index(
    leaderboard: &Vec<GameLeaderboardInfo>,
    player: &Pubkey,
    player_percent: u8,
    player_time: u64,    
) -> usize {
    let mut should_place = false;
    let mut bump_index = leaderboard.len();

    for i in 0..leaderboard.len() {
        let comp_percent = leaderboard[i].run_percent;
        let comp_time = leaderboard[i].run_percent_timestamp - leaderboard[i].run_start;

        if player == &leaderboard[i].player {
            return i;
        }

        if should_place {
            let bump_percent = leaderboard[bump_index].run_percent;
            let bump_time = leaderboard[bump_index].run_percent_timestamp - leaderboard[bump_index].run_start;

            if bump_percent > comp_percent {
                bump_index = i;
            } else if bump_percent == comp_percent {
                if bump_time < comp_time {
                    bump_index = i;
                }
            }
        } else if player_percent > comp_percent {
            should_place = true;
            bump_index = i;
        } else if player_percent == comp_percent {
            if player_time < comp_time {
                should_place = true;
                bump_index = i;
            }
        }
    }

    return bump_index;
}

// #[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
// #[account]
// pub struct TestStruct {
//     // pub hi: u64,
//     pub bye: u64,
//     pub name: Vec<u8>,
// }

#[test]
pub fn test () {
    // let test1 = Pubkey::new_unique();
    // let test2 = Pubkey::new_unique();
    // let test3 = test2.clone();

    // println!("\nOne {}", test1);
    // println!("Two {}", test2);
    // println!("Three {}\n", test3);

    // println!("\n One == Two [{}]", test1 == test2);
    // println!("\n Two == Three [{}]", &test2 == &test3);
}
