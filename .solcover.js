module.exports = {
  testCommand: 'node --max-old-space-size=2048 ../node_modules/.bin/truffle test --network coverage',
  compileCommand: 'node --max-old-space-size=2048 ../node_modules/.bin/truffle compile --network coverage',
  copyPackages: ['zeppelin-solidity'],
  norpc: true,
  skipFiles: [
    'Migrations.sol',
  ]
};
