const Chance = require('chance');
const express = require('express');

const chance = new Chance();

const validatorsApiFactory = () => {
  const router = express.Router();

  router.get('/validators/elected', async (req, res) => {
    const data = Array.from(Array(5), () => {
      return {
        name: chance.name(),
        address: `0x${chance.hash({lenght: 20})}`,
        stake: chance.integer({min: 0, max: 100000}),
        totalReward: chance.integer({min: 0, max: 100000}),
        participationReward: chance.integer({min: 0, max: 100000}),
      }
    })
    res.json(data);
  });

  return router;
};

module.exports = validatorsApiFactory;
