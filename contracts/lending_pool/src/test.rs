#![cfg(test)]

use super::*;
use soroban_sdk::{
    contract, contractimpl, symbol_short,
    testutils::{Address as _, Ledger, MockAuth, MockAuthInvoke},
    Address, Env, IntoVal,
};

// Note: To write fully integrated tests for cross-contract calls, we would normally
// deploy dummy versions of the Config, Oracle, and Interest models using `env.register_contract`,
// then deploy standard Soroban Token contracts for mock XLM/USDC.
// Due to the complexity and length, we provide a placeholder to demonstrate setup.

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(&env, &contract_id);
    let config_address = Address::generate(&env);

    client.initialize(&config_address);
    // Since get_config isn't explicitly exposed as a view, we verify no panic on init.
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(&env, &contract_id);
    let config_address = Address::generate(&env);

    client.initialize(&config_address);
    client.initialize(&config_address);
}

// --- execute_liquidation_burn authorization tests ---
//
// A minimal stand-in for the Configuration contract (get_interest_model /
// get_liquidation_engine) and the Interest Rate Model (get_borrow_index),
// exposing just what `execute_liquidation_burn` depends on. Lets these tests
// exercise the real cross-contract `ConfigClient` auth-check path without
// pulling in the full configuration/interest_rate crates.

#[contract]
struct MockConfig;

#[contractimpl]
impl MockConfig {
    pub fn setup(env: Env, interest_model: Address, liquidation_engine: Address) {
        env.storage().instance().set(&symbol_short!("im"), &interest_model);
        env.storage().instance().set(&symbol_short!("le"), &liquidation_engine);
    }

    pub fn get_interest_model(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("im")).unwrap()
    }

    pub fn get_liquidation_engine(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("le")).unwrap()
    }
}

#[contract]
struct MockInterestModel;

#[contractimpl]
impl MockInterestModel {
    pub fn get_borrow_index(_env: Env, _asset: Address) -> i128 {
        WAD // 1:1, so scaled_debt == actual_debt in these tests
    }
}

struct LiquidationFixture {
    client: LendingPoolClient<'static>,
    pool_id: Address,
    liquidation_engine: Address,
    collat_asset: Address,
    debt_asset: Address,
    borrower: Address,
    liquidator: Address,
}

/// Deploys a LendingPool wired to a MockConfig/MockInterestModel, seeds a
/// borrower position (1,000 collateral / 500 scaled debt) directly in pool
/// storage, and funds the pool with real collateral tokens so a liquidation
/// burn can actually pay out seized collateral.
fn setup_liquidation_fixture(env: &Env) -> LiquidationFixture {
    let pool_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(env, &pool_id);

    let interest_model_id = env.register_contract(None, MockInterestModel);
    let liquidation_engine = Address::generate(env);

    let config_id = env.register_contract(None, MockConfig);
    let config_client = MockConfigClient::new(env, &config_id);
    config_client.setup(&interest_model_id, &liquidation_engine);

    client.initialize(&config_id);

    let token_admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let collat_asset = sac.address();
    let token_admin_client = token::StellarAssetClient::new(env, &collat_asset);
    token_admin_client.mock_all_auths().mint(&pool_id, &1_000_000_000i128);

    let debt_asset = Address::generate(env);
    let borrower = Address::generate(env);
    let liquidator = Address::generate(env);

    env.as_contract(&pool_id, || {
        env.storage().persistent().set(
            &DataKey::UserPosition(borrower.clone(), collat_asset.clone()),
            &UserPosition { collateral_amount: 1000, scaled_debt: 0, last_interaction: 0 },
        );
        env.storage().persistent().set(
            &DataKey::UserPosition(borrower.clone(), debt_asset.clone()),
            &UserPosition { collateral_amount: 0, scaled_debt: 500, last_interaction: 0 },
        );
        env.storage().persistent().set(
            &DataKey::PoolState(debt_asset.clone()),
            &PoolState { total_liquidity: 0, total_borrowed: 500, current_borrow_rate: 0, current_supply_rate: 0, current_utilization: 0 },
        );
        env.storage().persistent().set(
            &DataKey::PoolState(collat_asset.clone()),
            &PoolState { total_liquidity: 1000, total_borrowed: 0, current_borrow_rate: 0, current_supply_rate: 0, current_utilization: 0 },
        );
    });

    LiquidationFixture { client, pool_id, liquidation_engine, collat_asset, debt_asset, borrower, liquidator }
}

