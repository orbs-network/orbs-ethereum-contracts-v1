const express = require('express');

const guardiansApiFactory = web3 => {
  const router = express.Router();

  router.get('/guardians', (req, res) => {
    res.json(['1', '2']);
  });

  router.get('/guardians/:address', (req, res) => {
    res.json({ name: 'test', website: 'https://test.com' });
  });

  return router;
};

module.exports = guardiansApiFactory;
