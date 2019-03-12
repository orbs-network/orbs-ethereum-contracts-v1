const Web3 = require('web3');
const cors = require('cors');
const express = require('express');
const guardiansApiFactory = require('./api/guardians');
const validatorsApiFactory = require('./api/validators');

const port = process.env.PORT || 5678;

const app = express();

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141'
  )
);

const corsOptions = {
  origin: ['http://localhost:3000', 'https://orbs-network.github.io']
};

app.use(cors(corsOptions));

app.get('/is_alive', (req, res) => res.sendStatus(200));
app.use('/api', guardiansApiFactory(web3));
app.use('/api', validatorsApiFactory(web3));

app.listen(port, () => console.log(`Started on port ${port}!`));
