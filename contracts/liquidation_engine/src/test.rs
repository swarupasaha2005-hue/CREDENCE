#![cfg(test)]

use super::*;
use soroban_sdk::{
    contract, contractimpl, symbol_short,
    testutils::{Address as _, Ledger},
    Address, Env,
};

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LiquidationEngine);
    let client = LiquidationEngineClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let config_address = Address::generate(&env);

    client.initialize(&admin, &config_address);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LiquidationEngine);
    let client = LiquidationEngineClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let config_address = Address::generate(&env);

    client.initialize(&admin, &config_address);
    client.initialize(&admin, &config_address);
}

// --- Oracle price-safety integration tests (Improvement #3) ---
//
// Uses the real, hardened `oracle` crate (a dev-dependency) so these tests
// prove `liquidate()` genuinely inherits Oracle's zero/stale-price rejection,
// not a hand-rolled substitute. A minimal mock LendingPool records what
// `execute_liquidation_burn` was called with (it isn't LendingPool's own
// accounting under test here - that's covered in lending_pool's test suite).

#[contract]
struct MockConfig;

#[contractimpl]
impl MockConfig {
    pub fn setup(env: Env, liq_threshold: u32, liq_bonus: u32, oracle: Address, lending_pool: Address) {
        env.storage().instance().set(&symbol_short!("liqth"), &liq_threshold);
        env.storage().instance().set(&symbol_short!("liqbon"), &liq_bonus);
        env.storage().instance().set(&symbol_short!("oracle"), &oracle);
        env.storage().instance().set(&symbol_short!("lp"), &lending_pool);
    }

    pub fn get_liq_threshold(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("liqth")).unwrap()
    }

    pub fn get_liq_bonus(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("liqbon")).unwrap()
    }

    pub fn get_oracle(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("oracle")).unwrap()
    }

    pub fn get_lending_pool(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("lp")).unwrap()
    }
}

#[contract]
struct MockLendingPool;

#[contractimpl]
impl MockLendingPool {
    pub fn set_position(env: Env, user: Address, asset: Address, collateral_amount: i128, scaled_debt: i128) {
        env.storage().persistent().set(
            &(user, asset),
            &UserPosition { collateral_amount, scaled_debt, last_interaction: 0 },
        );
    }

    pub fn get_user_position_view(env: Env, user: Address, asset: Address) -> UserPosition {
        env.storage().persistent().get(&(user, asset)).unwrap_or(UserPosition {
            collateral_amount: 0,
            scaled_debt: 0,
            last_interaction: 0,
        })
    }

    pub fn get_current_borrow_index_view(_env: Env, _asset: Address) -> i128 {
        WAD // 1:1, so scaled_debt == actual_debt in these tests
    }

    pub fn execute_liquidation_burn(
        env: Env,
        borrower: Address,
        liquidator: Address,
        collat_asset: Address,
        debt_asset: Address,
        actual_debt_repaid: i128,
        collat_seized: i128,
    ) {
        env.storage().instance().set(
            &symbol_short!("burn"),
            &(borrower, liquidator, collat_asset, debt_asset, actual_debt_repaid, collat_seized),
        );
    }
}

struct Fixture {
    client: LiquidationEngineClient<'static>,
    pool_id: Address,
    oracle_client: oracle::OracleContractClient<'static>,
    debt_asset: Address,
    collat_asset: Address,
    borrower: Address,
    liquidator: Address,
}

/// Deploys LiquidationEngine wired to the real Oracle contract, a MockConfig
/// carrying liq_threshold/liq_bonus, and a MockLendingPool that records the
/// resulting `execute_liquidation_burn` call instead of doing real pool
/// accounting (that flow is covered by lending_pool's own test suite).
fn setup_fixture(env: &Env, liq_threshold: u32, liq_bonus: u32) -> Fixture {
    env.mock_all_auths();

    let engine_id = env.register_contract(None, LiquidationEngine);
    let client = LiquidationEngineClient::new(env, &engine_id);

    let oracle_admin = Address::generate(env);
    let oracle_id = env.register_contract(None, oracle::OracleContract);
    let oracle_client = oracle::OracleContractClient::new(env, &oracle_id);
    oracle_client.initialize(&oracle_admin);

    let pool_id = env.register_contract(None, MockLendingPool);

    let config_id = env.register_contract(None, MockConfig);
    let config_client = MockConfigClient::new(env, &config_id);
    config_client.setup(&liq_threshold, &liq_bonus, &oracle_id, &pool_id);

    let admin = Address::generate(env);
    client.initialize(&admin, &config_id);

    let token_admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let debt_asset = sac.address();
    // execute_liquidation_burn is mocked out on MockLendingPool, so the
    // collateral asset never needs a real token transfer in these tests.
    let collat_asset = Address::generate(env);

    let borrower = Address::generate(env);
    let liquidator = Address::generate(env);

    Fixture { client, pool_id, oracle_client, debt_asset, collat_asset, borrower, liquidator }
}

fn set_position(env: &Env, pool_id: &Address, user: &Address, asset: &Address, collateral_amount: i128, scaled_debt: i128) {
    MockLendingPoolClient::new(env, pool_id).set_position(user, asset, &collateral_amount, &scaled_debt);
}

fn mint_debt_asset(env: &Env, asset: &Address, to: &Address, amount: i128) {
    token::StellarAssetClient::new(env, asset).mint(to, &amount);
}

