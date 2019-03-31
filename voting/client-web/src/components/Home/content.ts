export default [
  {
    title: 'Delegators',
    links: [
      {
        url: 'https://www.orbs.com/delegation-instructions-with-metamask/',
        title: 'Delegating using Metamask'
      },
      {
        url: 'https://www.orbs.com/delegating-with-transfer/',
        title: 'Delegating by sending 0.07 ORBS directly'
      },
      {
        url: 'https://www.orbs.com/delegating-using-mycrypto/',
        title: 'Delegating using MyCrypto'
      }
    ],
    imageUrl:
      'https://www.orbs.com/wp-content/uploads/2019/03/Orbs-Telescope.png',
    text:
      'As an ORBS token holder, it is your responsibility to participate in the Orbs Universe by delegating your voting power to a Guardian you trust. This contributes to the network security by making sure a trustworthy group of validators is running the network. \n Delegation only needs to be performed once and remains valid unless modified to a different Guardian. Delegation takes place by making a simple Ethereum transaction using a standard Ethereum wallet. There are multiple ways to delegate, choose the easiest one for you:',
    cta: {
      label: 'Delegate',
      url: '/delegator'
    }
  },
  {
    title: 'Guardians',
    links: [
      {
        url:
          'https://github.com/orbs-network/orbs-ethereum-contracts/blob/master/voting/ethereum/instructions/guardian_registration.md',
        title: 'Becoming a Guardian'
      },
      {
        url:
          'https://github.com/orbs-network/orbs-ethereum-contracts/blob/master/voting/ethereum/instructions/vote_out.md',
        title: 'Voting using MyCrypto'
      }
    ],
    imageUrl: 'https://www.orbs.com/wp-content/uploads/2019/03/Orbs-Voting.png',
    text:
      'Anyone can become an active Guardian and participate in the daily voting to approve Validators. Guardians are key players that review validators, monitor their operations and audit the network. Being a Guardian requires commitment and effort.',
    cta: {
      label: 'Vote',
      url: '/guardian'
    }
  },
  {
    title: 'Validators',
    links: [
      {
        url:
          'https://github.com/orbs-network/orbs-ethereum-contracts/blob/master/voting/ethereum/instructions/validator_registration.md',
        title: 'Becoming a Validator'
      }
    ],
    imageUrl:
      'https://www.orbs.com/wp-content/uploads/2019/03/Validators-Network.png',
    text:
      'Validators run Orbs network. They participate in the block creation and validation and maintain the state and block history. Validators are skilled professionals, capable of maintaining their node security, availability and connectivity and providing the required quality of service.',
    cta: {
      label: 'Explore',
      url: '/Validator'
    }
  }
];
