=== Dev env for this wallet

* Start by running `npm run start-ganache`, this will start Ganache on port 8545 with a specific account
* In metamask:
    * Point it to `localhost:8545`.
    * Import an account with this mnemonic: `bone spatial narrow improve drop rabbit song pride lamp strong run hand`
    * The first account is the main account that you should be working with: `0xbDBE6E5030f3e769FaC89AEF5ac34EbE8Cf95a76`
* Run `npm run compile-and-deploy` to compile and deploy all the required contracts. (Take a node of the Orbs token address)
* Back in metamask, add Orbs token
    * Custom Token
    * Token Contract Address: Taken from the note above.
    * Token Symbol: `ORBS`
    * Decimals of Precision: 18