#[test]
fn test_execute_liquidation_burn_allows_registered_liquidation_engine() {
    let env = Env::default();
    let f = setup_liquidation_fixture(&env);

    env.mock_auths(&[MockAuth {
        address: &f.liquidation_engine,
        invoke: &MockAuthInvoke {
            contract: &f.pool_id,
            fn_name: "execute_liquidation_burn",
            args: (
                f.borrower.clone(),
                f.liquidator.clone(),
                f.collat_asset.clone(),
                f.debt_asset.clone(),
                200i128,
                200i128,
            )
                .into_val(&env),
            sub_invokes: &[],
        },
    }]);

    f.client.execute_liquidation_burn(&f.borrower, &f.liquidator, &f.collat_asset, &f.debt_asset, &200, &200);

    // Debt reduced, collateral seized and transferred to the liquidator.
    let debt_position = f.client.get_user_position_view(&f.borrower, &f.debt_asset);
    assert_eq!(debt_position.scaled_debt, 300); // 500 - 200
    let collat_position = f.client.get_user_position_view(&f.borrower, &f.collat_asset);
    assert_eq!(collat_position.collateral_amount, 800); // 1000 - 200

    let token_client = token::Client::new(&env, &f.collat_asset);
    assert_eq!(token_client.balance(&f.liquidator), 200);
}

#[test]
#[should_panic]
fn test_execute_liquidation_burn_rejects_unauthorized_user() {
    let env = Env::default();
    let f = setup_liquidation_fixture(&env);
    let attacker = Address::generate(&env);

    // Attacker authorizes themself instead of the registered Liquidation Engine.
    env.mock_auths(&[MockAuth {
        address: &attacker,
        invoke: &MockAuthInvoke {
            contract: &f.pool_id,
            fn_name: "execute_liquidation_burn",
            args: (
                f.borrower.clone(),
                attacker.clone(),
                f.collat_asset.clone(),
                f.debt_asset.clone(),
                1000i128,
                1000i128,
            )
                .into_val(&env),
            sub_invokes: &[],
        },
    }]);

    // The contract requires auth from the configured Liquidation Engine, which
    // has no matching authorization entry here, so this must panic before any
    // collateral/debt accounting is touched.
    f.client.execute_liquidation_burn(&f.borrower, &attacker, &f.collat_asset, &f.debt_asset, &1000, &1000);
}

#[test]
#[should_panic]
fn test_execute_liquidation_burn_rejects_call_with_no_auth() {
    let env = Env::default();
    let f = setup_liquidation_fixture(&env);

    // No authorization mocked at all - simulates a raw, unauthenticated call
    // straight into the low-level accounting path, bypassing the Liquidation
    // Engine's health-factor checks entirely.
    f.client.execute_liquidation_burn(&f.borrower, &f.liquidator, &f.collat_asset, &f.debt_asset, &200, &200);
}

// --- Live interest-rate accrual tests (Improvement #2) ---
//
// These use the REAL `interest_rate` crate (a dev-dependency) instead of a
// hand-rolled stand-in, so the assertions prove LendingPool genuinely drives
// the InterestRateModel's live utilization/borrow-rate/supply-rate/index
// outputs, rather than replaying a fake copy of the formulas. A single
// Stellar Asset Contract token is used as both collateral and borrow asset
// (mirroring how this was verified on testnet), which keeps the fixture
// small while still exercising the pool's own per-asset utilization math.
//
// `env.mock_all_auths()` is used here so these tests can focus purely on the
// rate/accrual wiring; Improvement #1's cross-contract authorization is
// exhaustively covered by the dedicated (non-mocked) tests above and in
// `interest_rate/src/test.rs`, and is untouched by this change.

use interest_rate::InterestRateModel as RealInterestRateModel;

