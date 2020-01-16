declare namespace Contracts {
    export interface StakedEvent {
        stakeOwner: string,
        amount: string, // TODO - not really a string but the matcher cannot handle conversions from strings...
        totalStakedAmount: string // TODO - not really a string but the matcher cannot handle conversions from strings...
    }

    export interface StakingContract extends Contract {

    }
}


