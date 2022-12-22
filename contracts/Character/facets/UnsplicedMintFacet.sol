// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibBytes} from "../../shared/libraries/LibBytes.sol";
import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";
import {LibCharacter} from "../libraries/LibCharacter.sol";
import {LibRNG} from "../../shared/libraries/LibRNG.sol";
import {IUnsplicedMint} from "../interfaces/IUnsplicedMint.sol";
import {ICharacter} from "../interfaces/ICharacter.sol";

contract UnsplicedMintFacet is IUnsplicedMint {

  function r() external view returns (uint) {
    bytes32 vrf = LibRNG.vrf();
    bytes memory slice = LibBytes.slice(abi.encodePacked(vrf), 1, 2);
    return LibBytes.toUint8(slice, 0);
  }

  function unsplicedMint() external override {
    LibRNG.Rarity rarity = LibRNG.generateRarity();
    bytes32 vrf = LibRNG.vrf();

    // Get last digit of the RVF bytes32 and roll a 6 faced dice
    uint affinity = uint(LibBytes.toUint8(abi.encodePacked(vrf), 31)) % 6;
    uint8[6] memory potential = [0, 0, 0, 0, 0, 0];
    potential[affinity] = 6;
    uint8[6] memory statistics = [6, 6, 6, 6, 6, 6];

    // Different digit to roll the profession
    LibCharacter.Profession profession = LibCharacter.Profession(uint(LibBytes.toUint8(abi.encodePacked(vrf), 30)) % 2);

    ICharacter(address(this)).mint(msg.sender, rarity, potential, statistics, profession);
  }
}
