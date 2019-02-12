
const DELEGATE_BY_TRANSFER_FILE = './delegate-by-transfer.json';
const DELEGATE_BY_VOTE_FILE = './delegate-by-vote.json';
const VOTE_FILE = './vote.json';

const IS_MAIN_NET = false;

const generateDelegateByTransfer = require('./generateDelegateByTransfer');

try {
    let delegateByTransferToSave = generateDelegateByTransfer();
} catch (e) {
    console.log(`error ${e}`);
}
