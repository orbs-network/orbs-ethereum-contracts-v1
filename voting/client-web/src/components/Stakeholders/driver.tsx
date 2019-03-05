export class StakeholdersDriver {
  given = {
    metamaskService() {
      return {
        getCurrentAddress() {
          return 'some-fake-address';
        }
      };
    },
    votingContract() {
      return {
        methods: {
          delegate(...args) {
            return {
              send({ from }) {
                console.log(
                  `Sent from ${from} with following arguments ${args}`
                );
                return true;
              }
            };
          }
        }
      };
    },
    guardiansContract(data) {
      return {
        methods: {
          getGuardians() {
            return {
              call() {
                return Object.keys(data);
              }
            };
          },
          getGuardianData(address) {
            return {
              call() {
                return data[address];
              }
            };
          }
        }
      };
    }
  };
  when = {};
}
