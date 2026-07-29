#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

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

// In a full test suite, we'd mock the token transfer responses and the oracle responses 
// and run the full borrow/repay flow.
