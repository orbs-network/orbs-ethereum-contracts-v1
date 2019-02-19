
const generateDelegateByTransfer = require('./findDelegateByTransferEvents');

try {
    let delegateByTransferToSave = generateDelegateByTransfer();
    setTimeout()
} catch (e) {
    console.log(`error ${e}`);
}
