// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITWAPTicker {
    function consult() external view returns (uint256);
}

contract AlgorithmicStableCoin {
    string public name = "Algorithmic Basic Stable Token";
    string public symbol = "ABST";
    uint8 public decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;
    address public priceTicker;

    uint256 public lastRebase;
    uint256 public rebaseInterval = 1 minutes;
    uint256 public targetPrice = 0.00001 * 1e18; // 0.00001 tBNB with 18 decimals

    address[] private _holders;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    event PriceChecked(uint256 price, uint256 target, uint256 supplyChange, bool positive);
    event HolderAdjusted(address indexed holder, uint256 oldBalance, uint256 newBalance);
    event RebaseDone(uint256 newTotalSupply);

    constructor() {
        owner = msg.sender;
        _mint(msg.sender, 1000e18);
        lastRebase = block.timestamp;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        _addHolder(to);
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        _addHolder(to);
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient");
        require(allowance[from][msg.sender] >= amount, "Not approved");
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to] += amount;
        _addHolder(to);
        emit Transfer(from, to, amount);
        return true;
    }

    function setTicker(address newTicker) external onlyOwner {
        require(newTicker != address(0), "Zero address");
        priceTicker = newTicker;
    }

    function lastRebased() external view returns (uint256 nextEpochTime) {
        return lastRebase;
    }

    function nextRebaseTime() external view returns (uint256 nextEpochTime) {
        uint256 next = lastRebase + rebaseInterval;
        return next;
    }

    function rebase() external {
        require(block.timestamp >= lastRebase + rebaseInterval, "Too soon");
        
        lastRebase = block.timestamp;

        uint256 price = ITWAPTicker(priceTicker).consult();
        if (price == targetPrice) {
            emit PriceChecked(price, targetPrice, 0, false);
            return;
        }

        uint256 supplyChange;
        bool positive;

        if (price > targetPrice) {
            positive = true;
            supplyChange = (totalSupply * (price - targetPrice)) / targetPrice;
        } else {
            positive = false;
            supplyChange = (totalSupply * (targetPrice - price)) / targetPrice;
        }

        emit PriceChecked(price, targetPrice, supplyChange, positive);
        _rebaseAdjust(positive, supplyChange);
        emit RebaseDone(totalSupply);
    }

    function _rebaseAdjust(bool positive, uint256 change) internal {
        if (change == 0) return;

        for (uint i = 0; i < _holders.length; i++) {
            address user = _holders[i];
            uint256 bal = balanceOf[user];
            uint256 delta = (bal * change) / totalSupply;
            uint256 newBalance = positive ? bal + delta : bal - delta;
            emit HolderAdjusted(user, bal, newBalance);
            balanceOf[user] = newBalance;
        }

        totalSupply = positive ? totalSupply + change : totalSupply - change;
    }

    function _addHolder(address user) internal {
        for (uint i = 0; i < _holders.length; i++) {
            if (_holders[i] == user) return;
        }
        _holders.push(user);
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}