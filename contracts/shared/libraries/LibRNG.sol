// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibBytes } from "./LibBytes.sol";

library LibRNG {

    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, FABLED }

    function generateRarity() internal view returns (Rarity r) {
        uint roll = LibBytes.toUint16(abi.encodePacked(vrf()), 30) % 1000;

        if (roll == 0) {
            r = Rarity.FABLED;
        } else if (roll <= 10) {
            r = Rarity.LEGENDARY;
        } else if (roll <= 59) {
            r = Rarity.EPIC;
        } else if (roll <= 204) {
            r = Rarity.RARE;
        } else if (roll <= 449) {
            r = Rarity.UNCOMMON;
        } else {
            r = Rarity.COMMON;
        }
    }

    function vrf() internal view returns (bytes32 result) {
        uint[1] memory bn;
        bn[0] = block.number;

        assembly {
            let memPtr := mload(0x40)

            if iszero(staticcall(not(0), 0xff, bn, 0x20, memPtr, 0x20)) {
                invalid()
            }

            result := mload(memPtr)
        }
    }
}
