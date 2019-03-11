# Enrolling Orbs Validator and Guardian accounts

This document walks you through the registration process of Validator and Guardian accounts using the MyCrypto desktop wallet application.
Any wallet software may be used, and the choice of MyCrypto here is for illustration only.

### Choose the network
In this example we will be enrolling on the Ropsten network. To verify you are on Ropsten follow these steps:

1. Open MyCrypto and select the desired network.<p> 
Ropsten in the example below: <p>
![](instructions/change_network_1.png)
Verify the active network is the desired network. If not, click *Change Network*
![](instructions/change_network_2.png)
Choose your target network. In this example, we will setup a Validator account on Ropsten testnet.
![](instructions/change_network_3.png)
Verify the selected network is Ropsten.
 
### Enrolling a Validator

Validator applicants may register with OrbsValidatorsRegistry without restriction. To participate in Voting, registration is required. 

An Orbs Validator has one Ethereum address and one Orbs Node address.
Before enrolling please make sure you have:

 - MyCrypto desktop app (or another equivalent wallet software)
 - A wallet setup with your Validator's Ethereum account keys with a positive Ether balance for fees
 - Your Orbs node public address and its IP address
 - Name and website URL of the enrolling Validator 
 - ABI and contract address available on Etherscan. For example, on Ropsten testnet the contract may be found [here][2] 

In order to enroll a Validator with OrbsValidatorsRegistry contract follow these steps:

