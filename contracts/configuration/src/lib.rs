#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Copy)]
pub enum DataKey {
    Admin,
    LTV,
    LiqThreshold,
    LiqBonus,
    ReserveFactor,
    BaseBorrowRate,
    OptUtilization,
    Slope1,
    Slope2,
    Treasury,
    Oracle,
    LendingPool,
}

#[contract]
pub struct ConfigurationContract;

fn check_admin(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Not initialized");
    admin.require_auth();
}

#[contractimpl]
impl ConfigurationContract {
    /// Initializes the configuration contract. Can only be called once.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.events().publish((symbol_short!("init"),), admin);
    }

    pub fn set_ltv(env: Env, ltv: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::LTV, &ltv);
        env.events().publish((Symbol::new(&env, "set_ltv"),), ltv);
    }

    pub fn get_ltv(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LTV).unwrap_or(0)
    }

    pub fn set_liquidation_threshold(env: Env, threshold: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::LiqThreshold, &threshold);
        env.events().publish((Symbol::new(&env, "set_liq_th"),), threshold);
    }

    pub fn get_liquidation_threshold(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LiqThreshold).unwrap_or(0)
    }

    pub fn set_liquidation_bonus(env: Env, bonus: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::LiqBonus, &bonus);
        env.events().publish((Symbol::new(&env, "set_liq_bon"),), bonus);
    }

    pub fn get_liquidation_bonus(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LiqBonus).unwrap_or(0)
    }

    pub fn set_reserve_factor(env: Env, factor: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::ReserveFactor, &factor);
        env.events().publish((Symbol::new(&env, "set_res_fac"),), factor);
    }

    pub fn get_reserve_factor(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ReserveFactor).unwrap_or(0)
    }

    pub fn set_base_borrow_rate(env: Env, rate: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::BaseBorrowRate, &rate);
        env.events().publish((Symbol::new(&env, "set_base_br"),), rate);
    }

    pub fn get_base_borrow_rate(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::BaseBorrowRate).unwrap_or(0)
    }

    pub fn set_optimal_utilization(env: Env, utilization: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::OptUtilization, &utilization);
        env.events().publish((Symbol::new(&env, "set_opt_utl"),), utilization);
    }

    pub fn get_optimal_utilization(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::OptUtilization).unwrap_or(0)
    }

    pub fn set_slope1(env: Env, slope: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Slope1, &slope);
        env.events().publish((Symbol::new(&env, "set_slope1"),), slope);
    }

    pub fn get_slope1(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Slope1).unwrap_or(0)
    }

    pub fn set_slope2(env: Env, slope: u32) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Slope2, &slope);
        env.events().publish((Symbol::new(&env, "set_slope2"),), slope);
    }

    pub fn get_slope2(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Slope2).unwrap_or(0)
    }

    pub fn set_treasury(env: Env, treasury: Address) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.events().publish((Symbol::new(&env, "set_treasury"),), treasury);
    }

    pub fn get_treasury(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury).expect("Treasury not set")
    }

    pub fn set_oracle(env: Env, oracle: Address) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Oracle, &oracle);
        env.events().publish((Symbol::new(&env, "set_oracle"),), oracle);
    }

    pub fn get_oracle(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Oracle).expect("Oracle not set")
    }

    pub fn set_lending_pool(env: Env, pool: Address) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::LendingPool, &pool);
        env.events().publish((Symbol::new(&env, "set_pool"),), pool);
    }

    pub fn get_lending_pool(env: Env) -> Address {
        env.storage().instance().get(&DataKey::LendingPool).expect("Pool not set")
    }

    pub fn transfer_admin(env: Env, new_admin: Address) {
        check_admin(&env);
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.events().publish((Symbol::new(&env, "new_admin"),), new_admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("Not initialized")
    }
}

mod test;
