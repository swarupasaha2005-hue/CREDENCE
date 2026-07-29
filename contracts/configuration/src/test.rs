#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ConfigurationContract);
    let client = ConfigurationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ConfigurationContract);
    let client = ConfigurationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    client.initialize(&admin); // Should panic
}

#[test]
fn test_setters_and_getters() {
    let env = Env::default();
    env.mock_all_auths(); // Mock auth for admin
    
    let contract_id = env.register_contract(None, ConfigurationContract);
    let client = ConfigurationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);

    // Test LTV
    client.set_ltv(&7500); // 75%
    assert_eq!(client.get_ltv(), 7500);

    // Test Liquidation Threshold
    client.set_liquidation_threshold(&8000); // 80%
    assert_eq!(client.get_liquidation_threshold(), 8000);

    // Test Liquidation Bonus
    client.set_liquidation_bonus(&500); // 5%
    assert_eq!(client.get_liquidation_bonus(), 500);

    // Test Reserve Factor
    client.set_reserve_factor(&1000); // 10%
    assert_eq!(client.get_reserve_factor(), 1000);

    // Test Borrow Rates
    client.set_base_borrow_rate(&0); // 0% base rate
    assert_eq!(client.get_base_borrow_rate(), 0);

    client.set_optimal_utilization(&8000); // 80% optimal
    assert_eq!(client.get_optimal_utilization(), 8000);

    client.set_slope1(&400); // 4% slope 1
    assert_eq!(client.get_slope1(), 400);

    client.set_slope2(&7500); // 75% slope 2
    assert_eq!(client.get_slope2(), 7500);

    // Test Addresses
    let treasury = Address::generate(&env);
    client.set_treasury(&treasury);
    assert_eq!(client.get_treasury(), treasury);

    let oracle = Address::generate(&env);
    client.set_oracle(&oracle);
    assert_eq!(client.get_oracle(), oracle);

    let pool = Address::generate(&env);
    client.set_lending_pool(&pool);
    assert_eq!(client.get_lending_pool(), pool);
    
    // Test Transfer Admin
    let new_admin = Address::generate(&env);
    client.transfer_admin(&new_admin);
    assert_eq!(client.get_admin(), new_admin);
}

#[test]
#[should_panic]
fn test_unauthorized_access() {
    let env = Env::default();
    
    let contract_id = env.register_contract(None, ConfigurationContract);
    let client = ConfigurationContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    // Because env.mock_all_auths() is NOT called, this will trigger an auth panic
    client.set_ltv(&7500); 
}