// Namespaced in their own module so `#[contractimpl]`'s generated helper
// items (e.g. `__setup`, `__get_interest_model`) don't collide with the
// identically-named methods on the `MockConfig` used by the liquidation
// tests above.
mod accrual_mocks {
    use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env};

#[contract]
pub struct FullMockConfig;

#[contractimpl]
impl FullMockConfig {
    #[allow(clippy::too_many_arguments)]
    pub fn setup(
        env: Env,
        lending_pool: Address,
        interest_model: Address,
        oracle: Address,
        ltv: u32,
        liq_threshold: u32,
        base_rate: u32,
        optimal_utilization: u32,
        slope1: u32,
        slope2: u32,
        reserve_factor: u32,
    ) {
        env.storage().instance().set(&symbol_short!("lp"), &lending_pool);
        env.storage().instance().set(&symbol_short!("im"), &interest_model);
        env.storage().instance().set(&symbol_short!("oracle"), &oracle);
        env.storage().instance().set(&symbol_short!("ltv"), &ltv);
        env.storage().instance().set(&symbol_short!("liqth"), &liq_threshold);
        env.storage().instance().set(&symbol_short!("base"), &base_rate);
        env.storage().instance().set(&symbol_short!("optu"), &optimal_utilization);
        env.storage().instance().set(&symbol_short!("s1"), &slope1);
        env.storage().instance().set(&symbol_short!("s2"), &slope2);
        env.storage().instance().set(&symbol_short!("rf"), &reserve_factor);
    }

    // Required by interest_rate's own `update_borrow_index` authorization check.
    pub fn get_lending_pool(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("lp")).unwrap()
    }

    pub fn get_interest_model(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("im")).unwrap()
    }

    pub fn get_oracle(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("oracle")).unwrap()
    }

    pub fn get_liquidation_engine(env: Env) -> Address {
        // Unused by these tests (no liquidation exercised here), but part of
        // the ConfigInterface trait LendingPool depends on.
        env.storage().instance().get(&symbol_short!("lp")).unwrap()
    }

    pub fn get_ltv(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("ltv")).unwrap()
    }

    pub fn get_liq_threshold(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("liqth")).unwrap()
    }

    pub fn get_base_borrow_rate(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("base")).unwrap()
    }

    pub fn get_optimal_utilization(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("optu")).unwrap()
    }

    pub fn get_slope1(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("s1")).unwrap()
    }

    pub fn get_slope2(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("s2")).unwrap()
    }

    pub fn get_reserve_factor(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("rf")).unwrap()
    }
}

#[contract]
pub struct MockOracle;

#[contractimpl]
impl MockOracle {
    pub fn set_price(env: Env, asset: Address, price: i128) {
        env.storage().instance().set(&asset, &price);
    }

    pub fn get_price(env: Env, asset: Address) -> i128 {
        env.storage().instance().get(&asset).unwrap()
    }
}
} // mod accrual_mocks

use accrual_mocks::{FullMockConfig, FullMockConfigClient, MockOracle, MockOracleClient};

// Matches the protocol's real, currently-configured testnet risk parameters
// (see registry/deployments.json wiring) - reusing the existing economics
// rather than inventing new ones for this test.
const TEST_LTV: u32 = 7000;
const TEST_LIQ_THRESHOLD: u32 = 7500;
const TEST_BASE_RATE: u32 = 200;
const TEST_OPTIMAL_UTILIZATION: u32 = 8000;
const TEST_SLOPE1: u32 = 400;
const TEST_SLOPE2: u32 = 7500;
const TEST_RESERVE_FACTOR: u32 = 1000;

struct AccrualFixture {
    client: LendingPoolClient<'static>,
    asset: Address,
    user: Address,
}

