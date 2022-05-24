## Setup Dapp

### To properly configure the Dapp, it is necessary to create an .env file in the dapp/src folder.

```
// The app option values are three numbers chosen by the developer to represent each option in the "move"
// This must match the hash values of the "_hashBlends" array argument in the contract's constructor function.
// Example: if we take 3 values. 111, 222, 333.
// I have to form all the possible combinations to represent each possible combination of 3 options.
// 111111111
// 222111111
// 333111111
// As shown above, then each combination of this is put through a SHA3_256 hash.

REACT_APP_VALUES_OPTION1=number option
REACT_APP_VALUES_OPTION2=number option
REACT_APP_VALUES_OPTION3=number option

REACT_APP_CONTRACT_HASH_TESTNET=<contract hash mainnet>
REACT_APP_CONTRACT_HASH_MAINNET=<contract hash mainnet>
REACT_APP_CONTRACT_ALCHEMY_KEY=<alchemy api url>
```
### We can then clone the repository, create the .env file mentioned above, and run the dapp.
```bash
git clone https://github.com/en0c-026/gawibawibo-polygon
cd dapp
yarn install
yarn start
```