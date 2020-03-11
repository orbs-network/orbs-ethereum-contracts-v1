import { CommitteeChangedEvent } from "../typings/elections-contract";
export declare class CommitteeProvider {
    private ethereumEndpoint;
    private posContractAddress;
    constructor(ethereumEndpoint: any, posContractAddress: any);
    getCommitteeAsOf(blockNumber: any): Promise<CommitteeChangedEvent>;
}
//# sourceMappingURL=committee-provider.d.ts.map