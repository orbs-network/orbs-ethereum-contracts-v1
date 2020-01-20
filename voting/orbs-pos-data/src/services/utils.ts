import Web3 from 'web3';
import { FIRST_ELECTION_BLOCK_HEIGHT, INTERVAL_BETWEEN_ELECTIONS } from './consts';

export async function readUpcomingElectionBlockNumber(web3: Web3): Promise<number> {
  let amountOfElections = 0;
  let upcomingElectionsBlockNumber = 0;
  const currentBlockNumber = await web3.eth.getBlockNumber();
  while (upcomingElectionsBlockNumber < currentBlockNumber) {
    amountOfElections += 1;
    upcomingElectionsBlockNumber = FIRST_ELECTION_BLOCK_HEIGHT + INTERVAL_BETWEEN_ELECTIONS * amountOfElections;
  }
  return upcomingElectionsBlockNumber;
}
