const express = require('express');

const ADDRESS_LENGTH = 20;

const electedValidatorsApiFactory = (ethereumClient, orbsClientService) => {
  const router = express.Router();

  const getElectedValidators = async () => {
    const data = await orbsClientService.getElectedValidators();
    const addresses = [];
    for (let i = 0; i < data.length; i += ADDRESS_LENGTH) {
      addresses.push(`0x${data.slice(i, i + ADDRESS_LENGTH).toString('hex')}`);
    }
    return addresses;
  };

  router.get('/validators/elected', async (req, res) => {
    const data = await getElectedValidators();
    res.json(data);
  });

  router.get('/validators/elected/:address', async (req, res) => {
    const address = req.params['address'];
    const validatorData = await ethereumClient.getValidatorData(address);
    const stake = await orbsClientService.getValidatorStake(address);
    const result = Object.assign({}, validatorData, {
      stake: stake.toString()
    });
    res.json(result);
  });

  return router;
};

module.exports = electedValidatorsApiFactory;
