## Validator Registration

Validator candidates may register to be elected as a Validator using OrbsValidatorsRegistry Ethereum Contract.  
An Orbs Validator is identified and voted for by its Ethereum address. 

This document walks you through the registration process of Validator and Guardian accounts using the MyCrypto desktop wallet application.
Any wallet software may be used, and the choice of MyCrypto here is for illustration only.

### A Validator registration requires to following data:
- Name and website URL of the enrolling Validator
- IP Address of the Orbs node
- An Orbs node public address
  - The Orbs node addressing scheme is equivalent to Ethereum.

Note: A Validator may update its registration data at any time or leave the registry.

### Registration pre-requirements
 - MyCrypto desktop app (or another equivalent wallet software)
 - A wallet setup with your Validator's Ethereum account keys with a positive Ether balance for gas payment
 - ABI and contract address available on Etherscan. For example, on Ropsten testnet the contract may be found [here][2] 
 - Registration data

### Enrollment steps

In order to enroll a Validator with OrbsValidatorsRegistry contract follow these steps:

1. **Verify you are on the correct network** ([Choosing the relevant Ethereum Network](./choosing_the_network.md))
2. Navigate to *Contracts*, under the *Interact* tab.
![](../instructions/enroll_validator_1.png)
1. Enter the `OrbsValidatorsRegistry` contract address. For Ropsten testnet the address may be found [here][2]. Paste the address in the text box labeled *Contract Address*.
1. Extract the contract ABI from the Etherscan *code* tab and paste it in the test box labeled *ABI / JSON Interface*. 
![](../instructions/enroll_validator_2.png)
1. Click *Access*.
* If the *Access* button appears disabled, make sure there are no trailing line feeds at the bottom of the *ABI / JSON Interface* text box.
1. Select `register` in the drop down list *Read / Write Contract*
![](../instructions/enroll_validator_3.png)
The function parameters for the `register` call will appear in the form.
1. Fill the fields labeled `name`, `ipAddress`, `website`, `OrbsAddress` 
with your Validator's registration data.
    - OrbsAddress must be formatted as a valid Ethereum address type.
    - IP address must first be converted to a hexadecimal number representation:
        - The hexadecimal number representation begins with `0x` followed by 8 hexadecimal digits, two for each byte in the IP address. for example: `216.58.207.46` will be formatted `0xd83acf2e`.
        - Several online tools can perform the conversion. [Here is one example with screen shots](https://www.browserling.com/tools/ip-to-hex):<p>
        ![](../instructions/IP_to_Hex_Converter_1.png)
 
        Paste your Orbs node's IP address in the text box and click *Convert to Hex!* <p>
        ![](../instructions/IP_to_Hex_Converter_2.png)
        
        Copy the hexadecimal number representation contained within the parentheses. Don't forget to include the prefix `0x`       
![](../instructions/enroll_validator_4.png)

1. Choose one of the options under *How would you like to access your wallet?*
and provide your wallet information/credentials.
In this example we choose to provide a mnemonic to open our wallet:
![](../instructions/enroll_validator_5.png)
Proceed to *Choose Address*. 
1. Select your Validator's Ethereum address. 
The address you choose will be the Validator's identification for voting later on.
![](../instructions/enroll_validator_6.png)
Make sure the account has a positive Ether balance for transaction fees. Then click *Unlock*.
1. Adjust the *Gas Limit* as required. `500,000` should be more than enough (at the time this is being written a successful registration uses ~174000 Gas)
![](../instructions/enroll_validator_7.png)
Click *Write*, then *Sign Transaction* 
![](../instructions/enroll_validator_8.png)
Click *Send Transaction*
![](../instructions/enroll_validator_9.png)
Review, then click *Send*

1. Once the transaction is sent, MyCrypto will provide a link to track the transaction status on Etherscan.
Navigate to *Etherscan* by clicking *Verify (Etherscan)*
![](../instructions/enroll_validator_10.png)

1. Confirm the transaction has been accepted successfully.
![](../instructions/etherscan_confirmation_1.png)
 
Make sure you see 
> TxReceipt Status:Success

With sufficient block confirmations.

[2]: https://ropsten.etherscan.io/address/0xd492757cee4c0e1159376aE7Da795fB6D949900a#code

##### Notes
* Registration values are unique among Validators, except for IP address which should be unique but is not enforced by the contract. 
with same name, website url, Orbs node public address, or Orbs node IP address. 
* To make changes to your registration repeat the process providing new values.
* To to be removed from the Validators Registry, use the leave() function.