#[test]
fn test_normal_liquidation_still_succeeds() {
    let env = Env::default();
    let f = setup_fixture(&env, 7500, 10500); // 75% threshold, 5% bonus

    f.oracle_client.set_price(&f.collat_asset, &WAD); // $1.00
    f.oracle_client.set_price(&f.debt_asset, &WAD); // $1.00

    // Collateral 100 @ $1 = $100, threshold 75% => liquidation_value $75.
    // Debt 100 @ $1 = $100 actual debt. $75 < $100 => unhealthy, liquidatable.
    set_position(&env, &f.pool_id, &f.borrower, &f.collat_asset, 100, 0);
    set_position(&env, &f.pool_id, &f.borrower, &f.debt_asset, 0, 100);
    mint_debt_asset(&env, &f.debt_asset, &f.liquidator, 50);

    f.client.liquidate(&f.liquidator, &f.borrower, &f.debt_asset, &f.collat_asset, &50);

    // Debt price == collat price, so collat seized = repayment * bonus/BPS.
    let expected_seized = (50 * 10500) / 10_000;
    let burn: (Address, Address, Address, Address, i128, i128) =
        env.as_contract(&f.pool_id, || env.storage().instance().get(&symbol_short!("burn")).unwrap());
    assert_eq!(burn.4, 50); // actual_debt_repaid
    assert_eq!(burn.5, expected_seized); // collat_seized
}

#[test]
#[should_panic(expected = "Price not found for asset")]
fn test_invalid_oracle_data_causes_safe_failure() {
    let env = Env::default();
    let f = setup_fixture(&env, 7500, 10500);

    // Collateral price was never set on the Oracle at all - the closest
    // real-world analog to "invalid oracle data" now that the Oracle itself
    // refuses to ever store a zero/negative price (see oracle/src/test.rs).
    f.oracle_client.set_price(&f.debt_asset, &WAD);

    set_position(&env, &f.pool_id, &f.borrower, &f.collat_asset, 100, 0);
    set_position(&env, &f.pool_id, &f.borrower, &f.debt_asset, 0, 100);
    mint_debt_asset(&env, &f.debt_asset, &f.liquidator, 50);

    // Must panic safely before any debt/collateral accounting is touched.
    f.client.liquidate(&f.liquidator, &f.borrower, &f.debt_asset, &f.collat_asset, &50);
}

#[test]
#[should_panic(expected = "Oracle price is stale")]
fn test_stale_oracle_price_causes_safe_failure() {
    let env = Env::default();
    env.ledger().with_mut(|li| li.timestamp = 1_000_000);
    let f = setup_fixture(&env, 7500, 10500);

    f.oracle_client.set_price(&f.collat_asset, &WAD);
    f.oracle_client.set_price(&f.debt_asset, &WAD);

    set_position(&env, &f.pool_id, &f.borrower, &f.collat_asset, 100, 0);
    set_position(&env, &f.pool_id, &f.borrower, &f.debt_asset, 0, 100);
    mint_debt_asset(&env, &f.debt_asset, &f.liquidator, 50);

    // Let the collateral price go stale (> MAX_PRICE_AGE_SECONDS old).
    env.ledger().with_mut(|li| li.timestamp = 1_000_000 + 86_400 + 1);
    f.client.liquidate(&f.liquidator, &f.borrower, &f.debt_asset, &f.collat_asset, &50);
}

#[test]
fn test_price_scaling_consistent_between_health_factor_and_seizure() {
    let env = Env::default();
    let f = setup_fixture(&env, 7500, 10500);

    // Distinct, non-1:1 prices: collateral $2.00, debt $1.00.
    let collat_price = 2 * WAD;
    let debt_price = WAD;
    f.oracle_client.set_price(&f.collat_asset, &collat_price);
    f.oracle_client.set_price(&f.debt_asset, &debt_price);

    // Collateral 100 @ $2 = $200 value; threshold 75% => liquidation_value $150.
    // Debt 200 @ $1 = $200 actual debt. $150 < $200 => unhealthy.
    set_position(&env, &f.pool_id, &f.borrower, &f.collat_asset, 100, 0);
    set_position(&env, &f.pool_id, &f.borrower, &f.debt_asset, 0, 200);
    mint_debt_asset(&env, &f.debt_asset, &f.liquidator, 100);

    f.client.liquidate(&f.liquidator, &f.borrower, &f.debt_asset, &f.collat_asset, &100);

    // Same WAD-scale formula used for both the health-factor gate above and
    // the seizure math below must agree on the same prices:
    // collat_base = repayment * debt_price / collat_price; seized = collat_base * bonus / BPS.
    let collat_base = (100i128 * debt_price) / collat_price;
    let expected_seized = (collat_base * 10500) / 10_000;

    let burn: (Address, Address, Address, Address, i128, i128) =
        env.as_contract(&f.pool_id, || env.storage().instance().get(&symbol_short!("burn")).unwrap());
    assert_eq!(burn.4, 100);
    assert_eq!(burn.5, expected_seized);
}

#[test]
#[should_panic]
fn test_extreme_price_values_do_not_silently_corrupt_accounting() {
    let env = Env::default();
    let f = setup_fixture(&env, 7500, 10500);

    // Deliberately extreme collateral amount and price whose product
    // overflows i128 in the collat_value computation. Rust's overflow
    // checks (enabled in this workspace's profiles, and by default in test
    // builds) must turn this into a clean panic/abort rather than silently
    // wrapping into a corrupted, exploitable value.
    let extreme_price: i128 = 170_000_000_000_000_000_000_000_000_000_000_000; // ~1.7e35
    f.oracle_client.set_price(&f.collat_asset, &extreme_price);
    f.oracle_client.set_price(&f.debt_asset, &WAD);

    set_position(&env, &f.pool_id, &f.borrower, &f.collat_asset, 1_000_000, 0);
    set_position(&env, &f.pool_id, &f.borrower, &f.debt_asset, 0, 100);
    mint_debt_asset(&env, &f.debt_asset, &f.liquidator, 50);

    f.client.liquidate(&f.liquidator, &f.borrower, &f.debt_asset, &f.collat_asset, &50);
}
