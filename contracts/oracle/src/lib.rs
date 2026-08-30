#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Price(Address), // Maps an Asset Address to its PriceData
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    pub price: i128,
    pub timestamp: u64,
}

// Maximum age a price is trusted for before it's treated as stale, in
// seconds. Mirrors the ~1-day freshness window this contract already uses
// for its own persistent-storage TTL (see the extend_ttl call in set_price,
// "roughly 1 to 10 days in ledgers") - not a newly-invented constant.
const MAX_PRICE_AGE_SECONDS: u64 = 86_400;

#[contract]
pub struct OracleContract;

fn check_admin(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Oracle not initialized");
    admin.require_auth();
}

#[contractimpl]
impl OracleContract {
    /// Initializes the oracle contract with an admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.events().publish((symbol_short!("init"),), admin);
    }

    /// Sets the price for a specific asset. Only the admin can call this.
    /// Price is represented as a fixed-point integer (WAD, 1e18 = $1.00).
    pub fn set_price(env: Env, asset: Address, price: i128) {
        check_admin(&env);
        if price <= 0 {
            panic!("Price must be positive");
        }

        let current_timestamp = env.ledger().timestamp();
        let price_data = PriceData {
            price,
            timestamp: current_timestamp,
        };

        env.storage().persistent().set(&DataKey::Price(asset.clone()), &price_data);
        // Extend TTL to ensure the price data doesn't get archived quickly
        env.storage().persistent().extend_ttl(&DataKey::Price(asset.clone()), 17280, 172800); // roughly 1 to 10 days in ledgers
        
        env.events().publish((Symbol::new(&env, "set_price"), asset), price_data);
    }

    /// Gets the current price of an asset. Panics if the asset price does not
    /// exist, is non-positive (defense-in-depth against any corrupted/legacy
    /// state, even though `set_price` already rejects this at the source), or
    /// is older than `MAX_PRICE_AGE_SECONDS`. Every protocol consumer
    /// (LendingPool, LiquidationEngine) reads prices exclusively through this
    /// function, so this is the single choke point for price safety.
    pub fn get_price(env: Env, asset: Address) -> i128 {
        let price_data: PriceData = env
            .storage()
            .persistent()
            .get(&DataKey::Price(asset))
            .expect("Price not found for asset");

        if price_data.price <= 0 {
            panic!("Invalid oracle price");
        }

        let age = env.ledger().timestamp().saturating_sub(price_data.timestamp);
        if age > MAX_PRICE_AGE_SECONDS {
            panic!("Oracle price is stale");
        }

        price_data.price
    }

    /// Checks if a price exists for a given asset.
    pub fn price_exists(env: Env, asset: Address) -> bool {
        env.storage().persistent().has(&DataKey::Price(asset))
    }

    /// Gets the timestamp of the last price update for a given asset.
    pub fn get_last_updated(env: Env, asset: Address) -> u64 {
        let price_data: PriceData = env
            .storage()
            .persistent()
            .get(&DataKey::Price(asset))
            .expect("Price not found for asset");
            
        price_data.timestamp
    }

    /// Transfers the admin role to a new address.
    pub fn transfer_admin(env: Env, new_admin: Address) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.events().publish((Symbol::new(&env, "new_admin"),), new_admin);
    }

    /// Retrieves the current admin.
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("Oracle not initialized")
    }
}

mod test;
