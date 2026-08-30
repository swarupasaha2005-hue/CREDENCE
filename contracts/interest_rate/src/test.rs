#![cfg(test)]

use super::*;
use soroban_sdk::{
    contract, contractimpl, symbol_short,
    testutils::{Address as _, Ledger, MockAuth, MockAuthInvoke},
    Address, Env, IntoVal,
};

// A minimal stand-in for the Configuration contract, exposing just the one
// method `update_borrow_index`'s authorization check depends on. Lets the
// authorization tests exercise the real cross-contract `ConfigClient` call
// path without pulling in the full configuration crate.
#[contract]
struct MockConfig;

#[contractimpl]
impl MockConfig {
    pub fn setup(env: Env, lending_pool: Address) {
        env.storage().instance().set(&symbol_short!("pool"), &lending_pool);
    }

    pub fn get_lending_pool(env: Env) -> Address {
        env.storage().instance().get(&symbol_short!("pool")).unwrap()
    }
}

/// Deploys InterestRateModel + a MockConfig wired to `lending_pool`, and wires
/// the model's config address (admin-authorized). Does not touch auths beyond
/// that setup call, so callers control exactly what's authorized afterward.
fn deploy_wired(env: &Env, admin: &Address, lending_pool: &Address) -> (InterestRateModelClient<'static>, Address) {
    let contract_id = env.register_contract(None, InterestRateModel);
    let client = InterestRateModelClient::new(env, &contract_id);

    let config_id = env.register_contract(None, MockConfig);
    let config_client = MockConfigClient::new(env, &config_id);
    config_client.setup(lending_pool);

    client.initialize(admin); // initialize takes no auth (first-time setup)

    env.mock_auths(&[MockAuth {
        address: admin,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "set_config_address",
            args: (config_id.clone(),).into_val(env),
            sub_invokes: &[],
        },
    }]);
    client.set_config_address(&config_id);

    (client, contract_id)
}

#[test]
fn test_utilization_rate() {
    let env = Env::default();

    // 50% utilization: 50 borrowed out of 100 total assets (50 liq + 50 borrowed)
    let util = InterestRateModel::get_utilization_rate(env.clone(), 50, 50);
    assert_eq!(util, 5000); // 5000 BPS = 50%

    // 0% utilization
    let util_zero = InterestRateModel::get_utilization_rate(env.clone(), 100, 0);
    assert_eq!(util_zero, 0);

    // 100% utilization
    let util_max = InterestRateModel::get_utilization_rate(env.clone(), 0, 100);
    assert_eq!(util_max, 10000);
}

#[test]
fn test_borrow_rate() {
    let env = Env::default();

    let base_rate = 0; // 0%
    let optimal_utilization = 8000; // 80%
    let slope1 = 400; // 4%
    let slope2 = 7500; // 75%

    // Below optimal: Utilization = 4000 (40%)
    // base (0) + (4000 * 400) / 8000 = 200 (2%)
    let rate_below = InterestRateModel::get_borrow_rate(env.clone(), 4000, base_rate, optimal_utilization, slope1, slope2);
    assert_eq!(rate_below, 200);

    // At optimal: Utilization = 8000 (80%)
    // base (0) + slope1 (400) = 400 (4%)
    let rate_optimal = InterestRateModel::get_borrow_rate(env.clone(), 8000, base_rate, optimal_utilization, slope1, slope2);
    assert_eq!(rate_optimal, 400);

    // Above optimal: Utilization = 9000 (90%)
    // base (0) + slope1 (400) + ((9000 - 8000) * 7500) / (10000 - 8000)
    // 400 + (1000 * 7500) / 2000 = 400 + 3750 = 4150 (41.5%)
    let rate_above = InterestRateModel::get_borrow_rate(env.clone(), 9000, base_rate, optimal_utilization, slope1, slope2);
    assert_eq!(rate_above, 4150);
}

