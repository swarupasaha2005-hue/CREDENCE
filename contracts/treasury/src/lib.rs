#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TreasuryStats {
    pub current_balance: i128,
    pub total_deposited: i128,
    pub total_withdrawn: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Stats(Address), // Maps asset Address to its TreasuryStats
}

// Internal helper for TTL to ensure persistent stats don't expire
fn extend_ttl(env: &Env, key: &DataKey) {
    env.storage().persistent().extend_ttl(key, 17280, 172800);
}

#[contract]
pub struct TreasuryContract;

fn check_admin(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Treasury not initialized");
    admin.require_auth();
}

#[contractimpl]
impl TreasuryContract {
    /// Initializes the Treasury with a master Admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.events().publish((symbol_short!("init"),), admin);
    }

    /// Deposits an asset into the treasury. This is permissionless.
    pub fn deposit(env: Env, asset: Address, caller: Address, amount: i128) {
        caller.require_auth();
        if amount <= 0 { panic!("Amount must be > 0"); }

        // 1. Transfer tokens from caller to the Treasury
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&caller, &env.current_contract_address(), &amount);

        // 2. Update Accounting
        let key = DataKey::Stats(asset.clone());
        let mut stats = env.storage().persistent().get(&key).unwrap_or(TreasuryStats {
            current_balance: 0,
            total_deposited: 0,
            total_withdrawn: 0,
        });

        stats.current_balance += amount;
        stats.total_deposited += amount;

        env.storage().persistent().set(&key, &stats);
        extend_ttl(&env, &key);

        // 3. Emit Event
        env.events().publish((Symbol::new(&env, "deposit"), asset), (caller, amount));
    }

    /// Withdraws an asset from the treasury to a recipient. Only callable by the Admin.
    pub fn withdraw(env: Env, asset: Address, amount: i128, recipient: Address) {
        check_admin(&env);
        if amount <= 0 { panic!("Amount must be > 0"); }

        let key = DataKey::Stats(asset.clone());
        let mut stats: TreasuryStats = env.storage().persistent().get(&key).expect("Asset not found in treasury");

        if amount > stats.current_balance {
            panic!("Insufficient treasury balance");
        }

        // 1. Update Accounting
        stats.current_balance -= amount;
        stats.total_withdrawn += amount;

        env.storage().persistent().set(&key, &stats);
        extend_ttl(&env, &key);

        // 2. Transfer tokens from Treasury to Recipient
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        // 3. Emit Event
        env.events().publish((Symbol::new(&env, "withdraw"), asset), (recipient, amount));
    }

    /// Transfers the admin role to a new address (e.g. a DAO).
    pub fn transfer_admin(env: Env, new_admin: Address) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.events().publish((Symbol::new(&env, "new_admin"),), new_admin);
    }

    // --- Readonly Views ---

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("Treasury not initialized")
    }

    pub fn get_treasury_stats(env: Env, asset: Address) -> TreasuryStats {
        env.storage().persistent().get(&DataKey::Stats(asset)).unwrap_or(TreasuryStats {
            current_balance: 0,
            total_deposited: 0,
            total_withdrawn: 0,
        })
    }

    pub fn get_balance(env: Env, asset: Address) -> i128 {
        Self::get_treasury_stats(env, asset).current_balance
    }

    pub fn get_total_deposits(env: Env, asset: Address) -> i128 {
        Self::get_treasury_stats(env, asset).total_deposited
    }

    pub fn get_total_withdrawals(env: Env, asset: Address) -> i128 {
        Self::get_treasury_stats(env, asset).total_withdrawn
    }
}

mod test;
