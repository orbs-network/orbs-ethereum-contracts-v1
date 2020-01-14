declare namespace Events {
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

    export interface StakedEvent {
        stakeOwner: string,
        amount: (number|BN),
        totalStakedAmount: (number|BN)
    }
}


