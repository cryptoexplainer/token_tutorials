// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IPancakePair {
    function getReserves() external view returns (
        uint112 reserve0,
        uint112 reserve1,
        uint32 blockTimestampLast
    );
    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract GetPairHelper {
    address public factory = 0x6725F303b657a9451d8BA641348b6761A6CC7a17; // PancakeSwap Testnet Factory
    address public tokenA;
    address public tokenB = 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd; // WBNB Testnet

    constructor(address _tokenA) {
        tokenA = _tokenA;
    }

    function getMyPair() public view returns (address) {
        return IPancakeFactory(factory).getPair(tokenA, tokenB);
    }

    function getReserves()
        external
        view
        returns (
            uint112 reserveTokenA,
            uint112 reserveTokenB,
            uint32 lastBlockTimestamp
        )
    {
        address pair = IPancakeFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "Pair not found");

        (uint112 r0, uint112 r1, uint32 ts) = IPancakePair(pair).getReserves();

        address token0 = IPancakePair(pair).token0();
        if (token0 == tokenA) {
            return (r0, r1, ts);
        } else {
            return (r1, r0, ts);
        }
    }
}