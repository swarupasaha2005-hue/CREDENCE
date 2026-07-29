#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env};

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
fn test_price_management() {
    let env = Env::default();
    env.mock_all_auths();
    
    // Set a mock ledger timestamp
    env.ledger().with_mut(|li| {
        li.timestamp = 1718000000;
    });

    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset_xlm = Address::generate(&env);
    
    // Check non-existent
    assert_eq!(client.price_exists(&asset_xlm), false);

    // Set price
    let price_val: i128 = 3400000; // e.g. $0.34 with 7 decimals
    client.set_price(&asset_xlm, &price_val);

    // Verify
    assert_eq!(client.price_exists(&asset_xlm), true);
    assert_eq!(client.get_price(&asset_xlm), price_val);
    assert_eq!(client.get_last_updated(&asset_xlm), 1718000000);
}

#[test]
#[should_panic(expected = "Price not found for asset")]
fn test_get_non_existent_price() {
    let env = Env::default();
    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let random_asset = Address::generate(&env);
    client.get_price(&random_asset); // Should panic
}

#[test]
#[should_panic]
fn test_unauthorized_price_update() {
    let env = Env::default();
    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset = Address::generate(&env);
    
    // Omitting env.mock_all_auths() means this fails
    client.set_price(&asset, &1000000); 
}

#[test]
fn test_transfer_admin() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let new_admin = Address::generate(&env);
    client.transfer_admin(&new_admin);
    
    assert_eq!(client.get_admin(), new_admin);
}
