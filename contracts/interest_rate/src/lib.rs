#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    BorrowIndex(Address), // Maps asset Address to index value (1e18 WAD)
    LastUpdated(Address), // Maps asset Address to timestamp
}

// BPS precision = 10,000 (100%)
const BPS_MAX: i128 = 10_000;
// Index precision (WAD) = 1e18
const WAD: i128 = 1_000_000_000_000_000_000;
const SECONDS_PER_YEAR: i128 = 31_536_000;

#[contract]
pub struct InterestRateModel;

fn check_admin(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Interest Model not initialized");
    admin.require_auth();
}

#[contractimpl]
impl InterestRateModel {
    /// Initializes the contract.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.events().publish((symbol_short!("init"),), admin);
    }

    /// Calculates the pool utilization rate in BPS (10000 = 100%).
    pub fn get_utilization_rate(_env: Env, total_liquidity: i128, total_borrowed: i128) -> i128 {
        let total_assets = total_liquidity + total_borrowed;
        if total_assets == 0 {
            return 0;
        }
        (total_borrowed * BPS_MAX) / total_assets
    }

    /// Calculates the Borrow APR in BPS using an Aave-style piecewise linear interest curve.
    pub fn get_borrow_rate(
        _env: Env,
        utilization: i128,
        base_rate: i128,
        optimal_utilization: i128,
        slope1: i128,
        slope2: i128,
    ) -> i128 {
        if utilization <= optimal_utilization {
            if optimal_utilization == 0 {
                return base_rate; // Edge case safeguard
            }
            // base_rate + (utilization * slope1) / optimal_utilization
            base_rate + (utilization * slope1) / optimal_utilization
        } else {
            // base_rate + slope1 + ((utilization - optimal_utilization) * slope2) / (100% - optimal_utilization)
            let excess_util = utilization - optimal_utilization;
            let excess_max = BPS_MAX - optimal_utilization;
            if excess_max == 0 {
                return base_rate + slope1 + slope2; // Edge case safeguard
            }
            base_rate + slope1 + (excess_util * slope2) / excess_max
        }
    }

    /// Calculates the Supply APR in BPS: Borrow Rate * Utilization * (1 - Reserve Factor).
    pub fn get_supply_rate(_env: Env, borrow_rate: i128, utilization: i128, reserve_factor: i128) -> i128 {
        let rate_util = (borrow_rate * utilization) / BPS_MAX;
        let lender_share = BPS_MAX - reserve_factor;
        (rate_util * lender_share) / BPS_MAX
    }

    /// Calculates the Reserve Rate (income to treasury) in BPS: Borrow Rate * Utilization * Reserve Factor.
    pub fn get_reserve_rate(_env: Env, borrow_rate: i128, utilization: i128, reserve_factor: i128) -> i128 {
        let rate_util = (borrow_rate * utilization) / BPS_MAX;
        (rate_util * reserve_factor) / BPS_MAX
    }

    /// Updates the global borrow index for a specific asset based on elapsed time and current borrow APR.
    /// Only the Lending Pool (or Admin) should be authorized to call this during state transitions.
    pub fn update_borrow_index(env: Env, asset: Address, borrow_rate: i128) {
        // Ideally, check_auth here for the lending pool. But for MVP, keeping open or checking admin.
        // In a production setup, the lending pool contract would be authenticated.
        
        let mut index = Self::get_borrow_index(env.clone(), asset.clone());
        let last_updated = env.storage().persistent().get(&DataKey::LastUpdated(asset.clone())).unwrap_or(0u64);
        let current_time = env.ledger().timestamp();
        
        if last_updated == 0 {
            // First time initialization for this asset
            index = WAD;
        } else if current_time > last_updated {
            let time_delta = (current_time - last_updated) as i128;
            
            // Linear approximation of compound interest for a single period:
            // Index_new = Index_old + (Index_old * BorrowRate * time_delta) / SecondsPerYear
            let rate_per_second_wad = (borrow_rate * WAD) / (BPS_MAX * SECONDS_PER_YEAR);
            let interest_factor_wad = (rate_per_second_wad * time_delta); // already applied WAD precision partially
            
            // Properly scale the index growth
            let index_growth = (index * interest_factor_wad) / WAD;
            index += index_growth;
        }

        env.storage().persistent().set(&DataKey::BorrowIndex(asset.clone()), &index);
        env.storage().persistent().set(&DataKey::LastUpdated(asset.clone()), &current_time);
        
        env.storage().persistent().extend_ttl(&DataKey::BorrowIndex(asset.clone()), 17280, 172800);
        env.storage().persistent().extend_ttl(&DataKey::LastUpdated(asset.clone()), 17280, 172800);

        env.events().publish((Symbol::new(&env, "update_index"), asset), index);
    }

    /// Retrieves the current borrow index for an asset, defaulted to 1e18 (WAD).
    pub fn get_borrow_index(env: Env, asset: Address) -> i128 {
        env.storage().persistent().get(&DataKey::BorrowIndex(asset)).unwrap_or(WAD)
    }

    /// Retrieves the timestamp of the last index update for an asset.
    pub fn get_last_updated(env: Env, asset: Address) -> u64 {
        env.storage().persistent().get(&DataKey::LastUpdated(asset)).unwrap_or(0)
    }
}

mod test;