/// Deploys LendingPool wired to a real InterestRateModel (dev-dependency) and
/// a FullMockConfig carrying the protocol's real risk-curve parameters, plus
/// a single SAC token used as both collateral and borrow asset. Mints the
/// user a starting balance and mocks all auths so the tests can focus solely
/// on rate/accrual wiring.
fn setup_accrual_fixture(env: &Env) -> AccrualFixture {
    env.mock_all_auths();

    let pool_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(env, &pool_id);

    let interest_admin = Address::generate(env);
    let interest_id = env.register_contract(None, RealInterestRateModel);
    let interest_client = interest_rate::InterestRateModelClient::new(env, &interest_id);

    let oracle_id = env.register_contract(None, MockOracle);
    let oracle_client = MockOracleClient::new(env, &oracle_id);

    let token_admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let asset = sac.address();
    oracle_client.set_price(&asset, &WAD); // $1.00, keeps LTV/health math simple

    let config_id = env.register_contract(None, FullMockConfig);
    let config_client = FullMockConfigClient::new(env, &config_id);
    config_client.setup(
        &pool_id,
        &interest_id,
        &oracle_id,
        &TEST_LTV,
        &TEST_LIQ_THRESHOLD,
        &TEST_BASE_RATE,
        &TEST_OPTIMAL_UTILIZATION,
        &TEST_SLOPE1,
        &TEST_SLOPE2,
        &TEST_RESERVE_FACTOR,
    );

    interest_client.initialize(&interest_admin);
    interest_client.set_config_address(&config_id);

    client.initialize(&config_id);

    let user = Address::generate(env);
    let token_admin_client = token::StellarAssetClient::new(env, &asset);
    token_admin_client.mint(&user, &1_000_000_000i128);

    AccrualFixture { client, asset, user }
}

#[test]
fn test_supply_updates_pool_liquidity_and_live_rates() {
    let env = Env::default();
    let f = setup_accrual_fixture(&env);

    f.client.deposit_collateral(&f.user, &f.asset, &1_000);

    let state = f.client.get_pool_state_view(&f.asset);
    assert_eq!(state.total_liquidity, 1_000);
    assert_eq!(state.total_borrowed, 0);

    // With zero debt, utilization is 0%, so the borrow rate must be exactly
    // the configured base rate - not the pre-fix default of 0.
    let expected_utilization = RealInterestRateModel::get_utilization_rate(env.clone(), 1_000, 0);
    let expected_borrow_rate = RealInterestRateModel::get_borrow_rate(
        env.clone(),
        expected_utilization,
        TEST_BASE_RATE as i128,
        TEST_OPTIMAL_UTILIZATION as i128,
        TEST_SLOPE1 as i128,
        TEST_SLOPE2 as i128,
    );
    assert_eq!(state.current_utilization, expected_utilization);
    assert_eq!(state.current_borrow_rate, expected_borrow_rate);
    assert_eq!(state.current_borrow_rate, TEST_BASE_RATE as i128);
}

#[test]
fn test_borrow_increases_utilization_and_updates_rates() {
    let env = Env::default();
    let f = setup_accrual_fixture(&env);

    f.client.deposit_collateral(&f.user, &f.asset, &1_000);
    f.client.borrow(&f.user, &f.asset, &f.asset, &200);

    let state = f.client.get_pool_state_view(&f.asset);
    assert_eq!(state.total_liquidity, 800);
    assert_eq!(state.total_borrowed, 200);

    // Independently recompute the expected utilization/borrow/supply rates
    // straight from the InterestRateModel's own pure functions, and assert
    // the pool's persisted PoolState matches exactly - proving LendingPool
    // is genuinely wired to the live curve, not leaving stale zeros.
    let expected_utilization = RealInterestRateModel::get_utilization_rate(env.clone(), 800, 200);
    assert!(expected_utilization > 0, "utilization must reflect the new debt");
    let expected_borrow_rate = RealInterestRateModel::get_borrow_rate(
        env.clone(),
        expected_utilization,
        TEST_BASE_RATE as i128,
        TEST_OPTIMAL_UTILIZATION as i128,
        TEST_SLOPE1 as i128,
        TEST_SLOPE2 as i128,
    );
    let expected_supply_rate = RealInterestRateModel::get_supply_rate(
        env.clone(),
        expected_borrow_rate,
        expected_utilization,
        TEST_RESERVE_FACTOR as i128,
    );

    assert_eq!(state.current_utilization, expected_utilization);
    assert_eq!(state.current_borrow_rate, expected_borrow_rate);
    assert_eq!(state.current_supply_rate, expected_supply_rate);
    assert!(state.current_borrow_rate > TEST_BASE_RATE as i128, "borrow rate must rise above the base rate once utilized");
}

