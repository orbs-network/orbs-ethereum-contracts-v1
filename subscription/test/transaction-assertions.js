const {Assertion} = require("chai");

function stringify(tx) {
    return JSON.stringify(tx, (key, value) => {
        return (typeof value === "bigint") ? value.toString() : value;
    });
}

module.exports = function (_chai, utils) {
    utils.overwriteProperty(Assertion.prototype, 'successful', function (_super) {
        return function () {
            const tx = utils.flag(this, 'object');
            if (tx.executionResult) {
                this.assert(
                    tx.executionResult === "SUCCESS",
                    "expected transaction #{this} to be successful",
                    "expected transaction #{this} to not be successful",
                    "a successful transaction",
                    stringify(tx)
                );
            } else {
                _super.call(this);
            }
        }
    });

    utils.overwriteProperty(Assertion.prototype, 'rejected', function (_super) {
        return function () {
            const tx = utils.flag(this, 'object');
            if (tx.executionResult && tx.transactionStatus) {
                this.assert(
                    tx.executionResult === "NOT_EXECUTED",
                    "expected transaction #{this} to not have been executed",
                    "expected transaction #{this} to have been executed",
                    "a rejected transaction",
                    stringify(tx)
                );

                this.assert(
                    tx.transactionStatus === "REJECTED_GLOBAL_PRE_ORDER",
                    "expected transaction #{this} to have been rejected during preordering",
                    "expected transaction #{this} to not have been rejected during preordering",
                    "a rejected transaction",
                    stringify(tx)
                );
            } else {
                _super.call(this);
            }
        }

    });
};
