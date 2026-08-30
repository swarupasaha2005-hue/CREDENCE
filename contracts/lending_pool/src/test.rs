#![cfg(test)]

use super::*;
use soroban_sdk::{
    contract, contractimpl, symbol_short,
    testutils::{Address as _, MockAuth, MockAuthInvoke},
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
