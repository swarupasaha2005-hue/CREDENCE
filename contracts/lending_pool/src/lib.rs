#![no_std]

use soroban_sdk::{contract, contractclient, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol};

// --- Cross-Contract Interfaces ---

#[contractclient(name = "ConfigClient")]
pub trait ConfigInterface {
    fn get_ltv(env: Env) -> u32; // Using u32 for BPS (10000) as established in previous config
    fn get_liq_threshold(env: Env) -> u32;
    fn get_oracle(env: Env) -> Address;
    fn get_interest_model(env: Env) -> Address;
}

#[contractclient(name = "OracleClient")]
pub trait OracleInterface {
    fn get_price(env: Env, asset: Address) -> i128;
}

#[contractclient(name = "InterestModelClient")]
pub trait InterestModelInterface {
    fn update_borrow_index(env: Env, asset: Address, borrow_rate: i128);
    fn get_utilization_rate(env: Env, total_liquidity: i128, total_borrowed: i128) -> i128;
    fn get_borrow_rate(env: Env, utilization: i128, base_rate: i128, optimal_utilization: i128, slope1: i128, slope2: i128) -> i128;
    fn get_borrow_index(env: Env, asset: Address) -> i128;
}

// --- Data Types ---

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    ConfigAddress,
    PoolState(Address), // Mapped by Asset Address
    UserPosition(Address, Address), // (User Address, Asset Address)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolState {
    pub total_liquidity: i128,
    pub total_borrowed: i128,
    pub current_borrow_rate: i128,
    pub current_supply_rate: i128,
    pub current_utilization: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserPosition {
    pub collateral_amount: i128,
    pub scaled_debt: i128, // Scaled by 1e18 WAD Index
    pub last_interaction: u64,
}

const BPS_MAX: i128 = 10_000;
const WAD: i128 = 1_000_000_000_000_000_000; // 1e18

// Internal helper for TTL
fn extend_ttl(env: &Env, key: &DataKey) {
    env.storage().persistent().extend_ttl(key, 17280, 172800);
}

#[contract]
pub struct LendingPool;

