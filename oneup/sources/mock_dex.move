module onechain_colosseum::mock_dex;

use one::coin::{Self, Coin, TreasuryCap};
use one::balance::{Self, Balance};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::object::{Self, UID};
use std::option;

/// One-Time Witness (matches module name in UPPERCASE)
/// This is ALSO the coin type for MUSD
public struct MOCK_DEX has drop {}

/// Storage for the DEX (Generic for any token type T)
public struct DexStorage<phantom T> has key {
    id: UID,
    usd_treasury: TreasuryCap<MOCK_DEX>,
    reserves: Balance<T>,
}

/// Init runs automatically on deployment
fun init(witness: MOCK_DEX, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        witness, 
        6, 
        b"MUSD", 
        b"Mock USD", 
        b"OneUp Trading Stablecoin", 
        option::none(), 
        ctx
    );
    
    transfer::public_freeze_object(metadata);
    transfer::public_transfer(treasury, tx_context::sender(ctx));
}

/// Create liquidity pool (call after deployment)
public fun create_pool<T>(
    treasury: TreasuryCap<MOCK_DEX>, 
    ctx: &mut TxContext
) {
    transfer::share_object(DexStorage<T> {
        id: object::new(ctx),
        usd_treasury: treasury,
        reserves: balance::zero(),
    });
}

/// Swap Token (OCT) -> MUSD
public fun swap_token_for_usd<T>(
    storage: &mut DexStorage<T>,
    payment: Coin<T>, 
    price_in_cents: u64,
    ctx: &mut TxContext
) {
    let token_amount = coin::value(&payment);
    let usd_amount = (token_amount * (price_in_cents as u64)) / 100_000;
    
    balance::join(&mut storage.reserves, coin::into_balance(payment));
    
    let usd_coin = coin::mint(&mut storage.usd_treasury, usd_amount, ctx);
    transfer::public_transfer(usd_coin, tx_context::sender(ctx));
}

/// Swap MUSD -> Token (OCT)
public fun swap_usd_for_token<T>(
    storage: &mut DexStorage<T>,
    payment: Coin<MOCK_DEX>,
    price_in_cents: u64,
    ctx: &mut TxContext
) {
    let usd_amount = coin::value(&payment);
    let token_amount = (usd_amount * 100_000) / (price_in_cents as u64);
    
    coin::burn(&mut storage.usd_treasury, payment);
    
    let token_coin = coin::from_balance(
        balance::split(&mut storage.reserves, token_amount),
        ctx
    );
    transfer::public_transfer(token_coin, tx_context::sender(ctx));
}

/// View reserves
public fun get_reserves<T>(storage: &DexStorage<T>): u64 {
    balance::value(&storage.reserves)
}
