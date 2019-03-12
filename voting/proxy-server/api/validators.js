const express = require('express');

const validatorsApiFactory = web3 => {
  const router = express.Router();

  router.get('/validators', (req, res) => {
    res.json(['3', '4']);
  });

  router.get('/validators/:address', (req, res) => {
    res.json({ name: 'test', website: 'https://test.com' });
  });

  return router;
};

module.exports = validatorsApiFactory;
