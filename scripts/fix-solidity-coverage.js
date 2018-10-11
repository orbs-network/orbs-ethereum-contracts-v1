// A temporary solution to solidity-coverage's memory leak issue:
// https://github.com/sc-forks/solidity-coverage/issues/251.

const fs = require('fs');

function fix(fileName, tokens) {
  console.log('Fixing', fileName); /* eslint-disable-line no-console */
  let data = fs.readFileSync(fileName, { encoding: 'utf8' });
  for (const token of tokens) {
    data = data.split(token.prev).join(token.next);
  }
  fs.writeFileSync(fileName, data, { encoding: 'utf8' });
}

fix('./node_modules/solidity-coverage/lib/app.js', [
  { prev: 'events.push', next: 'coverage.processEvent' },
]);

fix('./node_modules/solidity-coverage/lib/coverageMap.js', [
  { prev: '  generate(events, pathPrefix) {', next: '  processEvent(line) {' },
  { prev: '    for (let idx = 0; idx < events.length; idx++) {', next: '' },
  { prev: '      const event = JSON.parse(events[idx]);', next: '      const event = JSON.parse(line);' },
  { prev: '    // Finally, interpret the assert pre/post events', next: '  generate(events, pathPrefix) {' },
]);
