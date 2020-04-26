import { IOrbsRewardsService } from '../interfaces/IOrbsRewardsService';
import { IAccumulatedRewards } from '../interfaces/IAccumulatedRewards';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import Web3 from 'web3';
import { IOrbsPosContractsAddresses } from '../contracts-adresses';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import orbsRewardsDistributionContractJSON from '../contracts/OrbsRewardsDistribution.json';
import { ORBS_TDE_ETHEREUM_BLOCK } from './consts';
import { IOrbsClientService } from '../interfaces/IOrbsClientService';

export class OrbsRewardsService implements IOrbsRewardsService{
  private orbsRewardsDistributionContract: Contract;

  constructor(private web3: Web3, private orbsClientService: IOrbsClientService, addresses: IOrbsPosContractsAddresses) {
    this.orbsRewardsDistributionContract = new this.web3.eth.Contract(
      orbsRewardsDistributionContractJSON.abi as AbiItem[],
      addresses.orbsRewardsDistributionContract,
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

    const readRewards = events.map(log => {
      return {
        distributionEvent: log.returnValues.distributionEvent as string,
        amount: BigInt(log.returnValues.amount),
        transactionHash: log.transactionHash,
      };
    });

    return readRewards;
  }
}
