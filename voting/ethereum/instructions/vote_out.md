## Voting

Guardians enforce the protocol by monitoring the network and vote to approve Validators accordingly. A Guardian that identifies Validators that do not follow the protocol can vote them out. In each vote, a Guardian can vote out up to 3 Validators, a Guardian may by voting with an empty list, express consent to include all the listed Validators. 

A Guardian may cast a vote at any time which remains valid for up to 45,500 Ethereum blocks (approximately one week). In order to participate in an election, a guardian needs to have a valid vote at the time of the election event. When voting to vote out multiple Validators, the voting weight for each Validator equals to the Guardian’s total voting weight.

This document provides instructions for voting process using the MyCrypto desktop wallet application.
Any wallet software may be used, and the choice of MyCrypto here is for illustration only.

For voting using a voting UI see https://orbs-network.github.io/voting/guardian.

### Voting requires following data:
- Ethereum Addresses of up to three Orbs Validators to vote out

### Voting pre-requirements
 - MyCrypto desktop app (or another equivalent wallet software)
 - A wallet setup with your Guardians's Ethereum account keys with a positive Ether balance for gas payment
 - ABI and contract address available on Etherscan. For example, on Ropsten testnet the contract may be found [here][1] 

### Voting steps

In order to vote follow these steps:

1. **Verify you are on the correct network** ([Choosing the relevant Ethereum Network](./choosing_the_network.md))
2. Navigate to *Contracts*, under the *Interact* tab.
![](./voting_1.png)
1. Enter the `OrbsVoting` contract address. For Ropsten testnet the address may be found [here][1]. Paste the address in the text box labeled *Contract Address*.
1. Extract the Contract ABI from the Etherscan *code* [tab][1] and paste it in the test box labeled *ABI / JSON Interface*. 
![](./voting_2.png)
1. Click *Access*.
   * If the *Access* button appears disabled, make sure there are no trailing line feeds at the bottom of the *ABI / JSON Interface* text box.
1. Select `voteOut` in the drop down list *Read / Write Contract*
![](./voting_3.png)
The function parameter for the `voteOut` call will appear in the form.
1. Fill the parameter field labeled `nodes address[]`
with the Ethereum addresses corresponding to any Validator you wish to vote out.
An empty list implies all validators are approved by the voting guardians.
    - The list will be represented as a JSON array. for example:
    - `["0xd45083C7E21c9B346F2DfdB3d59e513C1FFC23d8", "0xA0bC632E9CE4485b5cF01e53A15B35672D237267"]`
    - to represent an empty list pass `[]`
    - If any of the addresses does not match a registered validator it will be ignored by Orbs when counting votes
    - validators are indicated using their Ethereum accounts addresses as registered under the OrbsValidatorsRegistry contract.
![](./voting_4.png)
1. Choose one of the options under *How would you like to access your wallet?*
and provide your wallet information/credentials.
In this example we choose to provide a mnemonic to open our wallet:
![](./unlock_mnemonic.png)
Click *Choose Address*
![](./voting_5.png)
1. Select your Guardians's Ethereum address. 
The address you choose should be your Guardian's identifying address as [registered under OrbsGuardians](./guardian_registration.md) contract.
Make sure the account has a positive Ether balance for transaction fees.
<br> Then click *Unlock*. 
![](./voting_6.png)
1. Verify *Automatically Calculate Gas Limit* is checked. 
![](./voting_7.png)
Don't forget to adjust Gas Price so the transaction is accepted in a reasonable time. Then Click *Write*, and then *Sign Transaction* 
![](./voting_8.png)
Click *Send Transaction*
![](./voting_9.png)
Review, then click *Send*

1. Once the transaction is sent, MyCrypto will provide a link to track the transaction status on Etherscan.
Navigate to *Etherscan* by clicking *Verify (Etherscan)*
![](./voting_10.png)

1. Confirm the transaction has been accepted successfully.
![](./voting_11.png)
 
Make sure you see 
> TxReceipt Status:Success

With sufficient block confirmations.

[1]: https://ropsten.etherscan.io/address/0x9f313f9b21d9EAcBACF7ad0527EDC39ec3753Fba#code

##### Notes
* If a vote is made from a non-guardian address the vote will succeed but Orbs network will ignore it. Guardianship is verified on Orbs upon processing of voting results.
* If a vote is made with a non-validator address in the nodes list the vote will succeed but Orbs betwork will ignore the vote. Validator registration is verified on Orbs upon processing of voting result. 
* A vote may be modified at any time, where the last vote recorded before an election event is taken into consideration.
