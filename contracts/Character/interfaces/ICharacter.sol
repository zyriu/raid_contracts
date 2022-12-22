// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../shared/libraries/LibRNG.sol";
import "../libraries/LibCharacter.sol";

interface ICharacter {
  function mint(address, LibRNG.Rarity, uint8[6] calldata, uint8[6] calldata, LibCharacter.Profession) external;
  /* View functions */
  function baseURI() external view returns (string memory);

  function charactersOfOwner(address) external view returns (uint256[] memory);
}
