module onechain_colosseum::duel;

use one::object::{Self, UID, ID};
use one::tx_context::{Self, TxContext};
use one::transfer;
use one::coin::{Self, Coin};
use one::balance::{Self, Balance};
use one::clock::{Self, Clock};
use one::event;
use std::option::{Self, Option};

const SCALAR: u128 = 10000;

const E_NOT_OPEN: u64 = 1;
const E_WRONG_STAKE: u64 = 2;
const E_NOT_CREATOR: u64 = 3;
const E_NOT_ACTIVE: u64 = 5;
const E_NOT_ENDED: u64 = 6;
const E_DIVISION_BY_ZERO: u64 = 8;

public struct Duel<phantom T> has key {
    id: UID,
    creator: address,
    opponent: Option<address>,
    wager_coins: Balance<T>,
    wager_amount: u64,
    duration: u64,
    start_time: Option<u64>,
    status: u8,
}

public struct AdminCap has key, store {
    id: UID,
}

public struct DuelCreated has copy, drop {
    duel_id: ID,
    creator: address,
    wager_amount: u64,
    duration: u64,
}

public struct DuelJoined has copy, drop {
    duel_id: ID,
    creator: address,
    opponent: address,
    start_time: u64,
    duration: u64,
}

public struct DuelResolved has copy, drop {
    duel_id: ID,
    winner: address,
    creator_score: u64,
    opponent_score: u64,
    creator_start: u64,
    creator_end: u64,
    opponent_start: u64,
    opponent_end: u64,
}

public struct DuelCancelled has copy, drop {
    duel_id: ID,
    creator: address,
}

fun init(ctx: &mut TxContext) {
    let admin = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin, tx_context::sender(ctx));
}

public fun create<T>(
    wager: Coin<T>,
    duration: u64,
    ctx: &mut TxContext
): ID {
    let wager_amount = coin::value(&wager);
    let duel_uid = object::new(ctx);
    let duel_id = object::uid_to_inner(&duel_uid);
    
    let duel = Duel<T> {
        id: duel_uid,
        creator: tx_context::sender(ctx),
        opponent: option::none(),
        wager_coins: coin::into_balance(wager),
        wager_amount,
        duration,
        start_time: option::none(),
        status: 0,
    };
    
    event::emit(DuelCreated {
        duel_id,
        creator: tx_context::sender(ctx),
        wager_amount,
        duration,
    });
    
    transfer::share_object(duel);
    duel_id
}

public fun join<T>(
    duel: &mut Duel<T>,
    wager: Coin<T>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(duel.status == 0, E_NOT_OPEN);
    assert!(coin::value(&wager) == duel.wager_amount, E_WRONG_STAKE);
    
    balance::join(&mut duel.wager_coins, coin::into_balance(wager));
    
    let start_time = clock::timestamp_ms(clock);
    
    duel.opponent = option::some(tx_context::sender(ctx));
    duel.start_time = option::some(start_time);
    duel.status = 1;
    
    event::emit(DuelJoined {
        duel_id: object::uid_to_inner(&duel.id),
        creator: duel.creator,
        opponent: tx_context::sender(ctx),
        start_time,
        duration: duel.duration,
    });
}

public fun cancel<T>(
    duel: &mut Duel<T>,
    ctx: &mut TxContext
) {
    assert!(duel.status == 0, E_NOT_OPEN);
    assert!(tx_context::sender(ctx) == duel.creator, E_NOT_CREATOR);
    
    duel.status = 3;
    
    let refund = balance::withdraw_all(&mut duel.wager_coins);
    let refund_coin = coin::from_balance(refund, ctx);
    
    transfer::public_transfer(refund_coin, duel.creator);
    
    event::emit(DuelCancelled {
        duel_id: object::uid_to_inner(&duel.id),
        creator: duel.creator,
    });
}

public fun resolve<T>(
    _admin: &AdminCap,
    duel: &mut Duel<T>,
    creator_start_val: u64,
    creator_end_val: u64,
    opponent_start_val: u64,
    opponent_end_val: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    assert!(duel.status == 1, E_NOT_ACTIVE);
    
    let elapsed = clock::timestamp_ms(clock) - *option::borrow(&duel.start_time);
    assert!(elapsed >= duel.duration, E_NOT_ENDED);
    
    assert!(creator_start_val > 0, E_DIVISION_BY_ZERO);
    assert!(opponent_start_val > 0, E_DIVISION_BY_ZERO);
    
    let creator_score = ((creator_end_val as u128) * SCALAR) / (creator_start_val as u128);
    let opponent_score = ((opponent_end_val as u128) * SCALAR) / (opponent_start_val as u128);
    
    let winner_addr = if (creator_score > opponent_score) {
        duel.creator
    } else if (opponent_score > creator_score) {
        *option::borrow(&duel.opponent)
    } else {
        duel.creator
    };
    
    event::emit(DuelResolved {
        duel_id: object::uid_to_inner(&duel.id),
        winner: winner_addr,
        creator_score: (creator_score as u64),
        opponent_score: (opponent_score as u64),
        creator_start: creator_start_val,
        creator_end: creator_end_val,
        opponent_start: opponent_start_val,
        opponent_end: opponent_end_val,
    });
    
    duel.status = 2;
    let pot = balance::withdraw_all(&mut duel.wager_coins);
    transfer::public_transfer(coin::from_balance(pot, ctx), winner_addr);
}
	
