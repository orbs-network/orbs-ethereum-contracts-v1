
## Full flow

#### flow deploy

* deploy TestingERC20 to ethereum (future with orbstoken from its repo)
  * set 10 initial account with 5 different inital values
* deploy Validators to ethereum 
  * set initial 5 validators (assume 3 will be elected)
* deploy Voting to ethereum 

#### flow record 

* run 15 delegation transfer txs on ethereum
* run 15 random transfer txs on ethereum
* future : run 5 direct delegate txs on ethereum
* run 5 activist votes on ethereum
* future : run the txs in random order

#### flow mirror 

* generate orbs mirroring txs
    * option 1 : run web3 script 
    * option 2 : sum up the txs from recording flow
* send mirroring with gammacli to orbs
* future : simple byzantine txs sent with real data
* advance ganache x txs forward

#### flow process

* call orbs process tx till its returns true
* run query on _Config contract to validate expectations

## Future flows

* run more than one period

&nbsp;

&nbsp;


## Naming:

### Players:
* Stakeholder
* Activist
* Validator

### Verbs:
* Stakeholder delegates to activist
* Activist votes for validator
* Recording - taking action on Ethereum
* Mirroring - mirroring Ethereum recorded action to orbs 
* Processing - processing mirrored information & storing result

### Nouns:
* Candidates validator (candidates)
* Elected validator (elected)

### Names of contracts:
* Voting - the voting contract on Ethereum 
* Validators - the list of candidates validators on Ethereum 
* _Elections - the contract on orbs that mirrors and processes the votes from Ethereum. (Repository contract)
* _Config - the contract on orbs that stores the elected validators. (Repository contract)
