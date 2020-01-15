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
    }

    export interface Assertion
    {
        bignumber: Assertion;
    }
}

