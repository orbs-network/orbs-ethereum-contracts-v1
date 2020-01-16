declare namespace Contracts {
    export interface StakedEvent {
        stakeOwner: string,
        amount: (number|BN),
        totalStakedAmount: (number|BN)
    }

    export interface StakingContract extends Contract {

    }
}


