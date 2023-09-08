const HDWalletProvider = require('@truffle/hdwallet-provider');
const { Web3 } = require('web3');
//updated web3 and hdwallet-provider imports added for convenience

// deploy code will go here
const { abi, evm } = require('./compile');

const provider = new HDWalletProvider(
    'solar bench move check observe step always frequent hammer tray body welcome',
    'https://sepolia.infura.io/v3/96f07513ecf346f4bfa56637e47f5287'
);

const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account ', accounts[0]);
    const inbox = await new web3.eth.Contract(abi)
        .deploy({data: evm.bytecode.object, arguments: []})
        .send({ gas: '1000000', from: accounts[0]});
    console.log('Deployed to', inbox.options.address);
    provider.engine.stop();
};

deploy();
