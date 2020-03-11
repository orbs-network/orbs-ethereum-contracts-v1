import { SubscriptionChangedEvent, PaymentEvent, VcConfigRecordChangedEvent, VcOwnerChangedEvent, VcCreatedEvent } from "../typings/subscriptions-contract";
import { DelegatedEvent, CommitteeChangedEvent, TopologyChangedEvent, ValidatorRegisteredEvent, StakeChangeEvent, VoteOutEvent, VotedOutOfCommitteeEvent, BanningVoteEvent, BannedEvent, UnbannedEvent } from "../typings/elections-contract";
import { StakedEvent, UnstakedEvent } from "../typings/staking-contract";
import { ContractAddressUpdatedEvent } from "../typings/contract-registry-contract";
import { ProtocolChangedEvent } from "../typings/protocol-contract";
export declare function isBNArrayEqual(a1: Array<any>, a2: Array<any>): boolean;
declare global {
    export namespace Chai {
        interface TypeComparison {
            delegatedEvent(data?: Partial<DelegatedEvent>): void;
            committeeChangedEvent(data?: Partial<CommitteeChangedEvent>): void;
            topologyChangedEvent(data?: Partial<TopologyChangedEvent>): void;
            validatorRegisteredEvent(data?: Partial<ValidatorRegisteredEvent>): void;
            stakeChangedEvent(data?: Partial<StakeChangeEvent>): void;
            stakedEvent(data?: Partial<StakedEvent>): void;
            unstakedEvent(data?: Partial<UnstakedEvent>): void;
            subscriptionChangedEvent(data?: Partial<SubscriptionChangedEvent>): void;
            paymentEvent(data?: Partial<PaymentEvent>): void;
            vcConfigRecordChangedEvent(data?: Partial<VcConfigRecordChangedEvent>): void;
            vcCreatedEvent(data?: Partial<VcCreatedEvent>): void;
            vcOwnerChangedEvent(data?: Partial<VcOwnerChangedEvent>): void;
            voteOutEvent(data?: Partial<VoteOutEvent>): void;
            votedOutOfCommitteeEvent(data?: Partial<VotedOutOfCommitteeEvent>): void;
            contractAddressUpdatedEvent(data?: Partial<ContractAddressUpdatedEvent>): void;
            banningVoteEvent(data?: Partial<BanningVoteEvent>): void;
            bannedEvent(data?: Partial<BannedEvent>): void;
            unbannedEvent(data?: Partial<UnbannedEvent>): void;
            protocolChangedEvent(data?: Partial<ProtocolChangedEvent>): void;
        }
        interface Assertion {
            bignumber: Assertion;
            haveCommittee(data: CommitteeChangedEvent): any;
        }
    }
}
//# sourceMappingURL=matchers.d.ts.map