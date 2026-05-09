// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DeflationaryToken {
    string public name = "DeflationaryToken";
    string public symbol = "DFTK";
    uint8 public decimals = 18;

    uint256 public totalSupply;

    // 2% burn fee
    uint256 public burnRate = 2;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * (10 ** uint256(decimals));
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        uint256 burnAmount = (amount * burnRate) / 100;
        uint256 sendAmount = amount - burnAmount;

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += sendAmount;
        totalSupply -= burnAmount;

        emit Transfer(msg.sender, to, sendAmount);
        emit Transfer(msg.sender, address(0), burnAmount);

        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");

        uint256 burnAmount = (amount * burnRate) / 100;
        uint256 sendAmount = amount - burnAmount;

        balanceOf[from] -= amount;
        balanceOf[to] += sendAmount;
        allowance[from][msg.sender] -= amount;
        totalSupply -= burnAmount;

        emit Transfer(from, to, sendAmount);
        emit Transfer(from, address(0), burnAmount);

        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "Invalid address");

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);

        return true;
    }
}