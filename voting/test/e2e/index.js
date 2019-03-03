const {setup, tearDown} = require('./src');

(async () => {
  await setup();
  await tearDown();
  process.exit()
})();

