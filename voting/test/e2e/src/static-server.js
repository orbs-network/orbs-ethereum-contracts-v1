const { exec } = require('child_process');

const PORT = 5000;

const start = () => {
  return exec(`./node_modules/.bin/serve -l ${PORT} client-build`);
};

module.exports = {
  start,
  PORT
};
