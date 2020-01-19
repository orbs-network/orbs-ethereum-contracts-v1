declare namespace Contracts {
    import TransactionResponse = Truffle.TransactionResponse;
    import TransactionDetails = Truffle.TransactionDetails;

    export interface StakedEvent {
        stakeOwner: string,
        amount: number|BN,
        totalStakedAmount: number|BN,
    }

    export interface UnstakedEvent {
        stakeOwner: string,
        amount: number|BN,
        totalStakedAmount: number|BN,
    }

    export interface StakingContract extends Contract {
        stake(amount: number | BN, params?: TransactionDetails): Promise<TransactionResponse>
        unstake(amount: number | BN, params?: TransactionDetails): Promise<TransactionResponse>
    }
}