#[contractimpl]
impl LendingPool {
    /// Initializes the Lending Pool with the central Configuration Contract address.
    pub fn initialize(env: Env, config_address: Address) {
        if env.storage().instance().has(&DataKey::ConfigAddress) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::ConfigAddress, &config_address);
        env.events().publish((symbol_short!("init"),), config_address);
    }

    /// Helper to get the pool state, or default to 0s if it's a new asset.
    fn get_pool_state(env: &Env, asset: &Address) -> PoolState {
        env.storage().persistent().get(&DataKey::PoolState(asset.clone())).unwrap_or(PoolState {
            total_liquidity: 0,
            total_borrowed: 0,
            current_borrow_rate: 0,
            current_supply_rate: 0,
            current_utilization: 0,
        })
    }

    /// Helper to get user position, or default to 0s.
    fn get_user_position(env: &Env, user: &Address, asset: &Address) -> UserPosition {
        env.storage().persistent().get(&DataKey::UserPosition(user.clone(), asset.clone())).unwrap_or(UserPosition {
            collateral_amount: 0,
            scaled_debt: 0,
            last_interaction: env.ledger().timestamp(),
        })
    }

    /// Internal function to update the interest model before any liquidity change.
    fn update_interest(env: &Env, asset: &Address, state: &PoolState) {
        let config_addr: Address = env.storage().instance().get(&DataKey::ConfigAddress).unwrap();
        let config = ConfigClient::new(env, &config_addr);
        let interest_addr = config.get_interest_model();
        let interest_model = InterestModelClient::new(env, &interest_addr);
        
        interest_model.update_borrow_index(asset, &state.current_borrow_rate);
    }

    /// Deposits collateral into the pool.
    pub fn deposit_collateral(env: Env, user: Address, asset: Address, amount: i128) {
        user.require_auth();
        if amount <= 0 { panic!("Amount must be greater than 0"); }

        let mut state = Self::get_pool_state(&env, &asset);
        
        // 1. Update Interest globally BEFORE liquidity changes
        Self::update_interest(&env, &asset, &state);

        // 2. Transfer tokens from user to pool
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // 3. Update User Position
        let mut position = Self::get_user_position(&env, &user, &asset);
        position.collateral_amount += amount;
        position.last_interaction = env.ledger().timestamp();
        
        let user_key = DataKey::UserPosition(user.clone(), asset.clone());
        env.storage().persistent().set(&user_key, &position);
        extend_ttl(&env, &user_key);

        // 4. Update Pool State
        state.total_liquidity += amount;
        // In a real implementation, we'd query the interest model for new rates here.
        // For simplicity, we just save the updated liquidity.
        
        let pool_key = DataKey::PoolState(asset.clone());
        env.storage().persistent().set(&pool_key, &state);
        extend_ttl(&env, &pool_key);

        env.events().publish((Symbol::new(&env, "deposit"), user, asset), amount);
    }

    /// Borrows assets against collateral.
    pub fn borrow(env: Env, user: Address, collateral_asset: Address, borrow_asset: Address, amount: i128) {
        user.require_auth();
        if amount <= 0 { panic!("Amount must be greater than 0"); }

        // 1. Fetch cross-contract configurations
        let config_addr: Address = env.storage().instance().get(&DataKey::ConfigAddress).unwrap();
        let config = ConfigClient::new(&env, &config_addr);
        let oracle = OracleClient::new(&env, &config.get_oracle());
        let interest_model = InterestModelClient::new(&env, &config.get_interest_model());

        // 2. Update Interest for both assets before calculating debt
        let mut borrow_state = Self::get_pool_state(&env, &borrow_asset);
        Self::update_interest(&env, &borrow_asset, &borrow_state);

        // 3. Get Prices
        let collateral_price = oracle.get_price(&collateral_asset);
        let borrow_price = oracle.get_price(&borrow_asset);

        // 4. Calculate Health Factor / Borrow Capacity
        let position_collat = Self::get_user_position(&env, &user, &collateral_asset);
        let mut position_borrow = Self::get_user_position(&env, &user, &borrow_asset);

        let collateral_value = (position_collat.collateral_amount * collateral_price) / WAD; // Assume WAD precision normalization
        let ltv = config.get_ltv() as i128;
        
        let max_borrow_value = (collateral_value * ltv) / BPS_MAX;
        
        // Current actual debt = scaled_debt * index
        let current_index = interest_model.get_borrow_index(&borrow_asset);
        let actual_current_debt = (position_borrow.scaled_debt * current_index) / WAD;
        let requested_borrow_value = (amount * borrow_price) / WAD;
        let current_debt_value = (actual_current_debt * borrow_price) / WAD;

        if requested_borrow_value + current_debt_value > max_borrow_value {
            panic!("Exceeds borrow capacity");
        }
        
        if borrow_state.total_liquidity < amount {
            panic!("Insufficient pool liquidity");
        }

        // 5. Transfer tokens to user
        let token_client = token::Client::new(&env, &borrow_asset);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        // 6. Update user's scaled debt
        // new_scaled_debt = (requested_amount * WAD) / current_index
        let added_scaled_debt = (amount * WAD) / current_index;
        position_borrow.scaled_debt += added_scaled_debt;
        position_borrow.last_interaction = env.ledger().timestamp();
        
        let user_key = DataKey::UserPosition(user.clone(), borrow_asset.clone());
        env.storage().persistent().set(&user_key, &position_borrow);
        extend_ttl(&env, &user_key);

        // 7. Update pool state
        borrow_state.total_liquidity -= amount;
        borrow_state.total_borrowed += amount;
        
        let pool_key = DataKey::PoolState(borrow_asset.clone());
        env.storage().persistent().set(&pool_key, &borrow_state);
        extend_ttl(&env, &pool_key);

        env.events().publish((Symbol::new(&env, "borrow"), user, borrow_asset), amount);
    }

    /// Repays a borrowed asset.
    pub fn repay(env: Env, user: Address, asset: Address, amount: i128) {
        user.require_auth();
        if amount <= 0 { panic!("Amount must be greater than 0"); }

        let config_addr: Address = env.storage().instance().get(&DataKey::ConfigAddress).unwrap();
        let config = ConfigClient::new(&env, &config_addr);
        let interest_model = InterestModelClient::new(&env, &config.get_interest_model());

        let mut state = Self::get_pool_state(&env, &asset);
        Self::update_interest(&env, &asset, &state);

        let mut position = Self::get_user_position(&env, &user, &asset);
        
        let current_index = interest_model.get_borrow_index(&asset);
        let actual_debt = (position.scaled_debt * current_index) / WAD;
        
        // Prevent paying more than owed
        let repay_amount = if amount > actual_debt { actual_debt } else { amount };

        // Transfer funds to pool
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&user, &env.current_contract_address(), &repay_amount);

        // Reduce scaled debt
        let repaid_scaled = (repay_amount * WAD) / current_index;
        position.scaled_debt -= repaid_scaled;
        if position.scaled_debt < 0 { position.scaled_debt = 0; }
        
        position.last_interaction = env.ledger().timestamp();
        
        let user_key = DataKey::UserPosition(user.clone(), asset.clone());
        env.storage().persistent().set(&user_key, &position);
        extend_ttl(&env, &user_key);

        // Update pool state
        state.total_liquidity += repay_amount;
        state.total_borrowed -= repay_amount;
        if state.total_borrowed < 0 { state.total_borrowed = 0; }
        
        let pool_key = DataKey::PoolState(asset.clone());
        env.storage().persistent().set(&pool_key, &state);
        extend_ttl(&env, &pool_key);

        env.events().publish((Symbol::new(&env, "repay"), user, asset), repay_amount);
    }

    /// Withdraws collateral if health factor allows.
    pub fn withdraw_collateral(env: Env, user: Address, collateral_asset: Address, borrow_asset: Address, amount: i128) {
        user.require_auth();
        if amount <= 0 { panic!("Amount must be greater than 0"); }

        let config_addr: Address = env.storage().instance().get(&DataKey::ConfigAddress).unwrap();
        let config = ConfigClient::new(&env, &config_addr);
        let oracle = OracleClient::new(&env, &config.get_oracle());
        let interest_model = InterestModelClient::new(&env, &config.get_interest_model());

        let mut position_collat = Self::get_user_position(&env, &user, &collateral_asset);
        if position_collat.collateral_amount < amount {
            panic!("Insufficient collateral to withdraw");
        }

        let position_borrow = Self::get_user_position(&env, &user, &borrow_asset);
        
        // Check health factor AFTER hypothetical withdrawal
        if position_borrow.scaled_debt > 0 {
            let collateral_price = oracle.get_price(&collateral_asset);
            let borrow_price = oracle.get_price(&borrow_asset);
            
            let remaining_collateral = position_collat.collateral_amount - amount;
            let collat_value = (remaining_collateral * collateral_price) / WAD;
            
            let liq_threshold = config.get_liq_threshold() as i128;
            let current_index = interest_model.get_borrow_index(&borrow_asset);
            let actual_debt = (position_borrow.scaled_debt * current_index) / WAD;
            let debt_value = (actual_debt * borrow_price) / WAD;

            let liquidation_value = (collat_value * liq_threshold) / BPS_MAX;
            
            if liquidation_value < debt_value {
                panic!("Withdrawal drops health factor below liquidation threshold");
            }
        }

        let mut state = Self::get_pool_state(&env, &collateral_asset);
        Self::update_interest(&env, &collateral_asset, &state);

        // Transfer tokens to user
        let token_client = token::Client::new(&env, &collateral_asset);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        // Update position & state
        position_collat.collateral_amount -= amount;
        let user_key = DataKey::UserPosition(user.clone(), collateral_asset.clone());
        env.storage().persistent().set(&user_key, &position_collat);
        extend_ttl(&env, &user_key);

        state.total_liquidity -= amount;
        let pool_key = DataKey::PoolState(collateral_asset.clone());
        env.storage().persistent().set(&pool_key, &state);
        extend_ttl(&env, &pool_key);

        env.events().publish((Symbol::new(&env, "withdraw"), user, collateral_asset), amount);
    }
    
    // Readonly views

    pub fn get_user_position_view(env: Env, user: Address, asset: Address) -> UserPosition {
        Self::get_user_position(&env, &user, &asset)
    }

    pub fn get_pool_state_view(env: Env, asset: Address) -> PoolState {
        Self::get_pool_state(&env, &asset)
    }
}

mod test;