#[test]
fn test_supply_and_reserve_rate() {
    let env = Env::default();

    let borrow_rate = 1000; // 10%
    let utilization = 5000; // 50%
    let reserve_factor = 2000; // 20%

    // Supply rate: Borrow Rate (1000) * Utilization (5000) / 10000 = 500
    // Lenders get 80% of 500 = 400 (4%)
    let supply_rate = InterestRateModel::get_supply_rate(env.clone(), borrow_rate, utilization, reserve_factor);
    assert_eq!(supply_rate, 400);

    // Reserve rate: Protocol gets 20% of 500 = 100 (1%)
    let reserve_rate = InterestRateModel::get_reserve_rate(env.clone(), borrow_rate, utilization, reserve_factor);
    assert_eq!(reserve_rate, 100);
}

#[test]
fn test_borrow_index() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let lending_pool = Address::generate(&env);
    let (client, contract_id) = deploy_wired(&env, &admin, &lending_pool);
    let asset = Address::generate(&env);

    // Set initial timestamp
    env.ledger().with_mut(|li| {
        li.timestamp = 1000000;
    });

    // First update should initialize index to WAD (1e18)
    env.mock_auths(&[MockAuth {
        address: &lending_pool,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "update_borrow_index",
            args: (asset.clone(), 500i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    client.update_borrow_index(&asset, &500); // 5% borrow rate
    assert_eq!(client.get_borrow_index(&asset), 1_000_000_000_000_000_000);
    assert_eq!(client.get_last_updated(&asset), 1000000);

    // Fast forward 1 year (31,536,000 seconds)
    env.ledger().with_mut(|li| {
        li.timestamp = 1000000 + 31536000;
    });

    // Second update should apply 1 year of 5% interest
    // Index_new = WAD + WAD * 5% = WAD * 1.05 = 1.05e18
    //
    // update_borrow_index computes rate_per_second_wad as its own truncating
    // integer division before multiplying by time_delta, so a fractional
    // remainder (~0.19 WAD-units per second) is dropped and then amplified by
    // the 31,536,000-second delta. That yields an exact, deterministic
    // shortfall of 5,936,000 out of 1.05e18 (a ~5.65e-12 relative error) versus
    // the idealized math above — not a directional or formula bug, just
    // ordinary fixed-point truncation from dividing before multiplying.
    // Assert within a tolerance that comfortably covers this known truncation
    // rather than requiring bit-exact equality with the idealized value.
    env.mock_auths(&[MockAuth {
        address: &lending_pool,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "update_borrow_index",
            args: (asset.clone(), 500i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    client.update_borrow_index(&asset, &500);
    let index = client.get_borrow_index(&asset);
    let expected = 1_050_000_000_000_000_000i128;
    let tolerance = 10_000_000i128; // 1e-11 relative to WAD; actual observed diff is 5,936,000
    assert!(
        (index - expected).abs() <= tolerance,
        "borrow index {} not within tolerance of expected {}",
        index,
        expected
    );
}

#[test]
fn test_update_borrow_index_allows_registered_lending_pool() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let lending_pool = Address::generate(&env);
    let (client, contract_id) = deploy_wired(&env, &admin, &lending_pool);
    let asset = Address::generate(&env);

    env.mock_auths(&[MockAuth {
        address: &lending_pool,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "update_borrow_index",
            args: (asset.clone(), 500i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    client.update_borrow_index(&asset, &500);

    assert_eq!(client.get_borrow_index(&asset), 1_000_000_000_000_000_000);
}

#[test]
#[should_panic]
fn test_update_borrow_index_rejects_unauthorized_user() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let lending_pool = Address::generate(&env);
    let attacker = Address::generate(&env);
    let (client, contract_id) = deploy_wired(&env, &admin, &lending_pool);
    let asset = Address::generate(&env);

    // Attacker authorizes themself, not the registered Lending Pool.
    env.mock_auths(&[MockAuth {
        address: &attacker,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "update_borrow_index",
            args: (asset.clone(), 999999i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    // The contract requires auth from `lending_pool`, which has no matching
    // authorization entry here, so this must panic.
    client.update_borrow_index(&asset, &999999);
}

#[test]
#[should_panic]
fn test_update_borrow_index_rejects_call_with_no_auth() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let lending_pool = Address::generate(&env);
    let (client, _contract_id) = deploy_wired(&env, &admin, &lending_pool);
    let asset = Address::generate(&env);

    // No authorization mocked at all - simulates a raw, unauthenticated
    // invocation of the entry point (e.g. a random contract calling directly).
    client.update_borrow_index(&asset, &500);
}
