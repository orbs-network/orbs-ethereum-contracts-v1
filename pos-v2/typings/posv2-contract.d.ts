declare namespace Contracts {
    import TransactionDetails = Truffle.TransactionDetails;
    import TransactionResponse = Truffle.TransactionResponse;

    export interface PosV2Contract extends Contract {

        registerValidator(ip: string, params?: TransactionDetails): Promise<TransactionResponse>
        setStakingContract(address: string, params?: TransactionDetails): Promise<TransactionResponse>
        staked(stakeOwner: string, amount: number, params?: TransactionDetails): Promise<TransactionResponse>
        unstaked(stakeOwner: string, amount: number, params?: TransactionDetails): Promise<TransactionResponse>
    }

    export interface DelegatedEvent {
        from: string,
        to: string
    }

    export interface CommitteeChangedEvent {
        addrs: string[],
        stakes: (number|BN)[],
    }

    export interface ValidatorRegisteredEvent {
        addr: string,
        ip: string,
    }

    export interface TotalStakeChangedEvent {
        addr: string,
        newTotal: (number|BN)
    }
}


