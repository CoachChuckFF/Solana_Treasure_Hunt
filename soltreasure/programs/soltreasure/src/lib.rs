use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, Burn, Mint};
use spl_associated_token_account::get_associated_token_address;

declare_id!("GeHoPNKCypvmQy96y8DYxZBQf9gQiVW2NqVMUTxFG8a5");

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
    ) -> Result<()> {

        let game = &mut ctx.accounts.game;

        if params.name.len() > MAX_NAME_LEN { return Err(error!(ErrorCode::NameTooLong)) }

        // Check Gatekeeper
        let gatekeeper = Pubkey::create_program_address(
            &[
                game.key().as_ref(), 
                &[params.nonce]
            ],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::BadGatekeeper)?;

        if &gatekeeper != ctx.accounts.gatekeeper.to_account_info().key {
            return Err(error!(ErrorCode::BadGatekeeper))
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
    ) -> Result<()> {

        let game = &mut ctx.accounts.game;

        // Check Game
        if is_playing!(game.start_date) { return Err(error!(ErrorCode::IsPlaying)) }

        // Check Params
        let id_index = game.items.len();
        if params.name.len() > MAX_NAME_LEN { return Err(error!(ErrorCode::NameTooLong)) }
        if params.mint_tail_seed as usize > MAX_TAIL_SEED_INDEX { return Err(error!(ErrorCode::BadTailSeed)) }
        if !check_item_has_ok_mint(&params.mint_bytes) { return Err(error!(ErrorCode::BadMintBytes)) }

        // Check Items
        let item_index = get_item_index_from_mint(&ctx.accounts.game_vault.mint, &game.items);
        if item_index != game.items.len() { return Err(error!(ErrorCode::ItemAlreadyExists)) }
        if game.item_count as usize <= game.items.len() { return Err(error!(ErrorCode::MaxItemsLoaded)) }
        if ctx.accounts.coach_vault.amount < params.amount_to_tx { return Err(error!(ErrorCode::NotEnoughInCoachesVault)) }

        match params.item_type {
            TYPE_ITEM | TYPE_REWARD | TYPE_COMBINATION_OUTPUT => {
                game.items.push(
                    GameItem{
                        name: params.name.clone(),
                        mint: ctx.accounts.game_vault.mint.clone(),
                        burned: false,
                        item_type: params.item_type,
                        mint_tail_seed: params.mint_tail_seed,
                        mint_bytes: params.mint_bytes.clone(),
                        id: get_id!(id_index),
                        requirements: 0, // Will be set later
                        percent_per_item: params.percent_per_item,
                        items_per_mint: params.items_per_mint,
                        max_items_per_inventory: params.max_items_per_inventory,
                        cost_per_item: params.cost_per_item,
                    }
                );
            }
            _=> {
                return Err(error!(ErrorCode::BadItemType))
            }
        }

        if params.is_replay_token {
            game.replay_token_mint = ctx.accounts.game_vault.mint.clone();
        }

        if params.is_wrong_answer_item {
            game.wrong_answer_mint = ctx.accounts.game_vault.mint.clone();
            game.wrong_answer_vault = ctx.accounts.game_vault.key().clone();
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
            return Err(error!(ErrorCode::CouldNotTX))
        }

        Ok(())
    }

    // -------------- LOAD COMBINATION ------------------------ //
    pub fn load_combination(
        ctx: Context<LoadCombination>,
        params: LoadCombinationParams,
    ) -> Result<()> {

        let game = &mut ctx.accounts.game;

        // Check Game
        if is_playing!(game.start_date) { return Err(error!(ErrorCode::IsPlaying)) }

        // Check Params
        if params.name.len() > MAX_NAME_LEN { return Err(error!(ErrorCode::NameTooLong)) }
        if game.combinations.len() >= game.combination_count as usize { return Err(error!(ErrorCode::MaxCombosLoaded)) }

        let mut input_0_id = 0;
        let mut input_1_id = 0;
        let mut output_id = 0;

        for i in 0..game.items.len() {
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
            return Err(error!(ErrorCode::BadCombo))
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
    ) -> Result<()> {

        let game = &mut ctx.accounts.game;

        // Check Game
        if is_playing!(game.start_date) { return Err(error!(ErrorCode::IsPlaying)) }

        // Check Item
        let item_index = get_item_index_from_mint(&ctx.accounts.item_vault.mint, &game.items);
        if item_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }

        game.items[item_index].requirements = params.requirements;

        Ok(())
    }

    // -------------- PLAY/PAUSE ------------------------ //
    pub fn start_stop_countdown(
        ctx: Context<StartStopCountdown>,
        params: StartStopCountdownParams,
    ) -> Result<()> {

        let game = &mut ctx.accounts.game;
        let now = get_time!();

        // Check Game
        if is_playing!(game.start_date) { return Err(error!(ErrorCode::IsPlaying)) }

        // Check Items
        let replay_token_index = get_item_index_from_mint(&game.replay_token_mint, &game.items);
        let wrong_answer_index = get_item_index_from_mint(&game.wrong_answer_mint, &game.items);
        if replay_token_index == game.items.len() { return Err(error!(ErrorCode::NeedReplayToken)) }
        if wrong_answer_index == game.items.len() { return Err(error!(ErrorCode::NeedWrongAnswerItem)) }

        // Check Params
        if params.playing {
            if now + params.countdown_time >= params.supernova_date { return Err(error!(ErrorCode::BadSupernovaTime)) }
            if now + params.countdown_time + params.cheater_time >= params.supernova_date { return Err(error!(ErrorCode::BadCheaterTime)) }
        }

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
    ) -> Result<()> {

        let game = &mut ctx.accounts.game;
        let item_vault = &ctx.accounts.item_vault;
        let is_recreation = is_recreation!(game.supernova_date);

        // Check Game
        if !is_playing!(game.start_date) { return Err(error!(ErrorCode::NotPlaying)) }
        if !is_recreation { return Err(error!(ErrorCode::StillPlaying)) }

        // Check Items
        let burn_index = get_item_index_from_mint(&item_vault.mint, &game.items);
        if burn_index == game.items.len(){ return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if game.items[burn_index].burned { return Err(error!(ErrorCode::AlreadyBurned)) }

        if item_vault.amount > 0 {
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
                return Err(error!(ErrorCode::CouldNotTX))
            }
        }

        // Update State
        game.items[burn_index].burned = true;

        Ok(())
    }

    // -------------- USER FUNCTIONS ------------------------ //
    pub fn create_player_account(
        ctx: Context<CreatePlayer>, 
        params: CreatePlayerParams,
    ) -> Result<()> {
        
        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let is_recreation = is_recreation!(game.supernova_date);
        let now = get_time!();

        if !is_playing!(game.start_date) { return Err(error!(ErrorCode::NotPlaying)) }
        if is_recreation && ctx.accounts.player_replay_vault.amount == 0 { return Err(error!(ErrorCode::DoesNotHaveReplay)) }

        if params.name.len() > MAX_NAME_LEN { return Err(error!(ErrorCode::NameTooLong)) }

        // Check Player Account
        let player_account_key = Pubkey::create_program_address(
            &[
                ctx.accounts.player.key().as_ref(),
                game.key().as_ref(),
                &[params.bump]
            ],
            ctx.program_id,
        )
        .map_err(|_| ErrorCode::BadPlayerAccount)?;

        if &player_account_key != &player_account.key() {
            return Err(error!(ErrorCode::BadPlayerAccount))
        }

        player_account.name = params.name.clone();
        player_account.player = ctx.accounts.player.key().clone();
        player_account.game = game.key().clone();
        player_account.player_replay_vault = ctx.accounts.player_replay_vault.key().clone();
        player_account.player_wrong_answer_vault = ctx.accounts.player_wrong_answer_vault.key().clone();
        player_account.player_account = player_account.key().clone();

        player_account.run_start = now;
        player_account.run_percent_timestamp = now;
        player_account.run_percent = 0;

        player_account.og_percent = 0;
        player_account.is_speedrunning = is_recreation;

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
    ) -> Result<()> {
        
        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let is_recreation = is_recreation!(game.supernova_date);
        let now = get_time!();

        if !is_playing!(game.start_date) { return Err(error!(ErrorCode::NotPlaying)) }
        if !is_recreation { return Err(error!(ErrorCode::StillPlaying)) }
        if player_account.og_percent == 0 && ctx.accounts.player_replay_vault.amount == 0 { return Err(error!(ErrorCode::DoesNotHaveReplay)) }

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
    ) -> Result<()> {

        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let is_recreation = is_recreation!(game.supernova_date);

        // Check Game
        if !is_playing!(game.start_date) { return Err(error!(ErrorCode::NotPlaying)) }
        if is_recreation {
            if player_account.og_percent == 0 {
                if ctx.accounts.player_replay_vault.mint != game.replay_token_mint { return Err(error!(ErrorCode::DoesNotHaveReplay)) }
                if ctx.accounts.player_replay_vault.amount == 0 { return Err(error!(ErrorCode::DoesNotHaveReplay)) }
            }
        }

        // Check Items
        let item_index = get_item_index_from_mint(&ctx.accounts.game_item_account.mint, &game.items);
        let bad_index = get_item_index_from_mint(&game.wrong_answer_mint, &game.items);
        let item_inventory_index = get_inventory_item_index_from_mint(&ctx.accounts.game_item_account.mint, &player_account.inventory);
        let bad_inventory_index = get_inventory_item_index_from_mint(&game.wrong_answer_mint, &player_account.inventory);

        if item_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if bad_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if item_inventory_index == player_account.inventory.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if bad_inventory_index == player_account.inventory.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }

        let item = &game.items[item_index];
        let bad_item = &game.items[bad_index];

        // Check Combo Item
        if item.item_type == TYPE_COMBINATION_OUTPUT { return Err(error!(ErrorCode::IsCombo)) }

        // Check Cheat
        if !is_recreation && item.item_type == TYPE_REWARD && is_cheating!(player_account.run_start, game.cheater_time) { 
            return Err(error!(ErrorCode::IsPumkinEater)) 
        }

        // Check Requirements
        if item.requirements != NULL_REQUIREMENTS {
            if !meets_item_requirements(
                &player_account.inventory,
                item.requirements, 
            ) { return Err(error!(ErrorCode::DoesNotMeetReqs)) }
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
            if item.max_items_per_inventory < item.items_per_mint + player_account.inventory[item_inventory_index].amount { 
                return Err(error!(ErrorCode::WouldMintTooMany)) 
            }

            player_account.inventory[item_inventory_index].amount += item.items_per_mint;

        } else {
            if bad_item.max_items_per_inventory < bad_item.items_per_mint + player_account.inventory[bad_inventory_index].amount { 
                return Err(error!(ErrorCode::WouldMintTooMany)) 
            }

            player_account.inventory[bad_inventory_index].amount += bad_item.items_per_mint;
            
        }

        Ok(())
    }

    pub fn mint_item(
        ctx: Context<MintItem>,
    ) -> Result<()> {
        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;
        let is_recreation = is_recreation!(game.supernova_date);
        
        // Check Game
        if !is_playing!(game.start_date) { return Err(error!(ErrorCode::NotPlaying)) }
        if is_recreation {
            if player_account.og_percent == 0 {
                if ctx.accounts.player_vault_or_replay.mint != game.replay_token_mint { return Err(error!(ErrorCode::DoesNotHaveReplay)) }
                if ctx.accounts.player_vault_or_replay.amount == 0 { return Err(error!(ErrorCode::DoesNotHaveReplay)) }
            }
        }

        // Check Items
        let item_index = get_item_index_from_mint(&ctx.accounts.game_vault.mint, &game.items);
        let bad_item_index = get_item_index_from_mint(&game.wrong_answer_mint, &game.items);
        let inventory_index = get_inventory_item_index_from_mint(&ctx.accounts.game_vault.mint, &player_account.inventory);
        let bad_inventory_index = get_inventory_item_index_from_mint(&game.wrong_answer_mint, &player_account.inventory);
        
        if item_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if bad_item_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if inventory_index == player_account.inventory.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if bad_inventory_index == player_account.inventory.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        
        // Check Amounts
        let amount = player_account.inventory[inventory_index].amount - player_account.inventory[inventory_index].minted_count;
        let bad_amount = player_account.inventory[bad_inventory_index].amount - player_account.inventory[bad_inventory_index].minted_count;

        if amount == 0 && bad_amount == 0 {  return Err(error!(ErrorCode::NoneToMint)) }

        // If ! Recreation
        if !is_recreation {

            // Check that mints match
            if game.items[item_index].mint != player_account.inventory[inventory_index].mint { return Err(error!(ErrorCode::GeneralError)) }

            // If there are not enough in the vault, still count it for the game!
            if ctx.accounts.game_vault.amount >= amount as u64 && amount != 0 {
    
                let lammy_cost = amount as u64 * game.items[item_index].cost_per_item;
                if lammy_cost != 0 {
                    // Get those Lammys
                    let tx_lams = anchor_lang::solana_program::system_instruction::transfer(
                        &ctx.accounts.player.key(),
                        &ctx.accounts.coach.key(),
                        lammy_cost,
                    );
                    
                    let get_tx_lams_response = anchor_lang::solana_program::program::invoke(
                        &tx_lams,
                        &[
                            ctx.accounts.player.to_account_info().clone(),
                            ctx.accounts.coach.to_account_info().clone(),
                        ],
                    );
                    
                    if !get_tx_lams_response.is_ok() {
                        return Err(error!(ErrorCode::CouldNotTX))
                    }

                    game.lamports += lammy_cost;
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
                    to: ctx.accounts.player_vault_or_replay.to_account_info().clone(),
                    authority: ctx.accounts.gatekeeper.clone(),
                };
                let output_cpi = CpiContext::new_with_signer(cpi_program.clone(), output_tx, signer);
                let output_tx_result = token::transfer(output_cpi, amount as u64);
    
                if !output_tx_result.is_ok() {
                    return Err(error!(ErrorCode::CouldNotTX))
                }
            }

            // If there are not enough in the vault, still count it for the game!
            if ctx.accounts.game_wrong_answer_vault.amount >= bad_amount as u64 && bad_amount != 0 {

                let lammy_cost = bad_amount as u64 * game.items[bad_item_index].cost_per_item;
                if lammy_cost != 0 {
                    // Get those Lammys
                    let tx_lams = anchor_lang::solana_program::system_instruction::transfer(
                        &ctx.accounts.player.key(),
                        &ctx.accounts.coach.key(),
                        lammy_cost,
                    );
                    
                    let get_tx_lams_response = anchor_lang::solana_program::program::invoke(
                        &tx_lams,
                        &[
                            ctx.accounts.player.to_account_info().clone(),
                            ctx.accounts.coach.to_account_info().clone(),
                        ],
                    );
                    
                    if !get_tx_lams_response.is_ok() {
                        return Err(error!(ErrorCode::CouldNotTX))
                    }

                    game.lamports += lammy_cost;
                }
                
                // TX Output
                let seeds = &[
                    game.to_account_info().key.as_ref(),
                    &[game.nonce],
                ];
                let signer = &[&seeds[..]];
                let cpi_program = ctx.accounts.token_program.clone();
    
                let output_tx = Transfer {
                    from: ctx.accounts.game_wrong_answer_vault.to_account_info().clone(),
                    to: ctx.accounts.player_wrong_answer_vault.to_account_info().clone(),
                    authority: ctx.accounts.gatekeeper.clone(),
                };
                let output_cpi = CpiContext::new_with_signer(cpi_program.clone(), output_tx, signer);
                let output_tx_result = token::transfer(output_cpi, bad_amount as u64);
    
                if !output_tx_result.is_ok() {
                    return Err(error!(ErrorCode::CouldNotTX))
                }
            }
        }

        // Set State
        player_account.run_percent += game.items[item_index].percent_per_item * amount;
        player_account.run_percent += game.items[bad_item_index].percent_per_item * bad_amount;
        player_account.inventory[inventory_index].minted_count = player_account.inventory[inventory_index].amount;
        player_account.inventory[bad_inventory_index].minted_count = player_account.inventory[bad_inventory_index].amount;
        player_account.run_percent_timestamp = get_time!();

        if !is_recreation { player_account.og_percent = player_account.run_percent; }

        if player_account.player != game.coach {
            if is_recreation {

                // Set Speedboard
                if player_account.is_speedrunning {
                    let player_percent = player_account.run_percent;
                    let player_time = player_account.run_percent_timestamp - player_account.run_start;
                    let player_entry = GameLeaderboardInfo {
                        name: player_account.name.clone(),
                        player: player_account.player,
                        game_start: game.start_date,
                        run_start: player_account.run_start,
                        run_percent: player_account.run_percent,
                        run_percent_timestamp: player_account.run_percent_timestamp,
                    };
                    let bump_index = get_leaderbaord_bump_index(
                        &game.speedboard,
                        game.leaderboard_count,
                        &player_account.player,
                        player_percent,
                        player_time,
                    );
    
                    if bump_index == !0 { 
                        game.speedboard.push(player_entry); 
                    } else if bump_index < game.speedboard.len() {
                        game.speedboard[bump_index] = player_entry;
                    }
                }
    
            } else {
                // Set Leaderboard
                let player_percent = player_account.run_percent;
                let player_time = player_account.run_percent_timestamp - game.start_date;
                let player_entry = GameLeaderboardInfo {
                    name: player_account.name.clone(),
                    player: player_account.player,
                    game_start: game.start_date,
                    run_start: player_account.run_start,
                    run_percent: player_account.run_percent,
                    run_percent_timestamp: player_account.run_percent_timestamp,
                };
                let bump_index = get_leaderbaord_bump_index(
                    &game.leaderboard,
                    game.leaderboard_count,
                    &player_account.player,
                    player_percent,
                    player_time,
                );
    
                if bump_index == !0 { 
                    game.leaderboard.push(player_entry); 
                } else if bump_index < game.leaderboard.len() {
                    game.leaderboard[bump_index] = player_entry;
                }
            }
        } 


        Ok(())
    }

    // -------------- COMBINE ITEMS ------------------------ //
    pub fn forge_item(
        ctx: Context<ForgeItem>,
        params: ForgeItemParams,
    ) -> Result<()> {

        let player_account = &mut ctx.accounts.player_account;
        let game = &mut ctx.accounts.game;

        let input_0_index = get_item_index_from_mint(&ctx.accounts.input_0_vault.mint, &game.items);
        let input_1_index = get_item_index_from_mint(&ctx.accounts.input_1_vault.mint, &game.items);
        let output_index = get_item_index_from_mint(&ctx.accounts.output_vault.mint, &game.items);

        let input_0_inventory_index = get_inventory_item_index_from_mint(&ctx.accounts.input_0_vault.mint, &player_account.inventory);
        let input_1_inventory_index = get_inventory_item_index_from_mint(&ctx.accounts.input_1_vault.mint, &player_account.inventory);
        let output_inventory_index = get_inventory_item_index_from_mint(&ctx.accounts.output_vault.mint, &player_account.inventory);

        let is_recreation = is_recreation!(game.supernova_date);
        
        // Check Game
        if !is_playing!(game.start_date) { return Err(error!(ErrorCode::NotPlaying)) }
        if is_recreation {
            if player_account.og_percent == 0 {
                if ctx.accounts.player_replay_vault.mint != game.replay_token_mint { return Err(error!(ErrorCode::DoesNotHaveReplay)) }
                if ctx.accounts.player_replay_vault.amount == 0 { return Err(error!(ErrorCode::DoesNotHaveReplay)) }
            }
        }

        // Input Checks
        if params.combination_index as usize >= game.combinations.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }

        // Account Checks
        if input_0_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if input_1_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if output_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExist)) }
        if input_0_inventory_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if input_1_inventory_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if output_inventory_index == game.items.len() { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }

        let combo = &game.combinations[params.combination_index as usize];
        let player_i_0 = &player_account.inventory[input_0_inventory_index];
        let player_i_1 = &player_account.inventory[input_1_inventory_index];
        let player_o = &player_account.inventory[output_inventory_index];

        // Check Correct Combo
        if game.items[input_0_index].id != combo.input_0_id { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if game.items[input_1_index].id != combo.input_0_id { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if game.items[output_index].id != combo.output_id { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }

        // Amount Checks
        if player_i_0.amount < combo.input_0_amount { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if player_i_1.amount < combo.input_1_amount { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }
        if player_o.amount + combo.output_amount > game.items[output_index].max_items_per_inventory { return Err(error!(ErrorCode::ItemDoesNotExistInInventory)) }

        // // Set State
        player_account.inventory[input_0_inventory_index].amount -= combo.input_0_amount;
        player_account.inventory[input_0_inventory_index].minted_count = player_account.inventory[input_0_inventory_index].amount;
        player_account.run_percent -= game.items[input_0_index].percent_per_item * combo.input_0_amount;

        player_account.inventory[input_1_inventory_index].amount -= combo.input_1_amount;
        player_account.inventory[input_1_inventory_index].minted_count = player_account.inventory[input_1_inventory_index].amount;
        player_account.run_percent -= game.items[input_1_index].percent_per_item * combo.input_1_amount;

        player_account.inventory[output_inventory_index].amount += combo.output_amount;

        Ok(())
    }

    // pub fn test_stack(
    //     ctx: Context<TestStack>,
    // ) -> Result<()> {
    //     let foo = [0_u8; 4096 - 89];
    //     let boo = [0_u8; 10];

    //     msg!("{:?}", foo);
    
    //     Ok(())
    // }

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
        ),
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
    percent_per_item: u8, // Percentage gained with item,
    items_per_mint: u8, // How many to mint at a pop
    max_items_per_inventory: u8, // Max amount in inventory
    cost_per_item: u64, // Cost in Lammys
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
        space = get_player_size(game.items.len() as u8),
        seeds = [
            player.key().as_ref(),
            game.key().as_ref(),
        ],
        bump
    )]
    pub player_account: Box<Account<'info, Player>>,

    #[account(mut)]
    pub game: Box<Account<'info, Game>>, 

    #[account(
        mut, 
        constraint = &player_replay_vault.owner == player.key
        && player_replay_vault.mint == game.replay_token_mint
        && get_associated_token_address(&player.key(), &player_replay_vault.mint) == player_replay_vault.key()
    )]
    pub player_replay_vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        constraint = &player_wrong_answer_vault.owner == player.key
        && player_wrong_answer_vault.mint == game.wrong_answer_mint
        && get_associated_token_address(&player.key(), &player_wrong_answer_vault.mint) == player_wrong_answer_vault.key()
    )]
    pub player_wrong_answer_vault: Account<'info, TokenAccount>,

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
    pub game: Box<Account<'info, Game>>,
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
    pub player_account: Box<Account<'info, Player>>,

    // Game Vaults
    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
    )]
    pub game_vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        constraint = &game_vault.owner == gatekeeper.key
        && game_wrong_answer_vault.mint == game.wrong_answer_mint
    )]
    pub game_wrong_answer_vault: Account<'info, TokenAccount>,

    // Player Vaults
    #[account(
        mut, 
        constraint = &player_vault_or_replay.owner == player.key
    )]
    pub player_vault_or_replay: Account<'info, TokenAccount>, 

    #[account(
        mut, 
        constraint = &player_wrong_answer_vault.owner == player.key
        && player_wrong_answer_vault.mint == game.wrong_answer_mint
        && get_associated_token_address(&player.key(), &player_wrong_answer_vault.mint) == player_wrong_answer_vault.key()
    )]
    pub player_wrong_answer_vault: Account<'info, TokenAccount>,

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,  
    #[account(mut)]
    /// CHECK: Global Account
    pub coach: AccountInfo<'info>,
    /// CHECK: Global Account
    pub token_program: AccountInfo<'info>, 
    /// CHECK: Global Account
    pub system_program: Program <'info, System>, // literally solana itself
}

