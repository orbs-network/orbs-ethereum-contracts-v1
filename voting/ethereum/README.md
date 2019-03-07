### Enrolling a Validator

Validator applicants may register with OrbsValidatorsRegistry without 
restriction. To participate in Voting, registration is required. 

An Orbs validator has one Ethereum address and one Orbs Node address.
Before enrolling please make sure you have:

 - MyCrypto desktop app (or another equivalent wallet software)
 - A wallet setup with your Validator's Ethereum account keys with a positive Ether balance for fees
 - Your Orbs node public address, and it's IP address
 - Name and website URL of the enrolling Validator 
 
In order to enroll a validator with OrbsValidatorsRegistry contract follow these
steps:

1. Open MyCrypto and navigate to *Contracts*, under the *Interact* tab.
1. Enter the address provided for `OrbsValidatorsRegistry` contract in the text 
box labeled *Contract Address*
1. Extract the `abi` element from `IOrbsValidatorsRegistry.json` and paste it 
in the test box labeled *ABI / JSON Interface*
1. Click *Access*.
1. Select `register` in the drop down list *Read / Write Contract*
1. Fill the fields labeled `name`, `ipAddress`, `website`, `OrbsAddress` 
with your validator's registration data.
    - IP address must be formatted as a byte array of 4 bytes like so: 
        - for example: `199.203.79.137` will be formatted `0xC7CB4F89`
    - OrbsAddress must be formatted as a valid Ethereum address type.
    - leave *Value* blank
1. Choose one of the options under *How would you like to access your wallet?*
and provide your wallet information/credentials.
1. Proceed to *Select ad Address*. Select your Validator's Ethereum address. 
The address you choose will be the Validator's identification for voting later on.
1. Click *Unlock*
1. Adjust the *Gas Limit* as required. `500,000` should be enough.
1. Click *Write* 
1. Click *Sign Transaction*
1. Click *Send Transaction*

1. Review and click *Send*

1. Navigate to *Etherscan* by clicking *Verify (Etherscan)* to view your 
transaction status

1. Confirm the transaction has been accepted successfully. 
Make sure you see 
> TxReceipt Status:Success

##### Note
* Registration values are unique among validators. No two validators may register
with same name, website url, Orbs node public address, or Orbs node IP address. 
* To make changes to your registration repeat the process providing new values
 
 

### Enrolling a Guardian

Guardians may enroll without restriction to OrbsGuardians. Registration is 
required for participation in Voting.

An Orbs Guardian is identified by an Ethereum address.
Before enrolling please make sure you have:

 - MyCrypto desktop app (or another equivalent wallet software)
 - A wallet setup with your Guardian's Ethereum account keys with a positive Ether balance for fees
 - Name and website URL of the enrolling Guardian 
 
In order to enroll a guardian with OrbsGuardians contract follow these
steps:

1. Open MyCrypto and navigate to *Contracts*, under the *Interact* tab.
1. Enter the address provided for `OrbsGuardians` contract in the text 
box labeled *Contract Address*
1. Extract the `abi` element from `IOrbsGuardians.json` and paste it 
in the test box labeled *ABI / JSON Interface*
1. Click *Access*.
1. Select `register` in the drop down list *Read / Write Contract*
1. Fill the fields labeled `name`, `website` 
with your validator's registration data.
    - leave *Value* blank
1. Choose one of the options under *How would you like to access your wallet?*
and provide your wallet information/credentials.
1. Proceed to *Select ad Address*. Select your Guardians's Ethereum address. 
The address you choose will be the Guardians's identification for purpose
 of delegation later on.
1. Click *Unlock*
1. Adjust the *Gas Limit* as required. `500,000` should be enough.
1. Click *Write* 
1. Click *Sign Transaction*
1. Click *Send Transaction*

1. Review and click *Send*

1. Navigate to *Etherscan* by clicking *Verify (Etherscan)* to view your 
transaction status

1. Confirm the transaction has been accepted successfully. 
Make sure you see 
> TxReceipt Status:Success

##### Note
* Registration values uniqueness is not enforced among validators. 
Two validators may register with same name, or website url. It is up to 
the stakeholders to vet their Guardians. 
* To make changes to your registration repeat the process providing new values
 
 