#[test]
fn test_repay_decreases_utilization_and_recalculates_rates() {
    let env = Env::default();
    let f = setup_accrual_fixture(&env);

    f.client.deposit_collateral(&f.user, &f.asset, &1_000);
    f.client.borrow(&f.user, &f.asset, &f.asset, &200);
    let state_after_borrow = f.client.get_pool_state_view(&f.asset);

    f.client.repay(&f.user, &f.asset, &100);
    let state_after_repay = f.client.get_pool_state_view(&f.asset);

    assert_eq!(state_after_repay.total_borrowed, 100);
    assert!(
        state_after_repay.current_utilization < state_after_borrow.current_utilization,
        "utilization must decrease after a repay"
    );
    assert!(
        state_after_repay.current_borrow_rate < state_after_borrow.current_borrow_rate,
        "borrow rate must decrease along with utilization"
    );

    let expected_utilization = RealInterestRateModel::get_utilization_rate(env.clone(), 900, 100);
    assert_eq!(state_after_repay.current_utilization, expected_utilization);
}

#[test]
fn test_interest_accrues_over_time_when_debt_and_rate_are_positive() {
    let env = Env::default();
    let f = setup_accrual_fixture(&env);

    env.ledger().with_mut(|li| li.timestamp = 1_000_000);

    f.client.deposit_collateral(&f.user, &f.asset, &1_000);
    f.client.borrow(&f.user, &f.asset, &f.asset, &200);
    let index_before = f.client.get_current_borrow_index_view(&f.asset);
    assert_eq!(index_before, WAD, "index starts at 1.0 (WAD) on first accrual");

    // Advance a full year so the (now non-zero) borrow rate has time to
    // compound, then trigger another state change to force accrual.
    env.ledger().with_mut(|li| li.timestamp = 1_000_000 + 31_536_000);
    f.client.repay(&f.user, &f.asset, &50);

    let index_after = f.client.get_current_borrow_index_view(&f.asset);
    assert!(
        index_after > index_before,
        "borrow index must grow after time elapses with positive debt and a positive rate: {} vs {}",
        index_after,
        index_before
    );
}

#[test]
fn test_zero_debt_position_accrues_no_phantom_interest() {
    let env = Env::default();
    let f = setup_accrual_fixture(&env);

    env.ledger().with_mut(|li| li.timestamp = 1_000_000);
    f.client.deposit_collateral(&f.user, &f.asset, &1_000);

    // No borrow ever happened, so scaled_debt is 0 regardless of how the
    // global index moves - actual debt = scaled_debt * index / WAD = 0.
    env.ledger().with_mut(|li| li.timestamp = 1_000_000 + 31_536_000);
    f.client.deposit_collateral(&f.user, &f.asset, &1); // trigger another accrual pass

    let position = f.client.get_user_position_view(&f.user, &f.asset);
    assert_eq!(position.scaled_debt, 0, "a user who never borrowed must never accrue debt");
}

// --- Oracle price-safety integration tests (Improvement #3) ---
//
// Uses two distinct assets with two distinct, non-1:1 prices so that (unlike
// the same-asset accrual fixture above, where any consistent price cancels
// out of the ratio) the tests actually discriminate whether LendingPool
// interprets each asset's oracle price correctly and independently.

struct TwoAssetFixture {
    client: LendingPoolClient<'static>,
    collat_asset: Address,
    borrow_asset: Address,
    user: Address,
}

const COLLAT_PRICE: i128 = 3 * WAD; // $3.00
const BORROW_PRICE: i128 = WAD + WAD / 2; // $1.50

