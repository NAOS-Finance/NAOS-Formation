// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

import {IDetailedERC20} from "./IDetailedERC20.sol";

interface IbBUSDToken is IDetailedERC20 {
    function deposit(uint256) external;

    function withdraw(uint256) external;

    function token() external view returns (address);

    function totalToken() external view returns (uint256);
}