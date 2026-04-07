module 0x1::escrow {
    /// Simple example escrow for BattleQ solo stakes.
    /// NOTE: 0x1 is a placeholder; deploy this module under your own address
    /// and update moduleAddress in src/lib/contracts.ts accordingly.

    use std::signer;

    /// Each player stores their own Stake resource under their account.
    /// This tracks a logical staked amount; real INIT (uinit) movement
    /// should be added to match your appchain's bank/token model.
    struct Stake has key {
        amount: u64,
    }

    const E_NO_STAKE: u64 = 1;

    /// Player deposits `amount` into the BattleQ escrow (logical only).
    /// In a production deployment, also move INIT (uinit) from the player
    /// into this module's custody here.
    public entry fun stake(owner: &signer, amount: u64) acquires Stake {
        let addr = signer::address_of(owner);
        if (exists<Stake>(addr)) {
            let s_ref = &mut borrow_global_mut<Stake>(addr);
            s_ref.amount = s_ref.amount + amount;
        } else {
            move_to<Stake>(owner, Stake { amount });
        }
    }

    /// Player withdraws their escrowed amount and winnings (logical only).
    /// Extend this to actually return INIT tokens via your chain's bank module.
    public entry fun claim(owner: &signer) acquires Stake {
        let addr = signer::address_of(owner);
        if (!exists<Stake>(addr)) {
            abort E_NO_STAKE;
        };

        let Stake { amount } = move_from<Stake>(addr);
        if (amount == 0) {
            abort E_NO_STAKE;
        };

        // At this point `amount` would be transferred back to the player
        // using your chain's token/bank module. This example focuses on
        // having a deployable module wired to the frontend.
    }
}
