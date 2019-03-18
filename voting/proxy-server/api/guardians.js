const express = require('express');
const Orbs = require('orbs-client-sdk');
const OrbsContractsInfo = require('../contracts-info');
const OrbsGuardiansContractJSON = require('../contracts/OrbsGuardians.json');

const guardiansApiFactory = (web3, orbsAccount, orbsClient) => {
  const router = express.Router();

  const guardiansContract = new web3.eth.Contract(
    OrbsGuardiansContractJSON.abi,
    OrbsContractsInfo.OrbsGuardians.address
  );

  const getGuardianVoteWeight = async address => {
    const votingWeightQuery = orbsClient.createQuery(
      orbsAccount.publicKey,
      'OrbsVoting_1552865801',
      'getGuardianVotingWeight',
      [Orbs.argAddress(address.toLowerCase())]
    );
    const votingWeightResults = await orbsClient.sendQuery(votingWeightQuery);
    return votingWeightResults.outputArguments[0].value;
  };

  const getTotalStake = async () => {
    const totalStakeQuery = orbsClient.createQuery(
      orbsAccount.publicKey,
      'OrbsVoting_1552865801',
      'getTotalStake',
      []
    );
    const totalStakeResults = await orbsClient.sendQuery(totalStakeQuery);
    return totalStakeResults.outputArguments[0].value;
  };

  router.get('/guardians', async (req, res) => {
    try {
      const guardians = await guardiansContract.methods
        .getGuardians(0, 100)
        .call();
      res.json(guardians);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  router.get('/guardians/stake', async (req, res) => {
    try {
      const totalStake = await getTotalStake();
      res.send(totalStake.toString());
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  router.get('/guardians/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const data = await guardiansContract.methods
        .getGuardianData(address)
        .call();

      const [votingWeightResults, totalStakeResults] = await Promise.all([
        getGuardianVoteWeight(address),
        getTotalStake()
      ]);

      data['stake'] = (votingWeightResults / totalStakeResults).toString();

      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansApiFactory;