1. [Verify you are on the correct network](#Choose the network) 
1. Navigate to *Contracts*, under the *Interact* tab.
![](instructions/enroll_validator_1.png)
1. Enter the `OrbsValidatorsRegistry` contract address. For testnet Ropsten the address may be found [here][2]. Paste the address in the text box labeled *Contract Address*.
1. Extract the contract ABI from the Etherscan *code* tab and paste it in the test box labeled *ABI / JSON Interface*. 
![](instructions/enroll_validator_2.png)
    1. If the *Access* button appears disabled, make sure there are no trailing line feeds at the bottom of the text box.
1. Click *Access*.
1. Select `register` in the drop down list *Read / Write Contract*
![](instructions/enroll_validator_3.png)
The function parameters for the `register` call will appear in the form.
1. Fill the fields labeled `name`, `ipAddress`, `website`, `OrbsAddress` 
with your validator's registration data.
    - OrbsAddress must be formatted as a valid Ethereum address type.
    - IP address must first be converted to a hexadecimal number representation:
        - The hexadecimal number representation begins with `0x` followed by 8 hexadecimal digits, two for each byte in the IP address. for example: `216.58.207.46` will be formatted `0xd83acf2e`.
        - Several online tools can perform the conversion. [Here is one example with screen shots](https://www.browserling.com/tools/ip-to-hex):<p>
        ![](instructions/IP_to_Hex_Converter_1.png)
 
        Paste your Orbs node's IP address in the text box and click *Convert to Hex!* <p>
        ![](instructions/IP_to_Hex_Converter_2.png)
        
        Copy the hexadecimal number representation contained within the parentheses. Don't forget to include the prefix `0x`       
![](instructions/enroll_validator_4.png)

1. Choose one of the options under *How would you like to access your wallet?*
and provide your wallet information/credentials.
In this example we choose to provide a mnemonic to open our wallet:
![](instructions/enroll_validator_5.png)
Proceed to *Choose Address*. 
1. Select your Validator's Ethereum address. 
The address you choose will be the Validator's identification for voting later on.
![](instructions/enroll_validator_6.png)
Make sure the account has a positive Ether balance for transaction fees. Then click *Unlock*.
1. Adjust the *Gas Limit* as required. `500,000` should be more than enough (at the time this is being written a successful registration uses ~174000 Gas)
![](instructions/enroll_validator_7.png)
Click *Write*, then *Sign Transaction* 
![](instructions/enroll_validator_8.png)
Click *Send Transaction*
![](instructions/enroll_validator_9.png)
Review, then click *Send*

1. Once the transaction is sent, MyCrypto will provide a link to track the transaction status on Etherscan.
Navigate to *Etherscan* by clicking *Verify (Etherscan)*
![](instructions/enroll_validator_10.png)

1. Confirm the transaction has been accepted successfully.
![](instructions/etherscan_confirmation_1.png)
 
Make sure you see 
> TxReceipt Status:Success

With sufficient block confirmations.

[2]: https://ropsten.etherscan.io/address/0xd492757cee4c0e1159376aE7Da795fB6D949900a#code
##### Note
* Registration values are unique among validators, except for IP address which should be unique but is not enforced by the contract. 
with same name, website url, Orbs node public address, or Orbs node IP address. 
* To make changes to your registration repeat the process providing new values
 
 

### Enrolling a Guardian

Guardians may enroll without restriction to OrbsGuardians. Registration is required for participation in Voting.

An Orbs Guardian is identified by an Ethereum address.
Before enrolling please make sure you have:

 - MyCrypto desktop app (or another equivalent wallet software)
 - A wallet setup with your Guardian's Ethereum account keys with a positive Ether balance for fees
 - Name and website URL of the enrolling a Guardian
 - ABI and contract address available on Etherscan. For example, on Ropsten testnet the contract may be found [here][1] 
 - 1 Ether deposit required to enroll a Guardian
 
In order to enroll a Guardian with OrbsGuardians contract follow these steps:

1. [Verify you are on the correct network](#Choose the network)
1. Navigate to *Contracts*, under the *Interact* tab.
![](instructions/enroll_guardian_1.png)
1. Enter the `OrbsGuardians` contract address. For testnet Ropsten the address may be found [here][1]. Paste the address in the text 
box labeled *Contract Address*.
1. Extract the contract ABI from the Etherscan *code* tab and paste it 
in the test box labeled *ABI / JSON Interface*. 
![](instructions/enroll_guardian_2.png)
    1. If the *Access* button appears disabled, make sure there are no trailing line feeds at the bottom of the text box.
1. Click *Access*.
1. Select `register` in the drop down list *Read / Write Contract*
![](instructions/enroll_guardian_3.png)
The function parameters for the `register` call will appear in the form.
1. Fill the fields labeled `name` and `website` 
with your guardian details.
![](instructions/enroll_guardian_4.png)
1. Choose one of the options under *How would you like to access your wallet?*
and provide your wallet information/credentials.
![](instructions/enroll_guardian_5.png)
1. Proceed to *Select an Address*. Select your Guardians's Ethereum address. 
The address you choose will be the Guardians's identification for purpose
 of delegation later on.
![](instructions/enroll_guardian_6.png)
Click *Unlock*
1. After unlocking an account, a new field labeled *Value* will appear after the website entry field (see below).
Enter `1` in the *Value* field. This will send 1 Ether with your registration request as a deposit. `OrbsGuardian` contract
will refund you the deposit if you later request to unregister.
A 1 Ether deposit is required for registration. You may not send more than exactly 1 Ether.
![](instructions/enroll_guardian_7.png)
1. Verify that the option *Automatically Calculate Gas Limit* is switched off, and manually adjust the *Gas Limit* field as required. `500,000` will be more than enough (at the time this is being written a successful registration uses ~115000 Gas).
![](instructions/enroll_guardian_8.png)
Click *Write* 
![](instructions/enroll_guardian_9.png)
Click *Sign Transaction*
![](instructions/enroll_guardian_10.png)
Click *Send Transaction*
![](instructions/enroll_guardian_11.png)
Review, then click *Send*
1. Once the transaction is sent, MyCrypto will provide a link to track the transaction status on Etherscan.
Navigate to *Etherscan* by clicking *Verify (Etherscan)*
![](instructions/enroll_guardian_12.png)

1. Confirm the transaction has been accepted successfully.
![](instructions/etherscan_confirmation_2.png)
 
Make sure you see 
> TxReceipt Status:Success

With sufficient block confirmations.

[1]: https://ropsten.etherscan.io/address/0x71715337C81a99F1B02c3467168d5d657CeE6bfc#code

##### Note
* The contract does not enforce uniqueness of name and website values between the different Guardians. Two Guardians may register with same name, or website url. It is up to the Delegators to vet their Guardians. 
* To make changes to your registration repeat the process providing new values. A deposit is not required when re-registering. If you send a second deposit the transaction will revert.
 
 