fn setup_two_asset_fixture(env: &Env) -> TwoAssetFixture {
    env.mock_all_auths();

    let pool_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(env, &pool_id);

    let interest_admin = Address::generate(env);
    let interest_id = env.register_contract(None, RealInterestRateModel);
    let interest_client = interest_rate::InterestRateModelClient::new(env, &interest_id);

    let oracle_id = env.register_contract(None, MockOracle);
    let oracle_client = MockOracleClient::new(env, &oracle_id);

    let token_admin = Address::generate(env);
    let collat_asset = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let borrow_asset = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    oracle_client.set_price(&collat_asset, &COLLAT_PRICE);
    oracle_client.set_price(&borrow_asset, &BORROW_PRICE);

    let config_id = env.register_contract(None, FullMockConfig);
    let config_client = FullMockConfigClient::new(env, &config_id);
    config_client.setup(
        &pool_id,
        &interest_id,
        &oracle_id,
        &TEST_LTV,
        &TEST_LIQ_THRESHOLD,
        &TEST_BASE_RATE,
        &TEST_OPTIMAL_UTILIZATION,
        &TEST_SLOPE1,
        &TEST_SLOPE2,
        &TEST_RESERVE_FACTOR,
    );

    interest_client.initialize(&interest_admin);
    interest_client.set_config_address(&config_id);
    client.initialize(&config_id);

    let user = Address::generate(env);
    token::StellarAssetClient::new(env, &collat_asset).mint(&user, &1_000_000_000i128);
    token::StellarAssetClient::new(env, &borrow_asset).mint(&user, &1_000_000_000i128);

    TwoAssetFixture { client, collat_asset, borrow_asset, user }
}

#[test]
fn test_borrow_capacity_uses_correct_price_across_assets() {
    let env = Env::default();
    let f = setup_two_asset_fixture(&env);

    // Collateral: 1,000 units @ $3.00 = $3,000 value. LTV 70% => max borrow $2,100.
    f.client.deposit_collateral(&f.user, &f.collat_asset, &1_000);
    // Seed the borrow asset's own pool liquidity.
    f.client.deposit_collateral(&f.user, &f.borrow_asset, &5_000);

    // At $1.50/unit, borrowing exactly 1,400 units = $2,100 - precisely at
    // the boundary of the 70% LTV capacity computed from the $3.00 collateral
    // price. This only holds if both prices are interpreted correctly and
    // independently (the same-asset fixture above can't distinguish this,
    // since a shared price cancels out of the ratio).
    f.client.borrow(&f.user, &f.collat_asset, &f.borrow_asset, &1_400);

    let state = f.client.get_pool_state_view(&f.borrow_asset);
    assert_eq!(state.total_borrowed, 1_400);
}

#[test]
#[should_panic(expected = "Exceeds borrow capacity")]
fn test_borrow_rejected_just_beyond_capacity_at_correct_price() {
    let env = Env::default();
    let f = setup_two_asset_fixture(&env);

    f.client.deposit_collateral(&f.user, &f.collat_asset, &1_000);
    f.client.deposit_collateral(&f.user, &f.borrow_asset, &5_000);

    // One unit beyond the $2,100 capacity boundary computed above.
    f.client.borrow(&f.user, &f.collat_asset, &f.borrow_asset, &1_401);
}

#[test]
fn test_withdraw_health_factor_uses_correct_price() {
    let env = Env::default();
    let f = setup_two_asset_fixture(&env);

    f.client.deposit_collateral(&f.user, &f.collat_asset, &1_000);
    f.client.deposit_collateral(&f.user, &f.borrow_asset, &5_000);
    f.client.borrow(&f.user, &f.collat_asset, &f.borrow_asset, &1_000); // $1,500 debt

    // liquidation_value must stay >= debt_value ($1,500) using liq_threshold 75%.
    // Withdrawing down to 700 units leaves $2,100 collateral value * 75% = $1,575 >= $1,500: safe.
    f.client.withdraw_collateral(&f.user, &f.collat_asset, &f.borrow_asset, &300);
    let position = f.client.get_user_position_view(&f.user, &f.collat_asset);
    assert_eq!(position.collateral_amount, 700);
}

