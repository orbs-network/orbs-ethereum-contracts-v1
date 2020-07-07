import { IOrbsRewardsService } from '../interfaces/IOrbsRewardsService';
import { IAccumulatedRewards } from '../interfaces/IAccumulatedRewards';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import Web3 from 'web3';
import { IOrbsPosContractsAddresses, MainnetContractsAddresses } from '../contracts-adresses';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import orbsRewardsDistributionContractJSON from '../contracts/OrbsRewardsDistribution.json';
import orbsRewardsDistributionForStakingContractJSON from '../contracts/OrbsRewardsDistributionForStaking.json';
import { ORBS_TDE_ETHEREUM_BLOCK } from './consts';
import { IOrbsClientService } from '../interfaces/IOrbsClientService';

export class OrbsRewardsService implements IOrbsRewardsService{
  private orbsRewardsDistributionContract: Contract;
  private orbsRewardsDistributionForStakingContract: Contract;

  constructor(private web3: Web3,
              private orbsClientService: IOrbsClientService,
              orbsRewardsDistributionContractAddress: string = MainnetContractsAddresses.orbsRewardsDistributionContract,
              orbsRewardsDistributionForStakingContractAddress: string = MainnetContractsAddresses.orbsRewardsDistributionForStakingContract
  ) {
    this.orbsRewardsDistributionContract = new this.web3.eth.Contract(
      orbsRewardsDistributionContractJSON.abi as AbiItem[],
      orbsRewardsDistributionContractAddress
    );

    this.orbsRewardsDistributionForStakingContract = new this.web3.eth.Contract(
      orbsRewardsDistributionForStakingContractJSON.abi as AbiItem[],
      orbsRewardsDistributionForStakingContractAddress
    );
  }

  public async readAccumulatedRewards(address: string): Promise<IAccumulatedRewards> {
    const [delegatorReward, guardianReward, validatorReward] = await Promise.all([
      this.orbsClientService.readParticipationReward(address),
      this.orbsClientService.readGuardianReward(address),
      this.orbsClientService.readValidatorReward(address),
    ]);

    return {
      delegatorReward,
      guardianReward,
      validatorReward,
    };
  }

  public async readRewardsDistributionsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    const options = {
      fromBlock: ORBS_TDE_ETHEREUM_BLOCK,
      toBlock: 'latest',
      filter: { recipient: address },
    };

    const events = await this.orbsRewardsDistributionContract.getPastEvents('RewardDistributed', options);
    const eventsForStaking = await this.orbsRewardsDistributionForStakingContract.getPastEvents('RewardDistributed', options);

    const allEvents = [...events, ...eventsForStaking];

    const readRewards = allEvents.map(log => {
      return {
        distributionEvent: log.returnValues.distributionEvent as string,
        amount: BigInt(log.returnValues.amount),
        transactionHash: log.transactionHash,
      };
    });

    return readRewards;
  }
}
