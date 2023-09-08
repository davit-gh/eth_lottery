//SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);
        players.push(msg.sender);
    }

    function random() private view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp)));
    }

    function pickWinner() public restricted{
        uint ind = random() % players.length;
        payable(players[ind]).transfer(address(this).balance);
        players = new address[](0);
    }

    function getPlayers() public view returns(address[] memory){
        return players;
    }

    modifier restricted () {
        require(msg.sender == manager);
        _;
    }
}
