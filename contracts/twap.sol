// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPancakePair {
    function getReserves() external view returns (
        uint112 reserve0,
        uint112 reserve1,
        uint32 blockTimestampLast
    );
    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract TWAPTicker {
    address public pair;
    address public token0;
    address public token1;

    uint256 public priceCumulativeLast;
    uint32 public blockTimestampLast;
    uint256 public priceAverage;

    constructor(address _pair) {
        pair = _pair;
        token0 = IPancakePair(pair).token0();
        token1 = IPancakePair(pair).token1();
        priceCumulativeLast = IPancakePair(pair).price0CumulativeLast();
        (, , blockTimestampLast) = IPancakePair(pair).getReserves();
    }

    function lastUpdate() external view returns (uint256 nextEpochTime) {
        return blockTimestampLast;
    }

    uint256 constant Q112 = 2**112;

    function lastPrice() external view returns (uint256 price) {
        return (priceAverage * 1e18 / Q112);
    }

    function update() external {
        uint256 priceCumulative = IPancakePair(pair).price0CumulativeLast();
        (, , uint32 blockTimestamp) = IPancakePair(pair).getReserves();

        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        require(timeElapsed > 0, "No time elapsed");

        priceAverage = (priceCumulative - priceCumulativeLast) / timeElapsed;

        priceCumulativeLast     = priceCumulative;
        blockTimestampLast = blockTimestamp;
    }

    function consult() external view returns (uint256 amountOut) {
        return (priceAverage * 1e18 / Q112);
    }
}