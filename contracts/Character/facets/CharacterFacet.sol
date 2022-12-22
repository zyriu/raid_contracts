// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@solidstate/contracts/token/ERC721/base/ERC721Base.sol";
import "@solidstate/contracts/token/ERC721/enumerable/ERC721Enumerable.sol";
import "@solidstate/contracts/token/ERC721/metadata/ERC721Metadata.sol";
import {LibDiamond} from "../../shared/libraries/LibDiamond.sol";
import {LibCharacter} from "../libraries/LibCharacter.sol";
import {LibRNG} from "../../shared/libraries/LibRNG.sol";
import {ICharacter} from "../interfaces/ICharacter.sol";

contract CharacterFacet is ICharacter, ERC721Base, ERC721Enumerable, ERC721Metadata {
  using ERC721MetadataStorage for ERC721MetadataStorage.Layout;

  event Mint (
    uint256 id,
    address indexed to,
    LibRNG.Rarity rarity,
    uint8[6] statistics,
    uint8[6] potential,
    LibCharacter.Profession profession
  );

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(ERC721BaseInternal, ERC721Metadata) {
    require(from != to, "CharacterFacet::_beforeTokenTransfer: sender is recipient");
    if (from != address(0)) {
      require(from == ownerOf(tokenId), "CharacterFacet::_beforeTokenTransfer: sender is not the owner");
    }

    super._beforeTokenTransfer(from, to, tokenId);
    LibCharacter.CharacterStorage storage cs = LibCharacter.characterStorage();

    uint256 idToPreviousOwnerIndex = cs.characterIndexFromCharactersOfOwner[tokenId];

    if (to != address(0)) {
      cs.charactersOfOwner[to].push(tokenId);
      cs.characterIndexFromCharactersOfOwner[tokenId] = cs.charactersOfOwner[to].length - 1;
    }

    if (from != address(0)) {
      uint256 len = cs.charactersOfOwner[from].length;
      if (idToPreviousOwnerIndex < len - 1) {
        cs.charactersOfOwner[from][idToPreviousOwnerIndex] = cs.charactersOfOwner[from][len - 1];
        cs.characterIndexFromCharactersOfOwner[cs.charactersOfOwner[from][len - 1]] = idToPreviousOwnerIndex;
      }

      cs.charactersOfOwner[from].pop();
    }
  }

  function mint(
    address to,
    LibRNG.Rarity rarity,
    uint8[6] calldata potential,
    uint8[6] calldata statistics,
    LibCharacter.Profession profession
  ) external override onlyMinter {
    LibCharacter.CharacterStorage storage cs = LibCharacter.characterStorage();
    uint256 tokenId = _totalSupply();
    _safeMint(to, tokenId);
    cs.characters[tokenId] = LibCharacter.Character({
    id : tokenId,
    level : 1,
    rarity : rarity,
    mutation : 1,
    actionPoints : 6,
    movementPoints : 3,
    healthPoints : 100,
    speed : 0,
    expertise : 0,
    scavenging : 0,
    potential : potential,
    statistics : statistics,
    profession : profession,
    experiencePoints : 0
    });

    emit Mint(tokenId, to, rarity, statistics, potential, profession);
  }

  function baseURI() external override view returns (string memory) {
    ERC721MetadataStorage.Layout storage ls = ERC721MetadataStorage.layout();
    return ls.baseURI;
  }

  function characters(uint256[] calldata ids) external view returns (LibCharacter.Character[] memory) {
    LibCharacter.CharacterStorage storage cs = LibCharacter.characterStorage();
    LibCharacter.Character[] memory nx = new LibCharacter.Character[](ids.length);
    for (uint k = 0; k < ids.length; k++) {
      nx[k] = cs.characters[ids[k]];
    }

    return nx;
  }

  function charactersOfOwner(address owner) external override view returns (uint256[] memory) {
    LibCharacter.CharacterStorage storage cs = LibCharacter.characterStorage();
    return cs.charactersOfOwner[owner];
  }

  function supportsInterface(bytes4 _interfaceId) external override view returns (bool) {
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    return ds.supportedInterfaces[_interfaceId];
  }

  modifier onlyMinter() {
    require(msg.sender == address(this), "CharacterFacet::onlyMinter: unauthorized");
    _;
  }
}
