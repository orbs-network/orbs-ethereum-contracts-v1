import Chance from 'chance';
const chance = new Chance();

export const generateGuardiansData = () => {
  const addresses = Array.from(Array(5), () => `0x${chance.hash()}`);
  return addresses.reduce((acc, currAddress) => {
    acc[currAddress] = {
      _name: chance.name(),
      _website: chance.url()
    };
    return acc;
  }, {});
};
