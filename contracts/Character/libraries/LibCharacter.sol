// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibRNG} from "../../shared/libraries/LibRNG.sol";

library LibCharacter {
  bytes32 constant CHARACTER_STORAGE_POSITION = keccak256("raid.city.character.storage");

  enum Profession {NAVIGATOR, GUNSMITH}

  struct Character {
    uint256 id;
    uint32 level;
    LibRNG.Rarity rarity;
    uint32 mutation;
    uint8 actionPoints;
    uint8 movementPoints;
    uint32 healthPoints;
    uint32 speed;
    uint32 expertise;
    uint32 scavenging;
    uint8[6] potential;
    uint8[6] statistics;
    Profession profession;
    uint256 experiencePoints;
  }

  struct CharacterStorage {
    mapping(uint256 => Character) characters;
    mapping(uint256 => uint256) characterIndexFromCharactersOfOwner;
    mapping(address => uint256[]) charactersOfOwner;
  }

  function characterStorage() internal pure returns (CharacterStorage storage ns) {
    bytes32 position = CHARACTER_STORAGE_POSITION;
    assembly {
      ns.slot := position
    }
  }
}
