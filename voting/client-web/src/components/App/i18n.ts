import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them)
const resources = {
  en: {
    translation: {
      'Participation Instructions Content1':
        'One of the unique features of Orbs, is that the administration of the\nnetwork’s institutes is performed on another decentralized network. With\nthis architecture, we can avoid letting network operators execute the\nprocedures for their own election. This separation of powers provides an\nexternal decentralized guarantee to all PoS votes and delegations.',
      'Participation Instructions Content2':
        'To make this possible, delegation of voting power to guardians, and\nvoting on validators by the guardians are managed by smart contracts on\nthe Ethereum network using standard Ethereum wallets.',
      'Delegators Description':
        'As an ORBS token holder, it is your responsibility to participate in the Orbs Universe by delegating your voting power to a Guardian you trust. This contributes to the network security by making sure a trustworthy group of validators is running the network. \n Delegation only needs to be performed once and remains valid unless modified to a different Guardian. Delegation takes place by making a simple Ethereum transaction using a standard Ethereum wallet. There are multiple ways to delegate, choose the easiest one for you:',
      'Guardians Description':
        'Anyone can become an active Guardian and participate in the daily voting to approve Validators. Guardians are key players that review validators, monitor their operations and audit the network. Being a Guardian requires commitment and effort.',
      'Validators Description':
        'Validators run Orbs network. They participate in the block creation and validation and maintain the state and block history. Validators are skilled professionals, capable of maintaining their node security, availability and connectivity and providing the required quality of service.'
    }
  },
  ko: {
    translation: {}
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en',

    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
