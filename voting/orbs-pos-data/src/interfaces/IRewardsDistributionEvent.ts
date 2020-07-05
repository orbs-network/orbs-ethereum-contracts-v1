export interface IRewardsDistributionEvent {
  distributionEvent: string;
  /**
   * Amount in wei-ORBS
   */
  amount: bigint;
  transactionHash: string;
}
