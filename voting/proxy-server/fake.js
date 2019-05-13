const cors = require('cors');
const Chance = require('chance');
const express = require('express');

const app = express();
const chance = new Chance();

const port = process.env.PORT || 7890;

const corsOptions = {
  origin: ['http://localhost:3000']
};

app.use(cors(corsOptions));

const createRandomAddress = () => `0x${chance.hash({ lenght: 20 })}`;

app.get(
  ['/api/validators/elected', '/api/validators', '/api/guardians'],
  (req, res) => {
    const amountOfValidators = 6;
    const addresses = Array.from(Array(amountOfValidators), () =>
      createRandomAddress()
    );
    res.json(addresses);
  }
);

app.get(
  ['/api/validators/elected/:address', '/api/validators/:address'],
  (req, res) => {
    const data = {
      name: chance.name(),
      website: chance.url(),
      orbsAddress: createRandomAddress()
    };
    res.json(data);
  }
);

app.get('/api/guardians/:address', (req, res) => {
  const data = {
    name: chance.name(),
    website: chance.url()
  };
  res.json(data);
});

app.get('/api/elections/*', (req, res) => {
  res.send(chance.integer({ min: 0 }).toString());
});

app.listen(port, () => console.log(`Started on port ${port}!`));
