declare namespace Chai
{
    export interface TypeComparison
    {
        delegatedEvent(data?: Partial<Contracts.DelegatedEvent>): void;
        committeeChangedEvent(data?: Contracts.CommitteeChangedEvent): void;
        validatorRegisteredEvent(data?: Partial<Contracts.ValidatorRegisteredEvent>): void;
        totalStakeChangedEvent(data?: Partial<Contracts.TotalStakeChangedEvent>): void;
        stakedEvent(data?: Partial<Contracts.StakedEvent>): void;
        unstakedEvent(data?: Partial<Contracts.UnstakedEvent>): void;
        subscriptionChangedEvent(data?: Partial<Contracts.SubscriptionChangedEvent>): void;
        paymentEvent(data?: Partial<Contracts.PaymentEvent>): void;
    }

    export interface Assertion
    {
        bignumber: Assertion;
        haveCommittee(data: Contracts.CommitteeChangedEvent);
    }
}

