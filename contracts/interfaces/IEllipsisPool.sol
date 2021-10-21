// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

interface IEllipsisPool {
    function deposit(uint256, uint256) external;

    function withdraw(uint256, uint256) external;

    function claim(uint256) external;
}