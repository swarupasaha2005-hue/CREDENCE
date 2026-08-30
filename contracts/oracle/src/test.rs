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
#[should_panic(expected = "Price must be positive")]
fn test_zero_price_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset = Address::generate(&env);
    client.set_price(&asset, &0);
}

#[test]
#[should_panic(expected = "Price must be positive")]
fn test_negative_price_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset = Address::generate(&env);
    client.set_price(&asset, &-100);
}

#[test]
fn test_extreme_valid_price_is_handled_safely() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 1_000_000);

    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset = Address::generate(&env);
    // An extreme but still well within i128 range price (well under
    // i128::MAX / WAD, so downstream single multiplications by WAD-scale
    // amounts remain representable).
    let extreme_price: i128 = 1_000_000_000_000_000_000_000_000; // $1,000,000 WAD-scaled
    client.set_price(&asset, &extreme_price);

    assert_eq!(client.get_price(&asset), extreme_price);
}

#[test]
#[should_panic(expected = "Oracle price is stale")]
fn test_stale_price_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 1_000_000);

    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset = Address::generate(&env);
    client.set_price(&asset, &1_000_000);

    // Advance well beyond the max age (1 day) without another price update.
    env.ledger().with_mut(|li| li.timestamp = 1_000_000 + MAX_PRICE_AGE_SECONDS + 1);
    client.get_price(&asset);
}

#[test]
fn test_price_just_under_max_age_is_still_accepted() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 1_000_000);

    let contract_id = env.register_contract(None, OracleContract);
    let client = OracleContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let asset = Address::generate(&env);
    client.set_price(&asset, &1_000_000);

    // Right at the boundary (age == MAX_PRICE_AGE_SECONDS) must still pass.
    env.ledger().with_mut(|li| li.timestamp = 1_000_000 + MAX_PRICE_AGE_SECONDS);
    assert_eq!(client.get_price(&asset), 1_000_000);
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
