export const content = t => [
  {
    title: t('Delegators'),
    links: [
      // {
      //   url: 'https://www.orbs.com/delegation-instructions-with-metamask/',
      //   title: t('Delegating using Metamask'),
      // },
      // {
      //   url: 'https://www.orbs.com/delegating-with-transfer/',
      //   title: t('Delegating by sending 0.07 ORBS directly'),
      // },
      // {
      //   url: 'https://www.orbs.com/delegating-using-mycrypto/',
      //   title: t('Delegating using MyCrypto'),
      // },
      {
        url: 'https://www.orbs.com/tetra-orbs-staking-wallet-tutorial/',
        title: t('linkText_tetraWalletTutorial'),
      },
    ],
    imageUrl: 'https://www.orbs.com/wp-content/uploads/2019/03/Orbs-Telescope.png',
    text: t('text_delegatorDescriptionMain'),
    text2: t('text_delegatorDescriptionTetra'),
    cta: {
      label: t('Delegate'),
      url: '/delegator',
    },
  },
  {
    title: t('Guardians'),
    links: [
      {
        url:
          'https://github.com/orbs-network/orbs-ethereum-contracts/blob/master/voting/ethereum/instructions/guardian_registration.md',
        title: t('Becoming a Guardian'),
      },
      {
        url:
          'https://github.com/orbs-network/orbs-ethereum-contracts/blob/master/voting/ethereum/instructions/vote_out.md',
        title: t('Voting using MyCrypto'),
      },
    ],
    imageUrl: 'https://www.orbs.com/wp-content/uploads/2019/03/Orbs-Voting.png',
    text: t('Guardians Description'),
    cta: {
      label: t('Vote'),
      url: '/guardian',
    },
  },
  {
    title: t('Validators'),
    links: [
      {
        url:
          'https://github.com/orbs-network/orbs-ethereum-contracts/blob/master/voting/ethereum/instructions/validator_registration.md',
        title: t('Becoming a Validator'),
      },
    ],
    imageUrl: 'https://www.orbs.com/wp-content/uploads/2019/03/Validators-Network.png',
    text: t('Validators Description'),
    cta: {
      label: t('Explore'),
      url: '/Validator',
    },
  },
];
