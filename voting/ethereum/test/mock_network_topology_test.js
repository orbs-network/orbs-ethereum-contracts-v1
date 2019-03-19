var IOrbsNetworkTopology = artifacts.require("./MockOrbsNetwork");

const ORBS_ADDRESSES = [
    '0x6e2cb55e4cbe97bf5b1e731d51cc2c285d83cbf9',
    '0xd27e2e7398e2582f63d0800330010b3e58952ff6',
    '0xa328846cd5b4979d68a8c58a9bdfeee657b34de7',
    '0x54018092153dcdea764f89d33b086c7114e11985'
];

const IP_ADDRESSES = [
    '0x0dea8f0f',
    '0x0dea924a',
    '0x0dea931b',
    '0x344221f9'
];

contract('MockOrbsNetwork', () => {
    describe('represents a hard coded network topology', () => {
        it('returns fixed results', async () => {

            const instance = await IOrbsNetworkTopology.new();

            const network = await instance.getNetworkTopology();
            assert.deepEqual(network.nodeAddresses, ORBS_ADDRESSES, "expected fixed addresses");
            assert.deepEqual(network.ipAddresses, IP_ADDRESSES, "expected fixed addresses");

            assert.deepEqual(network.nodeAddresses, network[0], "expected first element to be node addresses");
            assert.deepEqual(network.ipAddresses, network[1], "expected second element to be ip addresses");
        });
    });
});

