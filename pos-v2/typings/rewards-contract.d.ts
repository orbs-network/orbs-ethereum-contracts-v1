declare namespace Contracts {
    import TransactionResponse = Truffle.TransactionResponse;
    import TransactionDetails = Truffle.TransactionDetails;

    export interface RewardsContract extends Contract {
        assignRewards(params?: TransactionDetails): Promise<TransactionResponse>;
        distributeRewards(addrs: string[], amounts: (number|BN)[], params?: TransactionDetails): Promise<TransactionResponse>;
    }
}