#[test]
#[should_panic(expected = "Withdrawal drops health factor below liquidation threshold")]
fn test_withdraw_rejected_when_correct_price_shows_unsafe_health_factor() {
    let env = Env::default();
    let f = setup_two_asset_fixture(&env);

    f.client.deposit_collateral(&f.user, &f.collat_asset, &1_000);
    f.client.deposit_collateral(&f.user, &f.borrow_asset, &5_000);
    f.client.borrow(&f.user, &f.collat_asset, &f.borrow_asset, &1_000); // $1,500 debt

    // Withdrawing down to 600 units leaves $1,800 * 75% = $1,350 < $1,500 debt: unsafe.
    f.client.withdraw_collateral(&f.user, &f.collat_asset, &f.borrow_asset, &400);
}

// A separate fixture using the REAL Oracle contract (dev-dependency), to prove
// LendingPool inherits Oracle's zero/stale-price rejection rather than
// silently treating missing/invalid price data as usable.

struct RealOracleFixture {
    client: LendingPoolClient<'static>,
    oracle_client: oracle::OracleContractClient<'static>,
    collat_asset: Address,
    borrow_asset: Address,
    user: Address,
}

fn setup_real_oracle_fixture(env: &Env) -> RealOracleFixture {
    env.mock_all_auths();

    let pool_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(env, &pool_id);

    let interest_admin = Address::generate(env);
    let interest_id = env.register_contract(None, RealInterestRateModel);
    let interest_client = interest_rate::InterestRateModelClient::new(env, &interest_id);

    let oracle_admin = Address::generate(env);
    let oracle_id = env.register_contract(None, oracle::OracleContract);
    let oracle_client = oracle::OracleContractClient::new(env, &oracle_id);
    oracle_client.initialize(&oracle_admin);

    let token_admin = Address::generate(env);
    let collat_asset = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let borrow_asset = env.register_stellar_asset_contract_v2(token_admin.clone()).address();

    let config_id = env.register_contract(None, FullMockConfig);
    let config_client = FullMockConfigClient::new(env, &config_id);
    config_client.setup(
        &pool_id,
        &interest_id,
        &oracle_id,
        &TEST_LTV,
        &TEST_LIQ_THRESHOLD,
        &TEST_BASE_RATE,
        &TEST_OPTIMAL_UTILIZATION,
        &TEST_SLOPE1,
        &TEST_SLOPE2,
        &TEST_RESERVE_FACTOR,
    );

    interest_client.initialize(&interest_admin);
    interest_client.set_config_address(&config_id);
    client.initialize(&config_id);

    let user = Address::generate(env);
    token::StellarAssetClient::new(env, &collat_asset).mint(&user, &1_000_000_000i128);
    token::StellarAssetClient::new(env, &borrow_asset).mint(&user, &1_000_000_000i128);

    RealOracleFixture { client, oracle_client, collat_asset, borrow_asset, user }
}

#[test]
#[should_panic(expected = "Price not found for asset")]
fn test_borrow_blocked_when_collateral_price_missing() {
    let env = Env::default();
    let f = setup_real_oracle_fixture(&env);

    f.oracle_client.set_price(&f.borrow_asset, &WAD);
    // Collateral price was never set - must not silently treat it as any
    // particular value (e.g. 0 or 1); the borrow must be blocked outright.

    f.client.deposit_collateral(&f.user, &f.collat_asset, &1_000);
    f.client.deposit_collateral(&f.user, &f.borrow_asset, &5_000);
    f.client.borrow(&f.user, &f.collat_asset, &f.borrow_asset, &1);
}

#[test]
#[should_panic(expected = "Oracle price is stale")]
fn test_borrow_blocked_when_collateral_price_is_stale() {
    let env = Env::default();
    env.ledger().with_mut(|li| li.timestamp = 1_000_000);
    let f = setup_real_oracle_fixture(&env);

    f.oracle_client.set_price(&f.collat_asset, &COLLAT_PRICE);
    f.oracle_client.set_price(&f.borrow_asset, &BORROW_PRICE);

    f.client.deposit_collateral(&f.user, &f.collat_asset, &1_000);
    f.client.deposit_collateral(&f.user, &f.borrow_asset, &5_000);

    // Let the collateral price go stale before attempting to borrow against it.
    env.ledger().with_mut(|li| li.timestamp = 1_000_000 + 86_400 + 1);
    f.client.borrow(&f.user, &f.collat_asset, &f.borrow_asset, &1);
}
