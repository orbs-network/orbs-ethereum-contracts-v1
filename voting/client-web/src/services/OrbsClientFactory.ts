import { Client, createAccount, NetworkType } from 'orbs-client-sdk';
import { LocalSigner } from 'orbs-client-sdk';

const ORBS_VIRTUAL_CHAIN_ID = 1_100_000; // The virtual chain Id on the Orbs network
const ORBS_NODE_ADDRESS = 'validator.orbs.com'; // The Orbs node that we will query
const PROTOCOL = 'https';
const ORBS_NODE_URL = `${PROTOCOL}://${ORBS_NODE_ADDRESS}/vchains/${ORBS_VIRTUAL_CHAIN_ID.toString()}`;

export function BuildOrbsClient(): Client {
  const { publicKey, privateKey } = createAccount();
  const signer = new LocalSigner({ publicKey, privateKey });
  return new Client(ORBS_NODE_URL, ORBS_VIRTUAL_CHAIN_ID, NetworkType.NETWORK_TYPE_TEST_NET, signer);
}
