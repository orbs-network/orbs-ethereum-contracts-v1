# [Orbs Voting UI](https://orbs-network.github.io/voting/)
> Voting UI is a webapp hosted at [github pages](https://orbs-network.github.io/voting/) where stakeholders can delegate their votes to guardians. Guardians in turn can vote for different validators and get rewards.

## Local dev
Local setup consist of two three parts: 1) web client, 2) metamask extension and 3) ganache. This guide will explain both parts.
1. Setting up local blockchain
    1. Download and install [Ganache](https://truffleframework.com/ganache).
    1. Launch Ganashe.
    1. Navigate to `voting/ethereum`.
    1. Run `npm install`.
    1. Run `npm run migrate`. This will deploy Ethereum smart contracts to your local blockchain.
    1. Open Ganache. You should see 3 contract deployed in transactions.
    1. Take contract addresses from transactions
    1. Run `npm run contracts:local`
1. Running `client-web`
    1. Clone the project `git clone https://github.com/orbs-network/orbs-ethereum-contracts`. This project is a monorepo. The interesting part for us is `Voting` folder. It contains contract and client side.
    1. Navigate to `client-web` folder `cd voting/client-web`.
    1. Run `npm install`.
    1. Run `npm start`.
    1. Go to [http://localhost:3000](http://localhost:3000) and see the app running.
1. Configuring Metamask extension
    1. Install [Metamask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?utm_source=chrome-ntp-icon)
    1. Open Ganache, click on `Accounts` tab and then click on `key` icon of the first account.
    1. Copy its private key.
    1. Create account in Metamask and import the key.

It's a little bit of a hustle, but at the end, you should be able to delegate and vote in the app.

## Tests
1. Unit and Component tests 
    1. Run `npm run test`
1. E2E tests
    1. Go to `voting/test/e2e`
    1. Run `npm test`

## Deploy
1. `npm run contracts:prod`
1. `npm run deploy`
1. [https://orbs-network.github.io/voting/](https://orbs-network.github.io/voting/)