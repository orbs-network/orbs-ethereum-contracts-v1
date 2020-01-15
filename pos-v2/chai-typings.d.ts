///<reference path="events.d.ts"/>

declare namespace Chai
{
    export interface TypeComparison
    {
        delegatedEvent(data?: Partial<Events.DelegatedEvent>): void;
        committeeChangedEvent(data?: Events.CommitteeChangedEvent): void;
        validatorRegisteredEvent(data?: Partial<Events.ValidatorRegisteredEvent>): void;
        totalStakeChangedEvent(data?: Partial<Events.TotalStakeChangedEvent>): void;
        stakedEvent(data?: Partial<Events.StakedEvent>): void;
        subscriptionChangedEvent(data?: Partial<Events.SubscriptionChangedEvent>): void;
        paymentEvent(data?: Partial<Events.PaymentEvent>): void;
    }

    export interface Assertion
    {
        bignumber: Assertion;
        haveCommittee(data: Events.CommitteeChangedEvent);
    }
}

