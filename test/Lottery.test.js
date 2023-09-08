const ganache = require('ganache');
const { Web3 } = require('web3');
const { abi, evm } = require('../compile')

const assert = require('assert');
const web3 = new Web3(ganache.provider());

let accounts;
let lottery;
let players;

beforeEach(async  () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    // Use one of those accounts to deploy the contract
    lottery = await new web3.eth.Contract(abi)
        .deploy({
            data: evm.bytecode.object
        })
        .send({ from: accounts[0], gas: '1000000' })
});

describe('Lottery Contract Tests', () => {
    it('deploys the contract', () => {
        // If contract adddress exists then it's deployed successfully
        assert.ok(lottery.options.address)
    });

    it('has initialized a manager address', async () => {
        const address = await lottery.methods.manager().call();
        assert.equal(address, accounts[0]);
    });

    it('single player can enter the lottery', async () => {
        // send more than 0.01 ether to satisfy the entry requirement
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.011', 'ether')});
        const players = await lottery.methods.getPlayers().call({from: accounts[0]});
        assert.equal(1, players.length);
        assert.equal(accounts[0], players[0]);
    });

    it('multiple players can enter the lottery', async () => {
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.011', 'ether')});
        await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.011', 'ether')});
        await lottery.methods.enter().send({ from: accounts[2], value: web3.utils.toWei('0.011', 'ether')});
        const players = await lottery.methods.getPlayers().call({from: accounts[0]});
        assert.equal(3, players.length);

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
    });

    it('requires min amount of ether to enter the lottery', async () => {
        try {
            await lottery.methods.enter().send({from: accounts[0], value: 0});
            assert(false)
        } catch (err) {
            assert.ok(err);
        }
    });

    it('only manager can call the winner', async () => {

       try {
           await lottery.methods.pickWinner().send({from: accounts[1]});
           assert(false);
       } catch (err) {
           assert.ok(err);
       }

    });

    it('credits the winner and resets the players array', async () => {
        // manager enters the lottery with 2 ethers
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('2', 'ether')});
        players = await lottery.methods.getPlayers().call({from: accounts[0]});
        assert.equal(1, players.length);

        // after winning the lottery the single player receives a bit less than
        // 2 ether (to account for gas fees)
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({from: accounts[0]});
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const diff = finalBalance - initialBalance;
        assert(diff > web3.utils.toWei('1.8', 'ether'));

        // check that the number of players has been reset after picking the winner
        players = await lottery.methods.getPlayers().call({from: accounts[0]});
        assert.equal(0, players.length);

        // check that the contract address balance is 0 after picking the winner
        const contractBalance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(0, contractBalance);
    });
});