// ------------ Forge Item -------------------------------
#[derive(Accounts)]
#[instruction(params: ForgeItemParams)]
pub struct ForgeItem<'info> {
    #[account(mut)]
    pub game: Box<Account<'info, Game>>, 
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
    pub player_account: Box<Account<'info, Player>>,

    // Game Vaults
    #[account(
        mut, 
        constraint = &input_0_vault.owner == gatekeeper.key
    )]
    pub input_0_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &input_1_vault.owner == gatekeeper.key
    )]
    pub input_1_vault: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = &output_vault.owner == gatekeeper.key
    )]
    pub output_vault: Account<'info, TokenAccount>,

    #[account(
        mut, 
        constraint = &player_replay_vault.owner == player.key
        && player_replay_vault.mint == game.replay_token_mint
    )]
    pub player_replay_vault: Account<'info, TokenAccount>,// Signers

    // Signers
    #[account(mut)]
    pub player: Signer<'info>,    
}
#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ForgeItemParams {
    combination_index: u8,
}

// // ------------ TEST STACK -------------------------------
// #[derive(Accounts)]
// pub struct TestStack<'info> {
//     /// CHECK: Global Account
//     pub test_account: AccountInfo<'info>, 
//     pub test_loader: AccountLoader<'info, BigData>,
// }

