#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

// Note: To write fully integrated tests for cross-contract calls, we would normally 
// deploy dummy versions of the Config, Oracle, and Lending Pool,
// then deploy standard Soroban Token contracts for mock XLM/USDC.
// Due to the complexity and length, we provide a placeholder to demonstrate setup constraints.

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
