#![no_std]

use soroban_sdk::{contract, contractclient, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token};

// --- Cross-Contract Interfaces ---

#[contractclient(name = "ConfigClient")]
pub trait ConfigInterface {
    fn get_liq_threshold(env: Env) -> u32; // e.g. 8000 BPS
    fn get_liq_bonus(env: Env) -> u32;     // e.g. 10500 BPS = 105% (5% bonus)
    fn get_oracle(env: Env) -> Address;
    fn get_lending_pool(env: Env) -> Address;
}

#[contractclient(name = "OracleClient")]
pub trait OracleInterface {
    fn get_price(env: Env, asset: Address) -> i128;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserPosition {
    pub collateral_amount: i128,
    pub scaled_debt: i128,
    pub last_interaction: u64,
}

#[contractclient(name = "LendingPoolClient")]
pub trait LendingPoolInterface {
    // Read operations
    fn get_user_position_view(env: Env, user: Address, asset: Address) -> UserPosition;
    
    // Borrow index is needed to convert scaled debt to actual debt.
    // In our architecture, the pool itself (or Interest Model) tracks this.
    fn get_current_borrow_index_view(env: Env, asset: Address) -> i128; 

    // Authorized operation: only callable by the Liquidation Engine.
    // Reduces the borrower's debt, subtracts collateral, and sends collateral to the liquidator.
    fn execute_liquidation_burn(
        env: Env, 
        borrower: Address, 
        liquidator: Address,
        collat_asset: Address, 
        debt_asset: Address, 
        actual_debt_repaid: i128, 
        collat_seized: i128
    );
}

// --- Data Types ---

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ConfigAddress,
}

const BPS_MAX: i128 = 10_000;
const WAD: i128 = 1_000_000_000_000_000_000; // 1e18

#[contract]
pub struct LiquidationEngine;

#[contractimpl]
impl LiquidationEngine {
    /// Initializes the Liquidation Engine.
    pub fn initialize(env: Env, admin: Address, config_address: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ConfigAddress, &config_address);
        env.events().publish((symbol_short!("init"),), config_address);
    }

    /// Primary entrypoint for a liquidator to liquidate an unhealthy position.
    /// Liquidator must have already authorized the token transfer of `debt_to_cover` to the pool.
    pub fn liquidate(
        env: Env,
        liquidator: Address,
        borrower: Address,
        debt_asset: Address,
        collat_asset: Address,
        debt_to_cover: i128,
    ) {
        liquidator.require_auth();
        if debt_to_cover <= 0 { panic!("Amount must be > 0"); }

        // 1. Fetch cross-contract configurations
        let config_addr: Address = env.storage().instance().get(&DataKey::ConfigAddress).unwrap();
        let config = ConfigClient::new(&env, &config_addr);
        let oracle = OracleClient::new(&env, &config.get_oracle());
        let pool = LendingPoolClient::new(&env, &config.get_lending_pool());

        // 2. Fetch Borrower Positions
        let collat_position = pool.get_user_position_view(&borrower, &collat_asset);
        let debt_position = pool.get_user_position_view(&borrower, &debt_asset);

        // 3. Fetch Prices
        let collat_price = oracle.get_price(&collat_asset);
        let debt_price = oracle.get_price(&debt_asset);

        // 4. Calculate Actual Debt & Values
        let current_index = pool.get_current_borrow_index_view(&debt_asset);
        let actual_debt = (debt_position.scaled_debt * current_index) / WAD;
        
        let collat_value = (collat_position.collateral_amount * collat_price) / WAD;
        let debt_value = (actual_debt * debt_price) / WAD;

        if debt_value == 0 {
            panic!("Borrower has no debt in this asset");
        }

        // 5. Evaluate Health Factor
        let liq_threshold = config.get_liq_threshold() as i128;
        // liquidation_value = CollatValue * Threshold / 10000
        let liquidation_value = (collat_value * liq_threshold) / BPS_MAX;
        
        // HF = LiquidationValue / DebtValue. If LiquidationValue >= DebtValue, HF >= 1.
        if liquidation_value >= debt_value {
            panic!("Health Factor >= 1. Position is healthy.");
        }

        // 6. Calculate Repayment Math
        // Cap the repayment to the maximum actual debt the user has.
        let actual_repayment = if debt_to_cover > actual_debt { actual_debt } else { debt_to_cover };

        // 7. Calculate Collateral to Seize (with Bonus)
        let bonus = config.get_liq_bonus() as i128; // e.g., 10500 BPS (105%)
        
        // Repayment Value = (actual_repayment * debt_price) / WAD
        // Collat Required for repayment = (Repayment Value * WAD) / collat_price
        // Equivalent to: collat_base = (actual_repayment * debt_price) / collat_price
        let collat_base = (actual_repayment * debt_price) / collat_price;
        let requested_collat_seized = (collat_base * bonus) / BPS_MAX;

        // 8. Handle Edge Case: Not enough collateral for the bonus
        let actual_collat_seized = if requested_collat_seized > collat_position.collateral_amount {
            collat_position.collateral_amount
        } else {
            requested_collat_seized
        };

        // 9. Execute transfer from Liquidator to Pool
        let token_client = token::Client::new(&env, &debt_asset);
        token_client.transfer(&liquidator, &config.get_lending_pool(), &actual_repayment);

        // 10. Command the Lending Pool to burn debt and transfer collateral
        pool.execute_liquidation_burn(
            &borrower, 
            &liquidator,
            &collat_asset, 
            &debt_asset, 
            &actual_repayment, 
            &actual_collat_seized
        );

        // 11. Emit Events
        env.events().publish((Symbol::new(&env, "liquidate"), liquidator.clone(), borrower.clone()), (debt_asset, actual_repayment));
        env.events().publish((Symbol::new(&env, "collat_seized"), liquidator, borrower), (collat_asset, actual_collat_seized));
    }
}

mod test;