// #[account(zero_copy)]
// pub struct BigData {
//     pub big_buffer: [u8; 32],
// }
// impl Default for BigData {
//     fn default() -> Self {
//         unsafe { std::mem::zeroed() }
//     }
// }

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
    pub player_wrong_answer_vault: Pubkey,
    pub player_account: Pubkey,

    pub run_start: u64,
    pub run_percent_timestamp: u64,
    pub run_percent: u8,

    pub og_percent: u8,
    pub is_speedrunning: bool,

    pub inventory: Vec<GameInventoryItem>,
}
pub fn get_player_size (
    game_item_count: u8,
) -> usize {
    return  ACCOUNT_DISCRIMINATOR +
            (MAX_NAME_LEN) + 
            (32 * 5) + 
            8 + // run_start
            8 + // run_percent_timestamp
            1 + // run_percent
            1 + // og_percent
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

    pub percent_per_item: u8,  // 0-100
    pub items_per_mint: u8,    // Usually 1
    pub max_items_per_inventory: u8, // Usually 1

    pub cost_per_item: u64,    // In Lammys
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
    pub game_start: u64,
    pub run_start: u64,
    pub run_percent_timestamp: u64,
    pub run_percent: u8,
}
pub fn get_leaderboard_info_size () -> usize {
    return (MAX_NAME_LEN) + 32 + 8 + 8 + 8 + 1;
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
    pub wrong_answer_vault: Pubkey,

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
        (32 * 4) + 
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

// --------------- HELPERS ---------------------------------
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
        if &items[i].mint == mint {
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
    let wallet = player.to_bytes();

    // Create the correct hash
    for i in 0..item_mint_bytes.len() {
        correct_hash[i] = 
            wallet[wallet.len() - 1 - mint_tail_seed as usize] ^ 
            wallet[item_mint_bytes[i] as usize];
    }

    // Check against input
    for i in 0..hash.len() {
        if hash[i] != correct_hash[i] { return false }
    }

    return true;
}

pub fn get_leaderbaord_bump_index(
    leaderboard: &Vec<GameLeaderboardInfo>,
    leaderboard_max: u8,
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

    if bump_index == leaderboard.len() && leaderboard.len() < leaderboard_max as usize { 
        return !0; 
    }

    return bump_index;
}

// --------------- ERRORS ---------------------------------
#[error_code]
pub enum ErrorCode {
    #[msg("General Error")]
    GeneralError,
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Could not TX")]
    CouldNotTX,
    #[msg("Game has already started")]
    IsPlaying,
    #[msg("Game has not started")]
    NotPlaying,
    #[msg("The game has not ended yet")]
    StillPlaying,
    #[msg("Item does not exists")]
    ItemDoesNotExist,
    #[msg("Inventory item does not exists")]
    ItemDoesNotExistInInventory,
    #[msg("Does not have replay token or is OG")]
    DoesNotHaveReplay,

    #[msg("Bad gatekeeper")]
    BadGatekeeper,

    #[msg("Not enough spl in coach's vault")]
    NotEnoughInCoachesVault,
    #[msg("Item already exists")]
    ItemAlreadyExists,
    #[msg("Bad tail seed")]
    BadTailSeed,
    #[msg("Bad mint bytes")]
    BadMintBytes,
    #[msg("Max items loaded")]
    MaxItemsLoaded,
    #[msg("Bad item type")]
    BadItemType,

    #[msg("Max combos loaded")]
    MaxCombosLoaded,
    #[msg("Bad combo")]
    BadCombo,

    #[msg("Need reply token")]
    NeedReplayToken,
    #[msg("Need wrong answer item")]
    NeedWrongAnswerItem,

    #[msg("Start time > supernova")]
    BadSupernovaTime,
    #[msg("Start time + Cheater time > supernova")]
    BadCheaterTime,

    #[msg("Item has already burned")]
    AlreadyBurned,

    #[msg("Bad player account")]
    BadPlayerAccount,

    #[msg("Cannot hash a combo")]
    IsCombo,
    #[msg("Pumkin Eater...")]
    IsPumkinEater,
    #[msg("Does not meet reqs")]
    DoesNotMeetReqs,
    #[msg("Would mint/hash too many")]
    WouldMintTooMany,

    #[msg("Cannot mint from a recreation")]
    IsRecreation,
    #[msg("None to mint")]
    NoneToMint,
}

// --------------- TESTS ---------------------------------
// #[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
// #[account]
// pub struct TestStruct {
//     // pub hi: u64,
//     pub bye: u64,
//     pub name: Vec<u8>,
// }

// #[test]
// pub fn test () {
//     let player = Pubkey::from_str("4YjAYbmdHXC1QUUoQc363QKitVYoxw9qxCVk5J4ZAYDg");
//     let tail = 1;
//     let mint = [0,1,2,3];
//     let hash = [215,80,94,49];


//     match player {
//         Ok(p) => {
//             let did_match = check_for_correct_hash(
//                 &hash,
//                 &mint,
//                 &p,
//                 tail
//             );
//             println!("Maybe? {}", did_match);
//         },
//         Err(e) => {
//             println!("Naughty {}", e)
//         }
//     }
// }
